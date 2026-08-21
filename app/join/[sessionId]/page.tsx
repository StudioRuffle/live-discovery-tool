import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Exercise } from "@/lib/types";
import { AttendeeFlow } from "./attendee-flow";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}): Promise<Metadata> {
  const { sessionId } = await params;
  const supabase = await createClient();
  const { data: session } = await supabase
    .from("sessions")
    .select("name")
    .eq("id", sessionId)
    .single();

  if (!session) return {};

  const title = `${session.name} — Join the session`;
  const description = "Scan or tap to join in on your phone or laptop.";
  return {
    title,
    description,
    // Setting our own openGraph/twitter here overrides (doesn't merge
    // with) the root layout's, including its file-convention-based
    // og:image - so the shared image has to be re-referenced explicitly.
    openGraph: { title, description, images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Studio Ruffle" }] },
    twitter: { title, description, images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Studio Ruffle" }] },
  };
}

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
      "priority_ranking",
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
