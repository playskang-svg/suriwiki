/**
 * areas.ts — 전국 지역 트리 조회.
 *
 * 지역은 3,811개(시도 21 · 시군구 253 · 동 3,535)다.
 * 전부 프리렌더하면 빌드가 감당이 안 되므로 **시도만 정적 생성하고 나머지는 ISR** 로 돌린다.
 * 목록·인덱스 화면이 이 모듈을 공유한다.
 */
import { cache } from 'react';
import { createClient } from '@supabase/supabase-js';

export type AreaRow = { slug: string; label: string; parent_slug: string | null };

const PAGE = 1000;

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
  if (!anonKey) throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
  return createClient(url, anonKey);
}

/** 전체 지역. React.cache 로 한 요청에 한 번만 읽는다. */
export const fetchAllAreas = cache(async function fetchAllAreas(): Promise<AreaRow[]> {
  const sb = client();
  const rows: AreaRow[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await sb
      .from('areas')
      .select('slug,label,parent_slug')
      .range(from, from + PAGE - 1);
    if (error || !data || data.length === 0) break;
    rows.push(...(data as AreaRow[]));
    if (data.length < PAGE) break;
  }
  return rows;
});

export type AreaNode = AreaRow & { children: AreaRow[] };

/** 시도(최상위) + 그 직계 시군구. 인덱스 화면이 쓰는 2단 구조다. */
export const fetchAreaTree = cache(async function fetchAreaTree(): Promise<AreaNode[]> {
  const rows = await fetchAllAreas();
  const children = new Map<string, AreaRow[]>();
  for (const r of rows) {
    if (!r.parent_slug) continue;
    if (!children.has(r.parent_slug)) children.set(r.parent_slug, []);
    children.get(r.parent_slug)!.push(r);
  }
  return rows
    .filter(r => !r.parent_slug)
    .map(r => ({ ...r, children: (children.get(r.slug) ?? []).sort((a, b) => a.label.localeCompare(b.label, 'ko')) }))
    .sort((a, b) => b.children.length - a.children.length || a.label.localeCompare(b.label, 'ko'));
});

export const findArea = cache(async function findArea(slug: string): Promise<AreaRow | null> {
  const rows = await fetchAllAreas();
  return rows.find(r => r.slug === slug) ?? null;
});

/** 표시명. DB 의 "북구" 는 어느 시의 북구인지 알 수 없으므로 조상을 앞에 붙인다. */
export const areaDisplayLabel = cache(async function areaDisplayLabel(slug: string): Promise<string> {
  const rows = await fetchAllAreas();
  const bySlug = new Map(rows.map(r => [r.slug, r]));
  const chain: string[] = [];
  let cur = bySlug.get(slug);
  const seen = new Set<string>();
  while (cur && !seen.has(cur.slug)) {
    seen.add(cur.slug);
    if (!chain.includes(cur.label)) chain.unshift(cur.label);
    cur = cur.parent_slug ? bySlug.get(cur.parent_slug) : undefined;
  }
  return chain.join(' ');
});
