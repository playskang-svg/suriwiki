# SURIWIKI 인수인계 문서

**작성일** 2026-08-20 · **작업 폴더** `내 드라이브 / 15 suriwiki3 / suriwiki`

---

## 1. 이 프로젝트가 무엇인가

집수리 현장 사실(**CASE**)을 한 번 입력하면, AI가 검색 질문에 맞는
**Content Type(CT1~CT6)** 과 **Module(M01~M24)** 을 조합해 CASE·WIKI·LANDING 페이지를 생성하는 사이트다.

> **운영 공식**
> 사람은 현장 사실과 원본 사진을 제공하고, AI는 검색 질문에 맞는 CT와 모듈을 조합해 페이지를 생성한다.
> **글자 수를 맞추기 위해 없는 사실이나 반복 문장을 만들지 않는다.**

원본 기획: `Suriwiki_CT_MOD_모듈형_콘텐츠_생성_가이드_v0.3.docx` (상위 폴더)

### 세 축을 혼동하지 말 것

| 축 | 뜻 | 값 |
|---|---|---|
| **Page Type** | 페이지의 *역할* | CATEGORY / TOPIC / CASE / WIKI / AREA / LANDING |
| **Content Type** | 내용을 *설명하는 방식* | CT1 문제·해결 / CT2 절차 / CT3 정보 / CT4 비교 / CT5 진단 / CT6 사례 |
| **Module** | 페이지 안의 *내용 블록* | M01~M24 |

### 이 프로젝트의 존재 이유 = 사실성

키워드 선점이 목적이지만, **없는 사실로 페이지를 양산하지 않는 것**이 설계의 중심이다.
근거가 없으면 페이지를 만들지 않고 **HOLD** 한다. HOLD 는 실패가 아니라
"현장팀이 무엇을 채워야 하는지" 알려주는 신호다.

가장 위험한 지점은 **지역 페이지 양산**("강남 문틀수리 / 서초 문틀수리 …")이다.
`area_expandable` + 해당 지역 실제 CASE 검사로 막아 두었다.

---

## 2. 지금까지 한 일

| 단계 | 내용 | 상태 |
|---|---|---|
| 기획 문서화 | docx v0.3 → `docs/` 17종 체계화 | ✅ 완료 |
| 키워드 트리 | 규격 + 스크립트 4종 + 시드(264노드) | ✅ 완료·검증됨 |
| 스킬 3종 | keyword-tree / ct-mod-composer / case-intake | ✅ 완료 |
| DB 스키마 | `0001_init.sql` 작성 → Supabase 실제 적용 | ✅ 완료·검증됨 |
| 앱 골격 | Next.js 15 + Tailwind(Stitch 토큰) | ✅ 완료 |
| 모듈 컴포넌트 | M01~M24 + PageRenderer | ⚠️ 구현됨, 실데이터 렌더 미검증 |
| 조립 엔진 | `lib/compose/` | ⚠️ **미완성** (R6·R7) |
| 품질 게이트 | `lib/gate/` F/S/D/L 28규칙 | ⚠️ **미완성** (R1~R5) |
| E2E | CASE 1건 → 발행 → 렌더 | ❌ **한 번도 안 됨** |
| 배포 | Vercel | ❌ 미착수 |

---

## 3. 폴더 구조

