#!/usr/bin/env python3
"""
build_tree.py — Suriwiki 키워드 트리 빌더

시드 택소노미(space × target × problem × intent)를 전개해
data/keyword-tree.json 을 생성합니다.

사용:
  python3 build_tree.py --seed data/keyword-tree.seed.json \
      --areas data/areas.json --out data/keyword-tree.json
  python3 build_tree.py --seed ... --areas ... --out ... --cases data/cases.json

지역은 시드가 아니라 DB `areas` 테이블에서 온다 (docs/17-swappable-config.md §4).
--areas 파일은 `npm run areas:export` (scripts/export-areas.ts) 가 만든다.

cases.json 형식 (선택):
  [{"id":"case_...","area":"gangnam","space":"bath","target":"doorframe",
    "problem":"rot","has_cause":true,"image_count":8}]
"""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import re
import sys
from pathlib import Path

# ---------------------------------------------------------------- 상수

INTENT_CT = {
    "cause": "CT1", "howto": "CT2", "spec": "CT3", "compare": "CT4",
    "judge": "CT5", "case": "CT6", "cost": "CT5", "area": "CT6",
}
INTENT_PAGE_TYPE = {
    "cause": "LANDING", "howto": "WIKI", "spec": "WIKI", "compare": "WIKI",
    "judge": "LANDING", "case": "CASE", "cost": "LANDING", "area": "AREA",
}
INTENT_LABEL = {
    "cause": "원인", "howto": "셀프 방법", "spec": "정보", "compare": "비교",
    "judge": "수리·교체 판단", "case": "실제 사례", "cost": "비용 요소", "area": "지역 서비스",
}
INTENT_QUERY = {
    "cause": "{t} {p} 원인",
    "howto": "{t} {p} 셀프 수리 방법",
    "spec": "{t} 종류와 특징",
    "compare": "{t} 부분수리와 교체 비교",
    "judge": "{t} {p} 수리 가능한가",
    "case": "{t} {p} 시공 사례",
    "cost": "{t} {p} 비용이 달라지는 이유",
    "area": "{a} {t} 수리",
}
INTENT_VALUE = {
    # judge/compare 가 전환 가치가 가장 높다.
    # cost 는 M14가 "달라지는 이유"만 쓸 수 있어 전환 가치가 제한적이므로 낮춘다.
    "judge": 1.0, "compare": 1.0,
    "cause": 0.8, "cost": 0.75, "case": 0.7, "area": 0.7,
    "howto": 0.5, "spec": 0.5,
}
HINT_W = {"high": 1.0, "mid": 0.6, "low": 0.3}
COMP_W = {"low": 1.0, "mid": 0.55, "high": 0.2}

# 근거가 반드시 있어야 하는 intent
EVIDENCE_REQUIRED = {"case", "cost", "area"}

ID_RE = re.compile(r"^[a-z0-9_]+(\.[a-z0-9_]+){0,2}(#[a-z0-9_]+)?$")


# ---------------------------------------------------------------- 유틸

def evidence_w(n: int) -> float:
    return {0: 0.0, 1: 0.6, 2: 0.85}.get(n, 1.0) if n < 3 else 1.0


def priority(volume: str, n_cases: int, competition: str, intent: str, area_bonus: bool) -> float:
    return round(
        35 * HINT_W.get(volume, 0.3)
        + 25 * evidence_w(n_cases)
        + 20 * COMP_W.get(competition, 0.55)
        + 12 * INTENT_VALUE.get(intent, 0.5)
        + 8 * (1.0 if area_bonus else 0.0),
        1,
    )


def dedupe_key(query: str, ct: str, modules: list[str]) -> str:
    norm = re.sub(r"[\s\W_]+", "", query)
    raw = f"{norm}|{ct}|{','.join(sorted(modules))}"
    return hashlib.sha1(raw.encode("utf-8")).hexdigest()[:16]


def slugify(node_id: str) -> str:
    return node_id.replace("#", "-").replace(".", "-")


def load_ct_matrix(root: Path) -> dict:
    p = root / "data" / "content-types.json"
    if not p.exists():
        return {}
    data = json.loads(p.read_text(encoding="utf-8"))
    return {c["code"]: c for c in data["content_types"]}


# ---------------------------------------------------------------- 지역

