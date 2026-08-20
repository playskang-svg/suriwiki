# 11 · 사이트 구조 (Page Type · URL · 라우팅)

## Page Type의 역할

| Page Type | 역할 | 주 CT | 예시 URL |
|---|---|---|---|
| **CATEGORY** | 공간·영역 최상위 허브 | – | `/bathroom` |
| **TOPIC** | 대상(문틀·타일 등)별 주제 허브 | CT3·CT5 | `/bathroom/doorframe` |
| **WIKI** | 지식·절차·비교 문서 | CT2·CT3·CT4 | `/wiki/abs-doorframe` |
| **CASE** | 실제 현장 사례 | CT6 | `/case/gangnam-bath-doorframe-01` |
| **AREA** | 지역 허브 | CT6 | `/area/gangnam` |
| **LANDING** | 검색 질문 1개를 정면으로 겨냥한 전환 페이지 | CT1·CT4·CT5·CT6 | `/repair/bathroom-doorframe-rot` |

## URL 규칙

```
/                                   홈
/{space}                            CATEGORY   예: /bathroom
/{space}/{target}                   TOPIC      예: /bathroom/doorframe
/wiki/{slug}                        WIKI       예: /wiki/abs-vs-mdf-doorframe
/case/{slug}                        CASE       예: /case/gangnam-bath-doorframe-01
/area/{area-slug}                   AREA       예: /area/gangnam
/area/{area-slug}/{target}          지역×대상   예: /area/gangnam/doorframe   ※ 지역 CASE 필수
/repair/{intent-slug}               LANDING    예: /repair/bathroom-doorframe-rot-cause
```

- 슬러그는 **영문 소문자 + 하이픈**. 한글 슬러그는 사용하지 않습니다.
- 슬러그는 키워드 노드 `id` 에서 결정론적으로 생성합니다 (`bath.doorframe.rot#cause` → `bathroom-doorframe-rot-cause`).
- URL은 발행 후 변경하지 않습니다. 변경이 필요하면 301 + `canonical_page_id`.

## 내부링크 규칙 (M22)

| 관계 | 방향 | 필수 여부 |
|---|---|---|
| LANDING → 근거 CASE | 1개 이상 | ✔ (source_case_id 있을 때) |
| LANDING → 관련 WIKI | 1~2개 | 권장 |
| CASE → 상위 TOPIC | 1개 | ✔ |
| TOPIC → 하위 LANDING | 상위 우선순위 6개 | ✔ |
| AREA → 해당 지역 CASE 전체 | – | ✔ |
| WIKI ↔ WIKI (비교 대상) | 상호 | 권장 |

- 존재하지 않는 URL로 링크하지 않습니다 (빌드 시 링크 검증 실패 → 배포 중단).
- 한 페이지의 내부링크는 **3~8개**. 링크 목록 반복 복붙 금지.

## 라우팅 (Next.js App Router)

```
app/
├── layout.tsx
├── page.tsx                                  홈
├── [space]/
│   ├── page.tsx                              CATEGORY
│   └── [target]/page.tsx                     TOPIC
├── wiki/[slug]/page.tsx                      WIKI
├── case/[slug]/page.tsx                      CASE
├── area/
│   ├── [area]/page.tsx                       AREA
│   └── [area]/[target]/page.tsx              지역×대상
├── repair/[slug]/page.tsx                    LANDING
├── sitemap.ts
├── robots.ts
└── admin/
    ├── cases/new/page.tsx                    화면 1~4
    ├── cases/[id]/analyze/page.tsx           화면 5~6
    └── pages/[id]/preview/page.tsx           화면 7
```

모든 공개 페이지는 **동일한 렌더러**를 씁니다.

```tsx
// app/_render/PageRenderer.tsx
<PageRenderer page={page} modules={pageModules} images={variants} />
// module_order 를 순회하며 ModuleRegistry[code] 컴포넌트를 렌더
```

→ 새 모듈을 추가할 때 라우트를 건드리지 않습니다. `ModuleRegistry`에만 등록합니다.

## 렌더링 전략

| Page Type | 전략 | 재검증 |
|---|---|---|
| CATEGORY / TOPIC / AREA | SSG + ISR | 3600s |
| WIKI / CASE / LANDING | SSG (generateStaticParams) | on-demand revalidate (발행 시 웹훅) |
| admin/* | 동적 (인증 필요) | – |

`status = published` 인 페이지만 `generateStaticParams` 에 포함합니다.

관련: [13 SEO 규칙](13-seo-rules.md) · [15 개발 사양](15-dev-spec.md)
