import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'
import AdSlot from '@/components/AdSlot'
import { SITE_NAME, SITE_URL } from '@/lib/constants'
import { getAllData } from '@/lib/supabase'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // 주의: title.template을 쓰지 않는다 — 요구사항 1-2에 따라 페이지별 <title>은
  // "지역+키워드" 조합만으로 완성된 순수 텍스트여야 하고, 사이트명 접미사 같은
  // 어떤 문자열도 자동으로 덧붙어서는 안 된다. 하위 라우트가 자체 title을 설정하면
  // 이 값은 그대로 대체되고(합쳐지지 않고) 홈(`/`)에서만 이 기본값이 쓰인다.
  title: SITE_NAME,
  description: `${SITE_NAME} - 지역별 전문 시공 정보와 무료 상담`,
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // 상단 메뉴: 키워드마다 허브 페이지(app/[keyword]/page.tsx — 그 키워드의 전체 지역을
  // 썸네일 카드로 나열)로 링크한다. 발행된 조합이 하나도 없는 키워드는 허브 자체가
  // generateStaticParams에서 빠지므로(존재하지 않는 페이지) 메뉴에서도 제외한다.
  const { keywords, listings } = await getAllData()
  const publishedKeywordIds = new Set(listings.map((l) => l.keyword_id))
  const navItems = keywords
    .filter((keyword) => publishedKeywordIds.has(keyword.id))
    .map((keyword) => ({ keyword, href: `/${keyword.slug}` }))

  return (
    <html lang="ko">
      <body className="flex min-h-screen flex-col bg-white text-slate-900 antialiased">
        <header className="w-full border-b border-slate-100">
          <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
            {/* 로고 배지 — 메인 수리위키 앱(site-header.tsx)과 같은 남색+골드 "W" 배지를 그대로 맞춘다 */}
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#c5a059]/50 bg-gradient-to-br from-[#1c334b] to-[#0f1b29] text-base font-extrabold text-[#d4af37] shadow-sm">
                W
              </span>
              <span className="text-lg font-extrabold tracking-tight text-brand">{SITE_NAME}</span>
            </Link>
            {navItems.length > 0 ? (
              <nav aria-label="주요 시공 항목" className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600">
                {navItems.map(({ keyword, href }) => (
                  <Link key={keyword.id} href={href} className="hover:text-brand hover:underline underline-offset-2">
                    {keyword.display_name}
                  </Link>
                ))}
              </nav>
            ) : null}
          </div>
        </header>

        {/* 상단 광고 슬롯 — 모든 페이지 공통 (요구사항 5: layout.tsx 위치) */}
        <div className="w-full py-4">
          <AdSlot position="top" />
        </div>

        <main className="w-full flex-1">{children}</main>

        {/* 하단 광고 슬롯 — 모든 페이지 공통 (요구사항 5: layout.tsx 위치) */}
        <div className="w-full py-4">
          <AdSlot position="bottom" />
        </div>

        <footer className="w-full border-t border-slate-100 py-8">
          <p className="mx-auto max-w-3xl px-4 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
          </p>
        </footer>
      </body>
    </html>
  )
}
