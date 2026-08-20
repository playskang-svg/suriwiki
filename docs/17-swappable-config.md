# 17 · 교체 가능한 설정 구조 (키워드 · 연락처 · 지역)

목표: **키워드 세트 · 연락처 · 지역을 코드 수정 없이 빠르게 갈아끼운다.**
같은 코드베이스로 다른 주제·다른 업체·다른 지역의 사이트를 띄울 수 있어야 한다.

---

## 0. 지금 무엇이 문제인가 (2026-08-20 실측)

| 문제 | 위치 | 영향 |
|---|---|---|
| 브랜드명 하드코딩 | `app/layout.tsx:22,23,27` · `lib/seo/index.ts:7,105,115` **6곳** | 사이트명 하나 바꾸려면 코드 6곳 수정 |
| `SITE_URL` 폴백 중복 | `app/robots.ts:4` · `app/sitemap.ts:4` · `lib/seo/index.ts:4` | 세 곳에 `\|\| 'https://suriwiki.com'` 이 각각 박혀 있음 |
| **지역 정의가 두 곳** | `config/site.ts` 의 `areas: string[]` **vs** DB `areas` 테이블 | 어느 쪽이 진실인지 불명. F1 지역 판정과 어긋날 수 있음 |
| 값 없을 때 조용히 폴백 | `\|\| 'dummy_key'` 4곳, `\|\| 'https://suriwiki.com'` 3곳 | 설정 누락이 **에러가 아니라 가짜 값**으로 흘러감 |
| 키워드 세트 단일 | `data/keyword-tree.json` 고정 | 다른 주제 사이트를 만들려면 파일을 덮어써야 함 |

**가장 위험한 건 마지막 두 개다.** 폴백 때문에 "연락처를 안 넣었는데 사이트가 그냥 떠버리는" 상황이 생긴다.
집수리 사이트에서 가짜 전화번호가 노출되는 건 사실성 규칙(F7) 위반이자 실제 사고다.

---

## 1. 원칙

1. **단일 진실 공급원(SSOT)을 하나만 둔다.** 같은 값이 두 곳에 있으면 반드시 어긋난다.
2. **폴백 기본값을 두지 마라.** 필수 값이 없으면 **빌드가 죽어야 한다.** `|| '기본값'` 금지.
3. **자주 바뀌는 값일수록 코드에서 멀리 둔다.** 코드 < JSON 프로필 < 환경변수 < DB 순으로 교체가 빠르다.
4. **지역은 CASE 유무가 결정한다.** 서비스 지역 목록을 손으로 관리하지 마라 — F1 과 반드시 어긋난다.

---

## 2. 계층 구조

교체 속도 순으로 4층을 둔다. **위층이 아래층을 덮어쓴다.**

```
① 환경변수         Vercel 대시보드에서 즉시 교체 → redeploy 만 하면 반영
② 프로필 JSON      config/profiles/<name>.json — 파일 교체 → 빌드
③ DB (areas/cases) 지역·근거. 운영 중 계속 변함
④ 코드             구조와 규칙만. 값은 절대 두지 않는다
```

### 2-1. 파일 배치

```
config/
  profiles/
    default.json          ← 브랜드·연락처·키워드세트 지정
    <다른사이트>.json
  site.ts                 ← 프로필 로더 + zod 검증. 값 하드코딩 금지
data/
  keyword-tree.default.json
  keyword-tree.<다른사이트>.json
```

### 2-2. 프로필 JSON 스키마

```jsonc
{
  "profile": "default",
  "brand": {
    "name": "수리위키",
    "tagline": "전체 교체 없이, 상한 곳만 정확히 되살립니다",
    "site_url": "https://suriwiki.com"
  },
  "contact": {
    "phone": "010-0000-0000",
    "kakao_url": "https://pf.kakao.com/...",
    "email": "contact@example.com",
    "business_hours": "평일 09:00 - 18:00",
    "owner": "홍길동",
    "biz_no": "123-45-67890",
    "address": "부산광역시 해운대구"
  },
  "keyword_set": "default",      // data/keyword-tree.<이 값>.json 을 읽는다
  "area_scope": ["busan", "gimhae", "yangsan"],  // 후보 지역. 실제 노출은 CASE 유무가 결정
  "certifications": [],          // 실제 보유한 것만. 비어 있으면 F7 이 자격 단정을 차단한다
  "stats": null                  // 실제 지표 없으면 null. 임의 수치 금지 (F3)
}
```