```
suriwiki/
├── AGENTS.md                  ★ 에이전트 공통 규칙 · 단일 소스 · 절대 규칙
├── README.md                    문서 인덱스
├── HANDOVER.md                  이 문서
├── SUPABASE-SETUP.md          ★ DB 접속 정보 · 적용 내역
├── FIX-INSTRUCTION.md           1차 재작업 지시문 (완료)
├── FIX-INSTRUCTION-2.md       ★ 2차 검수 지시문 R1~R8 (미수행)
├── FIX-INSTRUCTION-3.md       ★ 3차 지시문 = R1~R8 + DB연결 + E2E + 배포
├── ANTIGRAVITY-PROMPTS.html     복사용 지시문 화면 (브라우저로 열기)
│
├── docs/                        규격 17종 (00~16)
├── data/                        기계 판독 단일 소스
│   ├── content-types.json     ★ CT별 필수·옵션·승격규칙
│   ├── modules.json             M01~M24
│   ├── keyword-tree.seed.json   시드 택소노미
│   ├── keyword-tree.json        빌드 산출물 (264노드)
│   ├── keyword-tree.schema.json
│   ├── difftest.fixtures.json ★ diff_score 결정론적 테스트 픽스처
│   └── cases.sample.json
├── .claude/skills/              스킬 3종 + 파이썬 스크립트 4종
├── supabase/migrations/         0001_init.sql
├── design/stitch_assets/        Stitch export 5화면 (HTML+PNG)
│
├── app/                         Next.js 라우트 + admin 7화면
├── components/modules/          M01~M24 + registry
├── components/common/           공통 9종
├── lib/compose/                 조립 엔진
├── lib/gate/                    품질 게이트
├── lib/keyword-tree/            우선순위·중복판정
└── __tests__/                   gate / compose / ai
```

**파일 174개** (node_modules 제외)

### 단일 소스 원칙

| 대상 | 단일 소스 | 금지 |
|---|---|---|
| CT별 모듈 조합 | `data/content-types.json` | 코드에 표 하드코딩 |
| 모듈 정의 | `data/modules.json` | 컴포넌트에 이름 하드코딩 |
| 키워드 | `data/keyword-tree.json` (빌드 산출물) | 손으로 편집 |
| 디자인 토큰 | `tailwind.config.ts` | 임의 hex |
| 사이트 정보 | `config/site.ts` | 전화번호·브랜드명 하드코딩 |

---

## 4. 인프라 현황

### Supabase — 적용 완료

| 항목 | 값 |
|---|---|
| 프로젝트 | `suriwiki` (`rgdejzrlszpesuodjejw`) · ap-northeast-2 |
| URL | `https://rgdejzrlszpesuodjejw.supabase.co` |
| 마이그레이션 | `suriwiki_ctmod_init`, `suriwiki_ctmod_lock_trigger_functions` |

**생성된 테이블 8종**: `areas` `cases` `case_images` `keyword_nodes` `pages` `page_modules` `image_variants` `page_links`

> 무료 플랜 활성 프로젝트 한도(2개) 때문에 **기존 `suriwiki` 프로젝트의 public 스키마에 추가**했다.
> 같은 DB에 이전 pSEO 테이블(`pseo_*` 등, 약 3만행)이 공존한다. 이름 충돌 없음, 기존 데이터 무손상.

**현재 데이터**: `areas` 8행만. 나머지 전부 0행.
`areas` 에는 `busan ← busan-buk / busan-nam` 부모 관계가 들어 있다 (F1 지역 판정 테스트용).

**DB 레벨 사실성 가드 (동작 확인됨)**
- `is_private=true` 사진을 `image_variants` 에 넣으면 거부
- 미승인 CASE 를 근거로 `published` 전환하면 거부
- 옵션 모듈 5개 이상이면 거부
- `HOLD` 인데 `hold_reason` 없으면 거부

접속 키는 `SUPABASE-SETUP.md` 참조. **`SUPABASE_SERVICE_ROLE_KEY` 는 대시보드에서 직접 복사해야 한다.**

### Vercel — 미착수

계정에 `suriwiki`, `13-suriwiki` 프로젝트가 이미 존재한다(이전 시도). 새로 만들기 전에 정리 여부를 판단할 것.

### Git — 미초기화

`git init` 이 안 돼 있다. `.env.local`, `node_modules`, `.next` 제외 확인 후 초기화 필요.

---

## 5. ⚠️ 남은 문제 8건 (R1~R8)

**전부 미해결.** 상세 수정 방법은 `FIX-INSTRUCTION-2.md` 에 있다.

