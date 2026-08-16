# 수리위키(suriwiki) 네이버 서치어드바이저 & 구글 서치콘솔 색인 등록 가이드

본 문서는 964개 세부 키워드 페이지와 22개 메인사이트 허브를 네이버 및 구글 검색엔진에 자동 수집·색인시키기 위한 웹마스터 도구 등록 가이드입니다.

---

## 1. 네이버 서치어드바이저 (Naver Search Advisor) 등록

### 1단계: 사이트 등록 및 소유 확인
1. [네이버 서치어드바이저](https://searchadvisor.naver.com/) 접속 및 로그인.
2. **웹마스터 도구** &rarr; 대표 도메인 `https://suriwiki.com` 입력.
3. 소유자 확인: HTML 태그 방식을 선택하여 메타태그를 `app/layout.tsx`에 추가하거나 HTML 파일을 `public/`에 업로드합니다.

### 2단계: 동적 사이트맵 (sitemap.xml) 제출
1. **요청** &rarr; **사이트맵 제출** 메뉴로 이동.
2. 사이트맵 URL 입력란에 `sitemap.xml` 입력 후 제출.
3. 수리위키 엔진이 자동으로 22개 공정 허브, 지역 허브, 964개 세부 키워드 랜딩 URL을 실시간 XML로 공급합니다.

### 3단계: RSS 및 웹페이지 수집 요청
1. **요청** &rarr; **웹페이지 수집** 메뉴 이동.
2. 신규 발행된 주요 지역×공정 랜딩페이지 URL (예: `services/moon-suri/gangnam`) 수집 요청.

---

## 2. 구글 서치콘솔 (Google Search Console) 등록

### 1단계: 속성 추가 및 소유권 확인
1. [Google Search Console](https://search.google.com/search-console/) 접속.
2. **도메인 속성** 선택 후 `suriwiki.com` 입력.
3. DNS TXT 레코드 복사 후 도메인 DNS 설정에 추가하여 인증.

### 2단계: 사이트맵 제출
1. 좌측 메뉴 **Sitemaps** 클릭.
2. **새 사이트맵 추가**: `sitemap.xml` 입력 후 **제출**.
3. 상태가 `성공(Success)`으로 표시되고 수백 개의 검색 URL이 색인 대상으로 등록되는지 확인.

---

## 3. SEO 색인 검증 체크리스트

| 검수 항목 | 기준 요구사항 | 확인 방법 |
|---|---|---|
| **Canonical URL** | 모든 키워드 페이지에 대표 URL 명시 | 크롬 개발자도구 `<link rel="canonical" ...>` |
| **JSON-LD 구조화 데이터** | `LocalBusiness`, `FAQPage`, `BreadcrumbList` 적용 | [구글 리치 리절트 테스트](https://search.google.com/test/rich-results) |
| **Robots txt** | `/consult`, `/admin`, `/search` 수집 차단 | `https://suriwiki.com/robots.txt` 접속 |
| **OpenGraph 태그** | 제목, 설명, 썸네일 전송 이미지 바인딩 | 카카오톡/페북 URL 공유 테스트 |
