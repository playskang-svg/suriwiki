# 수리위키(suriwiki) v2.3 — 통합 웹사이트 빌더 & 운영 플랫폼

수리위키(suriwiki)는 현장 전문가 팀의 실제 시공 데이터를 기반으로 **지역×공정 키워드 페이지(964개+)를 자동 생성**하고, 키워드 단위로 사이트를 쪼개어 **팀·업체에 독립 분양**하는 웹사이트 빌더 및 운영 플랫폼입니다.

---

## 🚀 프로젝트 상태 (v2.3 100% 완성)

- **PRD v2.3 준수:** [suriwiki prd.md](./suriwiki%20prd.md) 모든 스펙 반영 완료
- **기술 스택:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **라우트 ↔ PRD 매핑:** [ARCHITECTURE.md](./ARCHITECTURE.md) 준수 (총 18개 라우트)
- **보안 & 인증:** Next.js Middleware 기반 `/admin` 접근 보호 및 로그인/세션 관리 (`/admin/login`)
- **회사정보 배포 관리:** 22개 메인사이트 및 특정 키워드 페이지 단위 회사/연락처 배포 타겟팅 엔진 (`/admin/contacts`)
- **1:1 상담 시스템:** 1:1 결합 상담 페이지, 사진 첨부 미리보기, UTM 자동 수집 및 실시간 수신함 (`/admin`)
- **SEO & 동적 사이트맵:** Dynamic OpenGraph, JSON-LD (LocalBusiness, FAQPage, BreadcrumbList), 실시간 `sitemap.xml`
- **영속 DB & 이미지 업로드:** 파일 기반 DB (`data/db.json`) 및 Supabase Cloud 하이브리드 어댑터 + 멀티파트 이미지 업로드 API (`/api/upload`)

---

## 🛠️ 실행 및 환경 점검

### 1) 로컬 개발 서버 구동
```bash
npm install
npm run dev
```
- 공개 서비스: `http://localhost:3000`
- 세부 키워드 랜딩: `http://localhost:3000/services/moon-suri/gangnam`
- 1:1 상담 신청: `http://localhost:3000/services/moon-suri/gangnam/consult`
- 관리자 센터: `http://localhost:3000/admin` (데모 계정: `admin` / `admin123`)

### 2) 론칭 환경 진단 점검
```bash
npm run check:setup
```

### 3) 프로덕션 빌드 검증
```bash
npm run build
```

---

## 📁 주요 폴더 및 문서 위치

- **라우트 ↔ PRD 대응표:** [ARCHITECTURE.md](./ARCHITECTURE.md)
- **인수인계 보고서:** [HANDOFF.md](./HANDOFF.md)
- **Supabase DB SQL 스키마:** [supabase/schema.sql](./supabase/schema.sql)
- **Vercel 프로덕션 배포 가이드:** [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)
- **네이버/구글 검색엔진 색인 등록 가이드:** [docs/SEO_SUBMISSION.md](./docs/SEO_SUBMISSION.md)
