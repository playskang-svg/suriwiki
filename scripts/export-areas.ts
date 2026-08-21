/**
 * export-areas.ts — DB `areas` 테이블 → data/areas.json
 *
 * 지역의 단일 진실 공급원(SSOT)은 DB `areas` 테이블이다 (docs/17-swappable-config.md §4).
 * 시드(data/keyword-tree.seed.json)는 키워드(공간·대상·증상)만 정의하고 지역은 갖지 않는다.
 * 이 스크립트가 둘 사이의 다리다 — DB 를 읽어 build_tree.py 가 먹을 형태로 떨군다.
 *
 * 사용:
 *   npx tsx scripts/export-areas.ts [--max-depth 1] [--out data/areas.json]
 *
 * 내보내는 범위:
 *   ① 프로필의 area_scope 에 적힌 지역 (제 깊이와 무관하게 포함)
 *   ② ①의 하위 지역 중 계층 절대 깊이가 --max-depth 이하인 것 (기본 1 = 시군구)
 *   ③ 승인된 CASE 가 실제로 있는 지역 (깊이·범위 무관 — CASE 가 지역을 연다, F1)
 *
 * parent 는 이 목록 안에서의 부모로 다시 매단다. 빠진 조상을 채워 넣지 않는다 —
 * 서비스하지 않는 상위 지역(예: 서울 전체)이 AREA 노드로 생겨버리기 때문이다.
 */
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

type AreaRow = { slug: string; label: string; parent_slug: string | null };
type ExportedArea = { slug: string; label: string; parent: string | null; case_count: number };

// 시도 표시명 축약. 검색어는 "부산광역시 북구"가 아니라 "부산 북구"로 쓰인다.
// 매핑에 없는 값은 추측하지 않고 원본 label 을 그대로 쓴다.
const SIDO_SHORT: Record<string, string> = {
  '서울특별시': '서울', '부산광역시': '부산', '대구광역시': '대구', '인천광역시': '인천',
  '광주광역시': '광주', '대전광역시': '대전', '울산광역시': '울산', '세종특별자치시': '세종',
  '경기도': '경기', '강원특별자치도': '강원', '충청북도': '충북', '충청남도': '충남',
  '전북특별자치도': '전북', '전라남도': '전남', '경상북도': '경북', '경상남도': '경남',
  '제주특별자치도': '제주',
};

const PAGE = 1000;

function fail(msg: string): never {
  console.error(`ERROR: ${msg}`);
  process.exit(1);
}

function argValue(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const v = process.argv[i + 1];
  if (!v || v.startsWith('--')) fail(`--${name} 에 값이 없습니다.`);
  return v;
}

