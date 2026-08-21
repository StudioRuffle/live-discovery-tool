"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { submitWithRetry } from "@/lib/submit-with-retry";
import type { Exercise, QuestionnaireConfig } from "@/lib/types";

interface StoredAttendee {
  id: string;
  name: string;
}

// Same key format as app/join/[sessionId]/attendee-flow.tsx, so a person
// who fills this out and later opens the live join link on the same
// device is recognized under the same name - but progress is tracked
// under a separate key, so finishing this never marks live exercises done
// or vice versa.
function attendeeKey(sessionId: string) {
  return `dt_attendee_${sessionId}`;
}
function progressKey(sessionId: string, attendeeId: string) {
  return `dt_qprogress_${sessionId}_${attendeeId}`;
}

function loadAttendee(sessionId: string): StoredAttendee | null {
  try {
    const raw = localStorage.getItem(attendeeKey(sessionId));
    return raw ? (JSON.parse(raw) as StoredAttendee) : null;
  } catch {
    return null;
  }
}

function loadDone(sessionId: string, attendeeId: string): string[] {
  try {
    const raw = localStorage.getItem(progressKey(sessionId, attendeeId));
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function QuestionnaireFlow({
  sessionId,
  sessionName,
  exercises,
}: {
  sessionId: string;
  sessionName: string;
  exercises: Exercise[];
}) {
  const supabase = useMemo(() => createClient(), []);

  const [attendee, setAttendee] = useState<StoredAttendee | null | undefined>(undefined);
  const [nameInput, setNameInput] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  const [done, setDone] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const stored = loadAttendee(sessionId);
    setAttendee(stored);
    if (stored) setDone(loadDone(sessionId, stored.id));
  }, [sessionId]);

  const currentExercise = useMemo(
    () => exercises.find((e) => !done.includes(e.id)) ?? null,
    [exercises, done]
  );

  useEffect(() => {
    setAnswers({});
  }, [currentExercise?.id]);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    const name = nameInput.trim();
    if (!name) return;

    setJoining(true);
    setJoinError(null);
    const id = crypto.randomUUID();

    try {
      await submitWithRetry(supabase, "attendees", {
        id,
        session_id: sessionId,
        name,
      });
      const record = { id, name };
      localStorage.setItem(attendeeKey(sessionId), JSON.stringify(record));
      setAttendee(record);
    } catch {
      setJoinError("Couldn't join — check your connection and try again.");
    } finally {
      setJoining(false);
    }
  }

  async function handleSubmit() {
    if (!attendee || !currentExercise) return;
    const config = currentExercise.config as QuestionnaireConfig;
    if (config.questions.some((q) => !answers[q.id]?.trim())) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      await submitWithRetry(supabase, "responses", {
        exercise_id: currentExercise.id,
        attendee_id: attendee.id,
        payload: {
          answers: config.questions.map((q) => ({
            questionId: q.id,
            text: answers[q.id].trim(),
          })),
        },
      });

      const next = [...done, currentExercise.id];
      setDone(next);
      localStorage.setItem(progressKey(sessionId, attendee.id), JSON.stringify(next));
    } catch {
      setSubmitError("Couldn't submit — check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (attendee === undefined) return null;

  if (!attendee) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
        <h1 className="font-display text-3xl">{sessionName}</h1>
        <p className="max-w-sm text-ink/50">
          A couple of quick questions before the session — helps us make the
          most of our time together.
        </p>
        <form onSubmit={handleJoin} className="flex w-full max-w-sm flex-col gap-3">
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Your name"
            autoFocus
            required
            maxLength={60}
            className="rounded border px-4 py-4 text-xl"
          />
          <button
            type="submit"
            disabled={joining}
            className="rounded bg-brand px-4 py-4 text-xl font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
          >
            {joining ? "Starting…" : "Start"}
          </button>
          {joinError && <p className="text-sm text-red-600">{joinError}</p>}
        </form>
      </main>
    );
  }

  if (!currentExercise) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
        <h1 className="font-display text-3xl">
          {exercises.length === 0 ? "Nothing to answer yet" : "Thanks — all set"}
        </h1>
        <p className="mt-2 text-ink/50">
          {exercises.length === 0
            ? "The facilitator hasn't added any questions yet — check back soon."
            : "We'll see you at the session."}
        </p>
      </main>
    );
  }

  const config = currentExercise.config as QuestionnaireConfig;
  const allAnswered = config.questions.every((q) => answers[q.id]?.trim());

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <div className="flex w-full max-w-md flex-col gap-5">
        {config.questions.map((q) => (
          <div key={q.id}>
            <label className="mb-1 block text-sm font-semibold text-ink/70">
              {q.text}
            </label>
            <textarea
              value={answers[q.id] ?? ""}
              onChange={(e) =>
                setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
              }
              maxLength={2000}
              rows={3}
              className="w-full rounded border border-ink/15 px-3 py-2 text-lg"
            />
          </div>
        ))}
        <button
          onClick={handleSubmit}
          disabled={submitting || !allAnswered}
          className="rounded bg-brand px-4 py-4 text-xl font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Submit"}
        </button>
        {submitError && (
          <p className="text-sm text-red-600">
            {submitError}{" "}
            <button onClick={handleSubmit} className="underline">
              Retry
            </button>
          </p>
        )}
      </div>
    </main>
  );
}
