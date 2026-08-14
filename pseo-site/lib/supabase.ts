/**
 * lib/supabase.ts
 * ------------------------------------------------------------------------
 * pSEO 템플릿 사이트의 Supabase 연동 총괄 파일.
 *
 *  - Supabase 클라이언트 생성 (anon key, 읽기 전용)
 *  - DB 로우 타입 정의 (supabase/schema.sql과 1:1 대응)
 *  - 빌드 타임(next build, output:'export') 전용 데이터 페칭 헬퍼
 *
 * 무한 확장(페이지 수천~수만 개) 전략:
 *   getAllData()가 pseo_keywords / pseo_keyword_variants / pseo_regions /
 *   pseo_content_sections / pseo_page_listings 5개 테이블을 "딱 1번씩만"
 *   통째로 읽어오고, 이후 getPageData() / getStaticParamsList()는 전부
 *   메모리 안에서 조립한다. 페이지가 10개든 10만 개든 Supabase 쿼리 횟수는
 *   항상 5번으로 고정된다. (React.cache()로 빌드 렌더 트리 안 중복 호출도 제거)
 *
 * 콘텐츠 버전(variant): 키워드 하나에 title/description/H1 템플릿과 본문
 * 세트를 여러 개(pseo_keyword_variants) 둘 수 있다. 같은 키워드의 지역
 * 페이지끼리 지역명만 다르고 나머지 문장이 똑같아지는 걸 막기 위한 장치 —
 * (keyword_id + region_id)를 해시해 지역마다 결정적으로 버전 하나를 고른다
 * (재배포해도 같은 페이지는 항상 같은 버전 → 랜덤이지만 안정적).
 *
 * 필요한 환경변수 (.env.local, 배포 플랫폼 환경변수):
 *   NEXT_PUBLIC_SUPABASE_URL       - Supabase 프로젝트 URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY  - Supabase anon(public) key
 *                                     (RLS: 5개 테이블 모두 public SELECT 정책 필요 — supabase/schema.sql 참고)
 * ------------------------------------------------------------------------
 */
import { cache } from 'react'
import { createClient } from '@supabase/supabase-js'
import {
  buildRegionTree,
  getAncestors,
  getRegionLabel,
  getRegionPathSegments,
  getSiblings,
  resolveRegionByPath,
  type RegionNode,
} from './region-tree'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[lib/supabase] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 환경변수가 없습니다. ' +
      '.env.local.example을 복사해 .env.local을 만들고 값을 채워주세요.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
})

// ------------------------------------------------------------------------
// DB 로우 타입 (snake_case, supabase/schema.sql과 1:1 대응)
// ------------------------------------------------------------------------

export type RegionType = 'SIDO' | 'SIGUNGU' | 'DONG' | 'APT'
export type SectionType = 'INTRO' | 'BODY' | 'CONCLUSION'

export interface KeywordRow {
  id: string
  slug: string
  display_name: string
  phone: string
  is_active: boolean
  /** 상단 메뉴 드롭다운 묶음 이름 (예: '도배', '도배 견적'). null이면 그룹 없이 평메뉴로 노출.
   *  메뉴 구조 자체를 DB로 관리해서, 사이트를 복제/재사용할 때 코드 수정 없이 데이터만 바꾸면 된다. */
  menu_group: string | null
  /** 그룹 안에서, 그리고 그룹 없는 평메뉴 사이에서 정렬 순서 */
  menu_order: number
}

/** 키워드 하나가 가질 수 있는 여러 "콘텐츠 버전" 중 하나. 버전마다 제목·본문 각도가 다르다. */
export interface KeywordVariantRow {
  id: string
  keyword_id: string
  variant_key: string
  title_template: string
  meta_description_template: string
  h1_template: string
  sort_order: number
}

export interface RegionRow {
  id: string
  parent_id: string | null
  type: RegionType
  name: string
  slug: string
  display_order: number
}

export interface ContentSectionRow {
  id: string
  variant_id: string
  section_type: SectionType
  heading_level: 'h2' | 'h3' | null
  heading_template: string | null
  body_template: string
  sort_order: number
}

export interface PageListingRow {
  id: string
  keyword_id: string
  region_id: string
  phone_override: string | null
  /** 썸네일(OG 이미지)에만 박힐 전화번호. 비우면 phone_override → keyword.phone 순으로 대체된다. */
  thumbnail_phone: string | null
  is_published: boolean
  /** 키워드 허브 페이지(app/[keyword]/page.tsx) 카드에 실제 날짜로 노출 — 지어낸 값이 아니라 DB 값 그대로. */
  created_at: string
}

// ------------------------------------------------------------------------
// 원본 데이터 일괄 로드 (테이블당 쿼리 1회 "요청"처럼 보이지만, 실제로는
// 1000행씩 나눠 끝까지 페이지네이션한다 — 빌드 렌더 트리 내 메모이즈)
// ------------------------------------------------------------------------

