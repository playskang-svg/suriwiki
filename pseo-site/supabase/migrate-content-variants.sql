-- ============================================================================
-- 마이그레이션: 키워드 하나에 "콘텐츠 버전(variant)"을 여러 개 두는 구조로 확장
--
-- 지금까지는 키워드 하나 = 제목/본문 템플릿 하나라서, 같은 키워드의 모든 지역
-- 페이지가 지역명만 다르고 나머지는 완전히 똑같은 문장이었다(예: "서울 도배업체"와
-- "천안시 도배업체"가 제목 뒷부분·본문 내용까지 동일). 실제 콘텐츠 사이트는
-- (참고: bestjangpan.com) 같은 키워드라도 글마다 "후기 볼 때 주의할 점",
-- "견적 비교 체크리스트", "현장 확인 포인트" 등 다른 각도로 제목과 본문을 쓴다.
--
-- 그래서 title/description/H1 템플릿을 pseo_keywords에서 떼어내 새 표
-- pseo_keyword_variants로 옮기고, 본문 섹션(pseo_content_sections)도 이제
-- keyword_id가 아니라 variant_id를 기준으로 묶인다. 지역마다 어떤 버전을 쓸지는
-- (keyword_id + region_id)를 해시해서 결정적으로 고른다 — 재배포해도 같은
-- 페이지는 항상 같은 버전을 쓴다(랜덤이지만 안정적).
--
-- 실행 방법: Supabase 대시보드 → SQL Editor → 새 쿼리 → 이 파일 전체 붙여넣기 → Run
-- ============================================================================

-- 1) 버전 테이블 생성
create table if not exists pseo_keyword_variants (
  id uuid primary key default gen_random_uuid(),
  keyword_id uuid not null references pseo_keywords(id) on delete cascade,
  variant_key text not null,                  -- 내부 식별용 라벨. 예: 'review-tips'
  title_template text not null,
  meta_description_template text not null,
  h1_template text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (keyword_id, variant_key)
);
alter table pseo_keyword_variants enable row level security;
drop policy if exists "pseo public read" on pseo_keyword_variants; -- CREATE POLICY엔 IF NOT EXISTS가 없어 재실행 대비 drop 후 재생성
create policy "pseo public read" on pseo_keyword_variants for select using (true);

-- 2) content_sections가 이제 variant_id를 기준으로 묶인다 (keyword_id 컬럼은
--    기존 데이터 호환을 위해 남겨두되, 조회 코드는 variant_id만 본다)
alter table pseo_content_sections add column if not exists variant_id uuid references pseo_keyword_variants(id) on delete cascade;

-- 3) 기존 키워드마다 "default" 버전 1개씩 만들고, 기존 title/description/H1 템플릿을 그대로 옮긴다
insert into pseo_keyword_variants (keyword_id, variant_key, title_template, meta_description_template, h1_template, sort_order)
select id, 'default', title_template, meta_description_template, h1_template, 0
from pseo_keywords
where not exists (
  select 1 from pseo_keyword_variants v where v.keyword_id = pseo_keywords.id and v.variant_key = 'default'
);

-- 4) 기존 content_sections를 각 키워드의 "default" 버전에 연결
update pseo_content_sections cs
set variant_id = v.id
from pseo_keyword_variants v
where v.keyword_id = cs.keyword_id
  and v.variant_key = 'default'
  and cs.variant_id is null;
