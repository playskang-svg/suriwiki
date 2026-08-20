# 15 · 개발 사양 (Next.js + Tailwind + Supabase)

## 1. 스택

| 영역 | 선택 | 비고 |
|---|---|---|
| 프레임워크 | Next.js 15 App Router, TypeScript strict | RSC 우선 |
| 스타일 | Tailwind CSS v3 + Stitch 토큰 | [14](14-design-system.md) |
| DB / Auth / Storage | Supabase (Postgres + RLS + Storage) | |
| 이미지 | `next/image` + Supabase Storage transform | webp |
| 폼 | react-hook-form + zod | 화면 1~4 |
| 검증 | zod 스키마를 DB·API·AI 출력에 공통 사용 | |
| 배포 | Vercel | ISR + on-demand revalidate |
| 테스트 | vitest (유닛) + playwright (E2E 발행 플로우) | |

## 2. 디렉터리

```
suriwiki-app/
├── app/                     # 라우팅 (11 참조)
├── components/
│   ├── modules/             # M01~M24 → ModuleRegistry
│   ├── common/              # Header, BottomNav, Footer, CaseCard …
│   └── admin/               # 입력 7화면
├── lib/
│   ├── supabase/            # server/client 클라이언트
│   ├── compose/             # CT·모듈 조립 엔진 (08 로직)
│   ├── keyword-tree/        # 트리 로드·우선순위·중복판정 (12)
│   ├── images/              # 분류·pHash·크롭/오버레이 렌더
│   └── seo/                 # metadata, JSON-LD (13)
├── config/site.ts
├── data/                    # ../data 심볼릭 또는 복사 (content-types.json 등)
├── supabase/migrations/
└── tailwind.config.ts
```

## 3. 모듈 렌더러

```tsx
// components/modules/registry.ts
import type { ComponentType } from "react";
export type ModuleCode = `M${string}`;
export interface ModuleProps<T = unknown> { body: T; evidence: Evidence[]; images: ImageVariant[]; }

export const ModuleRegistry: Record<ModuleCode, ComponentType<ModuleProps<any>>> = {
  M01: AnswerBox, M02: SummaryCard, M03: SymptomList, M04: CauseFlow,
  M05: GradeCards, M06: JudgementCallout, M07: CriteriaTable, M08: ProcessTimeline,
  M09: SolutionList, M10: StepGuide, M11: SpecTable, M12: SpecTable,
  M13: CompareTable, M14: CostFactors, M15: Checklist, M16: SafetyBanner,
  M17: TipList, M18: ResultCard, M19: CaseCitation, M20: EvidenceGallery,
  M21: FaqAccordion, M22: RelatedGrid, M23: AreaBlock, M24: CtaBlock,
};
```

```tsx
// app/_render/PageRenderer.tsx  (서버 컴포넌트)
export function PageRenderer({ page, modules, images }: Props) {
  return (
    <article>
      {page.module_order.map((code) => {
        const m = modules.find((x) => x.module_code === code);
        if (!m) return null;                       // 근거 없는 모듈은 렌더 안 함
        const C = ModuleRegistry[code as ModuleCode];
        return <C key={code} body={m.body} evidence={m.evidence}
                  images={images.filter(i => m.body?.image_variant_ids?.includes(i.id))} />;
      })}
    </article>
  );
}
```

**새 모듈 추가 = 컴포넌트 1개 + registry 1줄 + zod 스키마 1개.** 라우트는 건드리지 않습니다.

## 4. 조립 엔진 (lib/compose)

