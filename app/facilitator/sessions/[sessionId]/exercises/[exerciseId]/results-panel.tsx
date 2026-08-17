"use client";

import { useEffect, useRef, useState } from "react";
import type { Pair } from "@/lib/types";

interface ResultsResponse {
  counts: Record<string, { left: number; right: number }>;
  notes: { pairId: string; note: string; submittedAt: string }[];
  total: number;
}

const POLL_INTERVAL_MS = 3000;

export function ResultsPanel({
  exerciseId,
  pairs,
}: {
  exerciseId: string;
  pairs: Pair[];
}) {
  const [results, setResults] = useState<ResultsResponse | null>(null);
  const pairsById = useRef(new Map(pairs.map((p) => [p.id, p])));

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`/api/facilitator/results/${exerciseId}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as ResultsResponse;
        if (!cancelled) setResults(data);
      } catch {
        // transient network blip - next poll tick will retry, no need to
        // surface anything on a projected screen for a single missed poll
      }
    }

    poll();
    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [exerciseId]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10">
      <div className="flex flex-col gap-8">
        {pairs.map((pair) => {
          const c = results?.counts[pair.id] ?? { left: 0, right: 0 };
          const total = c.left + c.right;
          const leftPct = total ? Math.round((c.left / total) * 100) : 50;

          return (
            <div key={pair.id} className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between text-4xl font-bold">
                <span>{pair.left}</span>
                <span>{pair.right}</span>
              </div>
              <div className="flex h-16 w-full overflow-hidden rounded-lg bg-ink-light text-2xl font-semibold">
                <div
                  className="flex items-center justify-end bg-brand pr-3 text-white transition-all duration-500"
                  style={{ width: `${leftPct}%` }}
                >
                  {c.left > 0 && c.left}
                </div>
                <div
                  className="flex items-center justify-start bg-cream pl-3 text-ink transition-all duration-500"
                  style={{ width: `${100 - leftPct}%` }}
                >
                  {c.right > 0 && c.right}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-2xl font-semibold text-white/70">Notes</h2>
        <div className="flex max-h-96 flex-col-reverse gap-3 overflow-y-auto">
          {results?.notes.map((n, i) => (
            <div
              key={`${n.submittedAt}-${i}`}
              className="rounded-lg bg-black/20 px-5 py-3 text-xl"
            >
              <span className="mr-2 text-white/50">
                {pairsById.current.get(n.pairId)?.left} /{" "}
                {pairsById.current.get(n.pairId)?.right}:
              </span>
              {n.note}
            </div>
          ))}
          {results && results.notes.length === 0 && (
            <p className="text-white/50">No notes yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
