/**
 * components/Breadcrumb.tsx
 * ------------------------------------------------------------------------
 * 홈 → 상위 지역 → ... → 현재 지역 순서로 보여주는 현재 위치 표시줄.
 * InternalLinks가 아래(하위 지역)·옆(인근 지역·다른 키워드)으로 가는 링크만
 * 다루다 보니, 위(상위 지역)로 올라가는 화면상 링크가 없었다 — 그 빈자리를 채운다.
 *
 * 마지막 항목(현재 페이지)은 링크로 만들지 않는다. href가 null인 항목은
 * 아직 발행되지 않은 (키워드×지역) 조합이라는 뜻이라 텍스트로만 보여준다
 * (끊긴 링크 방지 — lib/supabase.ts의 getPageData 참고).
 * ------------------------------------------------------------------------
 */
import Link from 'next/link'
import type { BreadcrumbItem } from '@/lib/supabase'
import { SITE_URL } from '@/lib/constants'

export default function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="현재 위치" className="mb-4 flex flex-wrap items-center gap-x-1 gap-y-1 text-sm text-slate-500">
      {/* 홈(루트 "/")은 항상 루트 프로젝트에만 있다 — 다른 키워드 프로젝트에서 렌더링될 때도
          있으므로(lib/constants.ts KEYWORD_SITE_URL 참고) 상대경로가 아니라 절대 URL로 고정한다. */}
      <Link href={SITE_URL} className="hover:text-brand hover:underline underline-offset-2">
        홈
      </Link>
      {items.map((item, i) => {
        const isCurrent = i === items.length - 1
        return (
          <span key={item.id} className="flex items-center gap-1">
            <span aria-hidden="true">›</span>
            {!isCurrent && item.href ? (
              <Link href={item.href} className="hover:text-brand hover:underline underline-offset-2">
                {item.name}
              </Link>
            ) : (
              <span className={isCurrent ? 'font-medium text-slate-700' : ''} aria-current={isCurrent ? 'page' : undefined}>
                {item.name}
              </span>
            )}
          </span>
        )
      })}
    </nav>
  )
}
