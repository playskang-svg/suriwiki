/**
 * lib/constants.ts
 * ------------------------------------------------------------------------
 * 사이트 전역 상수. 배포 전 이 파일 값만 바꾸면 브랜드/도메인이 통째로 교체된다.
 * ------------------------------------------------------------------------
 */

// 메인 수리위키 앱(components/public/site-header.tsx)과 동일한 브랜드를 쓴다.
// 템플릿을 다른 브랜드로 재사용할 땐 이 값과 app/layout.tsx의 로고 배지만 바꾸면 된다.
export const SITE_NAME = '수리위키'

/** canonical 태그, OG 이미지 절대경로 생성에 쓰이는 배포 도메인. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://example-pseo.pages.dev').replace(/\/$/, '')

/** DB(pseo_keywords.phone / pseo_page_listings.phone_override)가 비어있을 때 최후의 fallback */
export const DEFAULT_PHONE = '1588-0000'
