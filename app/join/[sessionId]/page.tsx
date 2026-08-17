import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Exercise } from "@/lib/types";
import { AttendeeFlow } from "./attendee-flow";

export default async function JoinPage({
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
        <p className="mt-2 text-gray-500">This session has ended.</p>
      </main>
    );
  }

  const { data: exercises, error } = await supabase
    .from("exercises")
    .select("*")
    .eq("session_id", sessionId)
    .in("type", [
      "values_tension",
      "word_choice",
      "keep_cut",
      "visual_reaction",
      "perceptual_map",
    ])
    .order("position", { ascending: true });

  if (error) throw new Error(error.message);

  return (
    <AttendeeFlow
      sessionId={sessionId}
      sessionName={session.name}
      exercises={(exercises as Exercise[]) ?? []}
    />
  );
}
