import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Service-role client: bypasses RLS. Server-only — never import this from client components.
// Callers must verify the requesting user is an admin before using it.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
