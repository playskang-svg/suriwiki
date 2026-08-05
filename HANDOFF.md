# 수리위키(SooriWiki) v2.3 인수인계 및 작업 보고서 (HANDOFF)

> **최종 수정일:** 2026-08-06  
> **현재 상태:** 깃허브 저장소, Supabase 클라우드 DB, Vercel 실서버 자동 배포 파이프라인 100% 가동 중  
> **GitHub Repository:** [https://github.com/playskang-svg/suriwiki](https://github.com/playskang-svg/suriwiki)  
> **Vercel Live URL:** [https://suriwiki.vercel.app](https://suriwiki.vercel.app)  
> **Supabase Cloud DB:** `https://rgdejzrlszpesuodjejw.supabase.co` (`HTTP 200 OK` 테이블 및 스토리지 연동 완료)

---

## 1. 프로젝트 개요

**수리위키 (SooriWiki)** — 대한민국 1등 집수리·복원 지식 백과 & 수도권 현장 전문가 연합 플랫폼.  
문틀, 마루, 도배, 필름, 타일, 계단, 문지방 수리 등 22개 시공 공정과 964개 수도권 세부 지역 키워드 페이지를 자동 생성하고, 1:1 상담 신청 및 현장 사진 접수, 영업 배포 관리, 1위 키워드 순위 추적을 통합 처리합니다.

---

## 2. 지금까지 완수된 핵심 작업 내역 (최신 업데이트)

### 1) 메인페이지 ("수리위키") 디자인 & 브랜드 개편
- **공식 브랜드명 적용:** "수리위키" 메인 브랜딩 확정 (STUDIO 등 불필요한 단어 제거 완료).
- **한국인 시공 마스터 히어로 배너:** 기존 외국인 기사님 이미지를 제거하고, **한국인 전문 기술 마스터 기사님 사진 (`public/korean_technician_hero.png`)**으로 교체 반영.
- **섹션 배치 순서 재조정:** **`🏗️ 22개 시공 공정별 전용 안내 홈 바로가기` (#services)** 섹션을 **`📍 수도권 지역별 대표 시공문의` (#consult-regions)** 섹션 **상단으로 재배치**.
- **지역 시공문의 DB 연동 박스:** 강남구, 서초구, 분당, 수원, 마포, 군포, 인천 남동구 등 8개 대표 지역 박스 및 DB 등록 아이템 연동.
- **파트너 & 협업 문의 폼:** 기술 마스터 및 공급처 제휴를 위한 전용 인페이지 신청서 구현.
- **비주얼 HTML 사이트맵 페이지 (`/sitemap`):** 22개 카테고리 및 964개 지역 세부 페이지 전체 한눈에 보기 타일 페이지 구현.

### 2) 네비게이션 진입 동선 완전 복원 (상담 직행 차단)
- 기존에 메인화면/카테고리 클릭 시 상담페이지(`/consult`)로 직접 건너뛰던 동선을 100% 수정.
- 카테고리 및 지역 클릭 시 **해당 공정 및 지역 전용 안내 페이지(홈) (`/services/[category]` 또는 `/services/[category]/[region]`)로 먼저 입장**하여 시공사례와 가이드를 확인한 후, `[1:1 상담 신청하기]` 버튼을 통해 상담 폼으로 진입하도록 동선 복원.

### 3) 공정별 전용 홈 페이지 (`app/services/[category]/page.tsx`) 완전 구축
- 빈 TODO 페이지 대신 아래 내용이 포함된 **풍부한 공정 전용 홈페이지**를 신규 구축:
  - 공정별 실제 현장 시공 전·후 (BEFORE & AFTER) 비교 사례 카드
  - 4단계 표준 시공 프로세스 & 0.1mm 정밀 기술 설명
  - 투명 정찰제 가격 가이드 & 팀장 안내
  - 수도권 8개 지역 전용 홈 선택 셀렉터 연동

### 4) 온라인 견적 상담 신청서 & 사진 첨부 안정화
- **최대 10MB 파일 용량 제한 유효성 검사:** 10MB를 초과하는 고용량 이미지 파일 선택 시 경고 팝업 안내 (`⚠️ 파일 용량이 너무 큽니다! (최대 10MB 이하의 이미지 파일만 첨부 가능합니다)`).
- 이미지 업로드 처리 상태 인디케이터 및 전송 에러 핸들링 보완.

### 5) 관리자 대시보드 (`/admin`) 기능 대폭 강화
- **고객 첨부 사진 1:1 확인 모달 (`/admin`):** `1:1 상담 신청 실시간 수신함` 테이블에 고객이 상담폼에서 첨부한 현장 사진의 썸네일과 **`🔍 크게보기` 원본 팝업 뷰어 모달** 추가.
- **섹션 이미지 교체·삭제 (`/admin/images`):** 메인 배너, 시공사례, 공정 썸네일 이미지를 파일 업로드/교체/삭제할 수 있는 관리 화면 구축.
- **40 NEW 네이버 1위 키워드 컴포넌트 (`NewRank1KeywordsShowcase`):** 메인 대시보드 및 순위 페이지 연동.
- **회사정보 배포 관리 (`/admin/contacts`):** 단일 프로필 관리 + 메인사이트/세부페이지 배포 타겟팅 엔진.

### 6) 깃허브 & Supabase & Vercel 3대 클라우드 인프라 연동
- **깃허브 저장소:** [https://github.com/playskang-svg/suriwiki](https://github.com/playskang-svg/suriwiki) 푸시 완료 (`.gitignore`에 `public/uploads/*` 제외 처리로 초경량 0.5MB 관리).
- **Supabase Cloud DB:** 프로젝트 `rgdejzrlszpesuodjejw`에 `supabase/schema.sql` 스키마 실행 완료 (`company_profiles`, `consultation_leads`, `keyword_pages`, `contact_distributions`, `sooriwiki-uploads` 버킷 `HTTP 200 OK` 정상 응답 검증 완료).
- **Vercel 자동 배포:** 깃허브 `main` 브랜치 푸시 시 1초 만에 자동 실서버 재배포 연동.

---

## 3. 라우트 및 핵심 파일 현황

| 라우트 경로 | 역할 및 구성 | 비고 |
|---|---|---|
| `/` | 수리위키 메인 홈페이지 (히어로, 시공사례, 공정관, 지역문의, 협업문의) | [app/page.tsx](./app/page.tsx) |
| `/services/[category]` | 공정별 전용 홈페이지 (BEFORE/AFTER, 4단계 공정, 지역 선택) | [app/services/[category]/page.tsx](./app/services/%5Bcategory%5D/page.tsx) |
| `/services/[category]/[region]` | 지역×공정 세부 랜딩페이지 (맞춤 본문, 사례, 1:1 상담 CTA) | [app/services/[category]/[region]/page.tsx](./app/services/%5Bcategory%5D/%5Bregion%5D/page.tsx) |
| `/services/[category]/[region]/consult` | 1:1 견적 상담 신청서 (사진 첨부 최대 10MB 제한, 비공개 접수) | [app/services/[category]/[region]/consult/page.tsx](./app/services/%5Bcategory%5D/%5Bregion%5D/consult/page.tsx) |
| `/sitemap` | 비주얼 HTML 사이트맵 타일 페이지 (22개 카테고리 & 964개 세부 키워드) | [app/sitemap/page.tsx](./app/sitemap/page.tsx) |
| `/admin` | 통합 운영 대시보드 (KPI, 40 NEW 1위 키워드, 고객 사진 첨부 수신함) | [app/admin/page.tsx](./app/admin/page.tsx) |
| `/admin/images` | 섹션 이미지 교체·삭제·업로드 대시보드 | [app/admin/images/page.tsx](./app/admin/images/page.tsx) |
| `/admin/contacts` | 회사 프로필 등록 및 사이트/페이지별 전화번호 배포 제어 | [app/admin/contacts/page.tsx](./app/admin/contacts/page.tsx) |
| `/admin/keywords` | 키워드 페이지 본문/상태 콤보박스 편집 | [app/admin/keywords/page.tsx](./app/admin/keywords/page.tsx) |
| `/admin/rankings` | 네이버 키워드 순위 및 AI 미개척 키워드 제안 | [app/admin/rankings/page.tsx](./app/admin/rankings/page.tsx) |

---

## 4. 향후 작업 계획 (사용자 세부 가이드 대기 중)

1. **대시보드 UI/UX 대폭 개편:** 사용자 안내에 따른 대시보드 기능 및 레이아웃 재설계.
2. **사이트 생성 및 세부 키워드 페이지 자동 생성 엔진 고도화:** 키워드 콤보박스 및 분양 사이트 생성 로직 재정립.

---
*작성 완료: 수리위키 개발팀*
