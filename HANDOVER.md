# SURIWIKI 인수인계 문서

> 최종 갱신: 2026-08-21 · 이 문서만 읽고도 개발·배포가 가능하도록 쓴다.
> 값이 바뀌면 이 문서도 같이 고친다. 문서와 실제가 어긋나면 **실제를 믿고 문서를 고쳐라.**

---

## 0. 링크 모음

| 대상 | 주소 |
|---|---|
| 운영 사이트 | https://suriwiki.com |
| GitHub 저장소 | https://github.com/playskang-svg/suriwiki |
| **작업 브랜치** | `v3` ← **여기서만 작업한다. 아래 §5 필독** |
| Vercel 프로젝트 | https://vercel.com/playskang-6383s-projects/suriwiki |
| Supabase 프로젝트 | https://supabase.com/dashboard/project/rgdejzrlszpesuodjejw |
| 네이버 서치어드바이저 | https://searchadvisor.naver.com |
| 구글 서치콘솔 | https://search.google.com/search-console |

---

## 1. 이 프로젝트가 무엇인가

**집수리 부분 수리 전문 업체의 콘텐츠 사이트.** 전체 교체 대신 상한 부분만 고치는 서비스다.

핵심은 기술이 아니라 **사실성 규칙**이다. 이 제품은 "실제로 시공한 것만 콘텐츠로 만든다"는
원칙 위에 세워져 있고, 그걸 강제하는 게이트가 빌드에 물려 있다. 게이트를 우회하는 코드를
쓰는 순간 이 제품은 존재 이유를 잃는다. §8 을 반드시 읽어라.

**구조**: CASE(실제 현장 기록) → CT(콘텐츠 타입 6종) 선택 → M01~M24 모듈 조립 → 검수 → 발행

---

## 1-2. 로컬 작업 환경 — 이 프로젝트의 특이점

### 작업 폴더 위치

```
/Users/sgk/Library/CloudStorage/GoogleDrive-playskang@gmail.com/내 드라이브/15 suriwiki3/suriwiki
```

**⚠️ Google Drive 동기화 폴더 안에 있다.** 그리고 경로에 **한글·공백·`@`** 가 모두 들어 있다.

```bash
# 이동할 때 반드시 따옴표로 감싼다
cd "/Users/sgk/Library/CloudStorage/GoogleDrive-playskang@gmail.com/내 드라이브/15 suriwiki3/suriwiki"
```

따옴표 없이 치면 경로가 공백에서 잘려 엉뚱한 곳에서 명령이 돈다.

### Google Drive 동기화가 주는 문제

현재 폴더 용량이 **912MB** 인데 대부분이 동기화할 필요 없는 것들이다.

| 폴더 | 용량 | git 추적 |
|---|---|---|
| `node_modules` | 519M | 제외됨 |
| `.next` | 172M | 제외됨 |
| `.git` | 121M | (저장소 자체) |
| 실제 소스 | 수 MB | 추적됨 |

**git 에서 제외되는 것과 Google Drive 동기화는 별개다.** `.gitignore` 에 있어도 Drive 는
그대로 업로드한다. `npm install` 이나 빌드를 돌릴 때마다 수만 개 파일이 동기화 큐에 쌓여
맥이 느려지고 Drive 가 충돌 사본을 만들 수 있다.

**권장**: 로컬 디스크(`~/projects/suriwiki` 등)로 옮겨서 작업하고, Drive 는 백업 용도로만 쓴다.
지금 위치를 유지해야 한다면 Google Drive 설정에서 `node_modules` · `.next` 를 동기화
제외 목록에 넣어라.

### macOS 권한 (TCC)

**AI 에이전트(Claude Code)는 `~/Downloads` · `~/Desktop` · `~/Documents` 를 읽을 수 없다.**
샌드박스를 꺼도 OS 레벨(TCC)에서 막힌다. 실제로 네이버 소유확인 파일을 Downloads 에서
옮기려다 `Operation not permitted` 가 났다.

그런 파일은 **사람이 직접** 옮겨야 한다.

```bash
cp ~/Downloads/파일명 "위 경로/public/"
```

### 검증된 실행 환경

