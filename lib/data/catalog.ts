/**
 * catalog.ts — 발행된 페이지를 사이트 구조(공간 → 대상 → 사례)로 묶는다.
 *
 * 목록·메뉴 화면이 공통으로 쓴다. 발행된 것만 다룬다 —
 * 준비 중인 페이지를 메뉴에 올리면 눌러서 404 가 나는 링크가 다시 생긴다.
 */
import { fetchPublishedPages, pageLastModified, type PublishedPage } from '@/lib/seo/sitemap';
import seed from '@/data/keyword-tree.seed.json';

export type SpaceInfo = { id: string; label: string };

/** 시드의 공간(L1) 정의. 페이지 분류의 기준이 된다. */
export const SPACES: SpaceInfo[] = (seed as any).spaces.map((s: any) => ({ id: s.id, label: s.label }));

/**
 * 공간별 판별 키워드.
 *
 * 공간 라벨만으로 맞추면 오분류가 난다 — "방조망"의 "방"이 "거실·방"에 걸리고,
 * "욕조 배수구"는 "욕실"과 글자가 겹치지 않아 어디에도 안 걸린다.
 * 그래서 시드의 대상(L2)·증상(L3) 라벨까지 판별어로 쓰고, 1글자 조각은 버린다.
 */
const SPACE_KEYWORDS: { space: SpaceInfo; words: string[] }[] = (seed as any).spaces.map((sp: any) => {
  const words = new Set<string>();
  const push = (v: string) => {
    for (const part of String(v).split(/[·\/()]/).map(x => x.trim())) {
      if (part.length >= 2) words.add(part);
    }
  };
  push(sp.label);
  for (const t of sp.targets ?? []) {
    push(t.label);
    for (const pr of t.problems ?? []) push(pr.label);
  }
  return { space: { id: sp.id, label: sp.label }, words: [...words].sort((a, b) => b.length - a.length) };
});

export type CatalogEntry = {
  slug: string;
  title: string;
  summary: string;
  pageType: string;
  updatedAt: Date;
};

export type CatalogGroup = {
  space: SpaceInfo | null;
  entries: CatalogEntry[];
};

function toEntry(p: PublishedPage): CatalogEntry {
  return {
    slug: p.slug,
    title: p.title,
    summary: p.meta_description || p.search_intent || '',
    pageType: p.page_type,
    updatedAt: pageLastModified(p),
  };
}

/**
 * 페이지가 속한 공간을 추정한다.
 *
 * slug 는 `case/<이름>` 처럼 공간 정보를 담지 않는 경우가 많으므로
 * 제목·검색의도에 공간 라벨(욕실·주방·현관…)이 들어 있는지로 판별한다.
 * 못 찾으면 null 그룹(기타)에 넣는다 — 임의로 아무 공간에 배정하지 않는다.
 */
function spaceOf(entry: CatalogEntry): SpaceInfo | null {
  const haystack = `${entry.title} ${entry.summary}`;
  // 가장 긴 판별어가 걸린 공간을 고른다. 짧은 단어의 우연한 일치보다 신뢰도가 높다.
  let best: { space: SpaceInfo; len: number } | null = null;
  for (const { space, words } of SPACE_KEYWORDS) {
    for (const w of words) {
      if (!haystack.includes(w)) continue;
      if (!best || w.length > best.len) best = { space, len: w.length };
      break; // words 는 길이 내림차순이라 첫 일치가 그 공간의 최장 일치다
    }
  }
  return best?.space ?? null;
}

export async function getCatalog(): Promise<{ all: CatalogEntry[]; groups: CatalogGroup[] }> {
  const pages = await fetchPublishedPages();
  const all = pages.map(toEntry).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

  const bySpace = new Map<string, CatalogEntry[]>();
  const rest: CatalogEntry[] = [];

  for (const e of all) {
    const s = spaceOf(e);
    if (!s) { rest.push(e); continue; }
    if (!bySpace.has(s.id)) bySpace.set(s.id, []);
    bySpace.get(s.id)!.push(e);
  }

  const groups: CatalogGroup[] = SPACES
    .filter(s => bySpace.has(s.id))
    .map(s => ({ space: s, entries: bySpace.get(s.id)! }));

  if (rest.length) groups.push({ space: null, entries: rest });

  return { all, groups };
}
