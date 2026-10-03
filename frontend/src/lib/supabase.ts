import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

/** Created once from the backend's public config; null when accounts are disabled. */
export function initSupabase(url: string | null, publishableKey: string | null): SupabaseClient | null {
  if (!client && url && publishableKey) client = createClient(url, publishableKey)
  return client
}

export function supabase(): SupabaseClient | null {
  return client
}
