/**
 * app/[keyword]/[...path]/page.tsx
 * ------------------------------------------------------------------------
 * 요구사항 1, 2, 3, 4를 모두 조립하는 메인 동적 페이지.
 * URL: /[키워드]/[시도]/[시군구]/[동]/[아파트]... — 지역 계층을 전부 슬래시로
 * 펼친다(요청 반영). [...path]는 필수 catch-all이라 최소 1단계(SIDO)는 있어야
 * 매칭된다 — 지역이 하나도 없는 "/[keyword]"는 app/[keyword]/page.tsx(허브)가 담당한다.
 *
 * 본문 순서: 브레드크럼 → H1 → 서론 → 목차 → 연락처 배너(썸네일) → 본론(H2/H3) →
 * 결론 → 내부 링크. 목차는 본론의 heading_template에서 그대로 뽑아내므로 항상
 * 실제 본문과 일치한다.
 *
 * SEO/GEO: <title>/description은 sanitize 파이프라인을 거치고, BreadcrumbList +
 * Service(LocalBusiness) JSON-LD를 추가해 검색엔진과 AI 검색(GEO)이 "이 페이지가
 * 어느 지역·서비스에 대한 것인지" 구조적으로 읽을 수 있게 한다.
 * ------------------------------------------------------------------------
 */
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAllData, getPageData, getStaticParamsList } from '@/lib/supabase'
import { renderTemplate, sanitizeGeneratedText, splitParagraphs } from '@/lib/content'
import { SITE_URL } from '@/lib/constants'
import { ogImageHref } from '@/lib/og-url'
import { decodeParam, decodeParamPath } from '@/lib/params'
import Breadcrumb from '@/components/Breadcrumb'
import ContactBanner from '@/components/ContactBanner'
import TableOfContents, { type TocItem } from '@/components/TableOfContents'
import InternalLinks from '@/components/InternalLinks'

// output:'export'는 generateStaticParams가 뱉은 조합만 존재할 수 있다.
// dynamicParams=false로 명시해 그 외 경로는 빌드 단계에서부터 확실히 404 처리되게 한다.
export const dynamicParams = false

interface PageProps {
  params: { keyword: string; path: string[] }
}