def load_areas(seed: dict, areas_path: str | None) -> list[dict]:
    """지역 목록을 --areas 파일에서만 읽는다.

    지역의 SSOT 는 DB `areas` 테이블이다 (docs/17-swappable-config.md §4).
    시드에 지역을 다시 넣으면 두 곳이 어긋나므로 발견 즉시 실패시킨다.
    폴백 기본값을 두지 않는다 — 출처가 없으면 빈 트리를 조용히 만들지 말고 죽어야 한다.
    """
    if "areas" in seed:
        raise SystemExit(
            "ERROR: 시드에 areas 가 남아 있습니다. 지역 SSOT 는 DB areas 테이블입니다.\n"
            "       시드에서 areas 를 지우고 `npm run areas:export` 산출물을 --areas 로 넘기세요.\n"
            "       (docs/17-swappable-config.md §4)"
        )
    if not areas_path:
        raise SystemExit(
            "ERROR: --areas 가 필요합니다. 먼저 `npm run areas:export` 로 data/areas.json 을 만드세요.\n"
            "       (지역을 손으로 관리하지 않습니다 — docs/17-swappable-config.md §4)"
        )
    path = Path(areas_path)
    if not path.exists():
        raise SystemExit(f"ERROR: {areas_path} 이 없습니다. `npm run areas:export` 를 먼저 실행하세요.")
    raw = json.loads(path.read_text(encoding="utf-8"))
    areas = raw.get("areas", []) if isinstance(raw, dict) else raw
    if not areas:
        raise SystemExit(
            f"ERROR: {areas_path} 에 지역이 0건입니다. "
            "프로필의 area_scope 와 DB areas 테이블을 확인하세요."
        )
    for a in areas:
        if "slug" not in a or "label" not in a:
            raise SystemExit(f"ERROR: {areas_path} 의 지역에 slug/label 이 없습니다: {a}")
    return areas


# ---------------------------------------------------------------- 빌드