/** Supabase/PostgREST는 .range()가 없으면 한 번에 최대 1000행만 돌려준다(에러 없이 조용히
 *  잘린다). pseo_page_listings·pseo_regions처럼 지역/발행 범위가 넓어지면 쉽게 1000행을
 *  넘는 표가 있어서, 빈 페이지가 나올 때까지 range를 밀며 전부 끌어온다.
 *  (실제로 이걸 안 해서 페이지 상당수가 조용히 빌드에서 누락되는 사고가 있었다.) */
const PAGE_SIZE = 1000

async function fetchAllRows<T>(
  buildQuery: () => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
): Promise<{ data: T[]; error: { message: string } | null }> {
  const rows: T[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await (buildQuery() as any).range(from, from + PAGE_SIZE - 1)
    if (error) return { data: rows, error }
    rows.push(...((data ?? []) as T[]))
    if (!data || data.length < PAGE_SIZE) break
  }
  return { data: rows, error: null }
}

export const getAllData = cache(async () => {
  const [keywordsRes, variantsRes, regionsRes, listingsRes, sectionsRes] = await Promise.all([
    fetchAllRows<KeywordRow>(() => supabase.from('pseo_keywords').select('*').eq('is_active', true)),
    fetchAllRows<KeywordVariantRow>(() =>
      supabase.from('pseo_keyword_variants').select('*').order('sort_order', { ascending: true })
    ),
    fetchAllRows<RegionRow>(() => supabase.from('pseo_regions').select('*')),
    fetchAllRows<PageListingRow>(() => supabase.from('pseo_page_listings').select('*').eq('is_published', true)),
    fetchAllRows<ContentSectionRow>(() =>
      supabase.from('pseo_content_sections').select('*').order('sort_order', { ascending: true })
    ),
  ])

  const results = [
    ['pseo_keywords', keywordsRes] as const,
    ['pseo_keyword_variants', variantsRes] as const,
    ['pseo_regions', regionsRes] as const,
    ['pseo_page_listings', listingsRes] as const,
    ['pseo_content_sections', sectionsRes] as const,
  ]
  for (const [label, res] of results) {
    if (res.error) {
      throw new Error(`[lib/supabase] ${label} 조회 실패: ${res.error.message}`)
    }
  }

  return {
    keywords: keywordsRes.data,
    variants: variantsRes.data,
    regions: regionsRes.data,
    listings: listingsRes.data,
    sections: sectionsRes.data,
  }
})

/** 문자열을 안정적인(재현 가능한) 정수 해시로 — 배경 이미지 로테이션과 동일한 방식. */
function hashSeed(seed: string): number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  return hash
}

/** keyword_id+region_id 조합마다 항상 같은 버전이 나오도록 결정적으로 하나 고른다. */
function pickVariant(variants: KeywordVariantRow[], seed: string): KeywordVariantRow {
  return variants[hashSeed(seed) % variants.length]
}

// ------------------------------------------------------------------------
// generateStaticParams용 — 발행 대상 전체 (keyword × region) 조합.
// path는 지역 계층을 전부 슬래시로 펼친 세그먼트 배열이다.
// (예: 백석동 → ["충청남도","천안시","백석동"] → /도배장판/충청남도/천안시/백석동)
// app/[keyword]/[...path]/page.tsx 와 app/api/og/[keyword]/[...path]/route.tsx가 공유한다.
// ------------------------------------------------------------------------

export const getStaticParamsList = cache(async () => {
  const { keywords, regions, listings } = await getAllData()
  const keywordMap = new Map(keywords.map((k) => [k.id, k]))
  const tree = buildRegionTree(regions)

  const params: { keyword: string; path: string[] }[] = []
  for (const listing of listings) {
    const kw = keywordMap.get(listing.keyword_id)
    const regionNode = tree.nodeMap.get(listing.region_id)
    if (kw && regionNode) params.push({ keyword: kw.slug, path: getRegionPathSegments(regionNode, tree.nodeMap) })
  }

  // 개발/검증용 샘플 빌드 — output:'export'는 증분 빌드가 없어서 파일 하나만 바꿔도
  // 전체 2만6천+ 페이지를 처음부터 다시 굽는다. 작은 변경을 눈으로 빨리 확인만 하고
  // 싶을 때는 `SAMPLE_BUILD_LIMIT=200 npm run build`처럼 환경변수를 주면 그 개수만큼만
  // (여러 키워드에 고르게 분산해서) 만든다 — 실제 배포용 빌드는 이 값을 비워두면 된다.
  const sampleLimit = Number(process.env.SAMPLE_BUILD_LIMIT)
  if (sampleLimit > 0 && sampleLimit < params.length) {
    // 키워드 하나로만 몰리지 않게, 키워드별로 라운드로빈으로 골고루 뽑는다.
    const byKeyword = new Map<string, typeof params>()
    for (const p of params) {
      if (!byKeyword.has(p.keyword)) byKeyword.set(p.keyword, [])
      byKeyword.get(p.keyword)!.push(p)
    }
    const buckets = [...byKeyword.values()]
    const sampled: typeof params = []
    for (let i = 0; sampled.length < sampleLimit; i++) {
      const bucket = buckets[i % buckets.length]
      const item = bucket[Math.floor(i / buckets.length)]
      if (item) sampled.push(item)
      if (buckets.every((b, idx) => Math.floor(i / buckets.length) >= b.length)) break
    }
    console.warn(`[getStaticParamsList] SAMPLE_BUILD_LIMIT=${sampleLimit} — 샘플 ${sampled.length}개만 빌드합니다(실제 배포 전엔 꼭 이 값 없이 전체 빌드하세요).`)
    return sampled
  }

  return params
})