### 2-3. 환경변수 오버라이드 (가장 빠른 교체 경로)

연락처는 제휴·이관 때문에 가장 자주 바뀐다. **Vercel 대시보드에서 값만 바꾸고 redeploy** 하면 되게 한다.

| 환경변수 | 덮어쓰는 대상 | 필수 |
|---|---|---|
| `NEXT_PUBLIC_SITE_PROFILE` | 어느 프로필을 읽을지 | ○ (기본 `default`) |
| `NEXT_PUBLIC_SITE_URL` | `brand.site_url` | ○ |
| `NEXT_PUBLIC_SITE_PHONE` | `contact.phone` | △ |
| `NEXT_PUBLIC_SITE_KAKAO_URL` | `contact.kakao_url` | △ |

**우선순위: 환경변수 > 프로필 JSON > 에러.** 세 번째가 핵심이다 — 기본값으로 때우지 않는다.

> **왜 전부 `NEXT_PUBLIC_` 인가**: `config/site.ts` 는 `M24`(CTA) 같은 **클라이언트 컴포넌트에서도 import** 된다.
> 접두사가 없으면 브라우저에서 `undefined` 가 되어 서버와 값이 달라지고 hydration 이 깨진다.
> 여기 담기는 값(사이트명·전화·카카오 링크)은 어차피 화면에 노출되는 공개 정보다.
> **`SUPABASE_SERVICE_ROLE_KEY` 같은 비밀값에는 이 접두사를 절대 붙이지 마라.**

> **프로필 등록**: 같은 이유로 프로필은 `fs` 로 읽지 않고 `config/site.ts` 의 `PROFILES` 맵에
> **정적 import 로 등록**한다. 새 프로필을 추가하면 JSON 파일 생성 + 맵에 한 줄 추가, 두 곳이다.

---

## 3. `config/site.ts` 가 해야 할 일

값을 담지 말고 **로드·검증·병합만** 한다.

```ts
import { z } from 'zod';

const profileSchema = z.object({
  profile: z.string(),
  brand: z.object({
    name: z.string().min(1),
    tagline: z.string().min(1),
    site_url: z.string().url(),
  }),
  contact: z.object({
    phone: z.string().regex(/^0\d{1,2}-\d{3,4}-\d{4}$/, '전화번호 형식 오류'),
    kakao_url: z.string().url().optional(),
    email: z.string().email(),
    business_hours: z.string(),
    owner: z.string(),
    biz_no: z.string(),
    address: z.string(),
  }),
  keyword_set: z.string(),
  area_scope: z.array(z.string()),
  certifications: z.array(z.string()),   // 빈 배열 허용. 없는 자격을 넣지 마라
  stats: z.object({ /* ... */ }).nullable(),
});
```

**반드시 지킬 것**

- 스키마 검증에 실패하면 **throw 해서 빌드를 죽여라.** 경고만 찍고 넘어가지 마라.
- `phone` 에 `010-0000-0000` 같은 자리표시자가 들어오면 **프로덕션 빌드에서 거부**하라.
  (`NODE_ENV === 'production'` 일 때 `0000-0000` 패턴 차단)
- `stats` 는 실제 지표가 있을 때만 채운다. 없으면 `null`. 게이트 F3 가 근거 없는 수치 렌더를 막는다.
- `certifications` 에 없는 자격을 본문이 단정하면 게이트 F7 이 막는다. **여기에 임의로 채워 넣어 F7 을 우회하지 마라.**

---

## 4. 지역 — SSOT 는 DB `areas` 테이블이다

`config/site.ts` 의 `areas: string[]` 를 **삭제하라.** 지역은 두 곳에서 관리하면 안 된다.

| 용도 | 출처 |
|---|---|
| 지역 계층(상위-하위) | DB `areas.parent_slug` |
| **실제 노출할 서비스 지역** | `areas` 중 **해당 지역(또는 하위 지역)에 승인된 CASE 가 있는 것** |
| 확장 후보 | 프로필의 `area_scope` |

