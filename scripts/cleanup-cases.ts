import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const slugsToDelete = [
  'case_gimhae_firedoor_sag_01',
  'pigeon-sample-1',
  'pigeon-sample-2',
  'pigeon-sample-3',
  'pigeon-sample-4',
  'pigeon-sample-5',
  'bath-trap-1'
];

async function main() {
  console.log("Cleaning up fake/duplicated data...");

  // Delete cases (should cascade or we just delete case_images manually)
  const { data: cases, error: caseErr } = await supabase.from('cases').select('id, slug').in('slug', slugsToDelete);
  
  if (cases && cases.length > 0) {
    const caseIds = cases.map(c => c.id);
    
    // 1. Delete from case_images
    console.log("Deleting case_images...");
    const { error: imgErr } = await supabase.from('case_images').delete().in('case_id', caseIds);
    if (imgErr) console.error("Error deleting case_images:", imgErr);

    // 2. Delete from cases
    console.log("Deleting cases...");
    const { error: delCaseErr } = await supabase.from('cases').delete().in('id', caseIds);
    if (delCaseErr) console.error("Error deleting cases:", delCaseErr);

    console.log(`Deleted cases: ${cases.map(c => c.slug).join(', ')}`);
  }

  // 3. Delete objects from storage bucket `cases-private`
  console.log("Cleaning up storage bucket...");
  for (const slug of slugsToDelete) {
    const { data: list, error: listErr } = await supabase.storage.from('cases-private').list(slug);
    if (listErr) {
      console.error(`Error listing storage for ${slug}:`, listErr);
      continue;
    }
    if (list && list.length > 0) {
      const pathsToDelete = list.map(item => `${slug}/${item.name}`);
      const { error: rmErr } = await supabase.storage.from('cases-private').remove(pathsToDelete);
      if (rmErr) {
        console.error(`Error removing objects for ${slug}:`, rmErr);
      } else {
        console.log(`Deleted ${pathsToDelete.length} objects from ${slug}`);
      }
    }
  }

  console.log("Cleanup complete!");
}

main().catch(console.error);
