-- ============================================================================
-- pSEO 템플릿 사이트 — Supabase PostgreSQL 스키마
-- ----------------------------------------------------------------------------
-- 메인 수리위키(suriwiki) 프로젝트의 keyword_pages 등 기존 테이블과 이름이 겹치지
-- 않도록 모든 테이블에 pseo_ 접두사를 붙였다. 같은 Supabase 프로젝트를 공유해도,
-- 완전히 새 프로젝트를 만들어 써도 안전하게 공존한다.
--
-- 실행 방법: Supabase 대시보드 → SQL Editor → 이 파일 전체 붙여넣기 → Run
-- 예시 데이터가 필요하면 이어서 supabase/seed.example.sql도 실행하면 된다.
-- ============================================================================

create extension if not exists "pgcrypto"; -- gen_random_uuid() 사용을 위해

create type pseo_region_type as enum ('SIDO', 'SIGUNGU', 'DONG', 'APT');
create type pseo_section_type as enum ('INTRO', 'BODY', 'CONCLUSION');

-- 1) 타깃 키워드 — 이 표만 갈아끼우면 사이트 주제가 바뀐다.
--    title/description/H1 템플릿은 여기 없다 — 아래 pseo_keyword_variants가 갖는다
--    (같은 키워드라도 글마다 다른 제목/각도를 쓰기 위해).
create table pseo_keywords (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,                 -- URL 세그먼트. 한글 그대로 써도 된다. 예: '도배장판'
  display_name text not null,                -- 실제 노출 키워드. 예: '도배장판'
  phone text not null default '1588-0000', -- 기본 상담 전화번호 (지역별로 override 가능)
  is_active boolean not null default true,
  menu_group text,                            -- 상단 메뉴 드롭다운 묶음 이름(예: '도배 견적'). null이면 평메뉴.
  menu_order int not null default 0,          -- 메뉴 안에서의 정렬 순서
  created_at timestamptz not null default now()
);

-- 1-1) 콘텐츠 버전(variant) — 키워드 하나에 여러 개 둘 수 있다. 같은 키워드의 지역
--      페이지끼리도 지역명만 다른 게 아니라, 제목 뒷부분·본문 각도가 실제로
--      달라지게 하려고 존재한다(예: "후기 볼 때 주의할 점" vs "견적 비교 체크리스트").
--      지역마다 어떤 버전을 쓸지는 (keyword_id+region_id)를 해시해 결정적으로 고른다.
create table pseo_keyword_variants (
  id uuid primary key default gen_random_uuid(),
  keyword_id uuid not null references pseo_keywords(id) on delete cascade,
  variant_key text not null,                  -- 내부 식별용. 예: 'review-tips'
  title_template text not null,
  meta_description_template text not null,
  h1_template text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (keyword_id, variant_key)
);
create index idx_pseo_variants_keyword on pseo_keyword_variants(keyword_id);

-- 2) 지역 트리 (SIDO > SIGUNGU > DONG > APT), 자기참조. 이 표를 갈아끼우면 커버리지가 바뀐다.
--    slug는 전국 유일이 아니라 "형제(같은 parent_id) 안에서만" 유일하면 된다 —
--    실제로 "중구"(부산·대구·대전 등), "고성군"(강원·경남)처럼 시/도가 다르면
--    같은 이름의 시/군/구가 흔하다. URL 경로 해석(resolveRegionByPath)도 형제
--    범위 안에서만 slug를 비교하므로 전역 유일성이 필요 없다.
create table pseo_regions (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references pseo_regions(id) on delete cascade,
  type pseo_region_type not null,
  name text not null,                        -- 노출용. 예: '불당동', '불당아이파크'
  slug text not null,                        -- URL 세그먼트 (flat). 형제 안에서만 유일하면 된다.
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (parent_id, slug)
);
create index idx_pseo_regions_parent on pseo_regions(parent_id);
create index idx_pseo_regions_type on pseo_regions(type);

-- 3) 버전별 서론 / 본론(H2·H3 여러 개) / 결론 콘텐츠. keyword_id가 아니라
--    variant_id에 걸린다 — 버전 하나가 완결된 글 한 편이다.
create table pseo_content_sections (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references pseo_keyword_variants(id) on delete cascade,
  section_type pseo_section_type not null,
  heading_level text check (heading_level in ('h2', 'h3')), -- INTRO/CONCLUSION은 NULL
  heading_template text,                      -- 예: '{region} {keyword} 비용은 얼마나 될까?'
  body_template text not null,                -- {region} {keyword} {phone} 치환. 문단은 빈 줄(\n\n)로 구분
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index idx_pseo_sections_variant on pseo_content_sections(variant_id, sort_order);

-- 4) 실제로 "발행"할 (키워드 × 지역) 조합 — 여기 있는 조합만 정적 페이지로 빌드된다.
--    키워드/지역을 아무리 많이 등록해도, 이 표에 없으면 페이지가 생기지 않는다
--    (원치 않는 조합까지 전부 뿌려지는 걸 막는 안전장치).
create table pseo_page_listings (
  id uuid primary key default gen_random_uuid(),
  keyword_id uuid not null references pseo_keywords(id) on delete cascade,
  region_id uuid not null references pseo_regions(id) on delete cascade,
  phone_override text,                        -- 이 조합만 다른 상담번호를 쓰고 싶을 때 (본문 전체에 적용)
  thumbnail_phone text,                       -- 썸네일(OG 이미지)에만 박힐 전화번호. 비우면 phone_override → keywords.phone 순으로 대체
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  unique (keyword_id, region_id)
);
create index idx_pseo_listings_region on pseo_page_listings(region_id);
create index idx_pseo_listings_keyword on pseo_page_listings(keyword_id);

-- RLS: anon key로는 읽기만 허용. 쓰기(등록/수정)는 Supabase 대시보드나
-- service_role 키를 쓰는 별도 관리 도구에서만 하면 된다(이 정적 사이트 자체는 읽기 전용).
alter table pseo_keywords enable row level security;
alter table pseo_keyword_variants enable row level security;
alter table pseo_regions enable row level security;
alter table pseo_content_sections enable row level security;
alter table pseo_page_listings enable row level security;

create policy "pseo public read" on pseo_keywords for select using (true);
create policy "pseo public read" on pseo_keyword_variants for select using (true);
create policy "pseo public read" on pseo_regions for select using (true);
create policy "pseo public read" on pseo_content_sections for select using (true);
create policy "pseo public read" on pseo_page_listings for select using (true);
