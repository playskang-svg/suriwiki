/**
 * app/[keyword]/page.tsx
 * ------------------------------------------------------------------------
 * 키워드 허브 페이지 — 이 키워드로 발행된 모든 지역을 썸네일 카드로 나열한다.
 * 상단 메뉴에서 키워드를 클릭하면 여기로 들어오고("도배업체 클릭 → 지역별
 * 썸네일이 쭉 펼쳐짐"), 카드 하나를 클릭하면 app/[keyword]/[...path]/page.tsx
 * (실제 포스팅 + 하위 지역 링크)로 들어가 계속 드릴다운할 수 있다.
 *
 * 카드는 요청대로 텍스트 미리보기 없이 썸네일 이미지만 보여준다(alt 텍스트로만
 * 접근성 정보를 남긴다).
 *
 * 전국 단위(시/도+시/군/구 245개)까지 발행되면서 카드가 최대 수백 개까지
 * 쌓이므로, "지역이 누락 없이 다 연결"되면서도 찾기 쉽도록 시/도별 섹션으로
 * 나누고 맨 위에 시/도 바로가기를 둔다.
 * ------------------------------------------------------------------------
 */
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAllData } from '@/lib/supabase'
import { buildRegionTree, getAncestors, getRegionLabel, getRegionPathSegments } from '@/lib/region-tree'
import { SITE_URL } from '@/lib/constants'
import { ogImageHref } from '@/lib/og-url'
import { decodeParam } from '@/lib/params'
import HeroBanner from '@/components/HeroBanner'

export const dynamicParams = false

interface PageProps {
  params: { keyword: string }
}

interface Card {
  href: string
  thumbnail: string
  regionLabel: string
  depth: number
}

interface SidoSection {
  sidoName: string
  sidoOrder: number
  anchorId: string
  cards: Card[]
}

async function getHubData(keywordSlug: string) {
  const { keywords, regions, listings } = await getAllData()
  const keyword = keywords.find((k) => k.slug === keywordSlug)
  if (!keyword) return null

  const tree = buildRegionTree(regions)
  const keywordListings = listings.filter((l) => l.keyword_id === keyword.id)

  const sectionMap = new Map<string, SidoSection>()

  for (const listing of keywordListings) {
    const regionNode = tree.nodeMap.get(listing.region_id)
    if (!regionNode) continue

    const ancestors = getAncestors(regionNode, tree.nodeMap)
    const sidoNode = ancestors[0] ?? regionNode // 조상이 없으면(SIDO 자기 자신) 그대로
    const path = getRegionPathSegments(regionNode, tree.nodeMap)

    const card: Card = {
      href: `/${keyword.slug}/${path.join('/')}`,
      thumbnail: ogImageHref(keyword.slug, path),
      regionLabel: getRegionLabel(regionNode, tree.nodeMap),
      depth: path.length,
    }

    let section = sectionMap.get(sidoNode.id)
    if (!section) {
      section = { sidoName: sidoNode.name, sidoOrder: sidoNode.display_order, anchorId: `sido-${sidoNode.id}`, cards: [] }
      sectionMap.set(sidoNode.id, section)
    }
    section.cards.push(card)
  }

  const sections = [...sectionMap.values()]
    .map((section) => ({
      ...section,
      cards: section.cards.sort((a, b) => a.depth - b.depth || a.regionLabel.localeCompare(b.regionLabel, 'ko')),
    }))
    .sort((a, b) => a.sidoOrder - b.sidoOrder)

  const totalCount = sections.reduce((sum, s) => sum + s.cards.length, 0)

  return { keyword, sections, totalCount }
}

export async function generateStaticParams() {
  const { keywords, listings } = await getAllData()
  const publishedKeywordIds = new Set(listings.map((l) => l.keyword_id))
  return keywords.filter((k) => publishedKeywordIds.has(k.id)).map((k) => ({ keyword: k.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const data = await getHubData(decodeParam(params.keyword))
  if (!data) return {}

  const title = `${data.keyword.display_name} 지역별 시공 정보 모음`
  const description = `${data.keyword.display_name} 관련 지역별 시공 안내를 한눈에 모아봤습니다. 원하는 지역을 선택해서 상세 정보를 확인하세요.`
  const path = `/${data.keyword.slug}`

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}${path}` },
    openGraph: { title, description, url: `${SITE_URL}${path}`, locale: 'ko_KR' },
  }
}

export default async function KeywordHubPage({ params }: PageProps) {
  const data = await getHubData(decodeParam(params.keyword))
  if (!data) notFound()

  const showJumpNav = data.sections.length > 1
  const heroTitle = `${data.keyword.display_name} 지역별 시공 정보`

  return (
    <div>
      <HeroBanner title={heroTitle} />
      <div className="mx-auto w-full max-w-5xl px-4 py-10 md:py-14">
        {/* 시/도 바로가기 — 지역이 많아져도 누락 없이 한눈에 훑고 원하는 시/도로 바로 이동 */}
        {showJumpNav ? (
          <nav aria-label="시/도 바로가기" className="flex flex-wrap gap-2">
            {data.sections.map((section) => (
              <a
                key={section.anchorId}
                href={`#${section.anchorId}`}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:border-brand hover:text-brand"
              >
                {section.sidoName} ({section.cards.length})
              </a>
            ))}
          </nav>
        ) : null}

        <div className="mt-8 space-y-12">
          {data.sections.map((section) => (
            <section key={section.anchorId} id={section.anchorId} className="scroll-mt-20">
              <h2 className="text-xl font-bold text-slate-900">
                {section.sidoName} <span className="font-normal text-slate-400">({section.cards.length})</span>
              </h2>
              {/* 모바일에서는 한 줄에 카드 1개씩(요청: "썸네일을 한줄에 하나씩") —
                  화면이 커질수록 점진적으로 여러 열로 늘어난다. */}
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {section.cards.map((card) => (
                  <Link
                    key={card.href}
                    href={card.href}
                    className="group block aspect-[1200/960] w-full overflow-hidden rounded-xl border border-slate-200 shadow-sm transition-shadow hover:shadow-md"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- 정적 export, next/image 최적화 서버 없음 */}
                    <img
                      src={card.thumbnail}
                      alt={`${card.regionLabel} ${data.keyword.display_name}`}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
