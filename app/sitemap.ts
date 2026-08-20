import { MetadataRoute } from 'next';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { siteConfig } from '@/config/site';

const SITE_URL = siteConfig.brand.site_url;

const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!anonKey) throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');

const supabase = createSupabaseClient(
  (() => { const url = process.env.NEXT_PUBLIC_SUPABASE_URL; if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL"); return url; })(),
  anonKey
);

// Next.js App Router: generateSitemaps allows splitting sitemaps
export async function generateSitemaps() {
  const { data: sidos } = await supabase.from('areas').select('slug').is('parent_slug', null);
  
  const regions = (sidos || []).map(s => ({ id: s.slug }));
  // Add a generic 'pages' id for non-area pages like cases, landing, etc.
  regions.push({ id: 'core' });
  return regions;
}

export default async function sitemap({ id }: { id: string }): Promise<MetadataRoute.Sitemap> {
  // if id === 'core', fetch non-AREA pages
  let query = supabase.from('pages').select('slug, published_at').eq('status', 'published');
  
  if (id === 'core') {
    query = query.neq('page_type', 'AREA-CASE').neq('page_type', 'AREA-SERVICE').neq('page_type', 'AREA');
  } else {
    // For area sitemaps, we would ideally only fetch pages starting with `area/${id}`.
    // However, our slug format for AREA pages is just `area/${areaSlug}`. 
    // To filter by region, we fetch all AREA pages and filter in JS, or we can use like query.
    // Wait, all AREA pages have slugs like `area/seoul`, `area/seoul-gangnam`.
    // So we can use `like('slug', \`area/${id}%\`)`
    query = query.like('slug', `area/${id}%`);
  }

  const { data: pages } = await query;
  if (!pages) return [];

  return pages.map(page => ({
    url: `${SITE_URL}/${page.slug}`,
    lastModified: page.published_at ? new Date(page.published_at) : new Date(),
    changeFrequency: 'weekly',
    priority: id === 'core' ? 0.9 : 0.6,
  }));
}