| # | 위치 | 문제 | 심각도 |
|---|---|---|---|
| **R2** | `lib/gate/run.ts` | 하드코딩된 `mockContext` 하나만 검사. **실제 페이지를 전혀 읽지 않는다.** CI 차단 장치로서 무의미 | 치명 |
| **R1** | `lib/gate/structure.ts` | 옵션 모듈 2개 미만을 *위반*으로 처리. 근거 부족한 짧은 페이지가 영구 차단되어 **없는 내용을 채우도록 압박**한다. 스펙 역행 | 치명 |
| R3 | `lib/gate/facts.ts` | F1 지역 판정이 `startsWith` 라 `busan` 노드가 `busan_nam` CASE 로 통과. `cases.length > 0` 조건 때문에 CASE 파일이 비면 전부 통과 | 높음 |
| R4 | `lib/gate/structure.ts` | S6 이 `work_steps` 를 문자열로 가정(실제는 jsonb 배열). 순서 비교 없이 개수만 봄 | 중간 |
| R5 | `lib/gate/dedupe.ts` | D5 가 `id.split('_crop')` 로 원본 추정. uuid 에는 그 문자열이 없어 **크롭 재사용을 전혀 못 잡는다** | 중간 |
| R6 | `lib/compose/compose.ts` | `getIntentFit` 이 상수 0.5, `getUniqueness` 가 상수 0.8. **검색 의도 적합도(가중치 35%)가 반영 안 됨** | 중간 |
| R7 | `lib/compose/compose.ts` | 중복 검사에 `"Mock M01"` 하드코딩. diff_score 의 25%가 항상 가산되어 **MERGE 될 페이지가 CREATE 로 빠져나간다** | 높음 |
| R8 | `lib/gate/structure.ts` | S2 가 `required_alternatives` 미검사 (CT2/CT3 의 `(M11\|M12)`) | 낮음 |

### 이미 해결된 것 (1차)

- `getCTMatrix()` 배열 오인덱싱 → Map 조회로 수정 ✅
- `expect(true).toBe(true)` 가짜 테스트 → 픽스처 6건 실검증으로 교체 ✅
- L1 주석 처리 해제, L3 길이 기준 복원 ✅
- 공통 컴포넌트 6종 추가 ✅
- `ai.ts` zod `safeParse` + 재시도 1회 + null 반환 ✅
- 게이트 28규칙 코드 전부 존재 ✅

---

## 6. 다음에 할 일 (순서 고정)

```
1단계  DB 연결        .env.local · 타입 생성 · sync-keywords.ts 로 264노드 적재 · Storage 버킷 2개
2단계  R1~R8 수정     R2 → R1 → 나머지
3단계  E2E 1건        CASE 삽입 → 조립 → 게이트 → 발행 → 빌드 → 실제 URL 렌더 확인
4단계  배포           git init → GitHub → Vercel 연결 → 게이트를 빌드 전 단계에 편입
```

**3단계가 끝나기 전에 배포하지 말 것.** 지금까지 페이지가 한 장도 만들어진 적이 없어
코드가 실제로 동작한다는 증거가 없다.

**3단계 완료 후에야** 콘텐츠 생성 루프(CASE 입력 → 페이지 생성)를 시작할 수 있다.

---

## 7. 작업 진행 방법

### Antigravity 에 지시하기

`suriwiki` 폴더를 **워크스페이스 루트**로 열고(상위 폴더를 열면 경로가 어긋난다) 붙여넣는다.

```
FIX-INSTRUCTION-3.md 를 끝까지 읽고 그대로 수행해라.
SUPABASE-SETUP.md 와 FIX-INSTRUCTION-2.md 도 함께 읽어라.
0단계 확인 결과를 먼저 보고한 뒤 시작해라.
```

한 번에 다 시키기보다 **단계별로 끊는 편**이 낫다. 특히 R2 가 안 고쳐지면 3단계 E2E 는 의미가 없다.

### ★ 보고를 검증하는 법 (중요)

지금까지 **"완료했습니다" 보고가 실제와 다른 경우가 3번 있었다.** 다음을 습관화할 것.

1. **명령 출력을 요구한다.** "통과했습니다"가 아니라 `npm run test` 의 테스트 이름별 목록을 받는다.
2. **파일 수정 시각을 본다.** 지시문 저장 시각보다 코드 수정 시각이 앞서면 그 지시는 수행되지 않은 것이다.
   ```bash
   ls -la --time-style=+%m-%d\ %H:%M lib/gate/ FIX-INSTRUCTION-*.md
   ```