async function main() {
  const maxDepth = Number(argValue('max-depth', '1'));
  if (!Number.isInteger(maxDepth) || maxDepth < 0) {
    fail('--max-depth 는 0 이상의 정수여야 합니다.');
  }
  const outPath = path.resolve(process.cwd(), argValue('out', 'data/areas.json'));

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) fail('NEXT_PUBLIC_SUPABASE_URL 이 없습니다. .env.local 을 확인하세요.');

  // anon 키로는 cases 를 못 읽는다(RLS 정책 없음). 조용히 0건으로 흘러가면
  // "CASE 있는 지역"이 통째로 누락되므로 service_role 을 강제한다.
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    fail('SUPABASE_SERVICE_ROLE_KEY 가 필요합니다 (cases 는 anon 으로 읽을 수 없습니다).');
  }

  // dotenv 로 .env.local 을 올린 뒤에 읽어야 하므로 동적 import 를 쓴다.
  const { siteConfig } = await import('../config/site');
  const scope = siteConfig.area_scope;
  if (!scope.length) {
    fail(`프로필 [${siteConfig.profile}] 의 area_scope 가 비어 있습니다. 확장할 지역이 없습니다.`);
  }

  const supabase = createClient(url, key);

  const rows: AreaRow[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('areas')
      .select('slug,label,parent_slug')
      .range(from, from + PAGE - 1);
    if (error) fail(`areas 조회 실패: ${error.message}`);
    if (!data || data.length === 0) break;
    rows.push(...(data as AreaRow[]));
    if (data.length < PAGE) break;
  }
  if (!rows.length) fail('DB areas 테이블이 비어 있습니다. scripts/migrate-areas.ts 를 먼저 실행하세요.');

  const { data: caseRows, error: caseErr } = await supabase
    .from('cases')
    .select('area_slug')
    .eq('status', 'approved');
  if (caseErr) fail(`cases 조회 실패: ${caseErr.message}`);

  const bySlug = new Map(rows.map(r => [r.slug, r]));
  const children = new Map<string, AreaRow[]>();
  for (const r of rows) {
    if (!r.parent_slug) continue;
    if (!children.has(r.parent_slug)) children.set(r.parent_slug, []);
    children.get(r.parent_slug)!.push(r);
  }

  function ancestors(slug: string): string[] {
    const out: string[] = [];
    const seen = new Set<string>([slug]);
    let cur = bySlug.get(slug)?.parent_slug ?? null;
    while (cur && !seen.has(cur)) {
      seen.add(cur);
      out.push(cur);
      cur = bySlug.get(cur)?.parent_slug ?? null;
    }
    return out;
  }

  function depthOf(slug: string): number {
    return ancestors(slug).length;
  }

  // 지역별 승인 CASE 수. 하위 지역의 CASE 는 상위로 전파한다 (docs/17 §4 SQL 과 동일).
  const ownCases = new Map<string, number>();
  let unassigned = 0;
  const orphanCaseAreas = new Set<string>();
  for (const c of caseRows ?? []) {
    const slug = (c as { area_slug: string | null }).area_slug;
    if (!slug) { unassigned++; continue; }
    if (!bySlug.has(slug)) { orphanCaseAreas.add(slug); continue; }
    ownCases.set(slug, (ownCases.get(slug) ?? 0) + 1);
  }

  const caseCount = new Map<string, number>();
  for (const [slug, n] of ownCases) {
    caseCount.set(slug, (caseCount.get(slug) ?? 0) + n);
    for (const a of ancestors(slug)) caseCount.set(a, (caseCount.get(a) ?? 0) + n);
  }

  const missing = scope.filter(s => !bySlug.has(s));
  if (missing.length) {
    fail(
      `프로필 [${siteConfig.profile}] 의 area_scope 에 DB 에 없는 지역이 있습니다: ${missing.join(', ')}\n` +
      `       areas 테이블에 행을 추가하거나 config/profiles/${siteConfig.profile}.json 을 고치세요.`
    );
  }

  // 깊이는 계층의 절대 깊이다 (0=시도, 1=시군구, 2=동).
  // 뿌리 기준 상대 깊이로 하면 area_scope 에 시군구를 하나 넣는 순간 그 아래 동까지 딸려온다.
  const selected = new Set<string>();
  for (const root of scope) {
    selected.add(root); // 범위 뿌리는 제 깊이와 무관하게 포함한다
    const stack = (children.get(root) ?? []).map(c => c.slug);
    while (stack.length) {
      const s = stack.pop()!;
      if (depthOf(s) > maxDepth) continue;
      selected.add(s);
      for (const c of children.get(s) ?? []) stack.push(c.slug);
    }
  }
  for (const slug of ownCases.keys()) selected.add(slug);

  // parent 는 "이 목록 안에서의" 부모다.
  // 빠진 조상을 채워 넣으면 서비스하지 않는 지역(예: 서울 전체)까지 AREA 노드로 생겨버리므로,
  // 조상을 끼워 넣지 말고 목록에 들어온 가장 가까운 조상으로 다시 매단다.
  function nearestSelectedAncestor(slug: string): string | null {
    for (const a of ancestors(slug)) if (selected.has(a)) return a;
    return null;
  }

  // 표시명: 조상 체인을 합쳐 "부산 북구" 처럼 만든다. "북구" 단독은 어느 시의 북구인지 알 수 없다.
  function displayLabel(slug: string): string {
    const chain = [...ancestors(slug)].reverse().concat(slug);
    const parts: string[] = [];
    chain.forEach((s, i) => {
      const raw = bySlug.get(s)!.label;
      const label = i === 0 ? (SIDO_SHORT[raw] ?? raw) : raw;
      if (!parts.includes(label)) parts.push(label);
    });
    return parts.join(' ');
  }

  const areas: ExportedArea[] = [...selected]
    .map(slug => ({
      slug,
      label: displayLabel(slug),
      parent: nearestSelectedAncestor(slug),
      case_count: caseCount.get(slug) ?? 0,
      _depth: depthOf(slug),
    }))
    .sort((a, b) => a._depth - b._depth || a.slug.localeCompare(b.slug))
    .map(({ _depth, ...rest }) => rest);

  const payload = {
    generated_at: new Date().toISOString().replace(/\.\d{3}Z$/, '+00:00'),
    source: 'supabase:areas',
    profile: siteConfig.profile,
    scope,
    max_depth: maxDepth,
    areas,
  };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2) + '\n', 'utf-8');

  const withCases = areas.filter(a => a.case_count > 0).length;
  console.log(`✓ ${path.relative(process.cwd(), outPath)}  지역 ${areas.length}개 (전체 ${rows.length}개 중)`);
  console.log(`    프로필      ${siteConfig.profile}`);
  console.log(`    area_scope  ${scope.join(', ')}  (하위는 절대 깊이 ${maxDepth} 까지)`);
  console.log(`    CASE 있는 지역 ${withCases}개`);
  if (unassigned > 0) {
    console.log(`    ! 승인 CASE ${unassigned}건에 area_slug 가 없습니다 — 그 지역은 열리지 않습니다 (F1)`);
  }
  if (orphanCaseAreas.size > 0) {
    console.log(`    ! areas 에 없는 area_slug 참조: ${[...orphanCaseAreas].join(', ')}`);
  }
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
