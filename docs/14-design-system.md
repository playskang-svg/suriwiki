# 14 · 디자인 시스템 (Stitch → Tailwind → 컴포넌트)

원본: `stitch_assets/*.html` (Google Stitch export)
추출한 Tailwind 토큰을 그대로 `tailwind.config.ts` 로 옮기고, 모듈(M01~M24)을 컴포넌트에 매핑합니다.

---

## 1. 디자인 토큰 (Stitch 원본에서 추출)

### 컬러

| 토큰 | 값 | 용도 |
|---|---|---|
| `primary` | `#00236f` | 주요 액션, 강조 텍스트 |
| `primary-container` / `deep-navy` | `#1e3a8a` | 히어로 배경, 강한 블록 |
| `on-primary` | `#ffffff` | primary 위 텍스트 |
| `primary-fixed` | `#dce1ff` | 연한 강조 배경 |
| `primary-fixed-dim` / `inverse-primary` | `#b6c4ff` | 다크 배경 위 강조 |
| `secondary` | `#855300` | 보조 |
| `secondary-container` | `#fea619` | 보조 강조(배지) |
| `amber-point` | `#f59e0b` | 포인트(별점·강조 아이콘) |
| `trust-blue` | `#3b82f6` | 신뢰 지표, 링크 |
| `tertiary` | `#222a3e` | 다크 섹션 배경 |
| `tertiary-container` | `#384055` | 다크 카드 |
| `surface` / `background` | `#f7f9fb` | 페이지 배경 |
| `surface-clean` / `surface-container-lowest` | `#ffffff` | 카드 |
| `surface-container-low` | `#f2f4f6` | 은은한 구획 |
| `surface-container` | `#eceef0` | 구획 |
| `surface-variant` / `surface-container-highest` | `#e0e3e5` | 구분선 배경 |
| `on-surface` / `on-background` | `#191c1e` | 본문 텍스트 |
| `on-surface-variant` | `#444651` | 보조 텍스트 |
| `outline` | `#757682` | 테두리 |
| `outline-variant` | `#c5c5d3` | 연한 테두리 |
| `border-subtle` | `#e2e8f0` | 카드 테두리 |
| `error` | `#ba1a1a` | 경고 (**M16 안전 배너**) |
| `error-container` | `#ffdad6` | 경고 배경 |
| `on-error-container` | `#93000a` | 경고 텍스트 |

### 타이포그래피

| 토큰 | 크기 / 행간 / 자간 / 굵기 | 폰트 |
|---|---|---|
| `display-lg` | 48 / 60 / -0.02em / 700 | Noto Sans KR |
| `display-lg-mobile` | 32 / 40 / -0.02em / 700 | Noto Sans KR |
| `headline-lg` | 32 / 44 / – / 700 | Noto Sans KR |
| `headline-md` | 24 / 32 / – / 600 | Noto Sans KR |
| `body-lg` | 18 / 28 / – / 400 | Noto Sans KR |
| `body-md` | 16 / 24 / – / 400 | Noto Sans KR |
| `status-label` | 14 / 20 / – / 500 | Noto Sans KR |
| `label-caps` | 12 / 16 / 0.08em / 600 | Inter |

### 간격 · 반경

| 토큰 | 값 |
|---|---|
| `stack-sm` / `stack-md` / `stack-lg` | 0.5rem / 1rem / 2rem |
| `gutter` | 1.5rem |
| `section-gap` | 6rem |
| `grid-margin-mobile` / `grid-margin-desktop` | 1.25rem / 4rem |
| `rounded` / `lg` / `xl` / `full` | 0.25 / 0.5 / 0.75rem / 9999px |

아이콘: **Material Symbols Outlined** (`FILL 0, wght 400, GRAD 0, opsz 24`)

### tailwind.config.ts

`data/` 가 아니라 앱 루트에 아래 파일을 생성합니다.
Stitch export의 `<script id="tailwind-config">` 블록 값을 **그대로** 옮깁니다.

```ts
import type { Config } from "tailwindcss";
export default {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: { extend: {
    colors: { /* 위 표 그대로 */ },
    fontFamily: { "body-md": ["var(--font-noto)"], "label-caps": ["var(--font-inter)"], /* … */ },
    fontSize: { /* 위 표 그대로 */ },
    spacing: { "stack-sm":"0.5rem","stack-md":"1rem","stack-lg":"2rem","gutter":"1.5rem","section-gap":"6rem","grid-margin-mobile":"1.25rem","grid-margin-desktop":"4rem" },
    borderRadius: { DEFAULT:"0.25rem", lg:"0.5rem", xl:"0.75rem", full:"9999px" },
  }},
} satisfies Config;
```

---

## 2. 화면 인벤토리 (Stitch 원본)

| 파일 | 화면 | 이 프로젝트에서의 역할 |
|---|---|---|
| `screen1_home.html` | 홈 (모바일 앱형, "거북이홈마스터") | `/` 홈 — 히어로 + 신뢰지표 + 서비스 그리드 + 강점 + 최근 사례 + 사진견적 CTA + 하단 탭 |
| `screen2_sink.html` | 서비스 상세 (싱크대) | `/{space}/{target}` **TOPIC** 템플릿 |
| `screen4_cases.html` | 시공사례 목록 (모바일) | `/case` 목록, 필터칩 + BEFORE/AFTER 카드 |
| `screen5_main_door.html` | 홈 (데스크톱 웹형, "문수리 전문가") | 데스크톱 `/` 및 **LANDING** 템플릿 |
| `screen6_cases_door.html` | 시공사례 목록 (데스크톱) | `/case` 데스크톱, 카테고리 탭 + 페이지네이션 |

