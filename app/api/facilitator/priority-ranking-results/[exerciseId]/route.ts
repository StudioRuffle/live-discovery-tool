import { NextResponse } from "next/server";
import { isFacilitatorAuthed } from "@/lib/facilitator-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PriorityRankingResponsePayload } from "@/lib/types";

// Borda count: within a single respondent's ranking of n items, the item
// at index i scores (n - i) points - first place scores n, last scores 1.
// Summed across respondents, so it stays meaningful even if not everyone
// has submitted yet.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ exerciseId: string }> }
) {
  if (!(await isFacilitatorAuthed())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { exerciseId } = await params;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("responses")
    .select("payload")
    .eq("exercise_id", exerciseId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const scores: Record<string, number> = {};

  for (const row of data ?? []) {
    const payload = row.payload as PriorityRankingResponsePayload;
    const order = payload?.order ?? [];
    const n = order.length;
    order.forEach((itemId, index) => {
      scores[itemId] = (scores[itemId] ?? 0) + (n - index);
    });
  }

  return NextResponse.json({ scores, respondents: data?.length ?? 0 });
}
