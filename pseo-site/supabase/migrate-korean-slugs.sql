-- ============================================================================
-- 마이그레이션: 슬러그를 영문 로마자에서 한글로 전환 + 이 배포를 "도배장판" 전용으로 정리
-- (요청: "이 배포는 도배장판 전용, 누수탐지는 삭제" + "URL 슬러그를 한글로")
--
-- 실행 방법: Supabase 대시보드 → SQL Editor → 새 쿼리 → 이 파일 전체 붙여넣기 → Run
-- ⚠️ 한 번만 실행하면 되는 1회성 마이그레이션. 두 번 실행해도 안전하다(멱등).
-- ============================================================================

-- 1) 메뉴 그룹 컬럼 추가 (schema.sql을 먼저 실행한 프로젝트라면 이미 없을 수 있어 안전하게 추가)
alter table pseo_keywords add column if not exists menu_group text;
alter table pseo_keywords add column if not exists menu_order int not null default 0;

-- 2) 누수탐지 삭제 — content_sections/page_listings는 on delete cascade라 자동으로 같이 삭제된다
delete from pseo_keywords where slug = 'leak-detection';

-- 3) 도배장판 키워드 슬러그를 한글로
update pseo_keywords set slug = '도배장판' where slug = 'wallpaper-flooring';

-- 4) 지역 슬러그를 한글로 (name과 동일한 값으로 — 형제 지역 사이에서만 유일하면 되므로 충돌 없음)
update pseo_regions set slug = '충청남도' where slug = 'chungnam';
update pseo_regions set slug = '천안시' where slug = 'cheonan';
update pseo_regions set slug = '아산시' where slug = 'asan';
update pseo_regions set slug = '불당동' where slug = 'buldang-dong';
update pseo_regions set slug = '백석동' where slug = 'baekseok-dong';
update pseo_regions set slug = '불당아이파크' where slug = 'buldang-ipark';
update pseo_regions set slug = '불당호반써밋' where slug = 'buldang-hoban-summit';

-- 5) 확인
select slug, display_name, menu_group from pseo_keywords;
select name, slug, type from pseo_regions order by display_order;