// ------------------------------------------------------------------------
// 페이지 1개(keyword × region) 렌더링에 필요한 모든 데이터 조립
// ------------------------------------------------------------------------

/** 화면에 보이는 브레드크럼 한 칸. href가 null이면 그 (키워드×지역) 조합이 아직
 *  발행되지 않았다는 뜻이라 링크 없이 텍스트로만 표시한다(끊긴 링크 방지). */
export interface BreadcrumbItem {
  id: string
  name: string
  href: string | null
}

export interface PageData {
  keyword: KeywordRow
  region: RegionNode
  regionLabel: string
  /** 루트(SIDO) → 바로 위 부모까지의 조상 목록. JSON-LD BreadcrumbList 생성에 쓴다. */
  ancestorRegions: RegionNode[]
  /** 홈 → ... → 현재 지역까지, 화면에 그대로 그리면 되는 브레드크럼 목록 (요청: 상위 지역 페이지 탐색) */
  breadcrumb: BreadcrumbItem[]
  /** ["충청남도","천안시","백석동"] — 이 페이지의 URL 슬러그 경로. InternalLinks가
   *  하위/인근 지역 href를 조립할 때 이 배열 끝에서부터 잘라 붙인다. */
  path: string[]
  /** 이 페이지에 결정적으로 배정된 콘텐츠 버전 — 제목/H1은 여기서 나온다. */
  variantKey: string
  titleTemplate: string
  metaDescriptionTemplate: string
  h1Template: string
  /** 본문(연락처 배너 tel: 링크, CTA 텍스트 등)에 쓰는 상담 전화번호 */
  phone: string
  /** 썸네일(OG 이미지)에 박히는 전화번호. thumbnail_phone이 없으면 phone과 동일한 값이 된다. */
  thumbnailPhone: string
  intro: ContentSectionRow[]
  body: ContentSectionRow[]
  conclusion: ContentSectionRow[]
  childRegions: RegionNode[]
  siblingRegions: RegionNode[]
  otherKeywords: KeywordRow[]
}

export const getPageData = cache(async (keywordSlug: string, pathSegments: string[]): Promise<PageData | null> => {
  const { keywords, variants, regions, listings, sections } = await getAllData()
  const tree = buildRegionTree(regions)

  const keyword = keywords.find((k) => k.slug === keywordSlug)
  if (!keyword) return null

  const regionNode = resolveRegionByPath(pathSegments, tree)
  if (!regionNode) return null

  const listingSet = new Set(listings.map((l) => `${l.keyword_id}:${l.region_id}`))
  const isPublished = (keywordId: string, regionId: string) => listingSet.has(`${keywordId}:${regionId}`)

  if (!isPublished(keyword.id, regionNode.id)) return null

  const listingRow = listings.find((l) => l.keyword_id === keyword.id && l.region_id === regionNode.id)
  const phone = listingRow?.phone_override || keyword.phone
  const thumbnailPhone = listingRow?.thumbnail_phone || phone

  // 이 키워드가 가진 버전 중, 이 지역에 결정적으로 배정된 버전 하나를 고른다.
  const keywordVariants = variants.filter((v) => v.keyword_id === keyword.id)
  if (keywordVariants.length === 0) return null // 버전이 하나도 없으면 콘텐츠가 없다는 뜻
  const variant = pickVariant(keywordVariants, `${keyword.id}:${regionNode.id}`)
  const variantSections = sections.filter((s) => s.variant_id === variant.id)

  const ancestorRegions = getAncestors(regionNode, tree.nodeMap)
  const breadcrumb: BreadcrumbItem[] = [...ancestorRegions, regionNode].map((r, i) => ({
    id: r.id,
    name: r.name,
    href: isPublished(keyword.id, r.id) ? `/${keyword.slug}/${pathSegments.slice(0, i + 1).join('/')}` : null,
  }))

  return {
    keyword,
    region: regionNode,
    regionLabel: getRegionLabel(regionNode, tree.nodeMap),
    ancestorRegions,
    breadcrumb,
    path: pathSegments,
    variantKey: variant.variant_key,
    titleTemplate: variant.title_template,
    metaDescriptionTemplate: variant.meta_description_template,
    h1Template: variant.h1_template,
    phone,
    thumbnailPhone,
    intro: variantSections.filter((s) => s.section_type === 'INTRO'),
    body: variantSections.filter((s) => s.section_type === 'BODY'),
    conclusion: variantSections.filter((s) => s.section_type === 'CONCLUSION'),
    childRegions: regionNode.children.filter((c) => isPublished(keyword.id, c.id)),
    siblingRegions: getSiblings(regionNode, tree).filter((s) => isPublished(keyword.id, s.id)),
    otherKeywords: keywords.filter((k) => k.id !== keyword.id && isPublished(k.id, regionNode.id)),
  }
})