| 도구 | 버전 |
|---|---|
| Node | v24.18.0 로 검증 (18.18 이상 필요) |
| npm | 11.16.0 |
| Python | 3.9.6 (키워드 트리 빌더용) |
| git | 2.50.1 |
| OS | macOS (darwin) · 셸 zsh |

Python 은 `.claude/skills/keyword-tree/scripts/*.py` 를 돌리는 데만 쓴다.
외부 패키지가 필요 없어 표준 설치본이면 된다.

---

## 2. 처음 오는 사람: 30분 안에 돌리기

### 2-1. 클론과 설치

```bash
git clone https://github.com/playskang-svg/suriwiki.git
cd suriwiki
git checkout v3          # main 이 아니다. §5 참고
npm install
```

Node 18.18 이상 필요(Next 15 요구사항). `npm install` 이 ERESOLVE 로 죽으면 §9 를 봐라.

### 2-2. 환경변수

`.env.local` 을 만든다. 값은 Vercel 대시보드나 기존 담당자에게 받는다.

```bash
cp .env.local.example .env.local
```

| 변수 | 어디서 얻나 | 필수 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API | ○ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 같은 곳. **`sb_publishable_` 로 시작해야 한다** | ○ |
| `SUPABASE_SERVICE_ROLE_KEY` | 같은 곳. **`sb_secret_` 로 시작해야 한다** | ○ |
| `REVALIDATE_SECRET` | 아무 랜덤 문자열 (배포 환경과 같아야 함) | ○ |

> **`eyJ` 로 시작하는 키는 옛 legacy 키다. 2026-08-20 에 비활성화됐다.** §9 참고.

이미 Vercel 에 값이 있으면 당겨올 수 있다.

```bash
npx vercel link --yes --scope playskang-6383s-projects --project suriwiki
npx vercel env pull .env.local --environment=development
```

### 2-3. 실행

```bash
npm run dev          # 개발 서버
npm run build        # 게이트 + 프로덕션 빌드 (배포 전 반드시 통과해야 함)
npm test             # vitest 25건
```

`npm run build` 는 게이트를 먼저 돌린다. **게이트가 실패하면 빌드가 죽는다. 정상 동작이다.**

---

## 3. 현재 상태 (2026-08-21)

### 콘텐츠

| 항목 | 수량 | 비고 |
|---|---|---|
| 발행 페이지 | **3건** (전부 CASE) | 사이트의 실질 콘텐츠 전부 |
| 승인 CASE | 6건 | **5건이 `area_slug` 비어 있음** ← 최대 병목 (1건은 `daegu-dong` 반영) |
| 키워드 노드 | 454 (OPEN 145 · HOLD 304 · CLAIMED 5) | HOLD 대부분 "그 지역 CASE 없음" |
| 지역(areas) | 3,811 (시도 21 · 시군구 253 · 동 3,535) · 트리 반영 23개 | |
| CASE 사진 | 원본 25장 → 공개 13장 | 1장은 `is_private` 로 차단됨(정상) |

### 페이지 구조

```
/                     홈 — 발행 페이지를 자동으로 링크
/cases                시공 사례 목록 (공간별 그룹)
/area                 전국 지역 인덱스 (광역 16개 아코디언)
/area/[area]          지역 페이지 — 시도 21개만 프리렌더, 나머지는 ISR
/case/[slug]          CASE 페이지
/[space]/[target]     TOPIC (아직 발행분 0)
/repair/[slug] /wiki/[slug]   (아직 발행분 0)
/admin/*              관리 화면 (robots 차단)
```

### SEO 인프라 (전부 동작 중)

| 경로 | 내용 |
|---|---|
| `/sitemap.xml` | 인덱스 → `core.xml`(3건) + `areas.xml`(274건) |
| `/rss.xml` | RSS 2.0. `/rss` `/feed` 등 별칭은 308 리다이렉트 |
| `/llms.txt` | 생성형 검색(AI) 대응 |
| `/robots.txt` | `/admin` `/api` `/dev` 차단 |
| `/4257f49271086ed5ec527bb4b684e97c.txt` | IndexNow 소유 확인 키 |
| `/navered2653434a8baf21142da44ddcc61ee0.html` | 네이버 소유 확인 |
| `/opengraph-image` | OG 이미지 동적 생성 |

