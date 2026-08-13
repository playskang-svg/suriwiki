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

/** canonical 태그, OG 이미지 절대경로 생성에 쓰이는 배포 도메인. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://example-pseo.pages.dev').replace(/\/$/, '')

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
