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
import { OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH, getKeywordSiteUrl } from '@/lib/constants'
import { ogImageHref } from '@/lib/og-url'
import { decodeParam, decodeParamPath } from '@/lib/params'
import Breadcrumb from '@/components/Breadcrumb'
import ContactBanner from '@/components/ContactBanner'
import CompactContactBand from '@/components/CompactContactBand'
import TableOfContents, { type TocItem } from '@/components/TableOfContents'
import InternalLinks from '@/components/InternalLinks'
import { pickBgImagePath } from '@/lib/bg-images'

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
  const title = sanitizeGeneratedText(renderTemplate(data.titleTemplate, vars))
  const description = sanitizeGeneratedText(renderTemplate(data.metaDescriptionTemplate, vars))
  // 이 키워드가 실제로 배포되는 도메인(lib/constants.ts KEYWORD_SITE_URL 참고) — 키워드마다
  // 다른 Cloudflare Pages 프로젝트에 살 수 있으므로 전역 SITE_URL이 아니라 이 페이지
  // 자신의 키워드 기준으로 절대 URL을 만든다.
  const pageSiteUrl = getKeywordSiteUrl(data.keyword.slug)
  const urlPath = `/${data.keyword.slug}/${data.path.join('/')}`
  const ogImagePath = ogImageHref(data.keyword.slug, data.path)
  // og:image/twitter:image는 메타태그라 크롤러가 "현재 페이지 origin" 맥락 없이 그대로
  // 가져가므로, metadataBase(app/layout.tsx — 루트 도메인 고정) 상대경로 해석에 기대지 않고
  // 여기서 직접 절대 URL로 만든다. 화면에 보이는 <img>(ogImagePath 그대로)는 항상 자기
  // 자신과 같은 프로젝트에서 서빙되므로 상대경로 그대로 둬도 된다.
  const absoluteOgImage = `${pageSiteUrl}${ogImagePath}`

  return {
    title,
    description,
    // 전통적 SEO에서는 영향력이 줄었지만, 페이지 주제를 명시적으로 밝혀두면
    // 비Google 검색엔진과 GEO(생성형 검색) 크롤러가 주제를 파악하는 데 도움이 된다.
    keywords: [data.keyword.display_name, data.regionLabel, `${data.regionLabel} ${data.keyword.display_name}`],
    alternates: { canonical: `${pageSiteUrl}${urlPath}` },
    openGraph: {
      title,
      description,
      url: `${pageSiteUrl}${urlPath}`,
      siteName,
      locale: 'ko_KR',
      type: 'article',
      images: [{ url: absoluteOgImage, width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT, alt: title, type: 'image/webp' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [absoluteOgImage],
    },
  }
}

export default async function KeywordRegionPage({ params }: PageProps) {
  const data = await getPageData(decodeParam(params.keyword), decodeParamPath(params.path))
  if (!data) notFound()

  const { keywords } = await getAllData()
  const siteName = keywords[0]?.display_name ?? data.keyword.display_name

  const vars = { region: data.regionLabel, keyword: data.keyword.display_name, phone: data.phone }
  const h1 = sanitizeGeneratedText(renderTemplate(data.h1Template, vars))
  const ogImagePath = ogImageHref(data.keyword.slug, data.path)
  const pageSiteUrl = getKeywordSiteUrl(data.keyword.slug)
  const pageUrl = `${pageSiteUrl}/${data.keyword.slug}/${data.path.join('/')}`
  // 본문 중간·하단의 낮은 배너용 배경 — 지금은 배경 이미지 로테이션을 쓰지만, 나중에
  // 실제 시공 사진이 생기면 이 한 줄만 그 경로로 바꾸면 된다.
  const bandImagePath = pickBgImagePath(`${data.keyword.slug}:${data.path.join('/')}:band`)

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
      item: `${pageSiteUrl}/${data.keyword.slug}/${data.path.slice(0, i + 1).join('/')}`,
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
  // FAQPage: 본론 H2가 전부 자동완성/FAQ 기반 질문형이라(요청 3), 그대로 질문·답변
  // 구조화 데이터로도 쓸 수 있다 — 구글 FAQ 리치 스니펫과 GEO(생성형 검색) 모두 도움.
  const faqEntities = bodySections
    .filter((s) => s.headingText)
    .map((s) => ({
      '@type': 'Question',
      name: s.headingText,
      acceptedAnswer: {
        '@type': 'Answer',
        text: sanitizeGeneratedText(renderTemplate(s.section.body_template, vars)),
      },
    }))
  const faqJsonLd =
    faqEntities.length > 0 ? { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqEntities } : null

  // 제목 아래 해시태그 — 이 페이지의 핵심 키워드 몇 개만 짧게 (요청 2). 키워드 자체,
  // 현재 지역, 바로 위 지역(있을 때만), 같은 지역의 다른 키워드 하나 순으로 최대 4개.
  const immediateParent = data.ancestorRegions[data.ancestorRegions.length - 1]
  const hashtags = [
    data.keyword.display_name,
    data.region.name,
    immediateParent && immediateParent.name !== data.region.name ? immediateParent.name : null,
    data.otherKeywords[0]?.display_name ?? null,
  ].filter((tag, i, arr): tag is string => Boolean(tag) && arr.indexOf(tag) === i)

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-10 md:py-14">
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- JSON-LD 스크립트, 링크 아님 */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbList) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }} />
      {faqJsonLd ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      ) : null}

      {/* 홈 → 상위 지역 → 현재 지역 브레드크럼 — 상위 지역 페이지로 올라가는 화면상 유일한 경로 */}
      <Breadcrumb items={data.breadcrumb} />

      {/* H1: 시맨틱 구조의 최상단, 페이지당 반드시 1개만 존재 (요구사항 2-2) */}
      <h1 className="text-3xl font-extrabold leading-tight text-slate-900 md:text-4xl">{h1}</h1>

      {/* 핵심 키워드 해시태그 — 요청 2 */}
      {hashtags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm font-medium text-brand">
          {hashtags.map((tag) => (
            <span key={tag}>#{tag}</span>
          ))}
        </div>
      ) : null}

      {/* 서론 */}
      {data.intro.length > 0 ? (
        <div className="mt-6 space-y-4 text-base leading-relaxed text-slate-700 md:text-lg">
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

      {/* 본론: H2/H3 시맨틱 섹션 (요구사항 2-2). id는 목차 앵커와 동일한 값을 공유한다.
          본문이 길어졌으니(요청: H2 4개 이상) 중간에도 상담 배너를 한 번 더 넣는다 —
          정확히 절반 지점에서 나눠서 그 사이에 배치한다. */}
      {(() => {
        const midpoint = Math.ceil(bodySections.length / 2)
        const firstHalf = bodySections.slice(0, midpoint)
        const secondHalf = bodySections.slice(midpoint)

        const renderSection = ({ section, headingText, anchorId }: (typeof bodySections)[number]) => {
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
              <div className="mt-3 space-y-4 text-base leading-relaxed text-slate-700 md:text-lg">
                {splitParagraphs(renderTemplate(section.body_template, vars)).map((para, i) => (
                  <p key={`${section.id}-${i}`}>{para}</p>
                ))}
              </div>
            </section>
          )
        }

        return (
          <div className="mt-10 space-y-10">
            {firstHalf.map(renderSection)}

            {/* 본문 중간 상담 배너 — H2가 여러 개일 때만(짧은 글에서 배너가 3개 연달아 나오는 걸 방지).
                목차 다음 큰 썸네일과 달리 높이 낮은 배너형(지역명+연락처만). */}
            {secondHalf.length > 0 ? (
              <CompactContactBand
                imageSrc={bandImagePath}
                phone={data.phone}
                regionLabel={data.regionLabel}
                keyword={data.keyword.display_name}
                label="본문 중간"
              />
            ) : null}

            {secondHalf.map(renderSection)}

            {/* 결론 */}
            {data.conclusion.length > 0 ? (
              <section>
                <h2 className="text-2xl font-bold text-slate-900">마무리</h2>
                <div className="mt-3 space-y-4 text-base leading-relaxed text-slate-700 md:text-lg">
                  {data.conclusion.map((section) =>
                    splitParagraphs(renderTemplate(section.body_template, vars)).map((para, i) => (
                      <p key={`${section.id}-${i}`}>{para}</p>
                    ))
                  )}
                </div>
              </section>
            ) : null}

            {/* 본문 하단 상담 배너 — 글을 끝까지 읽은 사람에게 다시 한번 클릭 유도 */}
            <CompactContactBand
              imageSrc={bandImagePath}
              phone={data.phone}
              regionLabel={data.regionLabel}
              keyword={data.keyword.display_name}
              label="본문 하단"
            />
          </div>
        )
      })()}

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
