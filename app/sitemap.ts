import { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';
import {
  fetchPublishedPages,
  pageLastModified,
  pagesForSitemap,
  sitemapIdsFor,
  CORE_SITEMAP_ID,
} from '@/lib/seo/sitemap';

const SITE_URL = siteConfig.brand.site_url;

// 분할 사이트맵은 /sitemap/<id>.xml 로 서빙된다.
// 목록은 app/sitemap.xml/route.ts(인덱스)와 lib/seo/sitemap.ts 를 공유해 어긋나지 않게 한다.
export const AREAS_SITEMAP_ID = 'areas';

export async function generateSitemaps() {
  const ids = sitemapIdsFor(await fetchPublishedPages());
  // 발행 페이지가 하나도 없어도 빈 목록을 주면 /sitemap/core.xml 이 사라져 인덱스가 404 를 가리킨다.
  const base = ids.length ? ids : [CORE_SITEMAP_ID];
  // 지역 안내 페이지는 DB pages 가 아니라 시드 콘텐츠로 만들어지므로 별도 분할로 낸다.
  return [...base, AREAS_SITEMAP_ID].map(id => ({ id }));
}

export default async function sitemap({ id }: { id: string }): Promise<MetadataRoute.Sitemap> {
  if (id === AREAS_SITEMAP_ID) {
    const { areaSitemapSlugs } = await import('@/lib/seo/sitemap');
    const slugs = await areaSitemapSlugs();
    return slugs.map(slug => ({
      url: `${SITE_URL}/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    }));
  }

  const pages = pagesForSitemap(await fetchPublishedPages(), id);

  return pages.map(page => ({
    url: `${SITE_URL}/${page.slug}`,
    lastModified: pageLastModified(page),
    changeFrequency: 'weekly',
    priority: id === CORE_SITEMAP_ID ? 0.9 : 0.6,
  }));
}
