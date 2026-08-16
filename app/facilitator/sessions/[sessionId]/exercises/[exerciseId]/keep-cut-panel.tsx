"use client";

import { useEffect, useState } from "react";
import { revealExercise } from "@/app/facilitator/actions";

interface KeepCutResult {
  revealed: boolean;
  submittedCount: number;
  totalAttendees: number;
  responses?: { id: string; keep: string; cut: string; submittedAt: string }[];
}

const POLL_INTERVAL_MS = 3000;

export function KeepCutPanel({ exerciseId }: { exerciseId: string }) {
  const [result, setResult] = useState<KeepCutResult | null>(null);
  const [revealing, setRevealing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`/api/facilitator/keep-cut-results/${exerciseId}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as KeepCutResult;
        if (!cancelled) setResult(data);
      } catch {
        // transient blip - next poll tick retries
      }
    }

    poll();
    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [exerciseId]);

  async function handleReveal() {
    if (!confirm("Reveal all answers? This can't be undone for this exercise.")) {
      return;
    }
    setRevealing(true);
    try {
      await revealExercise(exerciseId);
      const res = await fetch(`/api/facilitator/keep-cut-results/${exerciseId}`, {
        cache: "no-store",
      });
      if (res.ok) setResult((await res.json()) as KeepCutResult);
    } finally {
      setRevealing(false);
    }
  }

  if (!result) return null;

  if (!result.revealed) {
    return (
      <div className="flex flex-col items-center gap-8 py-16">
        <p className="text-6xl font-bold">
          {result.submittedCount} of {result.totalAttendees}
        </p>
        <p className="text-2xl text-gray-400">responded</p>
        <button
          onClick={handleReveal}
          disabled={revealing}
          className="rounded-lg bg-sky-500 px-8 py-4 text-2xl font-bold text-white disabled:opacity-50"
        >
          {revealing ? "Revealing…" : "Reveal"}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <p className="text-xl text-gray-400">{result.submittedCount} responses</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {result.responses?.map((r) => (
          <div key={r.id} className="rounded-lg bg-gray-900 px-5 py-4">
            <p className="text-sm font-semibold text-green-400">Keep</p>
            <p className="mb-3 break-words text-xl">{r.keep}</p>
            <p className="text-sm font-semibold text-red-400">Cut</p>
            <p className="break-words text-xl">{r.cut}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
