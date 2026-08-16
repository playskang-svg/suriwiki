# 수리위키(suriwiki) Vercel 프로덕션 배포 및 22개 멀티 도메인 설정 가이드

본 문서는 수리위키 서비스의 Vercel 프로덕션 배포, 환경변수 구성, 그리고 22개 메인사이트 커스텀 도메인 매핑 절차를 안내합니다.

---

## 1. 사전 준비 사항

- Vercel 계정 (`https://vercel.com`)
- Supabase 프로젝트 (`https://supabase.com`) 및 API Key
- 구매 완료된 22개 카테고리 대표 도메인 (예: `doorsuri.com`, `moontlesuri.com` 등)

---

## 2. Vercel 배포 단계

### 1단계: GitHub 저장소 연결
1. 수리위키 프로젝트 저장소를 GitHub에 push합니다.
2. Vercel Dashboard &rarr; **Add New Project** &rarr; GitHub 저장소 선택.
3. Framework Preset: **Next.js** 선택.

### 2단계: 환경변수 (Environment Variables) 설정
Vercel 프로젝트 설정의 **Environment Variables** 메뉴에서 다음 항목을 등록합니다:

```env
# Supabase Cloud Database & Storage Credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# Admin Default Credentials Override (Optional)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password
```

### 3단계: 프로덕션 빌드 (Deploy)
- **Deploy** 버튼 클릭 시 Vercel Edge Network 상에 자동으로 정적 이중화 배포됩니다.
- 배포 완료 시 `https://suriwiki.vercel.app` 메인 접속 주소가 발급됩니다.

---

## 3. 22개 메인사이트 커스텀 도메인 매핑

Vercel의 **Single Project Multi-Domain** 기능을 사용하여 22개 공정 도메인을 하나의 프로젝트에 바인딩합니다.

### 1단계: Vercel Domains 등록
1. Vercel Dashboard &rarr; Project &rarr; **Settings** &rarr; **Domains** 이동.
2. 22개 도메인을 하나씩 추가합니다:
   - `doorsuri.koreajipsurimaster.com`
   - `moontlesuri.com`
   - `marubokwon.com`
   - ... (PRD 12.5 22개 도메인 전체)

### 2단계: DNS 레코드 설정 (도메인 등록업체 - 가비아, 닷네임, Cloudflare 등)
각 도메인의 DNS 설정에서 다음 CNAME/A 레코드를 추가합니다:

| Type | Name | Value | Purpose |
|---|---|---|---|
| A | `@` | `76.76.21.21` | Vercel Apex Server |
| CNAME | `www` | `cname.vercel-dns.com` | Vercel Subdomain |

---

## 4. 배포 후 상태 확인

- **공개 라우트:** `https://suriwiki.com/services/moon-suri/gangnam` 접속 테스트
- **1:1 상담 라우트:** `https://suriwiki.com/services/moon-suri/gangnam/consult` 접속 후 사진 첨부 접수 테스트
- **관리자 라우트:** `https://suriwiki.com/admin/login` 접속 후 로그인 및 회사정보 배포 확인
