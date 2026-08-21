/**
 * RSS 2.0 피드 — /rss.xml
 *
 * 네이버 서치어드바이저는 사이트맵과 별개로 RSS 제출을 받는다.
 * 새 글이 올라온 것을 사이트맵보다 빨리 알리는 경로라 지역·키워드 페이지를 계속 찍어내는
 * 이 사이트에는 값이 크다.
 *
 * 설명(description)은 실제 페이지에 있는 문장만 쓴다. 없으면 비워 둔다 —
 * 요약을 지어내면 사실성 규칙(F3/F7)을 피드에서 우회하는 셈이 된다.
 */
import { siteConfig } from '@/config/site';
import { fetchPublishedPages, pageLastModified } from '@/lib/seo/sitemap';
import { toRfc822, xmlResponse, xmlText } from '@/lib/seo/xml';

const SITE_URL = siteConfig.brand.site_url;
const MAX_ITEMS = 50;

export const revalidate = 3600;

export async function GET() {
  const pages = (await fetchPublishedPages())
    .sort((a, b) => pageLastModified(b).getTime() - pageLastModified(a).getTime())
    .slice(0, MAX_ITEMS);

  const items = pages.map(page => {
    const url = `${SITE_URL}/${page.slug}`;
    // meta_description 이 없으면 search_intent(질문 1문장)를 쓴다. 둘 다 없으면 설명을 넣지 않는다.
    const description = page.meta_description || page.search_intent || '';
    return [
      '    <item>',
      `      <title>${xmlText(page.title)}</title>`,
      `      <link>${xmlText(url)}</link>`,
      `      <guid isPermaLink="true">${xmlText(url)}</guid>`,
      `      <pubDate>${toRfc822(pageLastModified(page))}</pubDate>`,
      ...(description ? [`      <description>${xmlText(description)}</description>`] : []),
      '    </item>',
    ].join('\n');
  });

  const lastBuild = pages.length ? pageLastModified(pages[0]) : new Date();

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${xmlText(siteConfig.brand.name)}</title>`,
    `    <link>${xmlText(SITE_URL)}</link>`,
    `    <description>${xmlText(siteConfig.brand.tagline)}</description>`,
    '    <language>ko</language>',
    `    <lastBuildDate>${toRfc822(lastBuild)}</lastBuildDate>`,
    `    <atom:link href="${xmlText(`${SITE_URL}/rss.xml`)}" rel="self" type="application/rss+xml" />`,
    ...items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');

  return xmlResponse(body, revalidate);
}
