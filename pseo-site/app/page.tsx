/**
 * app/page.tsx — 사이트 홈(루트).
 * 키워드별로 최상위(SIDO) 지역 페이지만 모아 보여주는 가벼운 허브다.
 * 발행된 페이지가 수천~수만 개여도 여기선 "키워드 수 × 최상위 지역 수"만큼만
 * 보여주므로 크기가 무한정 커지지 않는다. 크롤러가 거미줄 링크 구조로
 * 들어가는 자연스러운 진입점 역할도 한다.
 */
import Link from 'next/link'
import { getAllData } from '@/lib/supabase'
import { buildRegionTree } from '@/lib/region-tree'
import { SITE_NAME } from '@/lib/constants'

export default async function HomePage() {
  const { keywords, regions, listings } = await getAllData()
  const tree = buildRegionTree(regions)
  const listingSet = new Set(listings.map((l) => `${l.keyword_id}:${l.region_id}`))

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-extrabold text-slate-900">{SITE_NAME}</h1>
      <p className="mt-3 text-slate-600">지역과 시공 항목을 선택하면 맞춤 정보 페이지로 이동합니다.</p>

      <div className="mt-10 space-y-10">
        {keywords.map((keyword) => {
          const topRegions = tree.roots.filter((r) => listingSet.has(`${keyword.id}:${r.id}`))
          return topRegions.length > 0 ? (
            <section key={keyword.id}>
              <h2 className="text-xl font-bold text-slate-900">{keyword.display_name}</h2>
              <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {topRegions.map((region) => (
                  <li key={region.id}>
                    <Link
                      href={`/${keyword.slug}/${region.slug}`}
                      className="block rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 transition-colors hover:border-brand hover:text-brand"
                    >
                      {region.name} {keyword.display_name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null
        })}
      </div>
    </div>
  )
}
