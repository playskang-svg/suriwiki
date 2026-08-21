/**
 * publish-pages.ts — 검수를 마친 페이지를 발행한다 (review → published).
 *
 * 발행은 공개 행위다. 되돌리려면 status 를 review 로 되돌리고 재배포해야 하므로
 * 기본은 미리보기이고 --apply 를 줘야 실제로 바꾼다.
 *
 * 사용:
 *   npx tsx scripts/publish-pages.ts                    # 대상만 보여준다
 *   npx tsx scripts/publish-pages.ts --apply            # review 전부 발행
 *   npx tsx scripts/publish-pages.ts --slug case/x --apply
 *
 * 발행 전에 반드시 `npm run gate:all` 이 통과해야 한다.
 * 이 스크립트는 게이트를 다시 돌리지 않는다 — 게이트는 review·published 를 모두 검사하므로
 * 발행 후에도 위반이 생기면 빌드가 죽는다.
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
  const onlySlug = argValue('slug');

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) fail('NEXT_PUBLIC_SUPABASE_URL 이 없습니다.');
  if (!key) fail('SUPABASE_SERVICE_ROLE_KEY 가 필요합니다.');

  const supabase = createClient(url, key);

  let query = supabase
    .from('pages')
    .select('id,slug,title,page_type,status,module_order,image_set')
    .eq('status', 'review');
  if (onlySlug) query = query.eq('slug', onlySlug);

  const { data: pages, error } = await query;
  if (error) fail(`pages 조회 실패: ${error.message}`);

  if (!pages || pages.length === 0) {
    console.log('발행 대기(review) 중인 페이지가 없습니다.');
    return;
  }

  console.log(`발행 대기 ${pages.length}건${apply ? '' : ' (미리보기)'}\n`);
  for (const p of pages) {
    const mods = (p.module_order ?? []).length;
    const imgs = (p.image_set ?? []).length;
    console.log(`  ${p.slug}`);
    console.log(`    ${p.title}`);
    console.log(`    ${p.page_type} · 모듈 ${mods}개 · 이미지 ${imgs}장`);
  }

  if (!apply) {
    console.log('\n실제로 발행하려면 --apply 를 붙여 다시 실행하세요.');
    return;
  }

  const now = new Date().toISOString();
  const ids = pages.map(p => p.id);
  const { error: upErr } = await supabase
    .from('pages')
    .update({ status: 'published', published_at: now })
    .in('id', ids);
  if (upErr) fail(`발행 실패: ${upErr.message}`);

  console.log(`\n✓ ${ids.length}건 발행 완료`);
  console.log('  사이트맵·RSS·llms.txt 에 반영하려면 재배포하거나 /api/revalidate 를 호출하세요.');
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
