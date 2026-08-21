import { NextResponse } from "next/server";
import { isFacilitatorAuthed } from "@/lib/facilitator-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { QuestionnaireResponsePayload } from "@/lib/types";

// Unlike the other results routes, this one names the respondent - the
// whole point of pre-session intake is knowing who said what while
// prepping the live exercises, unlike the anonymous-by-design in-room
// exercises. Safe here specifically because it's read only by the
// service-role-backed facilitator screen, never by anon.
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
    .select("attendee_id, payload, submitted_at, attendees(name)")
    .eq("exercise_id", exerciseId)
    .order("submitted_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const responses = (data ?? []).map((row) => ({
    attendeeId: row.attendee_id as string,
    attendeeName:
      (row.attendees as unknown as { name: string } | null)?.name ?? "Anonymous",
    answers: (row.payload as QuestionnaireResponsePayload).answers ?? [],
    submittedAt: row.submitted_at as string,
  }));

  return NextResponse.json({ responses, respondents: responses.length });
}
