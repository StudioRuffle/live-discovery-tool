import { NextResponse } from "next/server";
import { isFacilitatorAuthed } from "@/lib/facilitator-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PairResponsePayload } from "@/lib/types";

// Aggregates in-process rather than via a DB view/RPC: at the ~30-60
// attendee scale this tool targets, a handful of pairs means at most a few
// hundred response rows per exercise - trivial to reduce in memory, and
// avoids a second migration just for this.
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
    .select("payload, submitted_at")
    .eq("exercise_id", exerciseId)
    .order("submitted_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const counts: Record<string, { left: number; right: number }> = {};
  const notes: { pairId: string; note: string; submittedAt: string }[] = [];

  for (const row of data ?? []) {
    const payload = row.payload as PairResponsePayload;
    if (!payload?.pairId || !payload.choice) continue;

    counts[payload.pairId] ??= { left: 0, right: 0 };
    counts[payload.pairId][payload.choice]++;

    if (payload.note?.trim()) {
      notes.push({
        pairId: payload.pairId,
        note: payload.note.trim(),
        submittedAt: row.submitted_at,
      });
    }
  }

  return NextResponse.json({ counts, notes, total: data?.length ?? 0 });
}