두 브랜드 톤이 섞여 있으므로 **하나로 통일**합니다. 권장: 토큰·레이아웃은 공통, 브랜드명·연락처는 `siteConfig` 한 곳에서 주입.

```ts
// config/site.ts
export const siteConfig = {
  name: "수리위키",
  tagline: "전체 교체 없이, 상한 곳만 정확히 되살립니다",
  phone: "010-0000-0000",
  areas: ["부산","김해","양산"],   // 실제 CASE 보유 지역만
};
```

---

## 3. 모듈 → 컴포넌트 매핑

`module_order` 를 순회하며 `ModuleRegistry[code]` 를 렌더합니다.

| 모듈 | 컴포넌트 | Stitch 참조 | 스타일 요지 |
|---|---|---|---|
| M01 질문 즉답 | `AnswerBox` | screen5 히어로 하단 | `bg-primary-fixed` `rounded-xl` `p-stack-lg`, 답변은 `headline-md` |
| M02 핵심 요약 | `SummaryCard` | screen6 카드 | 4칸 그리드 (문제/판단/작업/결과), `label-caps` 라벨 |
| M03 문제·증상 | `SymptomList` | screen5 체크리스트 | `check_circle` 대신 `error` 톤 아이콘 |
| M04 원인 | `CauseFlow` | – | 3단 화살표 다이어그램, `surface-container-low` |
| M05 상태 구분 | `GradeCards` | screen2 특화기술 3카드 | 경미/부분/심함 3카드, 좌측 컬러바 |
| M06 전문가 판단 | `JudgementCallout` | screen5 "정확한 원인 진단" | `border-l-4 border-primary` 인용 블록 |
| M07 수리·교체 기준 | `CriteriaTable` | – | 2열 비교 테이블 |
| M08 실제 공정 | `ProcessTimeline` | screen6 상세 | 번호 배지 + 공정별 사진 |
| M09 일반 해결방법 | `SolutionList` | screen5 서비스 카드 | 아이콘 + 제목 + 설명 |
| M10 셀프시공 | `StepGuide` | – | ProcessTimeline과 동일 레이아웃, 상단 준비물 |
| M11 재료 | `SpecTable` | screen2 | `surface-clean` 테이블 |
| M12 공구 | `SpecTable` | 동일 | |
| M13 비교 | `CompareTable` | – | 축 3~4개, 승자 셀 `bg-primary-fixed` |
| M14 비용·시간 요소 | `CostFactors` | screen2 "예상 복원 비용" | **금액 대신 "달라지는 이유" 리스트**. 금액 표기 시 `~부터` + 면책 문구 필수 |
| M15 자가 확인 | `Checklist` | screen5 check_circle | 체크박스 리스트 |
| M16 안전·중단 | `SafetyBanner` | – | `bg-error-container` `text-on-error-container` + `warning` 아이콘. **접기 금지** |
| M17 관리·예방 | `TipList` | – | `lightbulb` 아이콘 리스트 |
| M18 결과·한계 | `ResultCard` | screen4 AFTER | 결과 + 한계 2단, 한계는 `on-surface-variant` |
| M19 CASE 근거 | `CaseCitation` | screen1 최근 사례 | 썸네일 + 지역 + 한줄 + `자세히 보기` |
| M20 사진·오버레이 | `EvidenceGallery` | screen4 BEFORE/AFTER | `compare_arrows` 슬라이더 + 캡션 + 오버레이 레이어 |
| M21 FAQ | `FaqAccordion` | screen5 자주 묻는 질문 | `expand_more` 아코디언, JSON-LD 연동 |
| M22 내부링크 | `RelatedGrid` | screen1 서비스 그리드 | 2~3열 카드 |
| M23 지역·서비스 | `AreaBlock` | screen4 "부산/경남 전지역 출장" | `bg-tertiary` 다크 블록 + 지역 CASE 리스트 |
| M24 CTA | `CtaBlock` | screen1 사진 견적 | `bg-deep-navy` + `add_a_photo` 버튼 + 전화/채팅 |

### 공통 컴포넌트

`Header`(모바일 고정 + 지역 선택) · `BottomNav`(모바일 4탭) · `DesktopNav`(screen5) · `Footer` · `FilterChips`(screen4) · `CaseCard` · `StatStrip`(10,000+ / 4.9 / 99%) · `Breadcrumb`

> **StatStrip 주의**: `10,000+`, `4.9`, `99%` 는 Stitch 더미값입니다.
> 실제 수치 근거가 없으면 **표시하지 않습니다**. (사실성 규칙)

---

## 4. 반응형

| 브레이크포인트 | 기준 | 레이아웃 |
|---|---|---|
| `< 768px` | screen1/2/4 | 1열, `grid-margin-mobile`, 하단 탭 노출, `display-lg-mobile` |
| `768~1279px` | – | 2열 카드, 상단 네비, 하단 탭 숨김 |
| `≥ 1280px` | screen5/6 | 3열, `grid-margin-desktop`, `section-gap`, 사이드 목차(LANDING) |

## 5. 접근성

- 본문 대비 `#191c1e` on `#f7f9fb` = 15.4:1 ✔
- `primary #00236f` on white = 13.9:1 ✔ / white on `primary` ✔
- `amber-point #f59e0b` 는 **텍스트 색으로 사용 금지** (white 대비 2.1:1). 아이콘·배경만.
- `outline #757682` on `surface #f7f9fb` = 4.6:1 → 1px 테두리 용도로만.
- 모든 아이콘 버튼에 `aria-label`. 터치 타깃 최소 44×44.
- 아코디언·슬라이더는 키보드 조작 가능(`Enter`/`Space`/방향키).

관련: [11 사이트 구조](11-site-architecture.md) · [15 개발 사양](15-dev-spec.md)
