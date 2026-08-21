import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/public";
import type { Exercise } from "@/lib/types";
import { QuestionnaireFlow } from "./questionnaire-flow";

// See app/join/[sessionId]/page.tsx for why this is here.
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

  const title = `${session.name} — A few questions before we meet`;
  const description = "A couple of quick questions to help us prepare.";
  const url = `https://live-discovery-tool.netlify.app/questionnaire/${sessionId}`;
  return {
    title,
    description,
    // og:type and og:url are two of the four REQUIRED properties per the
    // Open Graph spec (ogp.me) - some crawlers (Google's in particular)
    // decline to render a rich card at all without them, even with a
    // valid title/image present. Both were silently missing here because
    // setting our own `openGraph` object at this route replaces the root
    // layout's (which had `type`) rather than merging with it.
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
