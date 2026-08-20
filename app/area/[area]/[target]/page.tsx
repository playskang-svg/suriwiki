import { notFound } from 'next/navigation';
import PageRenderer from '@/app/_render/PageRenderer';
import { getPageData, getPublishedSlugs } from '@/lib/data/page';
import { buildMetadata, buildJsonLd } from '@/lib/seo';

export const revalidate = 3600;
export const dynamicParams = true;

type Params = Promise<{ area: string; target: string }>;

export async function generateStaticParams() {
  // AREA with target is basically AREA page type as well or a different query? 
  // 11-site-architecture says: /area/{area-slug}/{target}  지역×대상.
  // Wait, these might be stored as page_type = 'AREA' and slug = 'area/gangnam/doorframe'
  const slugs = await getPublishedSlugs('AREA');
  return slugs
    .filter(slug => slug.split('/').length === 3)
    .map(slug => {
      const parts = slug.split('/');
      return { area: parts[1], target: parts[2] };
    });
}

export async function generateMetadata({ params }: { params: Params }) {
  const { area, target } = await params;
  const data = await getPageData(`area/${area}/${target}`);
  if (!data) return {};
  return buildMetadata(data.page, data.pageModules['M01']);
}

export default async function AreaTargetPage({ params }: { params: Params }) {
  const { area, target } = await params;
  const data = await getPageData(`area/${area}/${target}`);
  
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
