import { NextResponse } from "next/server";
import { isFacilitatorAuthed } from "@/lib/facilitator-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { VisualReactionResponsePayload } from "@/lib/types";

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

  const counts: Record<string, { up: number; down: number }> = {};
  const notes: { imageId: string; note: string; submittedAt: string }[] = [];

  for (const row of data ?? []) {
    const payload = row.payload as VisualReactionResponsePayload;
    if (!payload?.imageId || !payload.reaction) continue;

    counts[payload.imageId] ??= { up: 0, down: 0 };
    counts[payload.imageId][payload.reaction]++;

    if (payload.note?.trim()) {
      notes.push({
        imageId: payload.imageId,
        note: payload.note.trim(),
        submittedAt: row.submitted_at,
      });
    }
  }

  return NextResponse.json({ counts, notes, total: data?.length ?? 0 });
}
