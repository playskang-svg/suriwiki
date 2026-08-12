import type { Metadata } from 'next'
import './globals.css'
import AdSlot from '@/components/AdSlot'
import { SITE_NAME, SITE_URL } from '@/lib/constants'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // 주의: title.template을 쓰지 않는다 — 요구사항 1-2에 따라 페이지별 <title>은
  // "지역+키워드" 조합만으로 완성된 순수 텍스트여야 하고, 사이트명 접미사 같은
  // 어떤 문자열도 자동으로 덧붙어서는 안 된다. 하위 라우트가 자체 title을 설정하면
  // 이 값은 그대로 대체되고(합쳐지지 않고) 홈(`/`)에서만 이 기본값이 쓰인다.
  title: SITE_NAME,
  description: `${SITE_NAME} - 지역별 전문 시공 정보와 무료 상담`,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="flex min-h-screen flex-col bg-white text-slate-900 antialiased">
        <header className="w-full border-b border-slate-100">
          <div className="mx-auto flex h-14 w-full max-w-3xl items-center px-4">
            <span className="text-lg font-extrabold tracking-tight text-brand">{SITE_NAME}</span>
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
