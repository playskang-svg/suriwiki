/**
 * XML 직렬화 유틸 — 사이트맵·RSS 가 공유한다.
 *
 * 페이지 제목·설명은 사람이 쓴 한국어라 `&`, `<`, 따옴표가 그대로 들어온다.
 * 이스케이프하지 않으면 XML 파서가 문서 전체를 거부하고, 검색엔진은 사이트맵을 통째로 버린다.
 */

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** XML 은 U+0000~U+0008 등 제어문자를 허용하지 않는다. 들어오면 문서가 깨진다. */
export function stripControlChars(value: string): string {
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

export function xmlText(value: string): string {
  return escapeXml(stripControlChars(value));
}

/** RSS 2.0 은 RFC 822 날짜를 요구한다. ISO 8601 을 그대로 넣으면 안 된다. */
export function toRfc822(date: Date): string {
  return date.toUTCString();
}

/** 사이트맵 <lastmod> 는 W3C Datetime(ISO 8601). */
export function toW3CDate(date: Date): string {
  return date.toISOString();
}

export function xmlResponse(body: string, maxAgeSeconds: number): Response {
  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': `public, max-age=0, s-maxage=${maxAgeSeconds}, stale-while-revalidate`,
    },
  });
}
