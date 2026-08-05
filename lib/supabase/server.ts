import { isSupabaseConfigured, getSupabaseConfig } from "./client";

export async function fetchSupabaseTable<T>(tableName: string): Promise<T[] | null> {
  if (!isSupabaseConfigured()) return null;

  const { url, serviceRoleKey, anonKey } = getSupabaseConfig();
  const apiKey = serviceRoleKey || anonKey;

  try {
    const res = await fetch(`${url}/rest/v1/${tableName}?select=*`, {
      headers: {
        apikey: apiKey,
        Authorization: `Bearer ${apiKey}`,
      },
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json();
      return data as T[];
    }
  } catch (error) {
    console.error(`Supabase fetch failed for table ${tableName}:`, error);
  }

  return null;
}

export async function insertSupabaseTable<T>(tableName: string, payload: Record<string, unknown>): Promise<T | null> {
  if (!isSupabaseConfigured()) return null;

  const { url, serviceRoleKey, anonKey } = getSupabaseConfig();
  const apiKey = serviceRoleKey || anonKey;

  try {
    const res = await fetch(`${url}/rest/v1/${tableName}`, {
      method: "POST",
      headers: {
        apikey: apiKey,
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      return data[0] as T;
    }
  } catch (error) {
    console.error(`Supabase insert failed for table ${tableName}:`, error);
  }

  return null;
}
