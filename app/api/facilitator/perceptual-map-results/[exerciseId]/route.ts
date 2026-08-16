import { NextResponse } from "next/server";
import { isFacilitatorAuthed } from "@/lib/facilitator-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PerceptualMapResponsePayload } from "@/lib/types";

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
    .select("attendee_id, payload")
    .eq("exercise_id", exerciseId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const placements = (data ?? []).flatMap((row) => {
    const payload = row.payload as PerceptualMapResponsePayload;
    return (payload.placements ?? []).map((p) => ({
      attendeeId: row.attendee_id as string,
      competitorId: p.competitorId,
      x: p.x,
      y: p.y,
    }));
  });

  return NextResponse.json({ placements, respondents: data?.length ?? 0 });
}
