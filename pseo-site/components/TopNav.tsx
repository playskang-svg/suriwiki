/**
 * components/TopNav.tsx
 * ------------------------------------------------------------------------
 * 상단 메뉴. 키워드를 "메뉴 그룹"(pseo_keywords.menu_group)으로 묶어서
 * 드롭다운으로 보여준다 — 그룹이 없는 키워드는 평메뉴 링크로 그대로 노출.
 *
 * 메뉴 구조 자체가 DB에서 나오므로(코드에 하드코딩 없음), 사이트를 다른
 * 키워드 세트로 복제/재사용할 때 pseo_keywords만 바꾸면 메뉴도 그대로 따라온다.
 *
 * 순수 CSS(group-hover/focus-within)로 드롭다운을 구현해 별도 클라이언트
 * 자바스크립트가 필요 없다 — 정적 export와 가장 궁합이 좋은 방식.
 * ------------------------------------------------------------------------
 */
import Link from 'next/link'
import type { KeywordRow } from '@/lib/supabase'

export interface NavEntry {
  kind: 'link' | 'group'
  label: string
  href?: string
  items?: { href: string; label: string }[]
}

/** keywords(발행된 것만) → 메뉴 그룹으로 묶은 NavEntry[]. menu_group·menu_order 순으로 정렬. */
export function buildNavEntries(keywords: KeywordRow[]): NavEntry[] {
  const sorted = [...keywords].sort((a, b) => a.menu_order - b.menu_order)
  const groups = new Map<string, NavEntry>()
  const entries: NavEntry[] = []

  for (const keyword of sorted) {
    const href = `/${keyword.slug}`
    if (!keyword.menu_group) {
      entries.push({ kind: 'link', label: keyword.display_name, href })
      continue
    }
    let group = groups.get(keyword.menu_group)
    if (!group) {
      group = { kind: 'group', label: keyword.menu_group, items: [] }
      groups.set(keyword.menu_group, group)
      entries.push(group)
    }
    group.items!.push({ href, label: keyword.display_name })
  }

  return entries
}

export default function TopNav({ entries }: { entries: NavEntry[] }) {
  if (entries.length === 0) return null

  return (
    <nav aria-label="주요 시공 항목" className="flex flex-wrap items-center gap-x-1 text-sm text-slate-600">
      {entries.map((entry) =>
        entry.kind === 'link' ? (
          <Link
            key={entry.label}
            href={entry.href!}
            className="rounded-md px-3 py-2 hover:bg-slate-50 hover:text-brand"
          >
            {entry.label}
          </Link>
        ) : (
          <div key={entry.label} className="group relative">
            <button
              type="button"
              className="flex items-center gap-1 rounded-md px-3 py-2 hover:bg-slate-50 hover:text-brand focus:outline-none"
            >
              {entry.label}
              <span aria-hidden="true" className="text-xs text-slate-400">
                ▾
              </span>
            </button>
            <div
              className="invisible absolute left-0 top-full z-10 min-w-[10rem] -translate-y-1 rounded-lg border border-slate-200 bg-white py-1.5 opacity-0 shadow-lg transition-all duration-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100"
            >
              {entry.items!.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-brand"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )
      )}
    </nav>
  )
}
