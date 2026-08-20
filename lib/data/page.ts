import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { PageRecord } from '@/lib/types/db';

const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!anonKey) throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');

const supabase = createSupabaseClient(
  (() => { const url = process.env.NEXT_PUBLIC_SUPABASE_URL; if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL"); return url; })(),
  anonKey
);

export async function getPageData(slug: string) {
  const { data: page } = await supabase.from('pages').select('*').eq('slug', slug).single();
  
  if (!page || page.status !== 'published') return null;

  const { data: modules } = await supabase.from('page_modules')
    .select('*')
    .eq('page_id', page.id)
    .order('position', { ascending: true });

  const pageModules = (modules || []).reduce((acc: any, m) => {
    acc[m.module_code] = m.body;
    return acc;
  }, {});

  return { page: page as PageRecord, pageModules };
}

export async function getPublishedSlugs(pageType: string): Promise<string[]> {
  const { data } = await supabase.from('pages')
    .select('slug')
    .eq('page_type', pageType)
    .eq('status', 'published');
  
  if (!data) return [];
  return data.map(d => d.slug);
}

export async function getOptimizedAreaSlugs(): Promise<string[]> {
  // To avoid 20,100 pages, we only pre-render areas that are SIDO, SIGUNGU, or DONGs with cases.
  // Because we don't have `region_type` in `areas`, we can deduce it by parent_slug depth.
  // Depth 0: SIDO, Depth 1: SIGUNGU, Depth 2: DONG.
  const { data: areas } = await supabase.from('areas').select('slug, parent_slug');
  if (!areas) return [];
  
  const { data: cases } = await supabase.from('cases').select('area_slug');
  const caseAreas = new Set((cases || []).map(c => c.area_slug).filter(Boolean));

  // Determine depths
  const depthMap = new Map<string, number>();
  
  // First pass: parent_slug is null -> depth 0
  for (const a of areas) {
    if (!a.parent_slug) depthMap.set(a.slug, 0);
  }
  // Second pass: depth 1
  for (const a of areas) {
    if (a.parent_slug && depthMap.has(a.parent_slug) && depthMap.get(a.parent_slug) === 0) {
      depthMap.set(a.slug, 1);
    }
  }
  // Third pass: depth 2
  for (const a of areas) {
    if (a.parent_slug && depthMap.has(a.parent_slug) && depthMap.get(a.parent_slug) === 1) {
      depthMap.set(a.slug, 2);
    }
  }

  const optimized = areas.filter(a => {
    const depth = depthMap.get(a.slug) ?? 3;
    if (depth <= 1) return true; // SIDO, SIGUNGU always pre-render
    if (caseAreas.has(a.slug)) return true; // DONG with cases pre-render
    return false;
  });

  return optimized.map(a => a.slug);
}
