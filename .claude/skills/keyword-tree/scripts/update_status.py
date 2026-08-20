#!/usr/bin/env python3
"""
update_status.py — 키워드 노드 상태 갱신 (트리 파일을 직접 손으로 고치지 않기 위한 도구)

사용:
  # 페이지 생성 시작
  python3 update_status.py data/keyword-tree.json bath.doorframe.rot#judge --status CLAIMED

  # 발행 완료
  python3 update_status.py data/keyword-tree.json bath.doorframe.rot#judge \
      --status PUBLISHED --page-id 8f2c... --url /repair/bathroom-doorframe-rot-judge

  # 중복 판정 → 흡수
  python3 update_status.py data/keyword-tree.json bath.doorframe.rot#cost \
      --status MERGED --merged-into bath.doorframe.rot#judge

  # 근거 부족
  python3 update_status.py data/keyword-tree.json entrance.firedoor#area_seocho \
      --status HOLD --reason "서초구 실제 CASE 없음"
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

VALID = {"OPEN", "CLAIMED", "PUBLISHED", "HOLD", "MERGED"}

# 허용된 상태 전이 (12-keyword-tree.md §6)
ALLOWED = {
    "OPEN": {"CLAIMED", "HOLD", "MERGED"},
    "CLAIMED": {"PUBLISHED", "HOLD", "OPEN", "MERGED"},
    "PUBLISHED": {"MERGED", "HOLD"},
    "HOLD": {"OPEN", "MERGED"},
    "MERGED": set(),
}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("tree")
    ap.add_argument("node_id")
    ap.add_argument("--status", required=True, choices=sorted(VALID))
    ap.add_argument("--page-id", default=None)
    ap.add_argument("--url", default=None)
    ap.add_argument("--merged-into", default=None)
    ap.add_argument("--reason", default=None)
    ap.add_argument("--add-case", action="append", default=[], help="근거 CASE id 추가")
    ap.add_argument("--force", action="store_true", help="전이 규칙 무시")
    args = ap.parse_args()

    path = Path(args.tree)
    tree = json.loads(path.read_text(encoding="utf-8"))
    ids = {n["id"] for n in tree["nodes"]}

    node = next((n for n in tree["nodes"] if n["id"] == args.node_id), None)
    if node is None:
        print(f"✗ 노드 없음: {args.node_id}")
        return 1

    cur = node["status"]
    if not args.force and args.status != cur and args.status not in ALLOWED[cur]:
        print(f"✗ 허용되지 않는 전이: {cur} → {args.status}  (--force 로 무시 가능)")
        return 1

    if args.status == "MERGED":
        if not args.merged_into:
            print("✗ MERGED 는 --merged-into 필수")
            return 1
        if args.merged_into not in ids:
            print(f"✗ merged_into 대상 없음: {args.merged_into}")
            return 1
        node["merged_into"] = args.merged_into

    if args.status == "PUBLISHED" and not (args.url or node.get("target_url")):
        print("✗ PUBLISHED 는 --url 필요")
        return 1

    if args.status == "HOLD" and not (args.reason or node.get("hold_reason")):
        print("✗ HOLD 는 --reason 필요")
        return 1

    node["status"] = args.status
    if args.page_id:
        node["target_page_id"] = args.page_id
    if args.url:
        node["target_url"] = args.url
    if args.reason:
        node["hold_reason"] = args.reason
    if args.status != "HOLD":
        node["hold_reason"] = None
    for cid in args.add_case:
        node.setdefault("evidence_case_ids", [])
        if cid not in node["evidence_case_ids"]:
            node["evidence_case_ids"].append(cid)

    path.write_text(json.dumps(tree, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"✓ {args.node_id}: {cur} → {args.status}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
