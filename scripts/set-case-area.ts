/**
 * set-case-area.ts — CASE 에 시공 지역을 지정한다.
 *
 * `cases.area_slug` 가 비어 있으면 그 지역의 AREA 페이지가 열리지 않는다(F1).
 * 지역이 채워지면 export-areas 가 "승인 CASE 가 있는 지역"으로 자동 포함하므로
 * 프로필의 area_scope 에 없는 지역이어도 사이트에 열린다.
 *
 * 사용:
 *   npx tsx scripts/set-case-area.ts                          # 현황만 보여준다
 *   npx tsx scripts/set-case-area.ts --case <id|slug> --area <slug>          # 미리보기
 *   npx tsx scripts/set-case-area.ts --case <id|slug> --area <slug> --apply  # 반영
 *
 * `--case` 는 CASE id(앞 8자만으로도 됨) 또는 그 CASE 로 만든 페이지 slug 를 받는다.
 *
 * ⚠️ 지역은 **실제로 시공한 곳**만 넣어라. 근거 없이 채우면 그 지역에 시공했다는
 *    허위 표시가 되고, 이 제품이 게이트로 막으려는 바로 그것이 된다.
 */
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

function fail(msg: string): never {
  console.error(`ERROR: ${msg}`);
  process.exit(1);
}

function argValue(name: string): string | null {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return null;
  const v = process.argv[i + 1];
  if (!v || v.startsWith('--')) fail(`--${name} 에 값이 없습니다.`);
  return v;
}

async function main() {
  const apply = process.argv.includes('--apply');
  const caseRef = argValue('case');
  const areaSlug = argValue('area');

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) fail('NEXT_PUBLIC_SUPABASE_URL 이 없습니다.');
  if (!key) fail('SUPABASE_SERVICE_ROLE_KEY 가 필요합니다.');
  const sb = createClient(url, key);

  const { data: cases } = await sb
    .from('cases')
    .select('id,space,target,problem_id,status,area_slug')
    .order('created_at');
  const { data: pages } = await sb.from('pages').select('slug,source_case_id');

  // 인자가 없으면 현황만 보여준다.
  if (!caseRef || !areaSlug) {
    console.log('CASE 지역 현황\n');
    for (const c of cases ?? []) {
      const pg = (pages ?? []).find(p => p.source_case_id === c.id);
      console.log(
        `  ${c.id.slice(0, 8)}  ${`${c.space}/${c.target}/${c.problem_id}`.padEnd(32)}` +
        `${(c.area_slug ?? '(비어있음)').padEnd(20)} ${pg?.slug ?? '페이지없음'}`
      );
    }
    const empty = (cases ?? []).filter(c => !c.area_slug).length;
    console.log(`\n지역 미지정 ${empty} / ${cases?.length ?? 0}건`);
    console.log('\n지정하려면: --case <id|slug> --area <slug> [--apply]');
    return;
  }

  // CASE 찾기: id 접두사 또는 페이지 slug
  const byPage = (pages ?? []).find(p => p.slug === caseRef || p.slug === `case/${caseRef}`);
  const target = (cases ?? []).find(
    c => c.id.startsWith(caseRef) || (byPage && c.id === byPage.source_case_id)
  );
  if (!target) fail(`CASE 를 찾지 못했습니다: ${caseRef}`);

  // 지역이 실제로 존재하는지 확인한다. 없는 slug 를 넣으면 페이지가 안 열린다.
  const { data: area } = await sb
    .from('areas')
    .select('slug,label,parent_slug')
    .eq('slug', areaSlug)
    .maybeSingle();
  if (!area) fail(`areas 테이블에 없는 지역입니다: ${areaSlug}`);

  const pg = (pages ?? []).find(p => p.source_case_id === target.id);
  console.log(`CASE   ${target.id.slice(0, 8)}  ${target.space}/${target.target}/${target.problem_id}`);
  console.log(`페이지 ${pg?.slug ?? '(없음)'}`);
  console.log(`지역   ${target.area_slug ?? '(비어있음)'}  →  ${area.slug} (${area.label})`);

  if (!apply) {
    console.log('\n실제로 반영하려면 --apply 를 붙여 다시 실행하세요.');
    return;
  }

  const { error } = await sb.from('cases').update({ area_slug: area.slug }).eq('id', target.id);
  if (error) fail(`업데이트 실패: ${error.message}`);

  console.log('\n✓ 반영 완료');
  console.log('  다음: npm run tree:build && npm run tree:sync  (지역 노드 HOLD 해제)');
  console.log('        npm run build                            (게이트 재검사)');
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
