"use client";

import { useEffect, useState } from "react";
import type { ImageItem } from "@/lib/types";

interface ResultsResponse {
  counts: Record<string, { up: number; down: number }>;
  notes: { imageId: string; note: string; submittedAt: string }[];
  total: number;
}

const POLL_INTERVAL_MS = 3000;

// Lower = more divisive (closer to a 50/50 split). Images with zero
// responses sort last - there's no split to show yet.
function divisiveness(counts?: { up: number; down: number }): number {
  if (!counts) return Infinity;
  const total = counts.up + counts.down;
  if (total === 0) return Infinity;
  return Math.abs(counts.up / total - 0.5);
}

export function VisualReactionPanel({
  exerciseId,
  images,
}: {
  exerciseId: string;
  images: ImageItem[];
}) {
  const [results, setResults] = useState<ResultsResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`/api/facilitator/visual-reaction-results/${exerciseId}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as ResultsResponse;
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

  if (images.length === 0) {
    return <p className="text-white/50">No images uploaded yet.</p>;
  }

  const sorted = [...images].sort(
    (a, b) => divisiveness(results?.counts[a.id]) - divisiveness(results?.counts[b.id])
  );

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      {sorted.map((img) => {
        const c = results?.counts[img.id] ?? { up: 0, down: 0 };
        const total = c.up + c.down;
        const upPct = total ? Math.round((c.up / total) * 100) : 50;
        const notes = results?.notes.filter((n) => n.imageId === img.id) ?? [];

        return (
          <div key={img.id} className="flex gap-6 rounded-lg bg-black/20 p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.url}
              alt=""
              className="h-40 w-40 flex-shrink-0 rounded object-cover"
            />
            <div className="flex flex-1 flex-col gap-2">
              <div className="flex h-10 w-full overflow-hidden rounded-lg bg-ink-light text-lg font-semibold">
                <div
                  className="flex items-center justify-end bg-green-500 pr-3 transition-all duration-500"
                  style={{ width: `${upPct}%` }}
                >
                  {c.up > 0 && `👍 ${c.up}`}
                </div>
                <div
                  className="flex items-center justify-start bg-red-500 pl-3 transition-all duration-500"
                  style={{ width: `${100 - upPct}%` }}
                >
                  {c.down > 0 && `👎 ${c.down}`}
                </div>
              </div>
              {notes.map((n, i) => (
                <p key={`${n.submittedAt}-${i}`} className="text-sm text-white/70">
                  {n.note}
                </p>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
