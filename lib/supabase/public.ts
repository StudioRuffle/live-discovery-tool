import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Stateless anon-key client for public Server Components that don't need a
// cookie-bound session (no login, no writes tied to a session - attendee
// identity lives in localStorage on the client, not server cookies). Unlike
// server.ts's createClient(), this never touches next/headers cookies(),
// so it doesn't force Next into fully dynamic, uncacheable rendering -
// server.ts's client was making /join, /present, and /questionnaire
// respond Cache-Control: private, no-store, which is the wrong signal for
// pages that are meant to be publicly link-shared (and a plausible reason
// a link-preview crawler declines to unfurl them). RLS still applies.
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}
