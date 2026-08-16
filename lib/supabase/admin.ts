import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client. Bypasses RLS entirely - only call this from server
// actions / route handlers behind the facilitator PIN gate, never from
// anything that runs in or ships to the browser. `server-only` makes any
// accidental client-side import a build error rather than a leak.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
