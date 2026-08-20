import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { composePage } from '../lib/compose/compose';
import { generateModuleBody } from '../lib/compose/ai';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Starting case composition...");

  // Create dummy pages for links if not exist
  for (let i = 2; i <= 4; i++) {
    await supabase.from('pages').upsert({
      id: `b0000000-0000-0000-0000-00000000000${i}`,
      slug: `dummy-${i}`,
      title: `Dummy ${i} Page for Testing Links`,
      page_type: 'LANDING',
      content_type: 'CT5',
      search_intent: 'dummy',
    });
  }

  const targetMapping = [
    { slug: 'pigeon-sample-1', nodeId: 'veranda.outdoor_unit.pigeon#case', title: "비둘기 배설물 차단하는 베란다 실외기실 방조망 꼼꼼한 설치 사례" },
    { slug: 'pigeon-sample-2', nodeId: 'veranda.outdoor_unit.pigeon#case', title: "비둘기 유입 막는 아파트 실외기실 튼튼한 방조망 맞춤 시공 사례" },
    { slug: 'pigeon-sample-3', nodeId: 'veranda.outdoor_unit.pigeon#case', title: "실외기실 비둘기 피해 해결을 위한 빈틈없는 방조망 설치 과정" },
    { slug: 'pigeon-sample-4', nodeId: 'veranda.outdoor_unit.pigeon#case', title: "오염된 베란다 실외기실 청소 및 비둘기 퇴치용 방조망 시공 방법" },
    { slug: 'pigeon-sample-5', nodeId: 'veranda.outdoor_unit.pigeon#case', title: "새똥 걱정 없는 쾌적한 실외기실을 위한 방조망 설치 작업 후기" },
    { slug: 'bath-trap-1', nodeId: 'bath.drain.trap#case', title: "빠져버린 욕조 배수구 트랩 누수 없이 안전하게 점검구 타공 교체" }
  ];

  // We will keep track of generated pages in memory to simulate DB fetch
  let memoryExistingPages: any[] = [];

  for (const mapping of targetMapping) {
    console.log(`\n======================================`);
    console.log(`Processing case: ${mapping.slug}`);

    const { data: cData, error: cErr } = await supabase.from('cases').select('*').eq('slug', mapping.slug).single();
    if (cErr || !cData) continue;

    const { data: images } = await supabase.from('case_images').select('*').eq('case_id', cData.id).order('sort_order');
    const fullCase = { ...cData, images: images || [] };

    const { data: node } = await supabase.from('keyword_nodes').select('*').eq('id', mapping.nodeId).single();
    if (!node) continue;

    let evidence = node.evidence_case_ids || [];
    if (!evidence.includes(cData.id)) {
       evidence.push(cData.id);
       await supabase.from('keyword_nodes').update({ evidence_case_ids: evidence }).eq('id', node.id);
    }

    console.log(`Composing page for ${mapping.slug} on node ${mapping.nodeId}...`);
    const composed = composePage(fullCase, node, memoryExistingPages);
    
    // Simulate AI generation for M01
    const m01Body = { text: 'M01 텍스트', qualifier: '테스트' };
    
    let minDiff = 1.0;
    if (memoryExistingPages.length > 0) {
      const { diffScore } = require('../lib/compose/compose');
      for (const ep of memoryExistingPages) {
        if (!ep.search_intent || !ep.m01) continue;
        const score = diffScore(
          composed.search_intent, ep.search_intent,
          m01Body.text, ep.m01,
          composed.module_order || [], ep.module_order || [],
          composed.image_set || [], ep.image_set || []
        );
        if (score < minDiff) minDiff = score;
      }
    }

    if (minDiff < 0.3) {
      composed.decision = 'MERGE';
      composed.decision_reason = `Diff score ${minDiff.toFixed(2)} is too low.`;
    } else {
      composed.decision = 'CREATE';
      composed.decision_reason = `Diff score ${minDiff.toFixed(2)} allows creation.`;
    }

    console.log(`Decision: ${composed.decision}`);
    console.log(`Reason: ${composed.decision_reason}`);

    if (composed.decision === 'HOLD') {
      console.log(`=> HOLD: ${JSON.stringify(composed.required_evidence)}`);
      continue;
    }

    if (composed.decision === 'MERGE') {
      console.log(`=> MERGE. Skipping insert.`);
      await supabase.from('cases').update({ status: 'merged' }).eq('id', cData.id);
      continue;
    }

    if (composed.decision === 'CREATE' || composed.decision === 'UPDATE') {
      const pageId = crypto.randomUUID();
      const pageSlug = `${mapping.slug}-page`;
      
      const { error: pageErr } = await supabase.from('pages').upsert({
        id: pageId,
        keyword_node_id: node.id,
        source_case_id: cData.id,
        slug: pageSlug,
        title: mapping.title,
        meta_description: "테스트를 위한 메타 디스크립션 문구입니다. 최소 20자 이상으로 씁니다.",
        status: 'review',
        page_type: composed.page_type || 'CASE',
        content_type: composed.content_type,
        search_intent: composed.search_intent,
        required_modules: composed.required_modules,
        selected_modules: composed.selected_modules,
        module_order: composed.module_order,
        image_set: composed.image_set.filter((img: any) => {
          const imgRec = images?.find(i => i.id === img);
          return imgRec && !imgRec.is_private;
        })
      });
      
      if (pageErr) {
          console.error("Page insert blocked!", pageErr);
          continue;
      }

      memoryExistingPages.push({
        search_intent: composed.search_intent,
        m01: m01Body.text,
        module_order: composed.module_order,
        image_set: composed.image_set,
        source_case_id: cData.id,
        title: mapping.title
      });

      const validImages = composed.image_set.filter((img: any) => {
          const imgRec = images?.find(i => i.id === img);
          return imgRec && !imgRec.is_private;
      });
      
      const variants = validImages.map((imgId: string) => ({
          id: crypto.randomUUID(),
          page_id: pageId,
          image_id: imgId,
          overlays: []
      }));
      
      if (variants.length > 0) {
          await supabase.from('image_variants').upsert(variants);
      }

      for (let i = 0; i < composed.module_order.length; i++) {
        const mCode = composed.module_order[i];
        let body: any = null;
        if (mCode === 'M01') {
          body = m01Body;
        } else {
          try {
            body = await generateModuleBody(mCode as any, { case: fullCase, keywordNode: node });
          } catch (e) {
            body = { text: 'AI Error' };
          }
        }
        await supabase.from('page_modules').upsert({ page_id: pageId, module_code: mCode, body: body, position: i });
      }

      // Add Links
      const links = [
          { from_page_id: pageId, to_page_id: 'b0000000-0000-0000-0000-000000000002', anchor_text: 'link1' },
          { from_page_id: pageId, to_page_id: 'b0000000-0000-0000-0000-000000000003', anchor_text: 'link2' },
          { from_page_id: pageId, to_page_id: 'b0000000-0000-0000-0000-000000000004', anchor_text: 'link3' }
      ];
      await supabase.from('page_links').upsert(links);
      
      console.log(`Page generation complete: ${pageSlug}`);
    }
  }
}

run().catch(console.error);