구조화 데이터: `Organization` `WebSite`(전역) · `Service` `BreadcrumbList` `FAQPage`(지역) ·
`Article` `HowTo` `FAQPage` `LocalBusiness`(콘텐츠 페이지)

---

## 4. 데이터가 페이지가 되는 흐름

```
① 키워드          data/keyword-tree.seed.json  (사람이 고치는 유일한 키워드 파일)
                        │
                        │  npm run tree:build   (지역을 DB 에서 당겨와 합침)
                        ▼
                  data/keyword-tree.json  (빌드 산출물 — 손대지 마라)
                        │
                        │  npm run tree:sync
                        ▼
                  DB keyword_nodes  442개
                        │
② 현장 기록       CASE 입력(admin) → cases + case_images
                        │
                        │  ct-mod-composer 로 조립  ← 승인 CASE 가 있어야만 동작
                        ▼
                  DB pages (status: review)
                        │
                        │  npm 스크립트로 발행
                        ▼
                  pages (status: published) → 사이트에 노출
```

**지역은 시드가 아니라 DB `areas` 테이블이 유일한 출처다.** (docs/17 §4)
`scripts/export-areas.ts` 가 다리 역할을 한다. 시드에 `areas` 를 다시 넣으면 빌드가 에러로 막는다.

---

## 5. ⚠️ 배포 — 여기가 제일 위험하다

### 로컬 `v3` 와 원격 `main` 은 **다른 프로젝트**다

```
git log HEAD...origin/main   →   fatal: no merge base
```

| | 로컬 `v3` | 원격 `main` |
|---|---|---|
| 스택 | Next 15.5 + React 19 + Supabase | Next 14.2 + React 18 + `lib/store` |
| 라우트 | `/[space]` `/area` `/case` `/wiki` | `/services` `/regions` `/guides` |
| 커밋 | 이 문서 기준 25개 | 30개+ (별개 히스토리) |

**절대 `main` 에 푸시하거나 강제 푸시하지 마라.** 원격 main 에는 매일 06시에 도는
GitHub Actions(구글시트 → Supabase 동기화)가 있고, 강제 푸시하면 그게 통째로 사라진다.

```bash
git push origin v3        # ✅ 이것만
git push origin main      # ❌ 절대 금지
git push -f               # ❌ 절대 금지
```

### 프로덕션 배포 방법

Vercel 의 **Production Branch 설정은 여전히 `main`** 이다. 그래서 `v3` 푸시만으로는
프리뷰 배포까지만 되고 suriwiki.com 은 안 바뀐다. `promote` 로 올려야 한다.

```bash
# 1) v3 푸시 → 프리뷰 빌드가 자동으로 돈다
git push origin v3

# 2) 빌드가 Ready 인지 확인
npx vercel ls suriwiki --scope playskang-6383s-projects

# 3) 그 배포를 프로덕션으로 승격
npx vercel promote <배포URL> --scope playskang-6383s-projects --yes

# 4) 반영 확인 (CDN 캐시 때문에 1~2분, 쿼리스트링으로 우회해서 확인)
curl -s -o /dev/null -w "%{http_code}\n" "https://suriwiki.com/?v=$(date +%s)"
```

**롤백**은 이전 프로덕션 배포로 되돌리면 된다.

```bash
npx vercel rollback <이전배포ID> --scope playskang-6383s-projects
```

> 근본 해결: Vercel 대시보드 → Settings → Git → Production Branch 를 `v3` 로 바꾸면
> `git push origin v3` 만으로 프로덕션에 나간다. 아직 안 바꿨다.
> 바꾸면 원격 main 에 푸시가 일어나도 프로덕션이 안 뒤집힌다.

---

## 6. 자주 쓰는 명령

