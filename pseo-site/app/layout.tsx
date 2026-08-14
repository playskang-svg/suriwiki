import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'
import { FALLBACK_SITE_NAME, SITE_URL } from '@/lib/constants'
import { getAllData } from '@/lib/supabase'
import TopNav, { buildNavEntries } from '@/components/TopNav'

// 사이트 제목은 하드코딩하지 않고 DB의 첫 번째 키워드에서 그대로 가져온다
// (요청: "사이트 제목은 키워드 기준" — 키워드를 갈아끼우면 사이트 제목도 그대로 따라간다).
export async function generateMetadata(): Promise<Metadata> {
  const { keywords } = await getAllData()
  const siteName = keywords[0]?.display_name ?? FALLBACK_SITE_NAME
  return {
    metadataBase: new URL(SITE_URL),
    // 주의: title.template을 쓰지 않는다 — 요구사항 1-2에 따라 페이지별 <title>은
    // "지역+키워드" 조합만으로 완성된 순수 텍스트여야 하고, 사이트명 접미사 같은
    // 어떤 문자열도 자동으로 덧붙어서는 안 된다. 하위 라우트가 자체 title을 설정하면
    // 이 값은 그대로 대체되고(합쳐지지 않고) 홈(`/`)에서만 이 기본값이 쓰인다.
    title: siteName,
    description: `${siteName} - 지역별 전문 시공 정보와 무료 상담`,
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // 상단 메뉴: 키워드마다 허브 페이지(app/[keyword]/page.tsx — 그 키워드의 전체 지역을
  // 썸네일 카드로 나열)로 링크한다. 발행된 조합이 하나도 없는 키워드는 허브 자체가
  // generateStaticParams에서 빠지므로(존재하지 않는 페이지) 메뉴에서도 제외한다.
  //
  // 브랜드로 쓰는 키워드(keywords[0])는 이미 로고/사이트명 자리에 나오므로 메뉴에서
  // 또 한 번 보여주지 않는다 — "상단메뉴가 페이지(브랜드)랑 똑같으면 안 된다" 반영.
  const { keywords, listings } = await getAllData()
  const publishedKeywordIds = new Set(listings.map((l) => l.keyword_id))
  const brandKeywordId = keywords[0]?.id
  const navEntries = buildNavEntries(
    keywords.filter((keyword) => publishedKeywordIds.has(keyword.id) && keyword.id !== brandKeywordId)
  )
  const siteName = keywords[0]?.display_name ?? FALLBACK_SITE_NAME

  return (
    <html lang="ko">
      <body className="flex min-h-screen flex-col bg-white text-slate-900 antialiased">
        <header className="sticky top-0 z-20 w-full border-b border-slate-100 bg-white/95 backdrop-blur">
          <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
            {/* 로고 배지 — 이모지 기반(도배·장판이 연상되는 집 아이콘). 실제 로고
                이미지가 생기면 이 span 안의 이모지를 <img>로 바꾸기만 하면 된다. */}
            {/* 로고는 항상 루트 프로젝트(홈)로 간다 — 이 레이아웃은 모든 키워드 프로젝트에
                공통으로 쓰이므로 절대 URL로 고정한다(lib/constants.ts KEYWORD_SITE_URL 참고). */}
            <Link href={SITE_URL} className="flex items-center gap-2.5">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand text-xl"
                aria-hidden="true"
              >
                🏠
              </span>
              <span className="text-xl font-extrabold tracking-tight text-brand">{siteName}</span>
            </Link>
            <TopNav entries={navEntries} />
          </div>
        </header>

        {/* 대표 이미지 배너(HeroBanner)는 더 이상 여기(모든 페이지 공통)에 없다 — 항상
            사이트 브랜드명만 나와서 키워드 허브 페이지 등 실제 제목과 안 맞았다. 이제는
            각 페이지가 자기 제목으로 직접 렌더링한다(app/page.tsx, app/[keyword]/page.tsx). */}
        <main className="w-full flex-1">{children}</main>

        <footer className="w-full border-t border-slate-100 py-8">
          <p className="mx-auto max-w-3xl px-4 text-center text-sm text-slate-400">
            © {new Date().getFullYear()} {siteName}. All rights reserved.
          </p>
        </footer>
      </body>
    </html>
  )
}
