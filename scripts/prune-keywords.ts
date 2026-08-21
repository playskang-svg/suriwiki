/**
 * prune-keywords.ts — 트리에서 사라진 keyword_nodes 행을 지운다.
 *
 * sync-keywords.ts 는 upsert 만 한다(의도된 것이다 — 발행된 노드를 실수로 날리지 않기 위해).
 * 그래서 키워드나 지역 slug 가 바뀌면 옛 id 행이 DB 에 남는다.
 * 남은 행은 HOLD 리포트에 같은 지역을 두 번 띄우는 등 현장 요청 목록을 오염시킨다.
 *
 * 사용:
 *   npx tsx scripts/prune-keywords.ts            # 지울 목록만 보여준다 (기본)
 *   npx tsx scripts/prune-keywords.ts --apply    # 실제로 지운다
 *
 * 안전 조건 — 셋을 모두 만족하는 행만 지운다:
 *   ① 현재 트리(data/keyword-tree.json)에 없다
 *   ② status 가 HOLD 또는 OPEN 이다 (CLAIMED·PUBLISHED·MERGED 는 절대 건드리지 않는다)
 *   ③ target_page_id 가 없다 (페이지가 붙어 있으면 지우면 안 된다)
 *   ④ 다른 노드가 merged_into 로 가리키고 있지 않다
 */
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const DELETABLE_STATUS = ['HOLD', 'OPEN'];
const PAGE = 1000;

type NodeRow = {
  id: string;
  status: string;
  target_page_id: string | null;
  merged_into: string | null;
  label: string | null;
};

function fail(msg: string): never {
  console.error(`ERROR: ${msg}`);
  process.exit(1);
}

async function main() {
  const apply = process.argv.includes('--apply');

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) fail('NEXT_PUBLIC_SUPABASE_URL 이 없습니다.');
  if (!key) fail('SUPABASE_SERVICE_ROLE_KEY 가 필요합니다.');

  const treePath = path.resolve(process.cwd(), 'data/keyword-tree.json');
  if (!fs.existsSync(treePath)) {
    fail('data/keyword-tree.json 이 없습니다. `npm run tree:build` 를 먼저 실행하세요.');
  }
  const tree = JSON.parse(fs.readFileSync(treePath, 'utf-8'));
  const treeIds = new Set<string>((tree.nodes ?? []).map((n: { id: string }) => n.id));
  if (!treeIds.size) {
    fail('트리에 노드가 0건입니다. 전부 지워버리는 사고를 막기 위해 중단합니다.');
  }

  const supabase = createClient(url, key);

  const rows: NodeRow[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('keyword_nodes')
      .select('id,status,target_page_id,merged_into,label')
      .range(from, from + PAGE - 1);
    if (error) fail(`keyword_nodes 조회 실패: ${error.message}`);
    if (!data || data.length === 0) break;
    rows.push(...(data as NodeRow[]));
    if (data.length < PAGE) break;
  }

  // 다른 노드가 merged_into 로 가리키는 대상은 남겨 둔다 (참조가 끊긴다)
  const mergeTargets = new Set(rows.map(r => r.merged_into).filter(Boolean) as string[]);

  const orphans = rows.filter(r => !treeIds.has(r.id));
  const deletable = orphans.filter(
    r => DELETABLE_STATUS.includes(r.status) && !r.target_page_id && !mergeTargets.has(r.id)
  );
  const kept = orphans.filter(r => !deletable.includes(r));

  console.log(`DB ${rows.length}행 · 트리 ${treeIds.size}노드`);
  console.log(`트리에 없는 고아: ${orphans.length}행`);
  console.log(`  → 삭제 대상: ${deletable.length}행`);
  console.log(`  → 보존: ${kept.length}행`);

  for (const r of kept) {
    const why = !DELETABLE_STATUS.includes(r.status)
      ? `status=${r.status}`
      : r.target_page_id
        ? '페이지 연결됨'
        : 'merged_into 참조 대상';
    console.log(`     보존 ${r.id} (${why})`);
  }

  if (!deletable.length) {
    console.log('\n지울 것이 없습니다.');
    return;
  }

  console.log('\n삭제 대상:');
  for (const r of deletable) console.log(`  - ${r.id}  ${r.label ?? ''} [${r.status}]`);

  if (!apply) {
    console.log('\n실제로 지우려면 --apply 를 붙여 다시 실행하세요.');
    return;
  }

  const ids = deletable.map(r => r.id);
  for (let i = 0; i < ids.length; i += 100) {
    const batch = ids.slice(i, i + 100);
    const { error } = await supabase.from('keyword_nodes').delete().in('id', batch);
    if (error) fail(`삭제 실패: ${error.message}`);
  }
  console.log(`\n✓ ${ids.length}행 삭제 완료`);
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
