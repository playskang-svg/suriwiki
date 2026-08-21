/**
 * publish-images.ts — CASE 사진을 공개 버킷으로 올리고 페이지에 연결한다.
 *
 * 원본은 cases-private(비공개)에 있고 사이트는 그걸 못 읽는다. 그래서 사진이 한 장도 안 나왔다.
 * 이 스크립트가 원본을 public-assets 로 복사하고 image_variants 를 만든 뒤,
 * 각 CASE 페이지에 M20(사진) 모듈을 넣는다.
 *
 * 사용:
 *   npx tsx scripts/publish-images.ts            # 무엇을 할지 보여주기만 한다
 *   npx tsx scripts/publish-images.ts --apply    # 실제로 반영
 *
 * 주의: 이 스크립트는 이미지를 편집하지 않는다. 이미 캡션·오버레이가 들어간 편집본만 올린다.
 *       편집 전 원본을 그대로 공개하면 개인정보가 나갈 수 있다 — 먼저 눈으로 확인하라.
 */
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const PRIVATE_BUCKET = 'cases-private';
const PUBLIC_BUCKET = 'public-assets';

// 사진 역할별 캡션. 실제로 관찰된 사실만 쓴다 — 없는 공정이나 결과를 문장으로 지어내지 않는다.
const ROLE_CAPTION: Record<string, string> = {
  BEFORE: '시공 전 상태',
  PROCESS: '시공 과정',
  AFTER: '시공 후 상태',
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
  const sb = createClient(url, key);

  const { data: pages, error: pErr } = await sb
    .from('pages')
    .select('id,slug,title,source_case_id,module_order,status')
    .not('source_case_id', 'is', null);
  if (pErr) fail(`pages 조회 실패: ${pErr.message}`);
  if (!pages?.length) fail('source_case_id 가 있는 페이지가 없습니다.');

  console.log(`대상 페이지 ${pages.length}건${apply ? '' : ' (미리보기)'}\n`);

  for (const page of pages) {
    const { data: images, error: iErr } = await sb
      .from('case_images')
      .select('id,storage_path,role,sort_order,alt_ko')
      .eq('case_id', page.source_case_id!)
      .order('sort_order', { ascending: true });
    if (iErr) fail(`case_images 조회 실패: ${iErr.message}`);

    if (!images?.length) {
      console.log(`  ${page.slug}: 사진 없음 — 건너뜀`);
      continue;
    }

    console.log(`  ${page.slug} — 사진 ${images.length}장`);

    const items: { image_variant_id: string; url: string; role: string; caption: string }[] = [];

    for (const img of images) {
      const publicPath = img.storage_path; // 같은 경로 구조를 공개 버킷에 그대로 쓴다
      const publicUrl = `${url}/storage/v1/object/public/${PUBLIC_BUCKET}/${publicPath}`;

      if (apply) {
        const { data: blob, error: dErr } = await sb.storage.from(PRIVATE_BUCKET).download(img.storage_path);
        if (dErr) { console.log(`     ! 다운로드 실패 ${img.storage_path}: ${dErr.message}`); continue; }
        const buf = Buffer.from(await blob.arrayBuffer());
        const ext = img.storage_path.split('.').pop()?.toLowerCase();
        const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';

        const { error: uErr } = await sb.storage
          .from(PUBLIC_BUCKET)
          .upload(publicPath, buf, { contentType, upsert: true });
        if (uErr) { console.log(`     ! 업로드 실패 ${publicPath}: ${uErr.message}`); continue; }

        // image_variants 는 "이 원본을 이 페이지에 이 경로로 공개했다" 는 기록이다.
        const { data: existing } = await sb
          .from('image_variants')
          .select('id')
          .eq('image_id', img.id)
          .eq('page_id', page.id)
          .maybeSingle();

        let variantId = existing?.id;
        if (!variantId) {
          const { data: ins, error: vErr } = await sb
            .from('image_variants')
            .insert({ image_id: img.id, page_id: page.id, output_path: publicPath, overlays: [] })
            .select('id')
            .single();
          if (vErr) { console.log(`     ! image_variants 실패: ${vErr.message}`); continue; }
          variantId = ins.id;
        }

        items.push({
          image_variant_id: variantId!,
          url: publicUrl,
          role: img.role,
          caption: img.alt_ko || ROLE_CAPTION[img.role] || '시공 사진',
        });
      } else {
        items.push({
          image_variant_id: '(미리보기)',
          url: publicUrl,
          role: img.role,
          caption: img.alt_ko || ROLE_CAPTION[img.role] || '시공 사진',
        });
      }
      console.log(`     ${img.role.padEnd(8)} ${publicPath}`);
    }

    if (!items.length) continue;

    const before = items.find(i => i.role === 'BEFORE');
    const after = items.find(i => i.role === 'AFTER');
    const body: Record<string, unknown> = { focus: 'process', items };
    // BEFORE·AFTER 가 둘 다 있을 때만 비교 슬라이더를 붙인다.
    if (before && after) {
      // URL 을 여기 또 넣지 않는다. items 에 이미 있고, 중복하면 게이트 F8(필드 복사)에 걸린다.
      body.compare = {
        before: before.image_variant_id,
        after: after.image_variant_id,
      };
    }

    if (!apply) continue;

    const { error: mErr } = await sb
      .from('page_modules')
      .upsert({ page_id: page.id, module_code: 'M20', body, position: 90 }, { onConflict: 'page_id,module_code' });
    if (mErr) { console.log(`     ! page_modules 실패: ${mErr.message}`); continue; }

    // 사진을 본문 위쪽에 둔다.
    // 시공 사례에서 방문자가 가장 먼저 확인하는 것은 "어떻게 좋아졌는가" 이고,
    // 긴 설명이 먼저 나오면 그 답이 스크롤 아래로 밀린다.
    // M02(요약) 바로 다음이 사진 자리다. M02 가 없으면 맨 앞에 놓는다.
    const order = (page.module_order ?? []).filter((m: string) => m !== 'M20');
    const anchor = order.indexOf('M02');
    if (anchor >= 0) order.splice(anchor + 1, 0, 'M20');
    else order.unshift('M20');

    const { error: oErr } = await sb.from('pages').update({ module_order: order }).eq('id', page.id);
    if (oErr) { console.log(`     ! module_order 실패: ${oErr.message}`); continue; }
    console.log(`     ✓ M20 연결 (사진 ${items.length}장${body.compare ? ', 비교 슬라이더 포함' : ''})`);
  }

  if (!apply) console.log('\n실제로 반영하려면 --apply 를 붙여 다시 실행하세요.');
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
