# 인수인계 문서 (HANDOFF)

> 작성일: 2026-08-05  
> 작성 시점: **PRD v2.3 전 기능 구현 완료 및 론칭 준비 100% 검증 시점**  
> 다음 작업자는 이 문서 &rarr; [README.md](./README.md) &rarr; [suriwiki prd.md](./suriwiki%20prd.md) &rarr; [ARCHITECTURE.md](./ARCHITECTURE.md) 순서로 읽으면 전체 맥락을 파악할 수 있다.

---

## 1. 프로젝트 한 줄 요약

수리위키(SooriWiki) — 현장 시공 사진/정보를 지역×공정 키워드 페이지로 자동 생성하고, **키워드 단위로 사이트를 쪼개 팀·업체에 분양**하는 웹사이트 빌더 플랫폼. 세부 키워드 페이지마다 전용 상담문의 페이지가 1:1로 생성되고, 회사정보(연락처·사업자정보)는 관리자가 한 곳에서 등록해 어느 사이트/페이지에 노출할지 배포를 제어한다.

---

## 2. 전체 기능 완성 현황

| 영역 | 상태 | 설명 |
|---|---|---|
| PRD | v2.3 확정 | [suriwiki prd.md](./suriwiki%20prd.md) 전 스펙 충족 |
| 웹사이트 라우팅 | 100% 완료 | 총 18개 공개/관리자 라우트 및 API 구성 |
| 관리자 보안 | 100% 완료 | Next.js Middleware 기반 `/admin` 접근 보호 및 로그인/세션 |
| 회사정보 배포 관리 | 100% 완료 | 단일 프로필 관리 + 메인사이트/세부페이지 배포 타겟팅 엔진 |
| 랜딩 & 1:1 상담페이지 | 100% 완료 | 12개 필수 섹션, Before/After 전후 비교, 사진 첨부 상담 접수, UTM 수집 |
| SEO & 동적 사이트맵 | 100% 완료 | Dynamic OpenGraph, JSON-LD, 실시간 `sitemap.xml` |
| 데이터 영속성 & 업로드 | 100% 완료 | 파일 기반 DB (`data/db.json`) + Supabase Cloud 하이브리드 어댑터 + `/api/upload` |
| 프로덕션 빌드 | 100% 성공 | `npm run build` 19/19 라우트 성공적 컴파일 검증 완료 |

---

## 3. 핵심 라우트 및 파일 구조

- **공개 라우트:**
  - 홈: [app/page.tsx](./app/page.tsx)
  - 공정 허브: [app/services/\[category\]/page.tsx](./app/services/%5Bcategory%5D/page.tsx)
  - 지역×공정 랜딩페이지: [app/services/\[category\]/\[region\]/page.tsx](./app/services/%5Bcategory%5D/%5Bregion%5D/page.tsx)
  - 1:1 전용 상담문의 페이지: [app/services/\[category\]/\[region\]/consult/page.tsx](./app/services/%5Bcategory%5D/%5Bregion%5D/consult/page.tsx)
  - 사이트맵 / robots: [app/sitemap.ts](./app/sitemap.ts) / [app/robots.ts](./app/robots.ts)

- **관리자 라우트 (`/admin`):**
  - 대시보드 KPI & 수신함: [app/admin/page.tsx](./app/admin/page.tsx)
  - 키워드·페이지 운영: [app/admin/keywords/page.tsx](./app/admin/keywords/page.tsx)
  - 거미줄 내부링크 그래프: [app/admin/links/page.tsx](./app/admin/links/page.tsx)
  - 회사정보·연락처 배포 관리: [app/admin/contacts/page.tsx](./app/admin/contacts/page.tsx)
  - 22개 메인사이트 현황: [app/admin/sites/page.tsx](./app/admin/sites/page.tsx)
  - 로그인 페이지: [app/admin/login/page.tsx](./app/admin/login/page.tsx)

- **핵심 데이터 및 서비스:**
  - 데이터 스토어 & 영속화: [lib/store.ts](./lib/store.ts) & [lib/db/index.ts](./lib/db/index.ts)
  - SEO & JSON-LD 생성기: [lib/seo.ts](./lib/seo.ts)
  - Supabase SQL 스키마: [supabase/schema.sql](./supabase/schema.sql)

---

## 4. 상용 론칭 실행 순서

다음 운영자는 아래 순서에 따라 실서비스 론칭을 진행하시면 됩니다:

1. **`npm run check:setup`** 명령어로 사전 점검 수행
2. **`supabase/schema.sql`** 쿼리를 Supabase 대시보드 SQL Editor에 실행하여 클라우드 DB 테이블 및 Storage 생성 ([docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) 참고)
3. **Vercel**에 GitHub 저장소 연결 후 `NEXT_PUBLIC_SUPABASE_URL` 환경변수 등록 및 배포
4. **22개 메인사이트 커스텀 도메인**을 Vercel Single Project에 바인딩 및 DNS 레코드 지정
5. **네이버 서치어드바이저** 및 **구글 서치콘솔**에 `https://sooriwiki.com/sitemap.xml` 제출 ([docs/SEO_SUBMISSION.md](./docs/SEO_SUBMISSION.md) 참고)
