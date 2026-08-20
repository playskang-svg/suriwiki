-- Suriwiki 초기 스키마
-- docs/10-data-model.md 참조

create extension if not exists "pgcrypto";

-- ─────────────────────────────── enums

create type page_type_t   as enum ('CATEGORY','TOPIC','CASE','WIKI','AREA','LANDING');
create type content_type_t as enum ('CT1','CT2','CT3','CT4','CT5','CT6');
create type decision_t    as enum ('CREATE','UPDATE','MERGE','HOLD');
create type page_status_t as enum ('draft','review','published','hold');
create type case_status_t as enum ('draft','review','approved');
create type kw_status_t   as enum ('OPEN','CLAIMED','PUBLISHED','HOLD','MERGED');
create type image_role_t  as enum ('BEFORE','PROCESS','AFTER','MATERIAL','TOOL','DETAIL','EXCLUDE');

-- ─────────────────────────────── areas

create table areas (
  slug        text primary key,
  label       text not null,
  parent_slug text references areas(slug),
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────── cases

create table cases (
  id             uuid primary key default gen_random_uuid(),
  slug           text unique not null,
  area_slug      text references areas(slug),
  building_type  text,
  space          text not null,
  target         text not null,
  problem_id     text,
  problem        text not null,
  cause          text,
  cause_observed boolean not null default false,
  judgement      text not null,
  work_steps     jsonb not null default '[]'::jsonb,
  result         text not null,
  limit_note     text,
  materials      text[] not null default '{}',
  tools          text[] not null default '{}',
  duration_note  text,
  maintenance    text,
  safety_flags   text[] not null default '{}',
  status         case_status_t not null default 'draft',
  approved_by    uuid,
  approved_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index on cases (space, target, problem_id);
create index on cases (area_slug);
create index on cases (status);

-- CT1 은 관찰된 원인이 있어야 한다 (docs/16 S8)
alter table cases add constraint cause_observed_requires_cause
  check (not cause_observed or cause is not null);

-- ─────────────────────────────── case_images

create table case_images (
  id            uuid primary key default gen_random_uuid(),
  case_id       uuid not null references cases(id) on delete cascade,
  storage_path  text not null,
  role          image_role_t not null default 'DETAIL',
  must_use      boolean not null default false,
  is_private    boolean not null default false,
  phash         text,
  quality_score numeric(3,2),
  alt_ko        text,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now()
);
create index on case_images (case_id, role);
create index on case_images (phash);

-- ─────────────────────────────── keyword_nodes

create table keyword_nodes (
  id                  text primary key,
  parent_id           text references keyword_nodes(id) on delete set null,
  level               int  not null check (level between 0 and 4),
  label               text not null,
  query_ko            text,
  aliases             text[] not null default '{}',
  intent              text[] not null default '{}',
  suggested_ct        content_type_t,
  suggested_page_type page_type_t,
  area_expandable     boolean not null default false,
  volume_hint         text check (volume_hint in ('high','mid','low')),
  competition_hint    text check (competition_hint in ('high','mid','low')),
  evidence_case_ids   uuid[] not null default '{}',
  priority_score      numeric(5,1) not null default 0 check (priority_score between 0 and 100),
  status              kw_status_t not null default 'OPEN',
  hold_reason         text,
  target_page_id      uuid,
  target_url          text,
  merged_into         text references keyword_nodes(id),
  dedupe_key          text,
  notes               text not null default '',
  updated_at          timestamptz not null default now()
);
create index on keyword_nodes (status, priority_score desc);
create index on keyword_nodes (dedupe_key);
create index on keyword_nodes (parent_id);

alter table keyword_nodes add constraint merged_requires_target
  check (status <> 'MERGED' or merged_into is not null);
alter table keyword_nodes add constraint hold_requires_reason
  check (status <> 'HOLD' or hold_reason is not null);

-- ─────────────────────────────── pages

create table pages (
  id               uuid primary key default gen_random_uuid(),
  slug             text unique not null,
  page_type        page_type_t not null,
  content_type     content_type_t not null,
  search_intent    text not null,
  title            text not null,
  meta_description text,
  source_case_id   uuid references cases(id) on delete set null,
  keyword_node_id  text references keyword_nodes(id) on delete set null,
  required_modules text[] not null default '{}',
  selected_modules text[] not null default '{}',
  module_order     text[] not null default '{}',
  evidence_ids     jsonb  not null default '{}'::jsonb,
  image_set        uuid[] not null default '{}',
  decision         decision_t not null default 'CREATE',
  decision_reason  text,
  canonical_page_id uuid references pages(id),
  status           page_status_t not null default 'draft',
  published_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index on pages (status, page_type);
create index on pages (source_case_id);
create index on pages (keyword_node_id);

-- 옵션 모듈 2~4개 (docs/07 R3)
alter table pages add constraint optional_modules_range
  check (array_length(selected_modules,1) is null
      or array_length(selected_modules,1) between 2 and 4);

-- 발행된 페이지는 발행 시각이 있어야 한다
alter table pages add constraint published_requires_timestamp
  check (status <> 'published' or published_at is not null);

alter table keyword_nodes
  add constraint keyword_nodes_target_page_fk
  foreign key (target_page_id) references pages(id) on delete set null;

-- ─────────────────────────────── image_variants

create table image_variants (
  id          uuid primary key default gen_random_uuid(),
  image_id    uuid not null references case_images(id) on delete cascade,
  page_id     uuid references pages(id) on delete cascade,
  crop        jsonb,
  overlays    jsonb not null default '[]'::jsonb,
  caption_ko  text,
  output_path text,
  created_at  timestamptz not null default now()
);
create index on image_variants (page_id);
create index on image_variants (image_id);

-- ─────────────────────────────── page_modules

create table page_modules (
  page_id     uuid not null references pages(id) on delete cascade,
  module_code text not null check (module_code ~ '^M(0[1-9]|1[0-9]|2[0-4])$'),
  position    int  not null,
  body        jsonb not null default '{}'::jsonb,
  evidence    jsonb not null default '{}'::jsonb,
  primary key (page_id, module_code)
);
create index on page_modules (page_id, position);

-- ─────────────────────────────── page_links

create table page_links (
  from_page_id uuid not null references pages(id) on delete cascade,
  to_page_id   uuid not null references pages(id) on delete cascade,
  anchor_text  text not null,
  relation     text not null default 'related',
  primary key (from_page_id, to_page_id)
);

-- ─────────────────────────────── 사실성 트리거: 비공개 사진 차단 (F6)

create or replace function block_private_image_variant() returns trigger
language plpgsql as $$
begin
  if exists (select 1 from case_images ci where ci.id = new.image_id and ci.is_private) then
    raise exception '비공개 사진(is_private)은 페이지에 사용할 수 없습니다: %', new.image_id;
  end if;
  return new;
end $$;

create trigger trg_block_private_image
  before insert or update on image_variants
  for each row execute function block_private_image_variant();

-- ─────────────────────────────── 사실성 트리거: 미승인 CASE 발행 차단

create or replace function block_unapproved_case_publish() returns trigger
language plpgsql as $$
begin
  if new.status = 'published' and new.source_case_id is not null
     and not exists (select 1 from cases c where c.id = new.source_case_id and c.status = 'approved') then
    raise exception '승인되지 않은 CASE를 근거로 발행할 수 없습니다: %', new.source_case_id;
  end if;
  return new;
end $$;

create trigger trg_block_unapproved_publish
  before insert or update on pages
  for each row execute function block_unapproved_case_publish();

-- ─────────────────────────────── updated_at

create or replace function touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

create trigger trg_cases_touch  before update on cases         for each row execute function touch_updated_at();
create trigger trg_pages_touch  before update on pages         for each row execute function touch_updated_at();
create trigger trg_kw_touch     before update on keyword_nodes for each row execute function touch_updated_at();

-- ─────────────────────────────── RLS

-- Supabase에는 anon/authenticated 롤이 이미 있습니다.
-- 로컬 순수 Postgres에서 이 파일을 테스트할 수 있도록 없을 때만 생성합니다.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
end $$;

alter table cases          enable row level security;
alter table case_images    enable row level security;
alter table keyword_nodes  enable row level security;
alter table pages          enable row level security;
alter table page_modules   enable row level security;
alter table image_variants enable row level security;
alter table page_links     enable row level security;
alter table areas          enable row level security;

-- 공개: 발행된 페이지와 그 하위만
create policy pages_public_read on pages
  for select to anon using (status = 'published');

create policy page_modules_public_read on page_modules
  for select to anon using (
    exists (select 1 from pages p where p.id = page_modules.page_id and p.status = 'published'));

create policy image_variants_public_read on image_variants
  for select to anon using (
    exists (select 1 from pages p where p.id = image_variants.page_id and p.status = 'published'));

create policy page_links_public_read on page_links
  for select to anon using (
    exists (select 1 from pages p where p.id = page_links.from_page_id and p.status = 'published'));

create policy areas_public_read on areas for select to anon using (true);

-- cases / case_images / keyword_nodes 는 anon 정책 없음 = 접근 불가

-- 운영자: 전체
do $$
declare t text;
begin
  foreach t in array array['cases','case_images','keyword_nodes','pages','page_modules','image_variants','page_links','areas']
  loop
    execute format('create policy %I_staff_all on %I for all to authenticated using (true) with check (true)', t, t);
  end loop;
end $$;