export async function generateStaticParams() {
  return getStaticParamsList()
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const data = await getPageData(decodeParam(params.keyword), decodeParamPath(params.path))
  if (!data) return {}

  const { keywords } = await getAllData()
  const siteName = keywords[0]?.display_name ?? data.keyword.display_name

  const vars = { region: data.regionLabel, keyword: data.keyword.display_name, phone: data.phone }
  // sanitizeGeneratedText가 "블로그제목:" 같은 라벨 접두사·따옴표를 전부 걷어내고
  // 순수 텍스트만 남긴다 (요구사항 1-2).
  const title = sanitizeGeneratedText(renderTemplate(data.keyword.title_template, vars))
  const description = sanitizeGeneratedText(renderTemplate(data.keyword.meta_description_template, vars))
  const urlPath = `/${data.keyword.slug}/${data.path.join('/')}`
  const ogImagePath = ogImageHref(data.keyword.slug, data.path)

  return {
    title,
    description,
    // 전통적 SEO에서는 영향력이 줄었지만, 페이지 주제를 명시적으로 밝혀두면
    // 비Google 검색엔진과 GEO(생성형 검색) 크롤러가 주제를 파악하는 데 도움이 된다.
    keywords: [data.keyword.display_name, data.regionLabel, `${data.regionLabel} ${data.keyword.display_name}`],
    alternates: { canonical: `${SITE_URL}${urlPath}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}${urlPath}`,
      siteName,
      locale: 'ko_KR',
      type: 'article',
      images: [{ url: ogImagePath, width: 1200, height: 630, alt: title, type: 'image/webp' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImagePath],
    },
  }
}

export default async function KeywordRegionPage({ params }: PageProps) {
  const data = await getPageData(decodeParam(params.keyword), decodeParamPath(params.path))
  if (!data) notFound()

  const { keywords } = await getAllData()
  const siteName = keywords[0]?.display_name ?? data.keyword.display_name

  const vars = { region: data.regionLabel, keyword: data.keyword.display_name, phone: data.phone }
  const h1 = sanitizeGeneratedText(renderTemplate(data.keyword.h1_template, vars))
  const ogImagePath = ogImageHref(data.keyword.slug, data.path)
  const pageUrl = `${SITE_URL}/${data.keyword.slug}/${data.path.join('/')}`

  // 본론(H2/H3) 소제목을 미리 렌더링 + sanitize해서, 목차와 실제 본문 헤딩이
  // 정확히 같은 id/텍스트를 공유하게 한다 (한쪽만 바꿔서 어긋나는 일이 없도록).
  const bodySections = data.body.map((section) => ({
    section,
    headingText: section.heading_template
      ? sanitizeGeneratedText(renderTemplate(section.heading_template, vars))
      : null,
    anchorId: `section-${section.id}`,
  }))
  const tocItems: TocItem[] = bodySections
    .filter((s) => s.headingText)
    .map((s) => ({ id: s.anchorId, text: s.headingText as string, level: s.section.heading_level === 'h3' ? 'h3' : 'h2' }))

  // JSON-LD: 지역 계층(BreadcrumbList) + 이 페이지가 다루는 서비스(Service) 구조화 데이터.
  const breadcrumbList = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [...data.ancestorRegions, data.region].map((region, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: region.name,
      item: `${SITE_URL}/${data.keyword.slug}/${data.path.slice(0, i + 1).join('/')}`,
    })),
  }
  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: data.keyword.display_name,
    name: h1,
    areaServed: { '@type': 'Place', name: data.regionLabel },
    provider: { '@type': 'LocalBusiness', name: siteName, telephone: data.phone },
    url: pageUrl,
  }

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-10 md:py-14">
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- JSON-LD 스크립트, 링크 아님 */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbList) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }} />

      {/* 홈 → 상위 지역 → 현재 지역 브레드크럼 — 상위 지역 페이지로 올라가는 화면상 유일한 경로 */}
      <Breadcrumb items={data.breadcrumb} />

      {/* H1: 시맨틱 구조의 최상단, 페이지당 반드시 1개만 존재 (요구사항 2-2) */}
      <h1 className="text-3xl font-extrabold leading-tight text-slate-900 md:text-4xl">{h1}</h1>

      {/* 서론 */}
      {data.intro.length > 0 ? (
        <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-slate-700 md:text-base">
          {data.intro.map((section) =>
            splitParagraphs(renderTemplate(section.body_template, vars)).map((para, i) => (
              <p key={`${section.id}-${i}`}>{para}</p>
            ))
          )}
        </div>
      ) : null}

      {/* 목차 — 썸네일(연락처 배너) 바로 앞에 위치 */}
      <TableOfContents items={tocItems} />

      {/* 목차 다음, 본론(H2) 앞 연락처 배너 — 요구사항 3-3 */}
      <ContactBanner
        imageSrc={ogImagePath}
        phone={data.phone}
        regionLabel={data.regionLabel}
        keyword={data.keyword.display_name}
      />

      {/* 본론: H2/H3 시맨틱 섹션 (요구사항 2-2). id는 목차 앵커와 동일한 값을 공유한다. */}
      <div className="mt-10 space-y-10">
        {bodySections.map(({ section, headingText, anchorId }) => {
          const Heading = section.heading_level === 'h3' ? 'h3' : 'h2'
          return (
            <section key={section.id} id={anchorId} className="scroll-mt-20">
              {headingText ? (
                <Heading
                  className={
                    Heading === 'h2' ? 'text-2xl font-bold text-slate-900' : 'text-xl font-bold text-slate-800'
                  }
                >
                  {headingText}
                </Heading>
              ) : null}
              <div className="mt-3 space-y-4 text-[15px] leading-relaxed text-slate-700 md:text-base">
                {splitParagraphs(renderTemplate(section.body_template, vars)).map((para, i) => (
                  <p key={`${section.id}-${i}`}>{para}</p>
                ))}
              </div>
            </section>
          )
        })}

        {/* 결론 */}
        {data.conclusion.length > 0 ? (
          <section>
            <h2 className="text-2xl font-bold text-slate-900">마무리</h2>
            <div className="mt-3 space-y-4 text-[15px] leading-relaxed text-slate-700 md:text-base">
              {data.conclusion.map((section) =>
                splitParagraphs(renderTemplate(section.body_template, vars)).map((para, i) => (
                  <p key={`${section.id}-${i}`}>{para}</p>
                ))
              )}
            </div>
          </section>
        ) : null}
      </div>

      {/* 계층형 내부 링크 (거미줄 링크) — 요구사항 4 */}
      <InternalLinks
        keyword={data.keyword}
        currentRegion={data.region}
        path={data.path}
        childRegions={data.childRegions}
        siblingRegions={data.siblingRegions}
        otherKeywords={data.otherKeywords}
      />
    </article>
  )
}
