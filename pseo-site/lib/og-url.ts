/**
 * lib/og-url.ts
 * ------------------------------------------------------------------------
 * OG 썸네일 이미지 URL을 만드는 단 하나의 규칙을 모아둔다.
 *
 * 지역 계층을 전부 슬래시로 펼치다 보니(예: /도배장판/충청남도/천안시), 정적
 * export 파일시스템에서 "충청남도"가 동시에 (1) SIDO 페이지 자체의 파일이면서
 * (2) 하위 페이지들을 담는 폴더여야 하는 충돌이 생긴다. 페이지(.html/.txt)는
 * 확장자가 자동으로 붙어서 문제없지만, Route Handler(OG 이미지)는 확장자 없이
 * 그대로 파일명이 되기 때문에 실제로 충돌해서 빌드가 깨진다(EISDIR 에러, 실제
 * 빌드해서 확인함).
 *
 * 해결: OG 이미지 경로의 마지막 세그먼트에만 ".webp"를 붙인다. "충청남도.webp"
 * (파일)와 "충청남도"(폴더)는 이름이 달라서 절대 충돌하지 않는다 — 페이지가
 * 확장자로 문제를 피하는 것과 똑같은 원리를 그대로 적용한 것.
 * ------------------------------------------------------------------------
 */

/** 화면(썸네일 <img>, OG 메타태그)에서 쓰는 OG 이미지 URL. */
export function ogImageHref(keywordSlug: string, path: string[]): string {
  const withExt = [...path.slice(0, -1), `${path[path.length - 1]}.webp`]
  return `/api/og/${keywordSlug}/${withExt.join('/')}`
}

/** OG 이미지 generateStaticParams용 — path 세그먼트 배열 자체에 확장자를 심어서 반환한다. */
export function withOgExtension(path: string[]): string[] {
  return [...path.slice(0, -1), `${path[path.length - 1]}.webp`]
}

/** OG 라우트 핸들러 안에서 URL로 들어온 path를 원래 지역 슬러그 경로로 되돌린다. */
export function stripOgExtension(path: string[]): string[] {
  return [...path.slice(0, -1), path[path.length - 1].replace(/\.webp$/, '')]
}