def build(seed: dict, areas: list[dict], cases: list[dict], ct_matrix: dict) -> dict:
    nodes: list[dict] = []
    seen: set[str] = set()

    def add(node: dict) -> None:
        if node["id"] in seen:
            print(f"  ! 중복 id 무시: {node['id']}", file=sys.stderr)
            return
        seen.add(node["id"])
        nodes.append(node)

    def cases_for(space: str, target: str, problem: str | None = None, area: str | None = None) -> list[dict]:
        out = []
        for c in cases:
            if c.get("space") != space or c.get("target") != target:
                continue
            if problem and c.get("problem") != problem:
                continue
            if area and c.get("area") != area:
                continue
            out.append(c)
        return out

    def area_case_count(a: dict) -> int:
        # --cases 를 주면 그 파일이 근거의 출처다.
        # 안 주면 export_areas 가 DB 에서 집계한 값을 그대로 쓴다 (0 으로 덮어쓰지 않는다).
        if cases:
            return sum(1 for c in cases if c.get("area") == a["slug"])
        return int(a.get("case_count", 0))

    default_intents = seed.get("default_intents", ["cause", "judge", "case"])

    for space in seed["spaces"]:
        sid, slabel = space["id"], space["label"]
        add({
            "id": sid, "parent_id": None, "level": 1, "label": slabel,
            "query_ko": f"{slabel} 수리", "aliases": [], "intent": [],
            "suggested_ct": None, "suggested_page_type": "CATEGORY",
            "area_expandable": False,
            "volume_hint": space.get("volume_hint", "mid"),
            "competition_hint": space.get("competition_hint", "mid"),
            "evidence_case_ids": [], "priority_score": 0.0,
            "status": "OPEN", "hold_reason": None,
            "target_page_id": None, "target_url": f"/{sid}",
            "merged_into": None, "dedupe_key": None, "notes": "",
        })

        for tgt in space["targets"]:
            tid, tlabel = f"{sid}.{tgt['id']}", tgt["label"]
            t_cases = cases_for(sid, tgt["id"])
            add({
                "id": tid, "parent_id": sid, "level": 2, "label": tlabel,
                "query_ko": f"{tlabel} 수리", "aliases": [], "intent": ["spec"],
                "suggested_ct": "CT3", "suggested_page_type": "TOPIC",
                "area_expandable": bool(tgt.get("area_expandable")),
                "volume_hint": tgt.get("volume_hint", "mid"),
                "competition_hint": tgt.get("competition_hint", "mid"),
                "evidence_case_ids": [c["id"] for c in t_cases],
                "priority_score": priority(tgt.get("volume_hint", "mid"), len(t_cases),
                                           tgt.get("competition_hint", "mid"), "spec", False),
                "status": "OPEN", "hold_reason": None,
                "target_page_id": None, "target_url": f"/{sid}/{tgt['id']}",
                "merged_into": None, "dedupe_key": None, "notes": "",
            })

            for prob in tgt.get("problems", []):
                pid, plabel = f"{tid}.{prob['id']}", prob["label"]
                p_cases = cases_for(sid, tgt["id"], prob["id"])
                add({
                    "id": pid, "parent_id": tid, "level": 3, "label": f"{tlabel} {plabel}",
                    "query_ko": f"{tlabel} {plabel}", "aliases": [], "intent": [],
                    "suggested_ct": None, "suggested_page_type": None,
                    "area_expandable": bool(tgt.get("area_expandable")),
                    "volume_hint": prob.get("volume_hint", "low"),
                    "competition_hint": tgt.get("competition_hint", "mid"),
                    "evidence_case_ids": [c["id"] for c in p_cases],
                    "priority_score": 0.0,
                    "status": "OPEN", "hold_reason": None,
                    "target_page_id": None, "target_url": None,
                    "merged_into": None, "dedupe_key": None, "notes": "",
                })

                for intent in prob.get("intents", default_intents):
                    ct = INTENT_CT[intent]
                    req = ct_matrix.get(ct, {}).get("required", [])
                    query = INTENT_QUERY[intent].format(t=tlabel, p=plabel, a="")
                    query = re.sub(r"\s+", " ", query).strip()
                    n_cases = len(p_cases)
                    if intent == "cause":
                        n_ok = sum(1 for c in p_cases if c.get("has_cause"))
                    else:
                        n_ok = n_cases

                    status, hold = "OPEN", None
                    if intent in EVIDENCE_REQUIRED and n_ok == 0:
                        status = "HOLD"
                        hold = {
                            "case": "실제 CASE 없음",
                            "cost": "비용 근거 없음 — M14는 '달라지는 이유'만 작성 가능",
                            "area": "해당 지역 CASE 없음",
                        }[intent]
                    if intent == "cause" and n_cases > 0 and n_ok == 0:
                        status = "HOLD"
                        hold = "원인 관찰 기록 없음 → CT5(judge)로 전환 검토"

                    add({
                        "id": f"{pid}#{intent}", "parent_id": pid, "level": 4,
                        "label": f"{tlabel} {plabel} · {INTENT_LABEL[intent]}",
                        "query_ko": query, "aliases": [], "intent": [intent],
                        "suggested_ct": ct,
                        "suggested_page_type": INTENT_PAGE_TYPE[intent],
                        "area_expandable": bool(tgt.get("area_expandable")) and intent in ("case", "judge"),
                        "volume_hint": prob.get("volume_hint", "low"),
                        "competition_hint": tgt.get("competition_hint", "mid"),
                        "evidence_case_ids": [c["id"] for c in p_cases],
                        "priority_score": priority(prob.get("volume_hint", "low"), n_ok,
                                                   tgt.get("competition_hint", "mid"), intent, False),
                        "status": status, "hold_reason": hold,
                        "target_page_id": None,
                        "target_url": f"/repair/{slugify(pid)}-{intent}",
                        "merged_into": None,
                        "dedupe_key": dedupe_key(query, ct, req),
                        "notes": "",
                    })

            # 지역 × 대상 노드 (area_expandable 인 대상만)
            if tgt.get("area_expandable"):
                for area in areas:
                    a_cases = cases_for(sid, tgt["id"], area=area["slug"])
                    has = len(a_cases) > 0
                    add({
                        "id": f"{tid}#area_{area['slug'].replace('-', '_')}",
                        "parent_id": tid, "level": 4,
                        "label": f"{area['label']} {tlabel} 수리",
                        "query_ko": f"{area['label']} {tlabel} 수리",
                        "aliases": [], "intent": ["area"],
                        "suggested_ct": "CT6", "suggested_page_type": "AREA",
                        "area_expandable": True,
                        "volume_hint": tgt.get("volume_hint", "mid"),
                        "competition_hint": tgt.get("competition_hint", "mid"),
                        "evidence_case_ids": [c["id"] for c in a_cases],
                        "priority_score": priority(tgt.get("volume_hint", "mid"), len(a_cases),
                                                   tgt.get("competition_hint", "mid"), "area", has),
                        "status": "OPEN" if has else "HOLD",
                        "hold_reason": None if has else f"{area['label']} 실제 CASE 없음 (사실성 규칙 F1)",
                        "target_page_id": None,
                        "target_url": f"/area/{area['slug']}/{tgt['id']}",
                        "merged_into": None,
                        "dedupe_key": dedupe_key(f"{area['label']}{tlabel}수리", "CT6",
                                                 ct_matrix.get("CT6", {}).get("required", [])),
                        "notes": "",
                    })

    # 비교(CT4) 노드
    for cp in seed.get("compare_pairs", []):
        space_id = cp.get("space", "any")
        parent = space_id if space_id != "any" else None
        req = ct_matrix.get("CT4", {}).get("required", [])
        add({
            "id": f"{space_id if space_id != 'any' else 'common'}.compare_{cp['id']}",
            "parent_id": parent, "level": 2, "label": cp["label"],
            "query_ko": cp["label"].replace(" vs ", "와 ") + " 차이",
            "aliases": [cp["label"]], "intent": ["compare"],
            "suggested_ct": "CT4", "suggested_page_type": "WIKI",
            "area_expandable": False,
            "volume_hint": cp.get("volume_hint", "mid"),
            "competition_hint": cp.get("competition_hint", "mid"),
            "evidence_case_ids": [], "priority_score": priority(
                cp.get("volume_hint", "mid"), 0, cp.get("competition_hint", "mid"), "compare", False),
            "status": "OPEN", "hold_reason": None,
            "target_page_id": None,
            "target_url": f"/wiki/{cp['id'].replace('_', '-')}",
            "merged_into": None, "dedupe_key": dedupe_key(cp["label"], "CT4", req), "notes": "",
        })

    # 재료(CT3) 노드
    for mat in seed.get("materials", []):
        space_id = mat.get("space", "any")
        req = ct_matrix.get("CT3", {}).get("required", [])
        add({
            "id": f"{space_id if space_id != 'any' else 'common'}.material_{mat['id']}",
            "parent_id": space_id if space_id != "any" else None, "level": 2,
            "label": f"{mat['label']} 정보", "query_ko": f"{mat['label']} 특징",
            "aliases": [], "intent": ["spec"],
            "suggested_ct": "CT3", "suggested_page_type": "WIKI",
            "area_expandable": False, "volume_hint": "low", "competition_hint": "low",
            "evidence_case_ids": [],
            "priority_score": priority("low", 0, "low", "spec", False),
            "status": "OPEN", "hold_reason": None, "target_page_id": None,
            "target_url": f"/wiki/{mat['id'].replace('_', '-')}",
            "merged_into": None, "dedupe_key": dedupe_key(mat["label"], "CT3", req), "notes": "",
        })

    return {
        "version": seed.get("version", "0.3"),
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        "areas": [{**a, "case_count": area_case_count(a)} for a in areas],
        "nodes": sorted(nodes, key=lambda n: (-n["priority_score"], n["id"])),
    }


