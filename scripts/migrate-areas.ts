import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import aromanize from 'aromanize';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const SIDO_MAP: Record<string, string> = {
  '서울특별시': 'seoul',
  '경기도': 'gyeonggi',
  '대구광역시': 'daegu',
  '충청남도': 'chungnam',
  '강원특별자치도': 'gangwon',
};

function getBaseSlug(name: string): string {
  if (SIDO_MAP[name]) return SIDO_MAP[name];

  // Romanize
  let roman = aromanize.romanize(name).toLowerCase();
  
  // Remove spaces
  roman = roman.replace(/\s+/g, '');
  
  // Strip suffixes
  roman = roman.replace(/(teukbyeolsi|gwangyeoksi|si|gun|gu|eup|myeon|dong|ri)$/, '');
  
  return roman;
}

async function main() {
  console.log("Migrating pseo_regions to areas...");

  // Fetch all rows
  let allRegions: any[] = [];
  let from = 0;
  const step = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('pseo_regions')
      .select('*')
      .range(from, from + step - 1);
      
    if (error) throw error;
    if (!data || data.length === 0) break;
    allRegions.push(...data);
    if (data.length < step) break;
    from += step;
  }

  // To build hierarchy, process SIDO, then SIGUNGU, then DONG, then APT
  const typeOrder = { 'SIDO': 1, 'SIGUNGU': 2, 'DONG': 3, 'APT': 4 };
  allRegions.sort((a, b) => typeOrder[a.type as keyof typeof typeOrder] - typeOrder[b.type as keyof typeof typeOrder]);

  const idToSlug = new Map<string, string>();
  const inserts = [];
  const seenSlugs = new Set<string>();

  for (const r of allRegions) {
    let parentSlug = null;
    let fullSlug = getBaseSlug(r.name);

    if (r.parent_id) {
      parentSlug = idToSlug.get(r.parent_id);
      if (parentSlug) {
        fullSlug = `${parentSlug}-${fullSlug}`;
      }
    }
    
    // Deduplicate
    let originalSlug = fullSlug;
    let counter = 2;
    while (seenSlugs.has(fullSlug)) {
        fullSlug = `${originalSlug}-${counter}`;
        counter++;
    }
    seenSlugs.add(fullSlug);

    idToSlug.set(r.id, fullSlug);

    inserts.push({
      slug: fullSlug,
      label: r.name,
      parent_slug: parentSlug,
    });
  }

  console.log(`Generated ${inserts.length} area slugs. Starting insert...`);

  // Clear existing areas? No, user said "1,679행을 안전하게 일괄 Insert"
  // but to be safe, delete all first or use upsert.
  // We will upsert.

  const BATCH_SIZE = 500;
  for (let i = 0; i < inserts.length; i += BATCH_SIZE) {
    const batch = inserts.slice(i, i + BATCH_SIZE);
    const { error: insErr } = await supabase
      .from('areas')
      .upsert(batch, { onConflict: 'slug' });
    
    if (insErr) {
      console.error(`Error inserting batch ${i}:`, insErr);
    } else {
      console.log(`Inserted ${i + batch.length} / ${inserts.length}`);
    }
  }

  console.log("Migration complete!");
}

main().catch(console.error);
