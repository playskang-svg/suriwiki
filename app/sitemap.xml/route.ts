/**
 * 사이트맵 인덱스 — /sitemap.xml
 *
 * app/sitemap.ts 가 generateSitemaps 로 분할되면 실제 주소는 /sitemap/<id>.xml 이 되고
 * /sitemap.xml 은 만들어지지 않는다. robots.txt 와 각 검색엔진 콘솔은 주소 하나만 받으므로
 * 분할본을 나열하는 인덱스를 여기서 직접 만든다.
 *
 * 네이버 서치어드바이저·구글 서치콘솔·빙 웹마스터에 제출할 주소가 바로 이 파일이다.
 */
import { siteConfig } from '@/config/site';
import { fetchPublishedPages, pageLastModified, pagesForSitemap, sitemapIdsFor, CORE_SITEMAP_ID } from '@/lib/seo/sitemap';
import { AREAS_SITEMAP_ID } from '@/app/sitemap';
import { toW3CDate, xmlResponse, xmlText } from '@/lib/seo/xml';

const SITE_URL = siteConfig.brand.site_url;

export const revalidate = 3600;

export async function GET() {
  const pages = await fetchPublishedPages();
  const ids = sitemapIdsFor(pages);
  // 지역 분할은 DB pages 가 아니라 시드 콘텐츠로 만들어진다.
  // app/sitemap.ts 의 generateSitemaps 와 같은 목록을 내야 인덱스와 본문이 어긋나지 않는다.
  const list = [...(ids.length ? ids : [CORE_SITEMAP_ID]), AREAS_SITEMAP_ID];

  const entries = list.map(id => {
    const part = id === AREAS_SITEMAP_ID ? [] : pagesForSitemap(pages, id);
    // 분할별 최신 수정일. 비어 있으면 지금 시각을 쓴다.
    const lastmod = part.length
      ? new Date(Math.max(...part.map(p => pageLastModified(p).getTime())))
      : new Date();
    return [
      '  <sitemap>',
      `    <loc>${xmlText(`${SITE_URL}/sitemap/${id}.xml`)}</loc>`,
      `    <lastmod>${toW3CDate(lastmod)}</lastmod>`,
      '  </sitemap>',
    ].join('\n');
  });

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    '</sitemapindex>',
    '',
  ].join('\n');

  return xmlResponse(body, revalidate);
}