```bash
npm run dev                  # 개발 서버
npm run build                # 게이트 + 빌드 (배포 전 필수)
npm test                     # vitest
npx tsc --noEmit             # 타입체크

npm run tree:build           # 지역 export → 키워드 트리 빌드 → 검증
npm run tree:sync            # 트리를 DB keyword_nodes 에 반영
npm run tree:prune           # 트리에 없는 고아 노드 정리
npm run areas:export         # DB areas → data/areas.json

npm run gate:all             # 사실성·구조·중복·링크 게이트 전체
npm run env:push -- --apply  # .env.local → Vercel 3개 환경 일괄 반영

npx tsx scripts/set-case-area.ts             # CASE 지역 현황 / 지정
npx tsx scripts/publish-pages.ts --apply     # review → published
npx tsx scripts/publish-images.ts --apply    # 사진을 공개 버킷으로 + M20 연결
npx tsx scripts/ping-indexnow.ts --apply     # 검색엔진에 URL 통보
```

모든 스크립트는 **기본이 미리보기**이고 `--apply` 를 줘야 실제로 바꾼다.

---

## 7. 지금 막혀 있는 것 (우선순위)

### 🔴 1. `cases.area_slug` — 6건 중 5건이 아직 비어 있다

**진행**: 욕조 트랩 건은 사진 캡션("각산서한이다음 · 대구 동구 반야월")을 근거로
`daegu-dong` 을 채웠다. 그러자 `export-areas` 가 "승인 CASE 가 있는 지역은 범위 무관 포함"
규칙으로 대구 동구를 자동으로 끌어왔다 — 프로필 `area_scope` 에 대구가 없는데도 들어온다.
지역 23개 · 트리 454노드가 됐다.

**남은 것**: 비둘기 실외기실 5건. **이 사진들은 편집 전 촬영 원본이라 지역 정보가 없다.**
현장 기록에서 확인해 채워야 한다.

```bash
npx tsx scripts/set-case-area.ts                                   # 현황 확인
npx tsx scripts/set-case-area.ts --case <id|slug> --area <slug> --apply
npm run tree:build && npm run tree:sync                            # 지역 노드 갱신
```

⚠️ **실제로 시공한 곳만 넣어라.** 근거 없이 채우면 그 지역에 시공했다는 허위 표시가 된다.

### 🔴 2. 콘텐츠가 3건뿐

OPEN 키워드 145개가 조립 대기 중이지만 `composePage()` 가 **승인 CASE 를 필수로 요구**한다
(`caseData.status !== 'approved'` → HOLD). CASE 가 늘어야 풀린다. 코드로 뚫을 수 있는
문제가 아니라 설계상 의도된 차단이다.

추가로 `generateRealDataForModule` 이 지원하는 모듈이 8종(M02·M03·M04·M06·M08·M11·M12·M18)
뿐이다. M01(즉답)·M21(FAQ) 등은 생성기가 없어 비게 된다.

### 🟡 3. 공개 버킷에 촬영 원본이 올라가 있다

`docs/17 §8` 은 "`cases-private` → **편집본만** `public-assets`" 라고 정한다.
그런데 `publish-images.ts` 를 처음 돌릴 때 사진 1장만 확인하고 전부 편집본이라 판단해
비둘기 2건의 **촬영 원본 8장**이 공개 버킷에 올라갔다.

```
public-assets/bath-trap-1/       6장  ← 편집본 (정상)
public-assets/pigeon-sample-1/   4장  ← 촬영 원본
public-assets/pigeon-sample-2/   4장  ← 촬영 원본
```

담긴 것: 작업자 발·장갑 낀 손, 고객 집 베란다 내부, 창밖 건물.
개인 식별은 어려운 수준이라 **운영 판단으로 유지하기로 했다**(2026-08-21).
편집본이 준비되면 같은 경로로 덮어써서 교체하면 된다.

> 교훈: `publish-images.ts` 는 사진이 편집본인지 **검사하지 않는다.**
> 돌리기 전에 눈으로 확인해라.

### 🟡 4. 검색엔진 등록 (진행 중)

| 항목 | 상태 |
|---|---|
| 네이버 소유확인 파일 | ✅ 배포됨 |
| 네이버 소유확인 완료 | ⏳ 사용자 진행 중 |
| 사이트맵 제출 `https://suriwiki.com/sitemap.xml` | ⏳ |
| RSS 제출 `https://suriwiki.com/rss.xml` | ⏳ |
| 구글 서치콘솔 | ❌ 미등록 |
| IndexNow 발송 | ✅ 280건 접수 (네이버·빙 200) |

