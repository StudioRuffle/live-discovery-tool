import type { SupabaseClient } from "@supabase/supabase-js";

const AUTO_RETRIES = 2;
const RETRY_DELAY_MS = 800;
const DUPLICATE_RESPONSE_CODE = "23505"; // unique_violation

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Inserts a row, auto-retrying transient failures a couple of times before
// giving up. A duplicate-key error (23505) means a previous attempt of this
// exact insert actually succeeded server-side and only the response was
// lost to the network - that counts as success, not failure, so the caller
// never shows an error for a submission that's already recorded.
export async function submitWithRetry(
  supabase: SupabaseClient,
  table: string,
  row: Record<string, unknown>
): Promise<{ alreadySubmitted: boolean }> {
  let lastError: { code?: string; message: string } | null = null;

  for (let attempt = 0; attempt <= AUTO_RETRIES; attempt++) {
    const { error } = await supabase.from(table).insert(row);

    if (!error) return { alreadySubmitted: false };
    if (error.code === DUPLICATE_RESPONSE_CODE) return { alreadySubmitted: true };

    lastError = error;
    if (attempt < AUTO_RETRIES) await sleep(RETRY_DELAY_MS * (attempt + 1));
  }

  throw new Error(lastError?.message ?? "Submission failed");
}
