import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateQrSvg } from "@/lib/qr";
import { getSiteUrl } from "@/lib/site-url";
import { isPreSessionType, type Client, type Exercise } from "@/lib/types";
import { PairExerciseForm } from "./pair-exercise-form";
import { PerceptualMapForm } from "./perceptual-map-form";
import { PriorityRankingForm } from "./priority-ranking-form";
import { QuestionnaireForm } from "./questionnaire-form";
import { SessionActions } from "./session-actions";
import { DeleteExerciseButton } from "./delete-exercise-button";
import { JoinHero } from "./join-hero";
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
  const presentUrl = `${siteUrl}/present/${sessionId}`;
  const questionnaireUrl = `${siteUrl}/questionnaire/${sessionId}`;
  const hasQuestionnaire = ((exercises as Exercise[] | null) ?? []).some((e) =>
    isPreSessionType(e.type)
  );
  const qrSvg = isOpen ? await generateQrSvg(joinUrl) : null;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 p-8">
      <div>
        <Link
          href={`/facilitator/clients/${session.client_id}`}
          className="text-sm text-ink/50"
        >
          &larr; {(session as { clients: { name: string } | null }).clients?.name}
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="font-display text-3xl">{session.name}</h1>
          {!isOpen && (
            <span className="rounded-full bg-ink/10 px-3 py-1 text-xs font-semibold uppercase text-ink/60">
              Closed — read only
            </span>
          )}
        </div>
      </div>

      {isOpen && hasQuestionnaire && (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-ink/15 px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink/70">
              Pre-session questionnaire link — send this before the day, no
              PIN needed
            </p>
            <p className="truncate text-sm text-ink/50">{questionnaireUrl}</p>
          </div>
          <a
            href={questionnaireUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-sm font-semibold text-brand hover:underline"
          >
            Open &#8599;
          </a>
        </div>
      )}

      {isOpen && (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-ink/15 px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink/70">
              Presentation link — no PIN needed, safe to share or project
            </p>
            <p className="truncate text-sm text-ink/50">{presentUrl}</p>
          </div>
          <a
            href={presentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-sm font-semibold text-brand hover:underline"
          >
            Open &#8599;
          </a>
        </div>
      )}

      {isOpen && qrSvg && <JoinHero joinUrl={joinUrl} qrSvg={qrSvg} />}

      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
        <section className="flex flex-col gap-3">
          <h2 className="font-semibold">Exercises</h2>
          {exercises?.length === 0 && (
            <p className="text-ink/50">No exercises yet.</p>
          )}
          <ul className="flex flex-col gap-2">
            {(exercises as Exercise[] | null)?.map((exercise) => (
              <li
                key={exercise.id}
                className="flex items-center justify-between rounded border border-ink/15 px-4 py-3"
              >
                <span className="capitalize">{exercise.type.replace(/_/g, " ")}</span>
                <div className="flex items-center gap-4">
                  <Link
                    href={`/facilitator/sessions/${sessionId}/exercises/${exercise.id}`}
                    className="text-sm font-semibold text-brand hover:underline"
                  >
                    {isOpen ? "Run / view results" : "View results"} &rarr;
                  </Link>
                  {isOpen && (
                    <DeleteExerciseButton sessionId={sessionId} exerciseId={exercise.id} />
                  )}
                </div>
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
            <section className="flex flex-col gap-6 rounded-lg border border-ink/15 p-6 sm:flex-row">
              <div className="min-w-0 flex-1">
                <PairExerciseForm
                  sessionId={sessionId}
                  type="values_tension"
                  title="Values in Tension — word pairs"
                  leftPlaceholder="Speed"
                  rightPlaceholder="Craft"
                />
              </div>
              <div className="min-w-0 flex-1">
                <PairExerciseForm
                  sessionId={sessionId}
                  type="word_choice"
                  title="Word Choice — descriptive words"
                  leftPlaceholder="Modern"
                  rightPlaceholder="Timeless"
                />
              </div>
            </section>

            <section className="rounded-lg border border-ink/15 p-6">
              <form action={createKeepCutExercise} className="flex flex-col gap-3">
                <input type="hidden" name="session_id" value={sessionId} />
                <p className="text-sm font-semibold text-ink/70">Keep or Cut</p>
                <p className="text-sm text-ink/50">
                  No setup needed — attendees answer &quot;one thing you
                  couldn&apos;t lose&quot; and &quot;one thing that needs to
                  go&quot;, hidden until you reveal.
                </p>
                <button
                  type="submit"
                  className="self-start rounded bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-dark"
                >
                  Add exercise
                </button>
              </form>
            </section>

            <section className="rounded-lg border border-ink/15 p-6">
              <form action={createVisualReactionExercise} className="flex flex-col gap-3">
                <input type="hidden" name="session_id" value={sessionId} />
                <p className="text-sm font-semibold text-ink/70">Visual Reaction</p>
                <p className="text-sm text-ink/50">
                  Creates the exercise — upload reference images afterward from
                  its results page.
                </p>
                <button
                  type="submit"
                  className="self-start rounded bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-dark"
                >
                  Add exercise
                </button>
              </form>
            </section>

            <section className="rounded-lg border border-ink/15 p-6">
              <PerceptualMapForm sessionId={sessionId} />
            </section>

            <section className="rounded-lg border border-ink/15 p-6">
              <PriorityRankingForm sessionId={sessionId} />
            </section>

            <section className="rounded-lg border border-ink/15 p-6">
              <QuestionnaireForm sessionId={sessionId} />
            </section>
          </>
        )}
      </div>
    </main>
  );
}
