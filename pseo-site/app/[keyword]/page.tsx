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
 * ⚠️ 지역이 아주 많아지면(전국 단위) 카드 수백~수천 개가 한 페이지에 쌓인다.
 * 지금은 단순 목록이고, 실제로 지역이 크게 늘어나면 페이지네이션이나
 * 시/도별 섹션 구분을 추가하는 게 좋다.
 * ------------------------------------------------------------------------
 */
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAllData } from '@/lib/supabase'
import { buildRegionTree, getRegionLabel, getRegionPathSegments } from '@/lib/region-tree'
import { SITE_URL } from '@/lib/constants'
import { ogImageHref } from '@/lib/og-url'
import { decodeParam } from '@/lib/params'

export const dynamicParams = false

interface PageProps {
  params: { keyword: string }
}

async function getHubData(keywordSlug: string) {
  const { keywords, regions, listings } = await getAllData()
  const keyword = keywords.find((k) => k.slug === keywordSlug)
  if (!keyword) return null

  const tree = buildRegionTree(regions)
  const keywordListings = listings.filter((l) => l.keyword_id === keyword.id)

  const cards = keywordListings
    .map((listing) => {
      const regionNode = tree.nodeMap.get(listing.region_id)
      if (!regionNode) return null
      const path = getRegionPathSegments(regionNode, tree.nodeMap)
      return {
        href: `/${keyword.slug}/${path.join('/')}`,
        thumbnail: ogImageHref(keyword.slug, path),
        regionLabel: getRegionLabel(regionNode, tree.nodeMap),
      }
    })
    .filter((c): c is NonNullable<typeof c> => c !== null)
    .sort((a, b) => a.regionLabel.localeCompare(b.regionLabel, 'ko'))

  return { keyword, cards }
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

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 md:py-14">
      <h1 className="text-2xl font-extrabold text-slate-900 md:text-3xl">{data.keyword.display_name} 지역별 시공 정보</h1>
      <p className="mt-2 text-sm text-slate-500">원하는 지역을 선택하면 상세 안내와 하위 지역 목록을 볼 수 있습니다.</p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {data.cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group block aspect-[1200/630] w-full overflow-hidden rounded-xl border border-slate-200 shadow-sm transition-shadow hover:shadow-md"
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
    </div>
  )
}
