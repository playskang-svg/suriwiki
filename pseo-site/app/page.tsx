/**
 * app/page.tsx — 사이트 홈(루트).
 * 키워드마다 허브 페이지(app/[keyword]/page.tsx — 그 키워드의 전체 지역을
 * 썸네일로 나열)로 안내하는 가벼운 진입점. 실제 지역 목록은 허브 페이지가
 * 전담하므로 여기서는 중복해서 나열하지 않는다.
 */
import Link from 'next/link'
import { getAllData } from '@/lib/supabase'
import { FALLBACK_SITE_NAME } from '@/lib/constants'

export default async function HomePage() {
  const { keywords, listings } = await getAllData()
  const publishedKeywordIds = new Set(listings.map((l) => l.keyword_id))
  const activeKeywords = keywords.filter((k) => publishedKeywordIds.has(k.id))
  const siteName = keywords[0]?.display_name ?? FALLBACK_SITE_NAME

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-extrabold text-slate-900">{siteName}</h1>
      <p className="mt-3 text-slate-600">지역과 시공 항목을 선택하면 맞춤 정보 페이지로 이동합니다.</p>

      <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {activeKeywords.map((keyword) => (
          <li key={keyword.id}>
            <Link
              href={`/${keyword.slug}`}
              className="block rounded-lg border border-slate-200 px-4 py-3 text-center font-semibold text-slate-700 transition-colors hover:border-brand hover:text-brand"
            >
              {keyword.display_name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