즉 **"서비스 지역 목록"을 손으로 쓰지 않는다.** CASE 가 생기면 자동으로 지역이 열리고, 없으면 안 열린다.
이게 F1(실제 CASE 없는 지역 페이지 금지)과 자동으로 일치하는 유일한 방법이다.

지역을 새로 열려면: `areas` 에 행 추가 → 그 지역 CASE 승인 → 끝. **코드 수정 없음.**

```sql
-- 지금 노출 가능한 지역 (하위 → 상위 전파 포함)
select a.slug, a.label, count(c.id) as case_count
from areas a
left join areas child on child.parent_slug = a.slug
left join cases c on (c.area_slug = a.slug or c.area_slug = child.slug)
                  and c.status = 'approved'
group by a.slug, a.label
having count(c.id) > 0;
```

---

## 5. 키워드 세트 교체

`data/keyword-tree.<keyword_set>.json` 을 프로필이 가리킨다.
`scripts/sync-keywords.ts` 는 프로필을 읽어 해당 파일을 적재한다.

```bash
SITE_PROFILE=default npx tsx scripts/sync-keywords.ts
```

**한 DB 에 여러 사이트를 올릴 경우** `keyword_nodes` 에 `profile text not null default 'default'` 컬럼을
추가하고 PK 를 `(profile, id)` 로 바꿔야 한다. **지금은 필요 없다** — 한 DB = 한 사이트인 동안은 하지 마라.
필요해지는 시점에 마이그레이션하라. 미리 만들지 마라.

> 참고: 같은 DB 의 이전 pSEO 스키마에 `company_profiles` + `contact_distributions`(scope: site/page)와
> `pseo_page_listings.phone_override` 가 이미 있다. **페이지별로 연락처를 다르게 줘야 하는 요구가 생기면**
> 그 패턴을 참고하라. 지금은 사이트 단위 하나로 충분하다.

---

## 6. 교체 시나리오별 소요

| 바꾸려는 것 | 방법 | 재빌드 |
|---|---|---|
| 전화번호·카카오 링크 | Vercel 환경변수 수정 | redeploy |
| 브랜드명·태그라인·도메인 | `config/profiles/<name>.json` 수정 | 빌드 |
| 서비스 지역 추가 | `areas` 행 추가 + 그 지역 CASE 승인 | revalidate |
| 키워드 세트 전체 교체 | `keyword-tree.<name>.json` 추가 + `SITE_PROFILE` 변경 | 빌드 |
| 사이트 통째로 복제 | 프로필 JSON + 키워드 JSON 2개 파일 추가 | 빌드 |

---

## 7. 하지 말 것

1. `|| '기본값'` 폴백을 넣지 마라. 없으면 죽어야 한다.
2. `config/site.ts` 에 실제 값을 다시 하드코딩하지 마라.
3. 서비스 지역 목록을 손으로 관리하지 마라. CASE 가 결정한다.
4. `stats` · `certifications` 를 채워서 게이트 F3·F7 을 우회하지 마라.
5. 프로필 컬럼(`keyword_nodes.profile`)을 지금 미리 만들지 마라. 필요할 때 만든다.

---

## 8. 이미지 — 두 종류를 절대 섞지 마라

이미지는 성격이 완전히 다른 두 부류가 있다. **하나만 교체 가능해야 한다.**

| 구분 | A. 브랜드 자산 | B. CASE 사진 |
|---|---|---|
| 예 | 로고, 파비콘, OG 이미지, 히어로 배경, 빈 상태 일러스트 | 실제 현장 시공 사진 |
| 성격 | 사이트 껍데기 | **사실성의 근거** |
| 프로필로 교체 | **○ 해야 한다** | **✗ 절대 안 된다** |
| 출처 | `public/brand/<profile>/` | Supabase `cases-private` → 편집본만 `public-assets` |
| 걸린 규칙 | 없음 | F1(지역) · F6(비공개) · D5(이미지 중복) |

**B 를 프로필로 갈아끼울 수 있게 만들면 게이트 전체가 무의미해진다.**
사이트 A 의 김해 현장 사진이 사이트 B 의 부산 페이지에 붙는 순간, F1·D5 가 막으려던 바로 그 상황이 된다.
CASE 사진이 바뀐다는 건 CASE 가 바뀌었다는 뜻이고, 그러면 페이지가 다시 조립·검수돼야 한다.
**사진만 갈아끼우는 경로를 만들지 마라.**

