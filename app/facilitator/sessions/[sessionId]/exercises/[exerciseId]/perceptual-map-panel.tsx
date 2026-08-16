"use client";

import { useEffect, useState } from "react";
import type { PerceptualMapConfig } from "@/lib/types";

interface PlacementRow {
  attendeeId: string;
  competitorId: string;
  x: number;
  y: number;
}

const POLL_INTERVAL_MS = 3000;

// Cycled by competitor index - distinct enough at a glance from across a
// room, and stable regardless of how many competitors are configured.
const COLORS = [
  "#38bdf8", // sky
  "#f97316", // orange
  "#a3e635", // lime
  "#f472b6", // pink
  "#a78bfa", // violet
  "#facc15", // yellow
  "#2dd4bf", // teal
  "#fb7185", // rose
];

export function PerceptualMapPanel({
  exerciseId,
  config,
}: {
  exerciseId: string;
  config: PerceptualMapConfig;
}) {
  const [placements, setPlacements] = useState<PlacementRow[]>([]);
  const [respondents, setRespondents] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`/api/facilitator/perceptual-map-results/${exerciseId}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as { placements: PlacementRow[]; respondents: number };
        if (!cancelled) {
          setPlacements(data.placements);
          setRespondents(data.respondents);
        }
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

  const colorFor = (competitorId: string) => {
    const index = config.competitors.findIndex((c) => c.id === competitorId);
    return COLORS[index % COLORS.length] ?? "#ffffff";
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <p className="text-lg text-gray-400">{respondents} responses</p>

      <div className="flex items-center justify-center text-xl font-bold">
        {config.yAxis.top}
      </div>
      <div className="flex items-stretch gap-3">
        <div className="flex items-center [writing-mode:vertical-rl] rotate-180 text-xl font-bold">
          {config.xAxis.left}
        </div>
        <div className="relative aspect-square flex-1 rounded-lg bg-gray-900">
          <div className="absolute left-1/2 top-0 h-full w-px bg-gray-700" />
          <div className="absolute left-0 top-1/2 h-px w-full bg-gray-700" />
          {placements.map((p, i) => (
            <div
              key={`${p.attendeeId}-${p.competitorId}-${i}`}
              className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                left: `${p.x * 100}%`,
                top: `${(1 - p.y) * 100}%`,
                backgroundColor: colorFor(p.competitorId),
              }}
              title={config.competitors.find((c) => c.id === p.competitorId)?.name}
            />
          ))}
        </div>
        <div className="flex items-center [writing-mode:vertical-rl] text-xl font-bold">
          {config.xAxis.right}
        </div>
      </div>
      <div className="flex items-center justify-center text-xl font-bold">
        {config.yAxis.bottom}
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        {config.competitors.map((c) => (
          <div key={c.id} className="flex items-center gap-2 text-sm">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: colorFor(c.id) }}
            />
            {c.name}
          </div>
        ))}
      </div>
    </div>
  );
}
