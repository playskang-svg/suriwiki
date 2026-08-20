#!/usr/bin/env python3
"""
plan_pages.py — 키워드 트리에서 콘텐츠 생성 큐 출력

사용:
  python3 plan_pages.py data/keyword-tree.json --top 30
  python3 plan_pages.py data/keyword-tree.json --top 8 --space bath --format json
  python3 plan_pages.py data/keyword-tree.json --status HOLD --format md   # 필요 근거 리포트
"""
from __future__ import annotations

import argparse
import csv
import json
import sys
from pathlib import Path


def load_required(root: Path) -> dict[str, list[str]]:
    p = root / "data" / "content-types.json"
    if not p.exists():
        return {}
    data = json.loads(p.read_text(encoding="utf-8"))
    out = {}
    for c in data["content_types"]:
        req = list(c["required"])
        for alt in c.get("required_alternatives", []):
            req.append("(" + "|".join(alt) + ")")
        out[c["code"]] = req
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("tree", nargs="?", default="data/keyword-tree.json")
    ap.add_argument("--top", type=int, default=30)
    ap.add_argument("--status", default="OPEN", help="OPEN|HOLD|CLAIMED|PUBLISHED|ALL")
    ap.add_argument("--space", default=None, help="L1 space 로 필터 (예: bath)")
    ap.add_argument("--intent", default=None, help="intent 로 필터 (예: judge)")
    ap.add_argument("--level", type=int, default=None)
    ap.add_argument("--format", default="md", choices=["md", "csv", "json"])
    ap.add_argument("--root", default=".")
    args = ap.parse_args()

    tree = json.loads(Path(args.tree).read_text(encoding="utf-8"))
    required = load_required(Path(args.root).resolve())

    nodes = tree["nodes"]
    if args.status != "ALL":
        nodes = [n for n in nodes if n["status"] == args.status]
    if args.space:
        nodes = [n for n in nodes if n["id"].split(".")[0] == args.space]
    if args.intent:
        nodes = [n for n in nodes if args.intent in (n.get("intent") or [])]
    if args.level is not None:
        nodes = [n for n in nodes if n.get("level") == args.level]

    nodes = sorted(nodes, key=lambda n: -n["priority_score"])[: args.top]

    rows = []
    for i, n in enumerate(nodes, 1):
        ct = n.get("suggested_ct") or "-"
        rows.append({
            "rank": i,
            "score": n["priority_score"],
            "node_id": n["id"],
            "query": n.get("query_ko", ""),
            "ct": ct,
            "page_type": n.get("suggested_page_type") or "-",
            "required_modules": " ".join(required.get(ct, [])) or "-",
            "cases": len(n.get("evidence_case_ids") or []),
            "status": n["status"],
            "url": n.get("target_url") or "-",
            "hold_reason": n.get("hold_reason") or "",
        })

    if args.format == "json":
        json.dump(rows, sys.stdout, ensure_ascii=False, indent=2)
        print()
    elif args.format == "csv":
        w = csv.DictWriter(sys.stdout, fieldnames=list(rows[0].keys()) if rows else ["rank"])
        w.writeheader()
        w.writerows(rows)
    else:
        title = "필요 근거 리포트 (HOLD)" if args.status == "HOLD" else "콘텐츠 생성 큐"
        print(f"# {title} — 상위 {len(rows)}개\n")
        if args.status == "HOLD":
            print("| # | 점수 | 노드 | 검색 질문 | 필요한 근거 |")
            print("|---|---|---|---|---|")
            for r in rows:
                print(f"| {r['rank']} | {r['score']} | `{r['node_id']}` | {r['query']} | {r['hold_reason']} |")
        else:
            print("| # | 점수 | 노드 | 검색 질문 | CT | Page Type | 필수 모듈 | CASE | URL |")
            print("|---|---|---|---|---|---|---|---|---|")
            for r in rows:
                print(f"| {r['rank']} | {r['score']} | `{r['node_id']}` | {r['query']} | {r['ct']} | "
                      f"{r['page_type']} | {r['required_modules']} | {r['cases']} | `{r['url']}` |")
        print(f"\n총 {len(rows)}개 · 상태 필터: {args.status}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