def main() -> int:
    ap = argparse.ArgumentParser(description="Suriwiki 키워드 트리 빌더")
    ap.add_argument("--seed", default="data/keyword-tree.seed.json")
    ap.add_argument("--out", default="data/keyword-tree.json")
    ap.add_argument("--areas", default=None,
                    help="지역 목록 JSON (필수) — `npm run areas:export` 산출물")
    ap.add_argument("--cases", default=None, help="CASE 목록 JSON (선택)")
    ap.add_argument("--root", default=".", help="프로젝트 루트")
    args = ap.parse_args()

    root = Path(args.root).resolve()
    seed = json.loads(Path(args.seed).read_text(encoding="utf-8"))
    areas = load_areas(seed, args.areas)
    cases = json.loads(Path(args.cases).read_text(encoding="utf-8")) if args.cases else []
    tree = build(seed, areas, cases, load_ct_matrix(root))

    bad = [n["id"] for n in tree["nodes"] if not ID_RE.match(n["id"])]
    if bad:
        print(f"ERROR: id 패턴 위반 {bad[:5]}", file=sys.stderr)
        return 1

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(tree, ensure_ascii=False, indent=2), encoding="utf-8")

    by_status: dict[str, int] = {}
    for n in tree["nodes"]:
        by_status[n["status"]] = by_status.get(n["status"], 0) + 1
    print(f"✓ {out}  노드 {len(tree['nodes'])}개")
    for k, v in sorted(by_status.items()):
        print(f"    {k:<10} {v}")
    print(f"    지역 {len(areas)}개 (출처: {args.areas})")
    print(f"    CASE 근거 {len(cases)}건 반영")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
