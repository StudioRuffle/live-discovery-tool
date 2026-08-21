import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/public";
import { generateQrSvg } from "@/lib/qr";
import { getSiteUrl } from "@/lib/site-url";
import { JoinHero } from "@/app/facilitator/sessions/[sessionId]/join-hero";

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

  const title = `${session.name} — Welcome`;
  const description = "Scan the QR code or tap to join on your phone or laptop.";
  const url = `https://live-discovery-tool.netlify.app/present/${sessionId}`;
  return {
    title,
    description,
    // See app/join/[sessionId]/page.tsx generateMetadata for why type/url
    // are set explicitly here.
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

// Public, no-PIN screen meant to be projected or shared directly with a
// room - just the branded join hero, none of the facilitator's session
// management controls. Uses the anon client (RLS-scoped), not the
// admin/service-role one the facilitator pages use.
export default async function PresentPage({
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

  if (session.status !== "open") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
        <h1 className="font-display text-3xl">{session.name}</h1>
        <p className="mt-2 text-ink/50">This session isn&apos;t open yet.</p>
      </main>
    );
  }

  // getSiteUrl() reads next/headers - one of Next's "Dynamic APIs" that
  // forces the whole route into private, no-store rendering, which is the
  // wrong signal for a page meant to be publicly link-shared (and can
  // stop link-preview crawlers from unfurling it). Only call it in dev,
  // where deriving the host dynamically actually matters; in production
  // this is always the deployed origin anyway (same one metadataBase
  // uses), so skip the dynamic API and hardcode it.
  const siteUrl =
    process.env.NODE_ENV === "development"
      ? await getSiteUrl()
      : "https://live-discovery-tool.netlify.app";
  const joinUrl = `${siteUrl}/join/${sessionId}`;
  const qrSvg = await generateQrSvg(joinUrl);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center gap-8 p-8">
      <JoinHero joinUrl={joinUrl} qrSvg={qrSvg} />
    </main>
  );
}
