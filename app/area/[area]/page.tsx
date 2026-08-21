import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import PageRenderer from '@/app/_render/PageRenderer';
import Header from '@/components/common/Header';
import BottomNav from '@/components/common/BottomNav';
import { getPageData } from '@/lib/data/page';
import { buildMetadata, buildJsonLd } from '@/lib/seo';
import { areaDisplayLabel, fetchAreaTree, findArea } from '@/lib/data/areas';
import { siteConfig } from '@/config/site';

export const revalidate = 3600;
export const dynamicParams = true;

type Params = Promise<{ area: string }>;

/**
 * 시도(21개)만 정적 생성한다.
 *
 * 지역은 3,811개다. 전부 프리렌더하면 빌드가 수십 분으로 늘고 배포가 느려진다.
 * 시군구·동은 dynamicParams 로 첫 요청 때 만들어 캐시한다(ISR).
 * 실제 사례가 있는 지역은 사이트맵을 통해 크롤러가 먼저 들르므로 곧 캐시에 올라온다.
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

  return {
    title: { absolute: `${label} 부분 수리 | ${siteConfig.brand.name}` },
    description: `${label} 지역 부분 수리 문의 안내입니다.`,
    alternates: { canonical: `/area/${area}` },
    // 사례가 아직 없는 지역 페이지는 색인시키지 않는다.
    // 내용이 거의 같은 페이지 수천 개가 색인되면 사이트 전체 평가가 깎인다.
    robots: { index: false, follow: true },
  };
}

export default async function AreaPage({ params }: { params: Params }) {
  const { area } = await params;
  const data = await getPageData(`area/${area}`);

  // 발행된 지역 페이지가 있으면 그대로 렌더한다.
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

  // 없는 지역이면 404. 있는 지역이면 안내 페이지를 보여준다 —
  // 전국 어디서 들어와도 막다른 404 를 만나지 않게 하되,
  // 사례가 없다는 사실은 그대로 말한다 (없는 실적을 지어내지 않는다).
  const row = await findArea(area);
  if (!row) notFound();

  const label = await areaDisplayLabel(area);
  const telHref = `tel:${siteConfig.contact.phone.replace(/[^0-9]/g, '')}`;

  return (
    <>
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
            {label} 부분 수리
          </h1>

          <div className="bg-surface-clean border border-border-subtle rounded-2xl p-stack-lg mb-stack-md">
            <p className="font-body-md text-on-surface mb-stack-sm break-keep">
              {label} 지역은 <strong>아직 공개된 시공 사례가 없습니다.</strong>
            </p>
            <p className="font-body-md text-on-surface-variant break-keep">
              {siteConfig.brand.name}는 실제 작업한 현장만 기록해 공개합니다.
              사례가 없다고 시공이 불가능하다는 뜻은 아니니, 수리가 필요하시면 전화로 확인해 주세요.
              사진 한 장이면 가능 여부를 먼저 알려드립니다.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-stack-lg">
            <a
              href={telHref}
              className="bg-primary text-on-primary px-6 py-4 rounded-xl font-headline-md inline-flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">call</span>
              {siteConfig.contact.phone}
            </a>
            <Link
              href="/cases"
              className="border border-border-subtle text-on-surface px-6 py-4 rounded-xl font-headline-md inline-flex items-center justify-center gap-2 hover:border-primary hover:text-primary transition-colors"
            >
              다른 지역 시공 사례 보기
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </Link>
          </div>
        </div>
      </main>
      <BottomNav />
    </>
  );
}