인증코드를 받으면 `NEXT_PUBLIC_NAVER_SITE_VERIFICATION` /
`NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` 에 넣고 배포하면 된다. 코드는 이미 그 값을 읽는다.

### 🟡 5. DB `areas` 에 중복 행 5쌍

`migrate-areas.ts` 가 정식 계층을 넣으면서 초기 slug 와 겹쳤다.

| 레거시 (parent=null) | 정식 계층 |
|---|---|
| `gimhae` 김해 | `gyeongsangnamdo-gimhae` 김해시 |
| `yangsan` 양산 | `gyeongsangnamdo-yangsan` 양산시 |
| `gangnam` 서울 강남구 | `seoul-gangnam` 강남구 |
| `seocho` 서울 서초구 | `seoul-seocho` 서초구 |
| `pyeongtaek` 평택 | `gyeonggi-pyeongtaek` 평택시 |

동작에는 문제없다(`/area` 인덱스는 하위 지역이 있는 것만 광역으로 취급해 걸러낸다).
정리하려면 `cases.area_slug` 참조까지 같이 옮겨야 한다.

### 🟡 6. 원격 main 의 GitHub Actions

매일 06시에 구글시트 → Supabase 동기화가 돈다. **Secrets 에 옛 legacy 키가 있으면
2026-08-20 부터 실패하고 있을 것이다.** [Actions 탭](https://github.com/playskang-svg/suriwiki/actions)에서
확인하고, 실패했으면 Secrets 를 새 키로 갱신해야 한다.

---

## 8. 절대 규칙 (사실성)

이건 코드 컨벤션이 아니라 **제품의 존재 이유**다. 어떤 이유로도 우회하지 마라.

1. 실제 CASE 에 없는 **지역·가격·후기·공정·결과**를 만들어내지 않는다.
2. 글자 수를 채우려고 일반론·유사 FAQ·동일 CTA 를 반복하지 않는다.
3. 근거가 없으면 문장을 지어내지 말고 **CT 변경 또는 HOLD**.
4. 사진은 실제 내용을 바꾸지 않는다(없던 손상·공정·재료·결과 생성 금지).
5. 지역 페이지에 **"이 지역에서 시공했다" 는 문장을 쓰지 않는다.**
   실적 허위 표시는 표시광고법 문제다. 지역 페이지는 "이 지역에서 이런 수리를 다룬다" 는
   서비스 안내이고, 구조화 데이터도 `Service` 로 쓴다 — `aggregateRating`·`review` 금지.
6. `stats`·`certifications` 를 채워서 게이트 F3·F7 을 우회하지 않는다.

> **게이트가 못 잡는 사각지대**: 게이트는 DB 기반 페이지만 검사한다.
> `app/page.tsx` 같은 정적 페이지는 검사 대상 밖이다. 실제로 홈 카피에
> "수많은 집들이 이미…"(공개 사례 3건), "수십 번의 조색 테스트"(근거 없음),
> "당일 완료 원칙"(보증 근거 없음) 이 들어 있었고 2026-08-21 에 걷어냈다.
> **하드코딩 카피를 쓸 때는 게이트가 안 봐준다는 걸 기억해라.**

---

## 9. 실제로 겪은 함정 (다시 밟지 마라)

| 증상 | 원인 | 해결 |
|---|---|---|
| **마우스 휠 스크롤이 전혀 안 먹음** (JS `scrollTop` 은 동작) | `globals.css` 가 `html` 과 `body` 양쪽에 `overflow-x: hidden`. html 의 overflow 가 visible 이 아니면 뷰포트 스크롤이 html 박스로 넘어간다 | 가로 잘라내기는 `body` 에서만 |
| 스크롤은 되는데 "안 내려간다" 고 느낌 | `::-webkit-scrollbar { display:none }` 이 전역에 걸려 스크롤바가 안 보임 | `.hide-scrollbar` 클래스로만 적용 |
| 빌드는 통과하는데 Vercel 이 배포 거부 | `next@15.0.0` 보안 취약점(CVE-2025-66478). "Deploying outputs…" 다음에 차단 | 패치 버전으로 업그레이드 |
| 새 환경에서 `npm install` 이 ERESOLVE | `next@15.0.0` 이 고정한 react RC 가 `lucide-react` 의 `^19.0.0` 범위에 안 들어감(프리릴리스는 제외됨) | 정식 react 19 로 올리면 근본 해결. `.npmrc legacy-peer-deps` 는 임시방편 |
| `Legacy API keys are disabled` | Supabase legacy anon/service_role 키가 2026-08-20 비활성화 | `sb_publishable_` / `sb_secret_` 새 키로 교체. `npm run env:push -- --apply` |
| IndexNow 가 403 (키는 정상) | 280건을 한 번에 보냄. 문서엔 1만 개까지라지만 실제 한도는 훨씬 작다 | 100건씩 배치 전송 (이미 반영됨) |
| 게이트 F8 "필드 복사 탐지" 오탐 | `compare.before` 가 `items[].image_variant_id` 를 참조하는 건 설계 의도인데 복사로 잡힘 | UUID·URL 형식은 F8 대상에서 제외 (이미 반영됨) |
| CASE 페이지에 사진이 안 나옴 | 원본은 `cases-private`(비공개)에 있고 사이트가 못 읽음. M20 모듈은 `<img>` 대신 `IMG {id}` 텍스트만 찍고 있었음 | `scripts/publish-images.ts` 로 공개 버킷 복사 + M20 연결 |
| 사이트맵/RSS 가 발행 후에도 비어 있음 | `.next` 캐시 | `rm -rf .next` 후 재빌드 |
| 프로덕션에 반영 안 된 것처럼 보임 | Vercel CDN 캐시 | 쿼리스트링(`?v=$(date +%s)`)으로 우회해 확인 |
| 네이버가 소유확인 파일에 404 | 커밋만 하고 프로덕션 promote 를 안 함 | §5 배포 절차대로 promote |
| Downloads 폴더 파일을 못 읽음 | macOS TCC 권한. 샌드박스를 꺼도 안 됨 | 사용자가 직접 `cp` 해야 함 |

---

## 10. 폴더 구조

```
app/                    Next.js App Router
  _render/PageRenderer  콘텐츠 페이지 껍데기(헤더·빵부스러기·CTA) + 모듈 렌더
  area/                 지역 인덱스 + 지역 페이지
  cases/                시공 사례 목록
  sitemap.ts            분할 사이트맵 본문
  sitemap.xml/route.ts  사이트맵 인덱스 (둘이 같은 목록을 내야 함)
  rss.xml/ llms.txt/    피드·AI 검색
components/
  common/               Header · BottomNav · MobileMenu · HeroSlideshow
  modules/M01~M24       콘텐츠 모듈 24종
config/
  site.ts               프로필 로더 + zod 검증 (값 하드코딩 금지)
  profiles/default.json 브랜드·연락처·area_scope·인증코드·IndexNow 키
data/
  keyword-tree.seed.json  ★ 키워드를 고치는 유일한 파일
  keyword-tree.json       빌드 산출물 (손대지 마라)
  areas.json              빌드 산출물 (DB 에서 생성)
lib/
  gate/                 사실성·구조·중복·링크 게이트
  compose/              CT·모듈 조립
  seo/                  메타데이터·구조화데이터·사이트맵·IndexNow
  data/                 페이지·지역·카탈로그 조회
docs/00~17              설계 문서. **17 번(교체 가능한 설정)이 제일 중요**
scripts/                운영 스크립트 (§6)
```

---

## 11. 다음 사람에게 권하는 순서

1. **§5 배포 구조를 먼저 이해해라.** 모르고 `main` 에 푸시하면 사고난다.
2. `npm run build` 를 돌려 게이트가 통과하는지 확인해라. 이게 이 프로젝트의 심장이다.
3. `cases.area_slug` 를 채워라 (§7-1). 가장 적은 노력으로 가장 많은 페이지가 열린다.
4. 새 CASE 를 입력해라. 콘텐츠가 늘어야 나머지가 전부 풀린다.
5. 검색엔진 등록을 마무리해라 (§7-3). SEO 인프라는 다 만들어져 있고 제출만 남았다.
