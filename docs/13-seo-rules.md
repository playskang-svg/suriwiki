# 13 · SEO 규칙

## 기본 원칙

**검색엔진 노출은 "키워드를 넣는 것"이 아니라 "질문 1개에 정확히 답하는 것"으로 얻습니다.**
따라서 SEO 설정은 모두 `search_intent`(질문 1문장)와 `M01`(즉답)에서 파생됩니다.

## 메타데이터 생성 규칙

| 항목 | 규칙 | 소스 |
|---|---|---|
| `<title>` | 30~45자. `{핵심 질문 요약} \| 수리위키` | search_intent |
| `meta description` | 70~120자. **M01 즉답 문장**을 그대로 압축 | M01.answer |
| `h1` | 페이지당 1개. 질문형 또는 대상+문제형 | search_intent |
| `h2` | 각 모듈의 제목 | module_order |
| `canonical` | `canonical_page_id` 있으면 그쪽, 없으면 자기 자신 | pages |
| `og:image` | image_set[0] 의 편집본 | image_variants |

**금지**: 제목·설명에 지역명을 기계적으로 치환해 양산하는 것 (지역 CASE 없으면 HOLD).

## 구조화 데이터 (JSON-LD)

Page Type / CT 별로 다른 스키마를 씁니다.

| 조건 | 스키마 |
|---|---|
| 모든 페이지 | `BreadcrumbList` |
| M21(FAQ) 포함 | `FAQPage` ※ 실제 페이지에 보이는 Q&A만 |
| CT2 (절차) | `HowTo` (steps = M10) |
| CT6 / Page Type = CASE | `Article` + `image[]` + `about` |
| AREA / 서비스 페이지 | `LocalBusiness` + `areaServed` ※ 실제 서비스 지역만 |
| M13(비교) 포함 | `ItemList` |

```jsonc
// 예: CT6 CASE 페이지
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "{title}",
  "image": ["{og}", "..."],
  "about": { "@type": "Thing", "name": "욕실 문틀 하부 부식 교체" },
  "datePublished": "{published_at}",
  "author": { "@type": "Organization", "name": "수리위키" }
}
```

> **주의**: `AggregateRating` · `Review` 는 **실제 수집한 후기가 있을 때만** 넣습니다.
> 후기를 생성해서 마크업하지 않습니다. (구글 스팸 정책 위반 + 브랜드 신뢰 훼손)

## 중복 콘텐츠 방지

| 장치 | 구현 |
|---|---|
| dedupe_key | 발행 전 keyword_nodes에서 충돌 검사 → MERGE |
| diff_score | 같은 CASE 파생 페이지 간 0.45 미만이면 발행 차단 |
| canonical | MERGE 시 `canonical_page_id` 설정 + 301 |
| FAQ 유사도 | 전 페이지 FAQ 질문 임베딩 비교, 0.85 이상 중복 제거 |
| CTA 로테이션 | 페이지 그룹별 CTA 문구 3종 이상 |
| 이미지 | 같은 원본이라도 크롭·오버레이·캡션이 달라야 함 (04 참조) |

## 내부링크 · 크롤링

- `sitemap.xml`: `status = published` 만 포함. `lastmod` = `published_at`.
- `robots.txt`: `/admin` 전체 차단.
- 페이지네이션은 `rel=next/prev` 대신 **필터 조합마다 고유 URL**을 만들지 않습니다 (`?page=2`는 `noindex, follow`).
- 고아 페이지 금지: 모든 발행 페이지는 상위 TOPIC 또는 AREA 에서 링크되어야 합니다 (빌드 검증).

## Core Web Vitals 목표

| 지표 | 목표 | 수단 |
|---|---|---|
| LCP | < 2.0s | 히어로 이미지 `priority` 1장, webp, `next/image` |
| CLS | < 0.05 | 모든 이미지에 width/height, 폰트 `display=swap` + `size-adjust` |
| INP | < 200ms | 서버 컴포넌트 우선, 클라이언트 JS는 갤러리/아코디언만 |

- 폰트: `Noto Sans KR` (본문) + `Inter` (라벨). `next/font/google` 로 self-host, subset `korean, latin`.

## 발행 체크리스트

```
□ search_intent 1문장이 명확한가
□ M01 즉답이 title/description과 일치하는가
□ 필수 모듈 전부 근거 있음
□ 옵션 모듈 2~4개
□ 이미지 4~6장, alt 전부 있음, private 사진 미사용
□ 내부링크 3~8개, 전부 실재 URL
□ dedupe_key 충돌 없음, diff_score ≥ 0.45
□ 지역 언급이 있으면 해당 지역 CASE 보유
□ 금액을 단정하지 않음 (M14는 "달라지는 이유"만)
□ 사람 승인 완료
```

관련: [12 키워드 트리](12-keyword-tree.md) · [16 품질 게이트](16-quality-gate.md)
