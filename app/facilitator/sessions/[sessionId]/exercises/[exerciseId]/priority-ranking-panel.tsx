"use client";

import { useEffect, useState } from "react";
import type { PriorityRankingConfig } from "@/lib/types";

interface RankingResultsResponse {
  scores: Record<string, number>;
  respondents: number;
}

const POLL_INTERVAL_MS = 3000;

export function PriorityRankingPanel({
  exerciseId,
  config,
}: {
  exerciseId: string;
  config: PriorityRankingConfig;
}) {
  const [results, setResults] = useState<RankingResultsResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`/api/facilitator/priority-ranking-results/${exerciseId}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as RankingResultsResponse;
        if (!cancelled) setResults(data);
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

  const scores = results?.scores ?? {};
  const maxScore = Math.max(1, ...config.items.map((item) => scores[item.id] ?? 0));
  const ranked = [...config.items].sort(
    (a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0)
  );

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <p className="text-lg text-white/60">{results?.respondents ?? 0} responses</p>

      <div className="flex flex-col gap-4">
        {ranked.map((item, index) => {
          const score = scores[item.id] ?? 0;
          const widthPct = Math.round((score / maxScore) * 100);

          return (
            <div key={item.id} className="flex items-center gap-4">
              <span className="w-10 shrink-0 font-display text-2xl text-white/50">
                #{index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="mb-1 truncate font-display text-2xl">{item.label}</div>
                <div className="h-10 w-full overflow-hidden rounded-lg bg-ink-light">
                  <div
                    className="flex h-full items-center justify-end bg-brand pr-3 text-lg font-semibold text-white transition-all duration-500"
                    style={{ width: `${widthPct}%` }}
                  >
                    {score > 0 && score}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
