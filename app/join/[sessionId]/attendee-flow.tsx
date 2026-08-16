"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { submitWithRetry } from "@/lib/submit-with-retry";
import {
  isPairExerciseType,
  type Exercise,
  type Pair,
  type PairExerciseConfig,
  type VisualReactionConfig,
} from "@/lib/types";

interface StoredAttendee {
  id: string;
  name: string;
}

// exerciseId -> submitted item ids. Pair exercises track one id per pair;
// keep_cut (and any other single-submission exercise) uses "" as its one
// sentinel item id, matching responses.item_key for a payload with no
// pairId/imageId (see docs/responses-payload-shapes.md).
type Progress = Record<string, string[]>;
const SINGLE_SUBMISSION_ITEM_ID = "";

function attendeeKey(sessionId: string) {
  return `dt_attendee_${sessionId}`;
}
// Scoped by attendeeId, not just sessionId: localStorage is shared across
// every tab on the same origin, so keying by session alone would let one
// browser tab's progress bleed into another's if a device is ever shared
// (a kiosk, someone borrowing a phone). Real attendees are on separate
// phones with isolated storage, but this costs nothing and closes the gap.
function progressKey(sessionId: string, attendeeId: string) {
  return `dt_progress_${sessionId}_${attendeeId}`;
}

function loadAttendee(sessionId: string): StoredAttendee | null {
  try {
    const raw = localStorage.getItem(attendeeKey(sessionId));
    return raw ? (JSON.parse(raw) as StoredAttendee) : null;
  } catch {
    return null;
  }
}

function loadProgress(sessionId: string, attendeeId: string): Progress {
  try {
    const raw = localStorage.getItem(progressKey(sessionId, attendeeId));
    return raw ? (JSON.parse(raw) as Progress) : {};
  } catch {
    return {};
  }
}

function isExerciseDone(exercise: Exercise, progress: Progress): boolean {
  const submitted = progress[exercise.id] ?? [];
  if (isPairExerciseType(exercise.type)) {
    const config = exercise.config as PairExerciseConfig;
    return submitted.length >= config.pairs.length;
  }
  if (exercise.type === "visual_reaction") {
    const config = exercise.config as VisualReactionConfig;
    return submitted.length >= config.images.length;
  }
  // keep_cut and any other single-submission type
  return submitted.includes(SINGLE_SUBMISSION_ITEM_ID);
}