```ts
// lib/compose/index.ts
export async function composePage(input: {
  caseRow: CaseRow; node: KeywordNode; existing: PageSummary[];
}): Promise<ComposeResult> {
  const ct = pickCT(input.node, input.caseRow);
  const required = requiredModules(ct, input.caseRow, input.node);   // + M16/M23/M24 승격
  const missing = required.filter((m) => !hasEvidence(m, input.caseRow));
  if (missing.length) {
    const alt = fallbackCT(ct, missing);
    if (!alt) return { decision: "HOLD", reason: `근거 없음: ${missing.join(",")}` };
    return composePage({ ...input, forceCT: alt });
  }
  const optional = rankOptional(ct, input.caseRow, input.node).slice(0, 4)
                     .filter((m) => evidenceStrength(m, input.caseRow) >= 0.3);
  const order = orderModules(ct, input.node.query_ko, [...required, ...optional]);
  const imageSet = buildImageSet(input.caseRow, input.node, { min: 4, max: 6 });
  const diff = Math.min(...input.existing.map((p) => diffScore(draft, p)));
  return { decision: decide(diff), ct, required, optional, order, imageSet, diff };
}
```

`lib/compose/rules.ts` 는 **`data/content-types.json` 을 단일 소스로** 읽습니다. 표를 코드에 하드코딩하지 않습니다.

## 5. Supabase

### RLS 요약

| 테이블 | anon | authenticated(운영자) |
|---|---|---|
| `pages` | `select` where `status='published'` | 전체 |
| `page_modules` | 상위 page가 published일 때만 select | 전체 |
| `cases`, `case_images` | ❌ | 전체 |
| `image_variants` | 상위 page가 published일 때만 | 전체 |
| `keyword_nodes` | ❌ | 전체 |

- `case_images.is_private = true` 인 이미지는 **어떤 경로로도 공개 버킷에 복사되지 않도록** 서버 함수에서 차단.
- Storage 버킷 2개: `cases-private`(비공개 원본) / `public-assets`(발행된 편집본만).

### 마이그레이션

[`supabase/migrations/0001_init.sql`](../supabase/migrations/0001_init.sql)

### 발행 시 revalidate

```
Supabase DB Webhook (pages: UPDATE where status→published)
  → POST /api/revalidate  { slug, page_type, secret }
  → revalidatePath(`/${route}`) + revalidatePath("/sitemap.xml")
```

## 6. AI 호출 지점

| 지점 | 입력 | 출력 | 스킬 |
|---|---|---|---|
| 화면 3 업로드 직후 | 이미지 | role 태그, quality, phash, alt_ko 초안 | – (비전 모델) |
| 화면 5 분석 | case + 기존 트리 | 키워드 노드 후보 6~8개 + 우선순위 | `keyword-tree` |
| 화면 7 생성 | case + 선택 노드 | ComposeResult + 모듈별 body | `ct-mod-composer` |
| 발행 전 | draft page | 검수 리포트 (사실성·중복·링크) | `ct-mod-composer` 체크리스트 |

모든 AI 출력은 **zod로 파싱 실패 시 저장하지 않습니다.** (`safeParse` → 실패 시 재시도 1회 → HOLD)

## 7. 구현 순서 (권장 마일스톤)

| # | 범위 | 산출물 |
|---|---|---|
| M1 | 토큰 + 공통 컴포넌트 | tailwind.config, Header/Footer/BottomNav, 홈 정적 |
| M2 | DB + RLS + 시드 | 0001_init.sql 적용, 샘플 CASE 1건 |
| M3 | 모듈 컴포넌트 24종 + PageRenderer | Storybook 없이 `/dev/modules` 미리보기 페이지 |
| M4 | 공개 라우트 6종 + SEO + sitemap | CASE/WIKI/LANDING/TOPIC/AREA 렌더 |
| M5 | keyword-tree 파이프라인 | build/validate/plan 스크립트 + `/admin/keywords` |
| M6 | 입력 7화면 (admin) | 이미지 업로드·분류·승인 플로우 |
| M7 | compose 엔진 + AI 연동 | 초안 생성 → 검수 → 발행 |
| M8 | 품질 게이트 CI | 발행 차단 규칙 자동 검사 |

**M3 이전에 콘텐츠를 대량 생성하지 않습니다.** 렌더러가 확정돼야 모듈 body 스키마가 고정됩니다.

관련: [10 데이터 모델](10-data-model.md) · [16 품질 게이트](16-quality-gate.md)
