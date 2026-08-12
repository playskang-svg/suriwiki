/**
 * components/InternalLinks.tsx
 * ------------------------------------------------------------------------
 * 요구사항 4: 계층형 내부 링크("거미줄 링크") 컴포넌트.
 *
 *  - 하위 지역이 있으면(SIDO→SIGUNGU, SIGUNGU→DONG, DONG→APT) 그 목록을 보여준다.
 *  - 하위 지역이 없는 최하단 뎁스(보통 APT)라면, 인접한 형제 지역과 같은 지역의
 *    다른 키워드 페이지로 빠지는 링크를 보여준다.
 *
 * region.type을 하드코딩해서 분기하지 않고 "childRegions 유무"로 판단하므로,
 * 트리 깊이가 몇 단계든(SIDO~APT 4단계든, 더 깊어지든) 그대로 재사용할 수 있다.
 * ------------------------------------------------------------------------
 */
import Link from 'next/link'
import type { KeywordRow, RegionRow } from '@/lib/supabase'

interface InternalLinksProps {
  keyword: KeywordRow
  currentRegion: RegionRow
  /** 현재 지역 바로 아래 단계 지역 목록 (발행된 페이지만) */
  childRegions: RegionRow[]
  /** 같은 부모를 둔 인접 지역 목록 (발행된 페이지만, 자기 자신 제외) */
  siblingRegions: RegionRow[]
  /** 같은 지역의 다른 키워드 페이지 목록 (발행된 페이지만) */
  otherKeywords: KeywordRow[]
}

const CHILD_SECTION_LABEL: Record<RegionRow['type'], string> = {
  SIDO: '시/군/구별로 자세히 보기',
  SIGUNGU: '읍/면/동별로 자세히 보기',
  DONG: '아파트 단지별로 자세히 보기',
  APT: '',
}

export default function InternalLinks({
  keyword,
  currentRegion,
  childRegions,
  siblingRegions,
  otherKeywords,
}: InternalLinksProps) {
  const hasChildren = childRegions.length > 0

  return (
    <nav aria-label="관련 지역 및 시공 항목" className="mt-12 space-y-10 border-t border-slate-100 pt-8">
      {hasChildren ? (
        <section>
          <h2 className="text-lg font-bold text-slate-900">
            {currentRegion.name} {CHILD_SECTION_LABEL[currentRegion.type]}
          </h2>
          <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {childRegions.map((region) => (
              <li key={region.id}>
                <Link
                  href={`/${keyword.slug}/${region.slug}`}
                  className="block rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 transition-colors hover:border-brand hover:text-brand"
                >
                  {region.name} {keyword.display_name} →
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!hasChildren && siblingRegions.length > 0 ? (
        <section>
          <h2 className="text-lg font-bold text-slate-900">인근 지역 {keyword.display_name} 더 알아보기</h2>
          <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {siblingRegions.map((region) => (
              <li key={region.id}>
                <Link
                  href={`/${keyword.slug}/${region.slug}`}
                  className="block rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 transition-colors hover:border-brand hover:text-brand"
                >
                  {region.name} {keyword.display_name} →
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!hasChildren && otherKeywords.length > 0 ? (
        <section>
          <h2 className="text-lg font-bold text-slate-900">{currentRegion.name}에서 함께 찾는 시공 항목</h2>
          <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {otherKeywords.map((kw) => (
              <li key={kw.id}>
                <Link
                  href={`/${kw.slug}/${currentRegion.slug}`}
                  className="block rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 transition-colors hover:border-brand hover:text-brand"
                >
                  {currentRegion.name} {kw.display_name} →
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </nav>
  )
}
