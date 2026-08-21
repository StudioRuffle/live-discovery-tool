import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Exercise } from "@/lib/types";
import { QuestionnaireFlow } from "./questionnaire-flow";

// Public, no-PIN pre-session intake link - deliberately separate from
// /join/[sessionId]'s live in-room exercise queue (see isPreSessionType).
// Meant to be sent out and answered any time before the session, so unlike
// the live flow this doesn't gate on session.status === "open".
export default async function QuestionnairePage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (!session) notFound();

  if (session.status === "closed") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
        <h1 className="font-display text-3xl">{session.name}</h1>
        <p className="mt-2 text-ink/50">This session has ended.</p>
      </main>
    );
  }

  const { data: exercises, error } = await supabase
    .from("exercises")
    .select("*")
    .eq("session_id", sessionId)
    .eq("type", "questionnaire")
    .order("position", { ascending: true });

  if (error) throw new Error(error.message);

  return (
    <QuestionnaireFlow
      sessionId={sessionId}
      sessionName={session.name}
      exercises={(exercises as Exercise[]) ?? []}
    />
  );
}
