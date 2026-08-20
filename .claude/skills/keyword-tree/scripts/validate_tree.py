#!/usr/bin/env python3
"""
validate_tree.py — 키워드 트리 검증

검사:
  E1 id 패턴 위반
  E2 중복 id
  E3 고아 parent_id (존재하지 않는 부모)
  E4 dedupe_key 충돌 (서로 다른 노드가 같은 키)
  E5 MERGED 인데 merged_into 없음 / 대상 없음
  E6 area 노드인데 근거 CASE 없이 OPEN  (사실성 규칙 F1 위반)
  E7 priority_score 범위 밖
  E8 level 과 id 구조 불일치
  E9 PUBLISHED 인데 target_url 없음
  W1 HOLD 인데 hold_reason 없음
  W2 intent 없는 leaf 노드
  W3 suggested_ct 와 intent 매핑 불일치

사용:
  python3 validate_tree.py data/keyword-tree.json [--strict]
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

ID_RE = re.compile(r"^[a-z0-9_]+(\.[a-z0-9_]+){0,2}(#[a-z_0-9]+)?$")
VALID_STATUS = {"OPEN", "CLAIMED", "PUBLISHED", "HOLD", "MERGED"}
VALID_CT = {"CT1", "CT2", "CT3", "CT4", "CT5", "CT6"}
VALID_INTENT = {"cause", "howto", "spec", "compare", "judge", "case", "cost", "area"}
INTENT_CT = {
    "cause": "CT1", "howto": "CT2", "spec": "CT3", "compare": "CT4",
    "judge": "CT5", "case": "CT6", "cost": "CT5", "area": "CT6",
}


def validate(tree: dict) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warns: list[str] = []
    nodes = tree.get("nodes", [])
    ids = {n["id"] for n in nodes}

    seen: set[str] = set()
    dkeys: dict[str, list[str]] = defaultdict(list)

    for n in nodes:
        nid = n.get("id", "<no-id>")

        if not ID_RE.match(nid):
            errors.append(f"E1 id 패턴 위반: {nid}")
        if nid in seen:
            errors.append(f"E2 중복 id: {nid}")
        seen.add(nid)

        parent = n.get("parent_id")
        if parent and parent not in ids:
            errors.append(f"E3 고아 parent: {nid} → {parent}")

        if n.get("dedupe_key"):
            dkeys[n["dedupe_key"]].append(nid)

        status = n.get("status")
        if status not in VALID_STATUS:
            errors.append(f"E5 알 수 없는 status '{status}': {nid}")
        if status == "MERGED":
            if not n.get("merged_into"):
                errors.append(f"E5 MERGED 인데 merged_into 없음: {nid}")
            elif n["merged_into"] not in ids:
                errors.append(f"E5 merged_into 대상 없음: {nid} → {n['merged_into']}")

        if "area" in (n.get("intent") or []) and status == "OPEN" and not n.get("evidence_case_ids"):
            errors.append(f"E6 지역 노드가 근거 CASE 없이 OPEN (F1 위반): {nid}")

        score = n.get("priority_score", 0)
        if not isinstance(score, (int, float)) or not (0 <= score <= 100):
            errors.append(f"E7 priority_score 범위 밖 ({score}): {nid}")

        base = nid.split("#")[0]
        expected = base.count(".") + 1
        if "#" in nid:
            expected = 4
        if n.get("level") != expected:
            errors.append(f"E8 level 불일치 (level={n.get('level')}, 기대={expected}): {nid}")

        if status == "PUBLISHED" and not n.get("target_url"):
            errors.append(f"E9 PUBLISHED 인데 target_url 없음: {nid}")

        if status == "HOLD" and not n.get("hold_reason"):
            warns.append(f"W1 HOLD 인데 hold_reason 없음: {nid}")

        intents = n.get("intent") or []
        for it in intents:
            if it not in VALID_INTENT:
                errors.append(f"E5 알 수 없는 intent '{it}': {nid}")
        if n.get("level") == 4 and not intents:
            warns.append(f"W2 L4 노드인데 intent 없음: {nid}")

        ct = n.get("suggested_ct")
        if ct and ct not in VALID_CT:
            errors.append(f"E5 알 수 없는 CT '{ct}': {nid}")
        if ct and intents and INTENT_CT.get(intents[0]) != ct:
            warns.append(f"W3 intent({intents[0]}) 기대 CT={INTENT_CT.get(intents[0])} 이나 {ct}: {nid}")

    for k, group in dkeys.items():
        if len(group) > 1:
            errors.append(f"E4 dedupe_key 충돌 [{k}]: {', '.join(group)} → MERGE 필요")

    return errors, warns


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("tree", nargs="?", default="data/keyword-tree.json")
    ap.add_argument("--strict", action="store_true", help="경고도 실패로 처리")
    args = ap.parse_args()

    tree = json.loads(Path(args.tree).read_text(encoding="utf-8"))
    errors, warns = validate(tree)

    for e in errors:
        print(f"  ✗ {e}")
    for w in warns:
        print(f"  ! {w}")

    total = len(tree.get("nodes", []))
    print(f"\n노드 {total}개 · 오류 {len(errors)} · 경고 {len(warns)}")
    if errors:
        print("→ 오류를 해결한 뒤 페이지 생성을 진행하세요.")
        return 1
    if warns and args.strict:
        return 1
    print("✓ 검증 통과")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
