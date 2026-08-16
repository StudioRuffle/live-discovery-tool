import { NextResponse } from "next/server";
import { isFacilitatorAuthed } from "@/lib/facilitator-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { KeepCutResponsePayload } from "@/lib/types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ exerciseId: string }> }
) {
  if (!(await isFacilitatorAuthed())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { exerciseId } = await params;
  const supabase = createAdminClient();

  const { data: exercise, error: exerciseError } = await supabase
    .from("exercises")
    .select("session_id, reveal_state")
    .eq("id", exerciseId)
    .single();

  if (exerciseError || !exercise) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const { count: totalAttendees, error: attendeesError } = await supabase
    .from("attendees")
    .select("id", { count: "exact", head: true })
    .eq("session_id", exercise.session_id);
  if (attendeesError) {
    return NextResponse.json({ error: attendeesError.message }, { status: 500 });
  }

  if (exercise.reveal_state !== "revealed") {
    // Pre-reveal: count only. The payload column is never selected here -
    // not just hidden client-side - so there is nothing for a facilitator
    // screen (or anyone inspecting the network tab) to read before reveal.
    const { count: submittedCount, error: countError } = await supabase
      .from("responses")
      .select("id", { count: "exact", head: true })
      .eq("exercise_id", exerciseId);
    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    return NextResponse.json({
      revealed: false,
      submittedCount: submittedCount ?? 0,
      totalAttendees: totalAttendees ?? 0,
    });
  }

  const { data, error } = await supabase
    .from("responses")
    .select("id, payload, submitted_at")
    .eq("exercise_id", exerciseId)
    .order("submitted_at", { ascending: true });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const responses = (data ?? []).map((row) => {
    const payload = row.payload as KeepCutResponsePayload;
    return {
      id: row.id,
      keep: payload.keep,
      cut: payload.cut,
      submittedAt: row.submitted_at,
    };
  });

  return NextResponse.json({
    revealed: true,
    submittedCount: responses.length,
    totalAttendees: totalAttendees ?? 0,
    responses,
  });
}