export function AttendeeFlow({
  sessionId,
  sessionName,
  exercises,
}: {
  sessionId: string;
  sessionName: string;
  exercises: Exercise[];
}) {
  const supabase = useMemo(() => createClient(), []);

  const [attendee, setAttendee] = useState<StoredAttendee | null | undefined>(
    undefined // undefined = not checked yet, avoids a name-form flash on load
  );
  const [nameInput, setNameInput] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  const [progress, setProgress] = useState<Progress>({});
  const [justFinishedExerciseId, setJustFinishedExerciseId] = useState<
    string | null
  >(null);

  const [selectedSide, setSelectedSide] = useState<"left" | "right" | null>(null);
  const [note, setNote] = useState("");
  const [keepText, setKeepText] = useState("");
  const [cutText, setCutText] = useState("");
  const [reaction, setReaction] = useState<"up" | "down" | null>(null);
  const [imageNote, setImageNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const stored = loadAttendee(sessionId);
    setAttendee(stored);
    if (stored) setProgress(loadProgress(sessionId, stored.id));
  }, [sessionId]);

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

  const { currentExercise, exerciseIndex } = useMemo(() => {
    for (let i = 0; i < exercises.length; i++) {
      if (!isExerciseDone(exercises[i], progress)) {
        return { currentExercise: exercises[i], exerciseIndex: i };
      }
    }
    return { currentExercise: null, exerciseIndex: -1 };
  }, [exercises, progress]);

  const currentPair = useMemo(() => {
    if (!currentExercise || !isPairExerciseType(currentExercise.type)) return null;
    const config = currentExercise.config as PairExerciseConfig;
    const submitted = progress[currentExercise.id] ?? [];
    return config.pairs.find((p) => !submitted.includes(p.id)) ?? null;
  }, [currentExercise, progress]);

  const currentImage = useMemo(() => {
    if (!currentExercise || currentExercise.type !== "visual_reaction") return null;
    const config = currentExercise.config as VisualReactionConfig;
    const submitted = progress[currentExercise.id] ?? [];
    return config.images.find((img) => !submitted.includes(img.id)) ?? null;
  }, [currentExercise, progress]);

  function recordSubmission(exerciseId: string, itemId: string) {
    const next: Progress = {
      ...progress,
      [exerciseId]: [...(progress[exerciseId] ?? []), itemId],
    };
    setProgress(next);
    localStorage.setItem(progressKey(sessionId, attendee!.id), JSON.stringify(next));
    return next;
  }

  async function handlePairSubmit() {
    if (!attendee || !currentExercise || !currentPair || !selectedSide) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      await submitWithRetry(supabase, "responses", {
        exercise_id: currentExercise.id,
        attendee_id: attendee.id,
        payload: {
          pairId: currentPair.id,
          choice: selectedSide,
          ...(note.trim() ? { note: note.trim() } : {}),
        },
      });

      const next = recordSubmission(currentExercise.id, currentPair.id);
      setSelectedSide(null);
      setNote("");

      const config = currentExercise.config as PairExerciseConfig;
      if (next[currentExercise.id].length >= config.pairs.length) {
        setJustFinishedExerciseId(currentExercise.id);
      }
    } catch {
      setSubmitError("Couldn't submit — check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleKeepCutSubmit() {
    if (!attendee || !currentExercise) return;
    const keep = keepText.trim();
    const cut = cutText.trim();
    if (!keep || !cut) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      await submitWithRetry(supabase, "responses", {
        exercise_id: currentExercise.id,
        attendee_id: attendee.id,
        payload: { keep, cut },
      });

      recordSubmission(currentExercise.id, SINGLE_SUBMISSION_ITEM_ID);
      setKeepText("");
      setCutText("");
      setJustFinishedExerciseId(currentExercise.id);
    } catch {
      setSubmitError("Couldn't submit — check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleImageSubmit() {
    if (!attendee || !currentExercise || !currentImage || !reaction) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      await submitWithRetry(supabase, "responses", {
        exercise_id: currentExercise.id,
        attendee_id: attendee.id,
        payload: {
          imageId: currentImage.id,
          reaction,
          ...(imageNote.trim() ? { note: imageNote.trim() } : {}),
        },
      });

      const next = recordSubmission(currentExercise.id, currentImage.id);
      setReaction(null);
      setImageNote("");

      const config = currentExercise.config as VisualReactionConfig;
      if (next[currentExercise.id].length >= config.images.length) {
        setJustFinishedExerciseId(currentExercise.id);
      }
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
        <h1 className="text-2xl font-bold">{sessionName}</h1>
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
            className="rounded bg-black px-4 py-4 text-xl font-semibold text-white disabled:opacity-50"
          >
            {joining ? "Joining…" : "Join"}
          </button>
          {joinError && <p className="text-sm text-red-600">{joinError}</p>}
        </form>
      </main>
    );
  }

  const justFinishedExercise = exercises.find((e) => e.id === justFinishedExerciseId);
  if (justFinishedExercise) {
    const hasMore = exerciseIndex !== -1;

    if (justFinishedExercise.type === "keep_cut") {
      return (
        <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
          <h1 className="text-2xl font-bold">Thanks — recorded</h1>
          <p className="text-gray-500">
            Your answer stays private until the facilitator reveals results.
          </p>
          <button
            onClick={() => setJustFinishedExerciseId(null)}
            className="rounded bg-black px-6 py-3 text-lg font-semibold text-white"
          >
            {hasMore ? "Continue" : "Done"}
          </button>
        </main>
      );
    }

    if (justFinishedExercise.type === "visual_reaction") {
      return (
        <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
          <h1 className="text-2xl font-bold">Thanks for reacting!</h1>
          <button
            onClick={() => setJustFinishedExerciseId(null)}
            className="rounded bg-black px-6 py-3 text-lg font-semibold text-white"
          >
            {hasMore ? "Continue" : "Done"}
          </button>
        </main>
      );
    }

    const config = justFinishedExercise.config as PairExerciseConfig;
    const submittedIds = progress[justFinishedExercise.id] ?? [];

    return (
      <main className="flex min-h-screen flex-col items-center gap-6 p-8">
        <h1 className="text-2xl font-bold">Your picks</h1>
        <ul className="flex w-full max-w-sm flex-col gap-2">
          {config.pairs.map((pair: Pair) => (
            <li key={pair.id} className="rounded border px-4 py-3">
              {pair.left} vs {pair.right}
            </li>
          ))}
        </ul>
        {submittedIds.length === config.pairs.length && (
          <button
            onClick={() => setJustFinishedExerciseId(null)}
            className="rounded bg-black px-6 py-3 text-lg font-semibold text-white"
          >
            {hasMore ? "Continue" : "Done"}
          </button>
        )}
      </main>
    );
  }

  if (!currentExercise) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
        <h1 className="text-2xl font-bold">You&apos;re all caught up</h1>
        <p className="mt-2 text-gray-500">Thanks for taking part.</p>
      </main>
    );
  }

  if (currentExercise.type === "keep_cut") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
        <div className="flex w-full max-w-md flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-600">
              One thing you couldn&apos;t lose
            </label>
            <textarea
              value={keepText}
              onChange={(e) => setKeepText(e.target.value)}
              maxLength={200}
              rows={2}
              className="w-full rounded border px-3 py-2 text-lg"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-600">
              One thing that needs to go
            </label>
            <textarea
              value={cutText}
              onChange={(e) => setCutText(e.target.value)}
              maxLength={200}
              rows={2}
              className="w-full rounded border px-3 py-2 text-lg"
            />
          </div>
          <button
            onClick={handleKeepCutSubmit}
            disabled={submitting || !keepText.trim() || !cutText.trim()}
            className="rounded bg-black px-4 py-4 text-xl font-semibold text-white disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit"}
          </button>
          {submitError && (
            <p className="text-sm text-red-600">
              {submitError}{" "}
              <button onClick={handleKeepCutSubmit} className="underline">
                Retry
              </button>
            </p>
          )}
        </div>
      </main>
    );
  }

  if (currentExercise.type === "visual_reaction" && currentImage) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
        <div className="flex w-full max-w-md flex-col gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentImage.url}
            alt=""
            className="aspect-square w-full rounded-xl object-cover"
          />
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setReaction("up")}
              className={`rounded-xl border-4 py-6 text-4xl transition ${
                reaction === "up" ? "border-black bg-black" : "border-gray-200"
              }`}
            >
              👍
            </button>
            <button
              onClick={() => setReaction("down")}
              className={`rounded-xl border-4 py-6 text-4xl transition ${
                reaction === "down" ? "border-black bg-black" : "border-gray-200"
              }`}
            >
              👎
            </button>
          </div>

          {reaction && (
            <div className="flex flex-col gap-3">
              <textarea
                value={imageNote}
                onChange={(e) => setImageNote(e.target.value)}
                placeholder="Add a short note (optional)"
                maxLength={140}
                rows={2}
                className="rounded border px-3 py-2"
              />
              <button
                onClick={handleImageSubmit}
                disabled={submitting}
                className="rounded bg-black px-4 py-4 text-xl font-semibold text-white disabled:opacity-50"
              >
                {submitting ? "Submitting…" : "Submit"}
              </button>
              {submitError && (
                <p className="text-sm text-red-600">
                  {submitError}{" "}
                  <button onClick={handleImageSubmit} className="underline">
                    Retry
                  </button>
                </p>
              )}
            </div>
          )}
        </div>
      </main>
    );
  }

  if (!currentPair) return null;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <div className="flex w-full max-w-md flex-col gap-4">
        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={() => setSelectedSide("left")}
            className={`rounded-xl border-4 px-6 py-8 text-2xl font-bold transition ${
              selectedSide === "left"
                ? "border-black bg-black text-white"
                : "border-gray-200"
            }`}
          >
            {currentPair.left}
          </button>
          <button
            onClick={() => setSelectedSide("right")}
            className={`rounded-xl border-4 px-6 py-8 text-2xl font-bold transition ${
              selectedSide === "right"
                ? "border-black bg-black text-white"
                : "border-gray-200"
            }`}
          >
            {currentPair.right}
          </button>
        </div>

        {selectedSide && (
          <div className="flex flex-col gap-3">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a short note (optional)"
              maxLength={140}
              rows={2}
              className="rounded border px-3 py-2"
            />
            <button
              onClick={handlePairSubmit}
              disabled={submitting}
              className="rounded bg-black px-4 py-4 text-xl font-semibold text-white disabled:opacity-50"
            >
              {submitting ? "Submitting…" : "Submit"}
            </button>
            {submitError && (
              <p className="text-sm text-red-600">
                {submitError}{" "}
                <button onClick={handlePairSubmit} className="underline">
                  Retry
                </button>
              </p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
