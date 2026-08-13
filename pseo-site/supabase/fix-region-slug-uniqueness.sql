-- ============================================================================
-- 정정: 지역 슬러그를 "전국 유일"이 아니라 "형제(같은 부모) 안에서만 유일"로 완화
--
-- 실제 대한민국 행정구역은 "중구"(부산/대구/대전에 모두 있음), "고성군"(강원/경남에
-- 둘 다 있음)처럼 시/도가 다르면 같은 이름의 시/군/구가 흔하다. 지금 스키마는
-- pseo_regions.slug를 전국 유일(unique) 컬럼으로 강제하고 있어서, 전국 지역을
-- 다 넣으려 하면 이런 동명 지역에서 충돌한다.
--
-- 코드(lib/region-tree.ts resolveRegionByPath)는 애초에 "같은 부모 밑에서만"
-- slug를 비교하므로 전역 유일성이 필요 없다 — 제약조건만 실제 필요보다 엄격했다.
-- ============================================================================

alter table pseo_regions drop constraint if exists pseo_regions_slug_key;
alter table pseo_regions add constraint pseo_regions_parent_slug_key unique (parent_id, slug);
