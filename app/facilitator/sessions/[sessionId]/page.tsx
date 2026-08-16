import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateQrSvg } from "@/lib/qr";
import { getSiteUrl } from "@/lib/site-url";
import type { Client, Exercise } from "@/lib/types";
import { PairExerciseForm } from "./pair-exercise-form";
import { PerceptualMapForm } from "./perceptual-map-form";
import { SessionActions } from "./session-actions";
import { createKeepCutExercise, createVisualReactionExercise } from "../../actions";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const supabase = createAdminClient();

  const { data: session } = await supabase
    .from("sessions")
    .select("*, clients(name)")
    .eq("id", sessionId)
    .single();

  if (!session) notFound();

  const [{ data: exercises, error }, { data: clients }] = await Promise.all([
    supabase
      .from("exercises")
      .select("*")
      .eq("session_id", sessionId)
      .order("position", { ascending: true }),
    supabase.from("clients").select("*").order("name", { ascending: true }),
  ]);

  if (error) throw new Error(error.message);

  const isOpen = session.status === "open";
  const siteUrl = await getSiteUrl();
  const joinUrl = `${siteUrl}/join/${sessionId}`;
  const qrSvg = isOpen ? await generateQrSvg(joinUrl) : null;

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 p-8">
      <div>
        <Link
          href={`/facilitator/clients/${session.client_id}`}
          className="text-sm text-gray-500"
        >
          &larr; {(session as { clients: { name: string } | null }).clients?.name}
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{session.name}</h1>
          {!isOpen && (
            <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold uppercase text-gray-600">
              Closed — read only
            </span>
          )}
        </div>
      </div>

      {isOpen && qrSvg && (
        <section className="flex flex-col items-center gap-3 rounded-lg border p-6">
          <p className="text-sm font-semibold text-gray-600">Attendee join link</p>
          <div
            className="h-[320px] w-[320px]"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
          <a href={joinUrl} className="break-all text-center text-blue-600 underline">
            {joinUrl}
          </a>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">Exercises</h2>
        {exercises?.length === 0 && (
          <p className="text-gray-500">No exercises yet.</p>
        )}
        <ul className="flex flex-col gap-2">
          {(exercises as Exercise[] | null)?.map((exercise) => (
            <li
              key={exercise.id}
              className="flex items-center justify-between rounded border px-4 py-3"
            >
              <span className="capitalize">{exercise.type.replace(/_/g, " ")}</span>
              <Link
                href={`/facilitator/sessions/${sessionId}/exercises/${exercise.id}`}
                className="text-sm font-semibold text-blue-600 hover:underline"
              >
                {isOpen ? "Run / view results" : "View results"} &rarr;
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <SessionActions
        sessionId={sessionId}
        sessionName={session.name}
        status={session.status}
        clients={(clients as Client[] | null) ?? []}
        currentClientId={session.client_id}
      />

      {isOpen && (
        <>
          <section className="flex flex-col gap-6 rounded-lg border p-6 sm:flex-row">
            <div className="flex-1">
              <PairExerciseForm
                sessionId={sessionId}
                type="values_tension"
                title="Values in Tension — word pairs"
                leftPlaceholder="Speed"
                rightPlaceholder="Craft"
              />
            </div>
            <div className="flex-1">
              <PairExerciseForm
                sessionId={sessionId}
                type="word_choice"
                title="Word Choice — descriptive words"
                leftPlaceholder="Modern"
                rightPlaceholder="Timeless"
              />
            </div>
          </section>

          <section className="rounded-lg border p-6">
            <form action={createKeepCutExercise} className="flex flex-col gap-3">
              <input type="hidden" name="session_id" value={sessionId} />
              <p className="text-sm font-semibold text-gray-600">Keep or Cut</p>
              <p className="text-sm text-gray-500">
                No setup needed — attendees answer &quot;one thing you
                couldn&apos;t lose&quot; and &quot;one thing that needs to
                go&quot;, hidden until you reveal.
              </p>
              <button
                type="submit"
                className="self-start rounded bg-black px-4 py-2 font-semibold text-white"
              >
                Add exercise
              </button>
            </form>
          </section>

          <section className="rounded-lg border p-6">
            <form action={createVisualReactionExercise} className="flex flex-col gap-3">
              <input type="hidden" name="session_id" value={sessionId} />
              <p className="text-sm font-semibold text-gray-600">Visual Reaction</p>
              <p className="text-sm text-gray-500">
                Creates the exercise — upload reference images afterward from
                its results page.
              </p>
              <button
                type="submit"
                className="self-start rounded bg-black px-4 py-2 font-semibold text-white"
              >
                Add exercise
              </button>
            </form>
          </section>

          <section className="rounded-lg border p-6">
            <PerceptualMapForm sessionId={sessionId} />
          </section>
        </>
      )}
    </main>
  );
}