### 8-1. A(브랜드 자산) 교체 구조

프로필 JSON 에 `assets` 블록을 추가한다.

```jsonc
"assets": {
  "logo": "/brand/default/logo.svg",
  "favicon": "/brand/default/favicon.ico",
  "og_image": null,          // null 이면 브랜드명으로 동적 생성 (아래 8-2)
  "hero": null,              // null 이면 이미지 없이 텍스트만 렌더
  "placeholder": "/brand/default/placeholder.svg"
}
```

```
public/brand/
  default/
    logo.svg  favicon.ico  placeholder.svg
  <다른사이트>/
    ...
```

**`null` 을 허용하는 게 핵심이다.** 이미지가 없으면 자리표시자 사진을 끼우지 말고 **그 영역을 빼라.**
없는 사진을 채워 넣는 순간 A 가 B 를 흉내내게 된다.

### 8-2. OG 이미지는 파일로 두지 말고 생성하라

사이트를 복제할 때마다 OG 이미지를 새로 그리는 건 느리다. `next/og` 로 **브랜드명·태그라인에서 즉석 생성**하면
교체할 파일이 0개가 된다.

```
app/opengraph-image.tsx   → siteConfig.brand.name / tagline 만 읽어 렌더
```

파비콘만 실제 파일이 필요하다.

### 8-3. `next.config.ts` 의 `remotePatterns` 를 좁혀라

현재 설정은 이렇다.

```ts
{ hostname: 'lh3.googleusercontent.com' },   // ← 제거 대상
{ hostname: '*.supabase.co' },               // ← 너무 넓다
{ hostname: 'localhost' },
```

- `lh3.googleusercontent.com` 은 **Stitch 목업 이미지 때문에 열려 있다. 제거하라.**
  (`app/page.tsx:75,90` 에 AI 생성 이미지가 `alt="…보수 사례"` 로 박혀 있다. 8-4 참조)
- `*.supabase.co` 는 **아무 Supabase 프로젝트나 허용한다.** 프로필의 프로젝트 ref 로 좁혀라.
  → `<project-ref>.supabase.co`
- 외부 호스트를 새로 열 때는 **왜 필요한지 근거를 남겨라.** 열어두면 가짜 사진이 들어올 통로가 된다.

### 8-4. ⚠️ 지금 즉시 고쳐야 할 것 — 홈에 가짜 시공 사례가 있다

```
app/page.tsx:75   <img alt="싱크대 상판 크랙 보수 사례" src="https://lh3.googleusercontent.com/aida/AP1WRLux…" />
app/page.tsx:90   <img alt="문짝 파손 보수 사례"        src="https://lh3.googleusercontent.com/aida/AP1WRLs8…" />
```

`/aida/` 는 **Stitch 가 생성한 AI 목업 이미지**다. 실제 시공 사진이 아닌데 alt 가 "보수 사례"라고 단정한다.
이 프로젝트가 게이트로 막으려는 바로 그 위반이 홈에 그대로 있다.

**게이트는 이걸 못 잡는다.** `app/page.tsx` 는 DB 기반 페이지가 아니라 검사 대상 밖이다.

조치:
1. 두 `<img>` 를 **승인된 CASE 사진으로 교체하거나, 사례 섹션 자체를 제거하라.** 자리표시자로 바꾸지 마라.
2. `app/page.tsx:149` 의 `src={img}` 가 어디서 오는지 추적해 같은 문제가 없는지 확인하라.
3. 홈·카테고리처럼 **DB 를 안 거치는 정적 페이지도 최소한의 검사**를 받게 하라.
   최소 조건: 외부 호스트 이미지 금지, `alt` 에 "사례·시공·전후" 단정 금지 (승인 CASE 출처가 아닌 경우).

### 8-5. 하지 말 것

1. CASE 사진을 프로필/설정으로 교체 가능하게 만들지 마라.
2. 이미지가 없을 때 자리표시자 사진을 끼우지 마라. 영역을 빼라.
3. `remotePatterns` 를 넓게 열어두지 마라.
4. 무료 스톡·AI 생성 이미지를 시공 사례로 쓰지 마라. 어떤 alt 를 달아도 안 된다.
