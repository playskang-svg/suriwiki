import { notFound } from 'next/navigation';
import PageRenderer from '@/app/_render/PageRenderer';
import { getPageData, getPublishedSlugs } from '@/lib/data/page';
import { buildMetadata, buildJsonLd } from '@/lib/seo';

export const revalidate = 3600;
export const dynamicParams = true;

type Params = Promise<{ space: string; target: string }>;

export async function generateStaticParams() {
  const slugs = await getPublishedSlugs('TOPIC');
  return slugs.map(slug => {
    const [space, target] = slug.split('/');
    return { space, target };
  });
}

export async function generateMetadata({ params }: { params: Params }) {
  const { space, target } = await params;
  const data = await getPageData(`${space}/${target}`);
  if (!data) return {};
  return buildMetadata(data.page, data.pageModules['M01']);
}

export default async function TopicPage({ params }: { params: Params }) {
  const { space, target } = await params;
  const data = await getPageData(`${space}/${target}`);
  
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
