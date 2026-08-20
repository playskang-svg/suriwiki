import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { composePage } from '../lib/compose/compose';
import { generateModuleBody } from '../lib/compose/ai';
import { getCTMatrix } from '../lib/compose/rules';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Starting E2E test...");

  // 1. Insert CASE
  const caseId = 'c0000000-0000-0000-0000-000000000001';
  const { data: newCase, error: caseErr } = await supabase.from('cases').upsert({
    id: caseId,
    slug: 'case_gimhae_firedoor_sag_01',
    area_slug: 'gimhae',
    space: 'entrance',
    target: 'firedoor',
    problem_id: 'sag',
    problem: '방화문이 처져서 바닥에 끌림',
    judgement: '힌지 교체 및 문 조정 필요',
    result: '수리 완료, 문 부드럽게 열림',
    cause: '경첩 마모',
    cause_observed: true,
    work_steps: [
      { order: 1, title: 'Step 1' },
      { order: 2, title: 'Step 2' },
      { order: 3, title: 'Step 3' },
      { order: 4, title: 'Step 4' }
    ],
    status: 'approved'
  }).select().single();

  if (caseErr) throw new Error("Insert CASE failed: " + caseErr.message);
  console.log("Inserted CASE:", newCase.id);

  // 2. Insert case_images (5 images, 1 private)
  const images = [
    { id: 'a1000000-0000-0000-0000-000000000001', case_id: caseId, is_private: false, storage_path: 'i1.jpg' },
    { id: 'a2000000-0000-0000-0000-000000000002', case_id: caseId, is_private: false, storage_path: 'i2.jpg' },
    { id: 'a3000000-0000-0000-0000-000000000003', case_id: caseId, is_private: false, storage_path: 'i3.jpg' },
    { id: 'a4000000-0000-0000-0000-000000000004', case_id: caseId, is_private: false, storage_path: 'i4.jpg' },
    { id: 'a5000000-0000-0000-0000-000000000005', case_id: caseId, is_private: true, storage_path: 'i5.jpg' },
  ];
  await supabase.from('case_images').upsert(images);
  console.log("Inserted 5 case_images.");

  // Fetch node
  const { data: node } = await supabase.from('keyword_nodes').select('*').eq('id', 'entrance.firedoor.sag#judge').single();
  if (!node) throw new Error("Node entrance.firedoor.sag#judge not found.");

  // Append evidence_case_ids to keyword_nodes
  let evidence = node.evidence_case_ids || [];
  if (!evidence.includes(caseId)) {
     evidence.push(caseId);
     await supabase.from('keyword_nodes').update({ evidence_case_ids: evidence }).eq('id', node.id);
  }

  // 3. composePage
  const existingPages = (await supabase.from('pages').select('search_intent, m01, module_order, image_set')).data || [];
  const cData = { ...newCase, images };
  const composed = composePage(cData, node, existingPages);
  console.log("Composed page:", composed);

  // 4. Save page as review
  const pageId = 'b0000000-0000-0000-0000-000000000001';
  const { error: pageErr } = await supabase.from('pages').upsert({
    id: pageId,
    keyword_node_id: node.id,
    source_case_id: caseId,
    slug: 'e2e-test-page',
    title: '김해 방화문 처짐 수리 전문 - 빠른 해결과 꼼꼼한 점검 및 완벽 복구', // 38자
    meta_description: 'E2E Test Description. '.repeat(5),
    status: 'review',
    page_type: composed.page_type,
    content_type: composed.content_type,
    search_intent: composed.search_intent,
    required_modules: composed.required_modules,
    selected_modules: ['M19', 'M09'], // 2 options
    module_order: ['M01', 'M03', 'M05', 'M06', 'M07', 'M24', 'M19', 'M09'],
    image_set: composed.image_set.filter((img: string) => img !== 'a5000000-0000-0000-0000-000000000005') // Exclude private image
  });
  
  if (pageErr) {
      console.error("Page insert blocked!", pageErr);
  } else {
      console.log("Page inserted.");
  }

  // Save image variants
  const filteredImageSet = composed.image_set.filter((img: string) => img !== 'a5000000-0000-0000-0000-000000000005');
  const variants = filteredImageSet.map((imgId: string, idx: number) => ({
      id: `00000000-0000-0000-0000-00000000000${idx}`,
      page_id: pageId,
      image_id: imgId,
      overlays: []
  }));
  if (variants.length > 0) {
      const { error: varErr } = await supabase.from('image_variants').upsert(variants);
      if (varErr) {
          console.error("Image variants insert blocked!", varErr);
      }
  }

  // Generate modules
  for (const mCode of ['M01', 'M03', 'M05', 'M06', 'M07', 'M24', 'M19', 'M09']) {
    const body = await generateModuleBody(mCode as any, { case: cData, keywordNode: node });
    await supabase.from('page_modules').upsert({
      page_id: pageId,
      module_code: mCode,
      body: body,
      position: composed.module_order.indexOf(mCode)
    });
  }

  // Create dummy pages for links
  for (let i = 2; i <= 4; i++) {
    await supabase.from('pages').upsert({
      id: `b0000000-0000-0000-0000-00000000000${i}`,
      slug: `dummy-${i}`,
      title: `Dummy ${i}`,
      page_type: 'LANDING',
      content_type: 'CT5',
      search_intent: 'dummy',
    });
  }

  // Save page links
  const links = [
      { from_page_id: pageId, to_page_id: 'b0000000-0000-0000-0000-000000000002', anchor_text: 'link1' },
      { from_page_id: pageId, to_page_id: 'b0000000-0000-0000-0000-000000000003', anchor_text: 'link2' },
      { from_page_id: pageId, to_page_id: 'b0000000-0000-0000-0000-000000000004', anchor_text: 'link3' }
  ];
  await supabase.from('page_links').upsert(links);
  
  console.log("Page saved as review. Ready for gate:all.");
}

run().catch(console.error);
