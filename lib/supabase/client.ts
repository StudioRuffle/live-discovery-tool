import { createBrowserClient } from "@supabase/ssr";

// Used from Client Components (e.g. Realtime subscriptions, attendee submits).
// Safe to expose to the browser: only the anon key ships here, never the service role key.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
