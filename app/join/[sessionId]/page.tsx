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
        <h1 className="text-2xl font-bold">{session.name}</h1>
        <p className="mt-2 text-gray-500">This session has ended.</p>
      </main>
    );
  }

  // Phase 2 only supports values_tension; word_choice joins this list in
  // Phase 3 as the shared pair-answering component picks it up too.
  const { data: exercises, error } = await supabase
    .from("exercises")
    .select("*")
    .eq("session_id", sessionId)
    .in("type", ["values_tension"])
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
