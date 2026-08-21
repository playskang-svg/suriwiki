import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import PageRenderer from '@/app/_render/PageRenderer';
import Header from '@/components/common/Header';
import BottomNav from '@/components/common/BottomNav';
import { getPageData } from '@/lib/data/page';
import { buildMetadata, buildJsonLd } from '@/lib/seo';
import { areaDisplayLabel, fetchAreaTree, findArea } from '@/lib/data/areas';
import { getAreaRepairTopics, topicHeadline, REPAIR_CRITERIA } from '@/lib/data/area-content';
import { fetchPublishedPages, pageLastModified } from '@/lib/seo/sitemap';
import { siteConfig } from '@/config/site';

export const revalidate = 3600;
export const dynamicParams = true;

type Params = Promise<{ area: string }>;

/**
 * 시도만 정적 생성한다.
 *
 * 지역은 3,811개다. 전부 프리렌더하면 빌드가 수십 분으로 늘고 배포가 느려진다.
 * 시군구·동은 dynamicParams 로 첫 요청 때 만들어 캐시한다(ISR).
 */
export async function generateStaticParams() {
  const tree = await fetchAreaTree();
  return tree.map(t => ({ area: t.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { area } = await params;
  const data = await getPageData(`area/${area}`);

  if (data) return buildMetadata(data.page, data.pageModules['M01']);

  const label = await areaDisplayLabel(area);
  if (!label) return {};

  const topics = getAreaRepairTopics();
  const headline = topicHeadline(topics);

  return {
    title: { absolute: `${label} ${headline} 부분 수리 | ${siteConfig.brand.name}` },
    description:
      `${label} 지역 ${headline} 등 부분 수리 안내. ` +
      `전체 교체 전에 고쳐 쓸 수 있는지 판단하는 기준과 수리 범위를 정리했습니다.`,
    alternates: { canonical: `/area/${area}` },
    openGraph: {
      title: `${label} ${headline} 부분 수리`,
      description: `${label}에서 부분 수리로 접근할 수 있는 항목과 판단 기준입니다.`,
      type: 'article',
    },
  };
}

export default async function AreaPage({ params }: { params: Params }) {
  const { area } = await params;
  const data = await getPageData(`area/${area}`);

  // 발행된 지역 페이지(실제 그 지역 CASE 기반)가 있으면 그대로 렌더한다.
  if (data) {
    const jsonLd = buildJsonLd(data.page, data.pageModules);
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <PageRenderer
          title={data.page.title}
          moduleOrder={data.page.module_order}
          pageModules={data.pageModules}
          breadcrumb={[{ label: '시공 지역', href: '/area' }, { label: await areaDisplayLabel(area) }]}
        />
      </>
    );
  }

  const row = await findArea(area);
  if (!row) notFound();

  const label = await areaDisplayLabel(area);
  const topics = getAreaRepairTopics();
  const headline = topicHeadline(topics);
  const telHref = `tel:${siteConfig.contact.phone.replace(/[^0-9]/g, '')}`;

  // 실제 발행된 사례. 어느 지역 사례인지는 각 페이지가 밝힌다.
  const cases = (await fetchPublishedPages())
    .sort((a, b) => pageLastModified(b).getTime() - pageLastModified(a).getTime())
    .slice(0, 3);

  /*
    구조화 데이터.
    이 문서는 "이 지역에서 시공했다" 는 실적 주장이 아니라
    "이 지역에서 이런 수리를 다룬다" 는 서비스 안내다. 그래서 Service 로 표기하고
    실적을 뜻하는 필드(aggregateRating·review)는 넣지 않는다.
  */
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        name: `${label} 부분 수리`,
        serviceType: topics.map(t => t.targetLabel),
        provider: {
          '@type': 'Organization',
          name: siteConfig.brand.name,
          telephone: siteConfig.contact.phone,
        },
        areaServed: { '@type': 'Place', name: label },
        description: `${label} 지역 ${headline} 등 부분 수리 안내`,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '홈', item: siteConfig.brand.site_url },
          { '@type': 'ListItem', position: 2, name: '시공 지역', item: `${siteConfig.brand.site_url}/area` },
          { '@type': 'ListItem', position: 3, name: label, item: `${siteConfig.brand.site_url}/area/${area}` },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: REPAIR_CRITERIA.map(c => ({
          '@type': 'Question',
          name: c.title,
          acceptedAnswer: { '@type': 'Answer', text: c.desc },
        })),
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />
      <main className="flex flex-col relative w-full pt-16 pb-32 bg-surface">
        <div className="w-full max-w-3xl mx-auto px-grid-margin-mobile md:px-grid-margin-desktop">
          <nav aria-label="위치" className="py-stack-md flex items-center gap-1.5 flex-wrap text-status-label font-status-label text-on-surface-variant">
            <Link href="/" className="hover:text-primary transition-colors">홈</Link>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <Link href="/area" className="hover:text-primary transition-colors">시공 지역</Link>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <span className="text-on-surface">{label}</span>
          </nav>

          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-stack-md break-keep">
            {label} 부분 수리 — {headline}
          </h1>

          <p className="font-body-lg text-[17px] text-on-surface-variant mb-stack-lg break-keep leading-relaxed">
            {label}에서 {headline} 등을 전체 교체하지 않고 손상된 부분만 수리합니다.
            문틀 하부가 썩었거나 상판에 크랙이 갔다고 해서 전부 뜯어낼 필요는 없습니다.
            아래는 부분 수리로 접근할 수 있는 항목과, 교체가 나은 경우를 가르는 기준입니다.
          </p>

          {/* 지역 × 수리 항목 — 이 문서의 본문 */}
          <section className="mb-stack-lg">
            <h2 className="font-headline-md text-[22px] text-on-surface mb-stack-md">
              {`${label}에서 다루는 수리 항목`}
            </h2>
            <div className="flex flex-col gap-3">
              {topics.map(t => (
                <article
                  key={`${t.spaceId}.${t.targetId}`}
                  className="bg-surface-clean border border-border-subtle rounded-xl p-5"
                >
                  <h3 className="font-headline-md text-[18px] text-on-surface mb-1 break-keep">
                    {label} {t.targetLabel} 수리
                  </h3>
                  <p className="font-status-label text-status-label text-on-surface-variant mb-3">
                    {t.spaceLabel}
                  </p>
                  {t.problems.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {t.problems.map(p => (
                        <span
                          key={p.id}
                          className="px-2.5 py-1 rounded-lg bg-surface-container-low font-status-label text-status-label text-on-surface-variant"
                        >
                          {p.label}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>

          {/* 판단 기준 — FAQ 구조화 데이터와 같은 내용 */}
          <section className="mb-stack-lg">
            <h2 className="font-headline-md text-[22px] text-on-surface mb-stack-md">
              고쳐 쓸 수 있는지 판단하는 기준
            </h2>
            <div className="flex flex-col gap-3">
              {REPAIR_CRITERIA.map(c => (
                <div key={c.title} className="bg-surface-clean border border-border-subtle rounded-xl p-5">
                  <h3 className="font-headline-md text-[17px] text-on-surface mb-1.5 break-keep">{c.title}</h3>
                  <p className="font-body-md text-on-surface-variant break-keep leading-relaxed">{c.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 실제 시공 사례 — 어느 지역 것인지는 각 사례 페이지가 밝힌다 */}
          {cases.length > 0 && (
            <section className="mb-stack-lg">
              <h2 className="font-headline-md text-[22px] text-on-surface mb-2">실제 시공 사례</h2>
              <p className="font-body-md text-on-surface-variant mb-stack-md break-keep">
                작업한 현장의 문제·진단·공정·결과를 그대로 기록한 사례입니다.
                {label} 사례는 작업이 생기는 대로 이 페이지에 함께 싣습니다.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {cases.map(c => (
                  <Link
                    key={c.slug}
                    href={`/${c.slug}`}
                    className="group bg-surface-clean border border-border-subtle rounded-xl p-5 hover:border-primary/30 hover:shadow-md transition-all"
                  >
                    <h3 className="font-headline-md text-[16px] text-on-surface group-hover:text-primary transition-colors break-keep">
                      {c.title}
                    </h3>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="bg-primary-container rounded-2xl p-stack-lg text-center">
            <p className="font-body-md text-on-primary-container mb-stack-md break-keep">
              {label}에서 수리가 필요하시면 사진 한 장만 보내주세요.
              고쳐 쓸 수 있는 상태인지 먼저 알려드립니다.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={telHref}
                className="bg-primary text-on-primary px-6 py-3.5 rounded-xl font-headline-md inline-flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">call</span>
                {siteConfig.contact.phone}
              </a>
              <Link
                href="/cases"
                className="bg-on-primary text-primary px-6 py-3.5 rounded-xl font-headline-md inline-flex items-center justify-center gap-2 hover:bg-surface-clean transition-colors"
              >
                시공 사례 전체보기
              </Link>
            </div>
          </section>
        </div>
      </main>
      <BottomNav />
    </>
  );
}