3. **자기 의심 주석을 grep 한다.** 미완성 지점이 거의 정확히 여기에 있다.
   ```bash
   grep -rn "mock\|simplified\|we assume\|naive\|for now" lib/ app/ components/
   ```
4. **테스트가 실제로 검증하는지 본다.** `expect(true).toBe(true)`, 주석 처리된 검사, 완화된 임계값을 찾는다.

> 참고: 검증 환경이 Linux 인데 `node_modules` 가 macOS(darwin-arm64)용이면
> `vitest`·`esbuild` 가 네이티브 바인딩 오류로 실행되지 않는다. **이건 코드 문제가 아니다.**
> 실행 검증은 실제 개발 머신에서 해야 한다.

---

## 8. 절대 규칙 (사실성)

| # | 규칙 |
|---|---|
| F1 | 실제 CASE 에 없는 **지역**을 쓰지 않는다 |
| F2 | 근거 없는 **금액·기간**을 단정하지 않는다. M14 는 "달라지는 이유"만 |
| F3 | **후기·평점·시공건수**를 생성하지 않는다 |
| F4 | CASE 에 없는 **공정·재료·공구·결과**를 쓰지 않는다 |
| F5 | 사진의 **실제 내용을 변경**하지 않는다 |
| F6 | `is_private` 사진은 어떤 경로로도 공개하지 않는다 |
| F7 | 자격·면허·인증을 보유 사실 없이 표기하지 않는다 |

추가로:
- 필수 모듈의 근거가 없으면 → **CT 변경 또는 HOLD**. 문장을 지어내지 않는다.
- 글자 수를 채우기 위해 일반론·유사 FAQ·동일 CTA 를 반복하지 않는다.
- **Stitch 디자인의 `10,000+`, `4.9`, `99%` 는 더미값이다.** 실측 근거 없이 렌더하지 않는다.
- Stitch 원본의 전화번호 `010-2288-1194` 도 예시값이다. 실제 값으로 교체할 것.

전체: `docs/16-quality-gate.md`

---

## 9. 알아두면 좋은 것

**브랜드가 두 가지로 섞여 있다.** Stitch export 에 "거북이홈마스터"(모바일 앱형)와
"문수리 전문가"(데스크톱 웹형)가 함께 있다. `config/site.ts` 한 곳에서 주입하도록 통일해야 한다.

**문서가 틀렸을 가능성도 있다.** 실제로 `docs/09` 의 diff_score 검증표에 산술 오류가 있었고
(0.33/0.40 으로 계산하면 0.84 인데 0.68 로 적혀 있었다), 이를 고치면서
`data/difftest.fixtures.json` 을 만들어 기계가 자기검증할 수 있게 했다.
**에이전트가 문서와 구현의 불일치를 발견하면 임의로 문서를 고치지 말고 보고하도록** 지시문에 명시해 두었다.

**키워드 트리 파이썬 스크립트는 검증됐다.** 재빌드·검증이 언제든 가능하다.
```bash
python3 .claude/skills/keyword-tree/scripts/build_tree.py \
  --seed data/keyword-tree.seed.json --out data/keyword-tree.json --cases data/cases.sample.json
python3 .claude/skills/keyword-tree/scripts/validate_tree.py data/keyword-tree.json
python3 .claude/skills/keyword-tree/scripts/plan_pages.py data/keyword-tree.json --top 20
python3 .claude/skills/keyword-tree/scripts/plan_pages.py data/keyword-tree.json --status HOLD --top 30
```
현재 시드 기준 **264노드 · OPEN 151 · HOLD 105**. HOLD 대부분은 "그 지역 CASE 없음"이며,
이 목록이 곧 **현장팀에 요청할 촬영·기록 리스트**가 된다.

**`_archive/`** 에는 초기 배포 zip 과 검증용 소스 zip 이 들어 있다. 지워도 무방하다.
