import { notFound } from 'next/navigation';
import PageRenderer from '@/app/_render/PageRenderer';
import { getPageData, getPublishedSlugs } from '@/lib/data/page';
import { buildMetadata, buildJsonLd } from '@/lib/seo';

export const revalidate = 3600;
export const dynamicParams = true;

type Params = Promise<{ area: string }>;

export async function generateStaticParams() {
  // To avoid Vercel build timeout (20k pages), only pre-render:
  // - SIDO, SIGUNGU
  // - DONG with approved cases
  // Others will be handled by ISR (dynamicParams = true).
  
  const { getOptimizedAreaSlugs } = await import('@/lib/data/page');
  const slugs = await getOptimizedAreaSlugs();
  
  return slugs.map(slug => ({ area: slug }));
}

export async function generateMetadata({ params }: { params: Params }) {
  const { area } = await params;
  const data = await getPageData(`area/${area}`);
  if (!data) return {};
  return buildMetadata(data.page, data.pageModules['M01']);
}

export default async function AreaPage({ params }: { params: Params }) {
  const { area } = await params;
  const data = await getPageData(`area/${area}`);
  
  if (!data) notFound();

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
      />
    </>
  );
}
