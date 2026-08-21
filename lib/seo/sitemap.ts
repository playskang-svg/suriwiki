/**
 * 사이트맵 분할 정의 — 인덱스(/sitemap.xml)와 본문(/sitemap/<id>.xml)이 공유한다.
 *
 * 두 곳에 같은 로직을 따로 쓰면 반드시 어긋난다. 인덱스에는 있는데 본문이 404 이거나
 * 그 반대가 되면 검색엔진은 사이트맵 전체를 신뢰하지 않는다.
 */
import { cache } from 'react';
import { createClient } from '@supabase/supabase-js';

const AREA_PAGE_TYPES = ['AREA', 'AREA-CASE', 'AREA-SERVICE'];

/** 'core' 는 지역이 아닌 모든 페이지(CASE·WIKI·LANDING…)를 담는 분할이다. */
export const CORE_SITEMAP_ID = 'core';

export type PublishedPage = {
  slug: string;
  page_type: string;
  published_at: string | null;
  updated_at: string | null;
  title: string;
  meta_description: string | null;
  search_intent: string;
};

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
  if (!anonKey) throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
  return createClient(url, anonKey);
}

/**
 * 발행된 페이지 목록.
 *
 * React.cache 로 감싸 한 요청 안에서는 한 번만 조회한다.
 * 사이트맵은 generateSitemaps 와 sitemap 이, 홈은 목록과 지역 섹션이 같은 데이터를 쓰는데
 * 감싸지 않으면 요청마다 같은 쿼리가 여러 번 나간다.
 */
export const fetchPublishedPages = cache(async function fetchPublishedPages(): Promise<PublishedPage[]> {
  const { data } = await client()
    .from('pages')
    .select('slug, page_type, published_at, updated_at, title, meta_description, search_intent')
    .eq('status', 'published');
  return (data ?? []) as PublishedPage[];
});

export function isAreaPage(page: Pick<PublishedPage, 'page_type'>): boolean {
  return AREA_PAGE_TYPES.includes(page.page_type);
}

/**
 * AREA 페이지 slug 에서 최상위 지역 slug 를 뽑는다.
 *   area/busan-buk/doorframe → busan
 *   area/gimhae              → gimhae
 *
 * 지역 slug 는 `<시도>-<시군구>-<동>` 규칙이므로 첫 조각이 최상위다.
 * 레거시 최상위 지역(gimhae, gangnam 등)은 조각이 하나뿐이라 그대로 자기 자신이 된다.
 */
export function topLevelAreaOf(slug: string): string | null {
  const parts = slug.split('/');
  if (parts[0] !== 'area' || !parts[1]) return null;
  const areaSlug = parts[1];
  return areaSlug.split('-')[0] || null;
}

/**
 * 실제로 발행된 페이지가 있는 분할만 돌려준다.
 *
 * 빈 사이트맵을 20여 개 제출하면 검색엔진 쪽에 "빈 사이트맵" 경고가 쌓인다.
 * DB 의 모든 시도를 나열하지 않고, 페이지가 있는 지역만 낸다.
 */
export function sitemapIdsFor(pages: PublishedPage[]): string[] {
  const ids = new Set<string>();
  let hasCore = false;

  for (const page of pages) {
    if (isAreaPage(page)) {
      const top = topLevelAreaOf(page.slug);
      if (top) ids.add(top);
      else hasCore = true; // 지역을 못 읽으면 core 로 보낸다 — 어디에도 안 실리는 것보다 낫다
    } else {
      hasCore = true;
    }
  }

  const sorted = [...ids].sort();
  return hasCore ? [CORE_SITEMAP_ID, ...sorted] : sorted;
}

/** 특정 분할에 속하는 페이지만 고른다. sitemapIdsFor 와 같은 기준을 써야 한다. */
export function pagesForSitemap(pages: PublishedPage[], id: string): PublishedPage[] {
  if (id === CORE_SITEMAP_ID) {
    return pages.filter(p => !isAreaPage(p) || topLevelAreaOf(p.slug) === null);
  }
  return pages.filter(p => isAreaPage(p) && topLevelAreaOf(p.slug) === id);
}

export function pageLastModified(page: PublishedPage): Date {
  return new Date(page.published_at ?? page.updated_at ?? Date.now());
}
