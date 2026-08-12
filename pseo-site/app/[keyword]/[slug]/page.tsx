/**
 * app/[keyword]/[slug]/page.tsx
 * ------------------------------------------------------------------------
 * 요구사항 1, 2, 3, 4, 5를 모두 조립하는 메인 동적 페이지.
 * URL: /[keyword]/[region-slug]  (플랫 구조)
 *
 * 본문 순서(참고 사이트 구조 + 사용자 지시 반영): H1 → 서론 → 목차 → 연락처
 * 배너(썸네일) → 중단 광고 → 본론(H2/H3) → 결론 → 내부링크. 목차는 본론의
 * heading_template에서 그대로 뽑아내므로 항상 실제 본문과 일치한다.
 *
 * SEO/GEO: <title>/description은 기존 sanitize 파이프라인 그대로, 여기에
 * BreadcrumbList + Service(LocalBusiness) JSON-LD를 추가해 검색엔진과
 * AI 검색(GEO)이 "이 페이지가 어느 지역·서비스에 대한 것인지" 구조적으로
 * 읽을 수 있게 한다.
 * ------------------------------------------------------------------------
 */
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPageData, getStaticParamsList } from '@/lib/supabase'
import { renderTemplate, sanitizeGeneratedText, splitParagraphs } from '@/lib/content'
import { SITE_NAME, SITE_URL } from '@/lib/constants'
import AdSlot from '@/components/AdSlot'
import ContactBanner from '@/components/ContactBanner'
import TableOfContents, { type TocItem } from '@/components/TableOfContents'
import InternalLinks from '@/components/InternalLinks'

// output:'export'는 generateStaticParams가 뱉은 조합만 존재할 수 있다.
// dynamicParams=false로 명시해 그 외 경로는 빌드 단계에서부터 확실히 404 처리되게 한다.
export const dynamicParams = false

interface PageProps {
  params: { keyword: string; slug: string }
}

export async function generateStaticParams() {
  return getStaticParamsList()
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const data = await getPageData(params.keyword, params.slug)
  if (!data) return {}

  const vars = { region: data.regionLabel, keyword: data.keyword.display_name, phone: data.phone }
  // sanitizeGeneratedText가 "블로그제목:" 같은 라벨 접두사·따옴표를 전부 걷어내고
  // 순수 텍스트만 남긴다 (요구사항 1-2).
  const title = sanitizeGeneratedText(renderTemplate(data.keyword.title_template, vars))
  const description = sanitizeGeneratedText(renderTemplate(data.keyword.meta_description_template, vars))
  const path = `/${data.keyword.slug}/${data.region.slug}`
  const ogImagePath = `/api/og/${data.keyword.slug}/${data.region.slug}`

  return {
    title,
    description,
    // 전통적 SEO에서는 영향력이 줄었지만, 페이지 주제를 명시적으로 밝혀두면
    // 비Google 검색엔진과 GEO(생성형 검색) 크롤러가 주제를 파악하는 데 도움이 된다.
    keywords: [data.keyword.display_name, data.regionLabel, `${data.regionLabel} ${data.keyword.display_name}`],
    alternates: { canonical: `${SITE_URL}${path}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}${path}`,
      siteName: SITE_NAME,
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
  const data = await getPageData(params.keyword, params.slug)
  if (!data) notFound()

  const vars = { region: data.regionLabel, keyword: data.keyword.display_name, phone: data.phone }
  const h1 = sanitizeGeneratedText(renderTemplate(data.keyword.h1_template, vars))
  const ogImagePath = `/api/og/${data.keyword.slug}/${data.region.slug}`
  const pageUrl = `${SITE_URL}/${data.keyword.slug}/${data.region.slug}`

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
  // 검색엔진 리치 스니펫과 GEO(생성형 검색) 크롤러 모두, "어디의 무슨 서비스인지"를
  // 텍스트 파싱 없이 바로 읽어갈 수 있게 한다.
  const breadcrumbList = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [...data.ancestorRegions, data.region].map((region, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: region.name,
      item: `${SITE_URL}/${data.keyword.slug}/${region.slug}`,
    })),
  }
  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: data.keyword.display_name,
    name: h1,
    areaServed: { '@type': 'Place', name: data.regionLabel },
    provider: { '@type': 'LocalBusiness', name: SITE_NAME, telephone: data.phone },
    url: pageUrl,
  }

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-10 md:py-14">
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- JSON-LD 스크립트, 링크 아님 */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbList) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }} />

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

      {/* 중단 광고 슬롯 — 요구사항 5: page.tsx 위치 */}
      <AdSlot position="middle" />

      {/* 본론: H2/H3 시맨틱 섹션 (요구사항 2-2). id는 목차 앵커와 동일한 값을 공유한다. */}
      <div className="mt-8 space-y-10">
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
        childRegions={data.childRegions}
        siblingRegions={data.siblingRegions}
        otherKeywords={data.otherKeywords}
      />
    </article>
  )
}
