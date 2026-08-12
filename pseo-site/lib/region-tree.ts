/**
 * lib/region-tree.ts
 * ------------------------------------------------------------------------
 * pseo_regions 평면 배열(부모-자식 관계만 있는 목록)을 트리로 조립하고,
 * 조상/형제/전체 라벨을 구하는 순수 유틸리티. Supabase와 무관한 순수 함수만
 * 모아 테스트하기 쉽고, 다른 프로젝트에도 그대로 재사용할 수 있게 분리했다.
 * ------------------------------------------------------------------------
 */
import type { RegionRow } from './supabase'

export interface RegionNode extends RegionRow {
  children: RegionNode[]
}

export interface RegionTree {
  nodeMap: Map<string, RegionNode>
  roots: RegionNode[]
}

/** regions 평면 배열 → 트리. id 조회가 Map 기반이라 O(n)에 조립된다. */
export function buildRegionTree(regions: RegionRow[]): RegionTree {
  const nodeMap = new Map<string, RegionNode>()
  regions.forEach((r) => nodeMap.set(r.id, { ...r, children: [] }))

  const roots: RegionNode[] = []
  nodeMap.forEach((node) => {
    if (node.parent_id) {
      const parent = nodeMap.get(node.parent_id)
      if (parent) {
        parent.children.push(node)
        return
      }
      // parent_id는 있는데 실제 부모 로우가 없는 경우(데이터 정합성 오류) → 루트로 강등해 안전하게 렌더링
    }
    roots.push(node)
  })

  nodeMap.forEach((node) => node.children.sort((a, b) => a.display_order - b.display_order))
  roots.sort((a, b) => a.display_order - b.display_order)

  return { nodeMap, roots }
}

/** 최상위 루트 → 바로 위 부모까지의 조상 배열 (인덱스 0이 최상위) */
export function getAncestors(node: RegionNode, nodeMap: Map<string, RegionNode>): RegionNode[] {
  const chain: RegionNode[] = []
  let current = node.parent_id ? nodeMap.get(node.parent_id) : undefined
  while (current) {
    chain.unshift(current)
    current = current.parent_id ? nodeMap.get(current.parent_id) : undefined
  }
  return chain
}

/** "충청남도 천안시 불당동 불당아이파크"처럼 조상 이름을 이어붙인 자연스러운 지역 라벨 */
export function getRegionLabel(node: RegionNode, nodeMap: Map<string, RegionNode>): string {
  const ancestors = getAncestors(node, nodeMap)
  return [...ancestors, node].map((n) => n.name).join(' ')
}

/** 같은 부모를 둔 형제 지역 목록 (자기 자신 제외). 최상위(SIDO)는 roots 중에서 찾는다. */
export function getSiblings(node: RegionNode, tree: RegionTree): RegionNode[] {
  const parent = node.parent_id ? tree.nodeMap.get(node.parent_id) : undefined
  const pool = parent ? parent.children : tree.roots
  return pool.filter((n) => n.id !== node.id)
}
