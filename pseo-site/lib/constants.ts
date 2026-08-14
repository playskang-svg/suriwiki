/**
 * lib/constants.ts
 * ------------------------------------------------------------------------
 * 사이트 전역 상수. 배포 전 이 파일 값만 바꾸면 브랜드/도메인이 통째로 교체된다.
 * ------------------------------------------------------------------------
 */

// 사이트 제목은 하드코딩하지 않고 DB의 첫 번째 키워드에서 그대로 가져온다
// (app/layout.tsx, app/page.tsx 참고) — "사이트 제목은 키워드 기준" 요청 반영.
// 키워드가 아직 하나도 없을 때만 쓰이는 최후의 fallback.
export const FALLBACK_SITE_NAME = '지역 시공 정보'

/** canonical 태그, OG 이미지 절대경로 생성에 쓰이는 배포 도메인(= 루트/홈페이지가 사는 곳). */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://example-pseo.pages.dev').replace(/\/$/, '')

/**
 * Cloudflare Pages 무료 플랜은 배포 1건당 파일 2만 개 제한이 있다. 7개 키워드 ×
 * 전국 읍/면/동까지 발행하면 (html+RSC .txt+OG webp) 약 8만 개까지 늘어나서
 * 한 프로젝트로는 배포 자체가 거부된다 — 2026-08-14 실제 배포 시도에서 확인된
 * 에러: "Pages only supports up to 20,000 files in a deployment for your
 * current plan." 그래서 키워드별로 별도 Cloudflare Pages 프로젝트에 나눠 배포한다.
 *
 * 이 맵이 "이 키워드는 어느 도메인에 사는가"의 단일 출처(source of truth)다.
 * scripts/generate-sitemap.mjs와 scripts/split-by-keyword.mjs도 (import 경로
 * 별칭을 못 쓰는 순수 node 스크립트라) 이 맵을 그대로 복사해서 쓴다 — 여기를
 * 바꾸면 그 두 파일도 같이 바꿔야 한다.
 *
 * 새 키워드를 추가할 때: 발행 규모가 작으면(2만 파일 한도 안쪽) 그냥 루트에
 * 얹어도 되고, 크면 여기에 새 Cloudflare Pages 프로젝트 도메인을 추가하고
 * scripts/split-by-keyword.mjs의 KEYWORD_SITE_URL에도 똑같이 추가한다.
 */
export const KEYWORD_SITE_URL: Record<string, string> = {
  도배장판: SITE_URL, // 루트 프로젝트(suriwiki-pseo) — 홈페이지(/)도 여기 산다
  도배업체: 'https://suriwiki-pseo-dobae-eopche.pages.dev',
  아파트도배: 'https://suriwiki-pseo-apateu-dobae.pages.dev',
  벽지: 'https://suriwiki-pseo-byeokji.pages.dev',
  장판: 'https://suriwiki-pseo-jangpan.pages.dev',
  도배가격: 'https://suriwiki-pseo-dobae-gagyeok.pages.dev',
  도배비용: 'https://suriwiki-pseo-dobae-biyong.pages.dev',
}

/**
 * 이 키워드가 실제로 배포되는 도메인. 맵에 없는(나중에 새로 추가된) 키워드는
 * 안전하게 루트 도메인에 같이 산다고 가정한다 — split 스크립트가 모르는
 * 키워드는 옮기지 않고 루트에 그대로 남겨두는 것과 짝이 맞는 동작이다.
 */
export function getKeywordSiteUrl(keywordSlug: string): string {
  return KEYWORD_SITE_URL[keywordSlug] ?? SITE_URL
}

/** DB(pseo_keywords.phone / pseo_page_listings.phone_override)가 비어있을 때 최후의 fallback */
export const DEFAULT_PHONE = '1588-0000'

/**
 * 썸네일(OG 이미지) 크기. 표준 OG 비율(1200×630, 1.91:1)보다 세로로 넉넉하게 키웠다 —
 * 지역명이 긴 경우(예: "전남광주통합특별시") 제목이 2줄로 줄바꿈되면서 아래
 * "무료 상담 문의" 문구와 겹쳐 보이던 문제 때문. app/api/og/.../route.tsx가 실제
 * 이미지를 이 크기로 생성하고, ContactBanner/허브 카드는 CSS aspect-ratio로 같은
 * 비율을 맞춰 표시한다. 셋 중 하나만 바꾸면 서로 어긋나니 함께 바꿔야 한다.
 */
export const OG_IMAGE_WIDTH = 1200
export const OG_IMAGE_HEIGHT = 960
