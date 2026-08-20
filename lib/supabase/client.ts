import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');

  return createBrowserClient(
    (() => { const url = process.env.NEXT_PUBLIC_SUPABASE_URL; if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL"); return url; })(),
    anonKey
  )
}
