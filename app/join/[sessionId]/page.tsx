import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/public";
import type { Exercise } from "@/lib/types";
import { AttendeeFlow } from "./attendee-flow";

// Without an explicit revalidate window, a fully dynamic SSR route with no
// static generation path defaults to Cache-Control: private, no-store -
// the wrong signal for a page meant to be publicly link-shared, and a
// plausible reason a link-preview crawler declines to unfurl it. 30s
// keeps exercise/reveal-state changes propagating quickly while letting
// the response actually be cached.
export const revalidate = 30;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}): Promise<Metadata> {
  const { sessionId } = await params;
  const supabase = createPublicClient();
  const { data: session } = await supabase
    .from("sessions")
    .select("name")
    .eq("id", sessionId)
    .single();

  if (!session) return {};

  const title = `${session.name} — Join the session`;
  const description = "Scan or tap to join in on your phone or laptop.";
  const url = `https://live-discovery-tool.netlify.app/join/${sessionId}`;
  return {
    title,
    description,
    // Setting our own openGraph/twitter here overrides (doesn't merge
    // with) the root layout's - so its file-convention-based og:image and
    // og:type have to be re-specified explicitly, and og:url added. Both
    // og:type and og:url are required properties per the Open Graph spec
    // (ogp.me); a page missing them can fail to unfurl into a rich card
    // on stricter parsers even with a valid title/image present.
    openGraph: {
      title,
      description,
      url,
      type: "website",
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Studio Ruffle" }],
    },
    twitter: { title, description, images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Studio Ruffle" }] },
  };
}

export default async function JoinPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const supabase = createPublicClient();

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
