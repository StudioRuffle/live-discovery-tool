import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { generateQrSvg } from "@/lib/qr";
import { getSiteUrl } from "@/lib/site-url";
import { JoinHero } from "@/app/facilitator/sessions/[sessionId]/join-hero";

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
  const supabase = await createClient();

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

  const siteUrl = await getSiteUrl();
  const joinUrl = `${siteUrl}/join/${sessionId}`;
  const qrSvg = await generateQrSvg(joinUrl);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center gap-8 p-8">
      <JoinHero joinUrl={joinUrl} qrSvg={qrSvg} />
    </main>
  );
}
