import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Supabase DB Connection
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Use SERVICE_ROLE_KEY if available for backend script, fallback to ANON_KEY
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials. Make sure to set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const dataPath = path.resolve(process.cwd(), 'data/keyword-tree.json');
  if (!fs.existsSync(dataPath)) {
    console.error(`File not found: ${dataPath}`);
    process.exit(1);
  }

  const fileData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  const nodes = fileData.nodes;

  console.log(`Loaded ${nodes.length} nodes from keyword-tree.json`);

  // 1. Fetch existing nodes to check their status
  const { data: existingNodes, error: fetchError } = await supabase
    .from('keyword_nodes')
    .select('id, status, target_page_id, merged_into');

  if (fetchError) {
    console.error("Error fetching existing nodes:", fetchError);
    process.exit(1);
  }

  const existingMap = new Map(existingNodes.map((n: any) => [n.id, n]));

  // 2. Prepare the payload
  const preparedNodes = nodes.map((node: any) => {
    const existing = existingMap.get(node.id);
    let finalStatus = node.status;
    let finalTargetPageId = node.target_page_id;
    let finalMergedInto = node.merged_into;

    if (existing) {
      if (['CLAIMED', 'PUBLISHED', 'MERGED'].includes(existing.status)) {
        finalStatus = existing.status;
        finalTargetPageId = existing.target_page_id;
        finalMergedInto = existing.merged_into;
      }
    }

    return {
      id: node.id,
      parent_id: node.parent_id,
      level: node.level,
      label: node.label,
      query_ko: node.query_ko,
      aliases: node.aliases,
      intent: node.intent,
      suggested_ct: node.suggested_ct,
      suggested_page_type: node.suggested_page_type,
      area_expandable: node.area_expandable,
      volume_hint: node.volume_hint,
      competition_hint: node.competition_hint,
      evidence_case_ids: node.evidence_case_ids,
      priority_score: node.priority_score,
      status: finalStatus,
      hold_reason: node.hold_reason,
      target_page_id: finalTargetPageId,
      target_url: node.target_url,
      merged_into: finalMergedInto,
      dedupe_key: node.dedupe_key,
      notes: node.notes,
      updated_at: new Date().toISOString(),
    };
  });

  // Sort by level ascending
  preparedNodes.sort((a: any, b: any) => (a.level || 0) - (b.level || 0));

  // Pass 1: Insert without merged_into
  const pass1 = preparedNodes.map((n: any) => ({ ...n, merged_into: null }));
  const { error: upsertError1 } = await supabase
    .from('keyword_nodes')
    .upsert(pass1, { onConflict: 'id' });

  if (upsertError1) {
    console.error("Error upserting nodes (Pass 1):", upsertError1);
    process.exit(1);
  }

  // Pass 2: Update merged_into
  const pass2 = preparedNodes.filter((n: any) => n.merged_into !== null && n.merged_into !== undefined).map((n: any) => ({ id: n.id, merged_into: n.merged_into }));
  if (pass2.length > 0) {
      const { error: upsertError2 } = await supabase
        .from('keyword_nodes')
        .upsert(pass2, { onConflict: 'id' });

      if (upsertError2) {
        console.error("Error upserting nodes (Pass 2):", upsertError2);
        process.exit(1);
      }
  }

  // Fetch final status counts
  const { data: finalNodes, error: finalError } = await supabase
    .from('keyword_nodes')
    .select('status');

  if (finalError) {
    console.error("Error fetching final nodes:", finalError);
    process.exit(1);
  }

  const counts: Record<string, number> = {};
  for (const n of finalNodes) {
      counts[n.status] = (counts[n.status] || 0) + 1;
  }

  console.log(`Successfully upserted ${preparedNodes.length} keyword nodes.`);
  console.log("Status Counts:", counts);
}

run().catch(err => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
