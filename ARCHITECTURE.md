# 라우트 ↔ PRD 대응표

[suriwiki prd.md](./suriwiki%20prd.md)의 페이지 유형(2.2)·템플릿(11장)·관리자 대시보드(12장)를 실제 파일 경로로 옮긴 지도입니다. 새 기능을 추가할 때는 먼저 이 표에서 위치를 찾고, 없으면 표와 PRD를 함께 갱신하세요.

## 공개 사이트

| PRD 페이지 유형 | 라우트 파일 | 색인 정책 |
|---|---|---|
| 홈 (Level 0) | [app/page.tsx](./app/page.tsx) | index |
| 공정 허브 (Level 1A) | [app/services/\[category\]/page.tsx](./app/services/%5Bcategory%5D/page.tsx) | index |
| 지역 허브 (Level 1B) | [app/regions/\[region\]/page.tsx](./app/regions/%5Bregion%5D/page.tsx) | index |
| 지역×공정 랜딩페이지 (Level 2) | [app/services/\[category\]/\[region\]/page.tsx](./app/services/%5Bcategory%5D/%5Bregion%5D/page.tsx) | 품질 통과 시 index |
| 상담문의 페이지 | [app/services/\[category\]/\[region\]/consult/page.tsx](./app/services/%5Bcategory%5D/%5Bregion%5D/consult/page.tsx) | noindex, follow |
| 시공 사례 (Level 3) | [app/cases/\[caseSlug\]/page.tsx](./app/cases/%5BcaseSlug%5D/page.tsx) | 품질 통과 시 index |
| 전문가·업체 | [app/experts/\[expertSlug\]/page.tsx](./app/experts/%5BexpertSlug%5D/page.tsx) | 검증 완료 시 index |
| 정보 가이드 | [app/guides/\[topicSlug\]/page.tsx](./app/guides/%5BtopicSlug%5D/page.tsx) | 검수 완료 시 index |
| 내부 검색 | [app/search/page.tsx](./app/search/page.tsx) | noindex, follow |
| 사이트맵 / robots | [app/sitemap.ts](./app/sitemap.ts) / [app/robots.ts](./app/robots.ts) | — |

## 관리자 대시보드 (`/admin`, noindex/nofollow + 인증 보호 예정)

| PRD 섹션 | 라우트 파일 |
|---|---|
| 12.1 운영 KPI | [app/admin/page.tsx](./app/admin/page.tsx) |
| 12.2 키워드·페이지 운영 | [app/admin/keywords/page.tsx](./app/admin/keywords/page.tsx) |
| 12.3 내부링크 그래프 | [app/admin/links/page.tsx](./app/admin/links/page.tsx) |
| 12.4 회사정보·연락처 배포 관리 | [app/admin/contacts/page.tsx](./app/admin/contacts/page.tsx) |
| 12.5 키워드 카테고리 현황 | [app/admin/sites/page.tsx](./app/admin/sites/page.tsx) |
| 12.6 관리자 이용방법 가이드 | [app/admin/guide/page.tsx](./app/admin/guide/page.tsx) |

## 공용 컴포넌트

| 컴포넌트 | PRD 근거 |
|---|---|
| [components/public/site-header.tsx](./components/public/site-header.tsx) | 11.1-1 헤더 |
| [components/public/site-footer.tsx](./components/public/site-footer.tsx) | 11.1-12, 11.3 회사정보 배포 원칙 |
| [components/public/breadcrumb.tsx](./components/public/breadcrumb.tsx) | 4.3 링크 품질 규칙 |
| [components/public/consult-cta.tsx](./components/public/consult-cta.tsx) | 11.1-11 상담 CTA → 11.2 상담문의 페이지 |
| [components/admin/admin-sidebar.tsx](./components/admin/admin-sidebar.tsx) | 12장 전체 내비게이션 |
| [components/admin/kpi-card.tsx](./components/admin/kpi-card.tsx) | 12.1 KPI 카드 |

## 데이터

| 파일 | 내용 |
|---|---|
| [lib/types.ts](./lib/types.ts) | PRD 14장 데이터 모델(Site, Page, ConsultPage, CompanyProfile, ContactDistribution 등)의 TypeScript 타입 |
| [lib/mock-data.ts](./lib/mock-data.ts) | 뼈대 단계 목업 데이터 — 실제 연동 시 삭제 대상 |

## 아직 없는 것 (의도적으로 비워둠)

- 인증/세션, 역할 기반 접근제어 (PRD 13장)
- DB/API 연동, 실제 이미지 업로드
- 구조화 데이터(JSON-LD) 생성기 (PRD 7장)
- 메타데이터 자동 생성기 (PRD 6.2)
- 내부링크 자동 추천/그래프 시각화 (PRD 12.3)
