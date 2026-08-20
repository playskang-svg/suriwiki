# Supabase 세팅 완료 (2026-08-20)

CT·MOD 스키마가 실제 DB에 적용됐습니다. **이 문서의 값을 `.env.local` 에 넣으면 바로 연결됩니다.**

## 프로젝트

| 항목 | 값 |
|---|---|
| 프로젝트명 | `suriwiki` |
| project ref | `rgdejzrlszpesuodjejw` |
| 리전 | ap-northeast-2 (서울) |
| API URL | `https://rgdejzrlszpesuodjejw.supabase.co` |

> 무료 플랜 활성 프로젝트 한도(2개) 때문에 새 프로젝트 대신 **기존 `suriwiki` 프로젝트의 public 스키마에 추가**했습니다.
> 같은 DB에 이전 pSEO 테이블(`pseo_*`, `company_profiles` 등)이 함께 있습니다. **이름 충돌은 없으며 기존 데이터는 건드리지 않았습니다.**

## 적용된 마이그레이션

| 이름 | 내용 |
|---|---|
| `suriwiki_ctmod_init` | 테이블 8종 · enum 7종 · 트리거 3종 · RLS 정책 |
| `suriwiki_ctmod_lock_trigger_functions` | 트리거 전용 함수의 REST RPC 호출 차단 (보안 어드바이저 0028/0029 대응) |

**생성된 테이블**: `areas` `cases` `case_images` `keyword_nodes` `pages` `page_modules` `image_variants` `page_links`

**동작 확인된 사실성 가드**
- `is_private = true` 사진을 `image_variants` 에 넣으면 DB가 거부
- 미승인 CASE 를 근거로 `pages.status = 'published'` 로 바꾸면 DB가 거부
- 옵션 모듈 5개 이상이면 `optional_modules_range` 위반
- `status = 'HOLD'` 인데 `hold_reason` 이 없으면 거부

## 시드 데이터

`areas` 8행이 들어가 있습니다 (busan / busan-buk / busan-nam / gimhae / yangsan / gangnam / seocho / pyeongtaek).
`busan-buk`, `busan-nam` 은 `parent_slug = 'busan'` 입니다. **F1 지역 판정의 상위-하위 체인 테스트에 이 데이터를 쓰세요.**

`keyword_nodes` 는 비어 있습니다. `scripts/sync-keywords.ts` 로 `data/keyword-tree.json` 을 넣으세요.

## .env.local

```bash
NEXT_PUBLIC_SUPABASE_URL=https://rgdejzrlszpesuodjejw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_a16eKFEmFlrYk673lCZMng_qClVYkdG

# service_role 키는 대시보드에서 직접 복사하세요 (여기 적지 않습니다)
# https://supabase.com/dashboard/project/rgdejzrlszpesuodjejw/settings/api
SUPABASE_SERVICE_ROLE_KEY=

# 발행 시 on-demand revalidate 용 (아무 랜덤 문자열)
REVALIDATE_SECRET=
```

> `.env.local` 은 절대 커밋하지 마세요. `.gitignore` 에 있는지 확인하세요.

## RLS 요약

| 테이블 | anon | authenticated |
|---|---|---|
| `pages` | `status='published'` 만 select | 전체 |
| `page_modules` · `image_variants` · `page_links` | 상위 page 가 published 일 때만 select | 전체 |
| `areas` | select 전체 | 전체 |
| `cases` · `case_images` · `keyword_nodes` | **접근 불가** | 전체 |

## Storage (아직 안 만듦)

버킷 2개가 필요합니다. 대시보드 또는 코드로 만드세요.

| 버킷 | 공개 | 용도 |
|---|---|---|
| `cases-private` | 비공개 | 원본 사진. `is_private` 여부와 무관하게 전부 여기 |
| `public-assets` | 공개 | 발행된 페이지의 편집본만 |

**원본을 public-assets 로 그대로 복사하지 마세요.** 편집본만 올라갑니다 (사실성 규칙 F6).
