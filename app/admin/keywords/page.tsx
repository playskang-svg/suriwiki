import { createClient } from '@/lib/supabase/server';
import ClientKeywordPage from './ClientKeywordPage';

export const dynamic = 'force-dynamic';

export default async function AdminKeywordsPage() {
  const supabase = await createClient();
  
  const { data: nodes, error } = await supabase
    .from('keyword_nodes')
    .select('*')
    .order('priority_score', { ascending: false });

  if (error) {
    return <div className="p-8 text-error">Error loading keywords: {error.message}</div>;
  }

  return <ClientKeywordPage initialNodes={nodes || []} />;
}
