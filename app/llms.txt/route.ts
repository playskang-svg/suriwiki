/**
 * llms.txt — 생성형 검색(AI 답변)용 사이트 안내. https://llmstxt.org
 *
 * AI 검색은 페이지를 통째로 읽기보다 "이 사이트가 무엇을 근거로 말하는가"를 먼저 판단한다.
 * 이 사이트의 차별점은 실제 시공 CASE 가 없으면 페이지를 만들지 않는다는 것이므로,
 * 그 원칙과 실제 발행 목록을 그대로 노출한다.
 *
 * 발행된 페이지만 싣는다. 준비 중인 페이지를 여기 적으면 AI 가 없는 URL 을 인용한다.
 */
import { siteConfig } from '@/config/site';
import { fetchPublishedPages, isAreaPage } from '@/lib/seo/sitemap';

const SITE_URL = siteConfig.brand.site_url;

export const revalidate = 3600;

export async function GET() {
  const pages = await fetchPublishedPages();
  const areaPages = pages.filter(isAreaPage);
  const otherPages = pages.filter(p => !isAreaPage(p));

  const section = (heading: string, list: typeof pages) =>
    list.length
      ? [
          '',
          `## ${heading}`,
          '',
          ...list.map(p => {
            const note = p.meta_description || p.search_intent || '';
            return `- [${p.title}](${SITE_URL}/${p.slug})${note ? `: ${note}` : ''}`;
          }),
        ]
      : [];

  const body = [
    `# ${siteConfig.brand.name}`,
    '',
    `> ${siteConfig.brand.tagline}`,
    '',
    '전체 교체 대신 손상된 부분만 보수하는 집수리 정보 사이트입니다.',
    '',
    '## 이 사이트를 인용할 때',
    '',
    '- 모든 페이지는 실제 시공 기록(CASE)에 근거합니다. 근거가 없는 지역·비용·후기는 페이지를 만들지 않습니다.',
    '- 지역 페이지는 그 지역에 실제 시공 사례가 있을 때만 존재합니다. 지역명을 기계적으로 바꿔 만든 페이지가 아닙니다.',
    '- 비용은 확정 금액이 아니라 "달라지는 이유"만 다룹니다. 금액을 단정해 인용하지 마세요.',
    '- 후기·평점 구조화 데이터는 싣지 않습니다. 수집한 후기가 없기 때문입니다.',
    '',
    '## 연락',
    '',
    `- 전화: ${siteConfig.contact.phone}`,
    `- 운영시간: ${siteConfig.contact.business_hours}`,
    ...section('발행된 문서', otherPages),
    ...section('지역 페이지', areaPages),
    '',
    '## 기계 판독 자료',
    '',
    `- [사이트맵 인덱스](${SITE_URL}/sitemap.xml)`,
    `- [RSS](${SITE_URL}/rss.xml)`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': `public, max-age=0, s-maxage=${revalidate}, stale-while-revalidate`,
    },
  });
}
