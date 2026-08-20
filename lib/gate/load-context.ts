import { PageContext, pageContextSchema } from '../schemas/page-context';
import fs from 'fs';
import path from 'path';
import { sync as globSync } from 'glob';
// import { createClient } from '@supabase/supabase-js'; // We will use this when DB is connected

export async function loadContexts(options: { source: string, path?: string, page?: string }): Promise<PageContext[]> {
    let contexts: any[] = [];
    
    if (options.source === 'supabase') {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(url, key);

        let query = supabase.from('pages')
            .select(`
                *,
                case:cases(*),
                page_modules(*),
                image_variants(*),
                page_links!page_links_from_page_id_fkey(*)
            `)
            .in('status', ['review', 'published']);
            
        if (options.page) {
            query = query.eq('slug', options.page); // Assuming slug or id
        }
        
        const { data, error } = await query;
        if (error) {
            console.error("Supabase error:", error);
            process.exit(1);
        }
        
        if (data) {
            contexts = data.map(d => ({
                id: d.id,
                slug: d.slug,
                page_type: d.page_type,
                content_type: d.content_type,
                title: d.title,
                meta_description: d.meta_description,
                html_body: d.html_body,
                json_ld: d.json_ld,
                has_parent_link: d.has_parent_link,
                decision: d.decision,
                diff_score_min: d.diff_score_min,
                faq_similarity_max: d.faq_similarity_max,
                dedupe_key: d.dedupe_key,
                cta_rotation_key: d.cta_rotation_key,
                case: d.case,
                required_modules: d.required_modules,
                module_order: d.module_order,
                image_set: d.image_set,
                internal_links: (d.page_links || []).map((l: any) => l.to_page_id),
                image_variants: d.image_variants,
                // Maps page_modules to m01, m02, etc.
                ...d.page_modules.reduce((acc: any, m: any) => {
                    acc[m.module_code.toLowerCase()] = m.body;
                    return acc;
                }, {})
            }));
        }
    } else {
        // file source
        const globPattern = options.path || 'data/drafts/**/*.json';
        let files = globSync(globPattern);
        
        if (options.page) {
            files = files.filter((f: string) => f.includes(options.page!));
        }
        
        for (const file of files) {
            try {
                const content = fs.readFileSync(path.resolve(process.cwd(), file), 'utf-8');
                contexts.push(JSON.parse(content));
            } catch(e) {
                // ignore unparseable
            }
        }
    }

    // load all cases and areas for R3
    let allCases: any[] = [];
    let allAreas: any[] = [];
    if (options.source === 'supabase') {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(url, key);
        const { data: cData } = await supabase.from('cases').select('*');
        if (cData) allCases = cData;
        const { data: aData } = await supabase.from('areas').select('*');
        if (aData) allAreas = aData;
    } else {
        try {
            allCases = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'data/cases.sample.json'), 'utf-8'));
            const tree = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'data/keyword-tree.json'), 'utf-8'));
            allAreas = tree.areas || [];
        } catch(e) {}
    }

    if (contexts.length === 0) {
        console.log('검사 대상 0건');
        process.exit(1);
    }
    
    // Normalize areas (B-4: hyphen format as standard for DB slug)
    contexts.forEach(c => {
        if (c.keyword_node && c.keyword_node.area_slug) {
            c.keyword_node.area_slug = c.keyword_node.area_slug.replace(/_/g, '-');
        }
        c.all_cases = allCases;
        c.all_areas = allAreas;
    });

    const validContexts: PageContext[] = [];
    for (const ctx of contexts) {
        const parsed = pageContextSchema.safeParse(ctx);
        if (parsed.success) {
            validContexts.push(parsed.data);
        } else {
            console.error(`Invalid context for ${ctx.id || ctx.slug}:`, parsed.error.message);
        }
    }

    return validContexts;
}
