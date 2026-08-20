import { notFound } from 'next/navigation';
import PageRenderer from '@/app/_render/PageRenderer';
import { getPageData, getPublishedSlugs } from '@/lib/data/page';
import { buildMetadata, buildJsonLd } from '@/lib/seo';

export const dynamicParams = true;

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  const slugs = await getPublishedSlugs('CASE');
  return slugs.map(slug => {
    const parts = slug.split('/');
    return { slug: parts[1] };
  });
}

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const data = await getPageData(`case/${slug}`);
  if (!data) return {};
  return buildMetadata(data.page, data.pageModules['M01']);
}

export default async function CasePage({ params }: { params: Params }) {
  const { slug } = await params;
  const data = await getPageData(`case/${slug}`);
  
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
