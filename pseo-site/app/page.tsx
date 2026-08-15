/**
 * app/page.tsx — 사이트 홈(루트).
 * 키워드마다 허브 페이지(app/[keyword]/page.tsx — 그 키워드의 전체 지역을
 * 썸네일로 나열)로 안내하는 가벼운 진입점. 실제 지역 목록은 허브 페이지가
 * 전담하므로 여기서는 중복해서 나열하지 않는다.
 */
import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllData } from '@/lib/supabase'
import { FALLBACK_SITE_NAME, getKeywordSiteUrl } from '@/lib/constants'
import HeroBanner from '@/components/HeroBanner'

// 네이버 서치어드바이저 사이트 소유 확인용 메타태그. 대문(/)에만 있으면 되므로 여기(홈
// 페이지 전용 metadata)에 둔다 — app/layout.tsx에 넣으면 모든 페이지에 다 붙어버린다.
export const metadata: Metadata = {
  other: { 'naver-site-verification': '29cacf51c21b6595c9608b2b8f151b48b4f66346' },
}

export default async function HomePage() {
  const { keywords, listings } = await getAllData()
  const publishedKeywordIds = new Set(listings.map((l) => l.keyword_id))
  const activeKeywords = keywords.filter((k) => publishedKeywordIds.has(k.id))
  const siteName = keywords[0]?.display_name ?? FALLBACK_SITE_NAME

  return (
    <div>
      <HeroBanner title={siteName} />
      <div className="mx-auto w-full max-w-3xl px-4 py-12">
        <p className="text-slate-600">지역과 시공 항목을 선택하면 맞춤 정보 페이지로 이동합니다.</p>

        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {activeKeywords.map((keyword) => (
            <li key={keyword.id}>
              {/* 키워드마다 서로 다른 Cloudflare Pages 프로젝트에 배포되므로(lib/constants.ts
                  KEYWORD_SITE_URL 참고) 항상 절대 URL로 링크한다. */}
              <Link
                href={`${getKeywordSiteUrl(keyword.slug)}/${keyword.slug}`}
                className="block rounded-lg border border-slate-200 px-4 py-3 text-center font-semibold text-slate-700 transition-colors hover:border-brand hover:text-brand"
              >
                {keyword.display_name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
