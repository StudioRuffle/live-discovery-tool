"use client";

import { useState } from "react";
import { createPerceptualMapExercise } from "../../actions";

export function PerceptualMapForm({ sessionId }: { sessionId: string }) {
  const [rows, setRows] = useState([0]);

  return (
    <form action={createPerceptualMapExercise} className="flex flex-col gap-3">
      <input type="hidden" name="session_id" value={sessionId} />
      <p className="text-sm font-semibold text-ink/70">Perceptual Map</p>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <input
            type="text"
            name="x_left"
            placeholder="Legacy"
            required
            className="w-full min-w-0 rounded border border-ink/15 px-3 py-2"
          />
          <span className="text-ink/30">↔</span>
          <input
            type="text"
            name="x_right"
            placeholder="Emerging"
            required
            className="w-full min-w-0 rounded border border-ink/15 px-3 py-2"
          />
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <input
            type="text"
            name="y_bottom"
            placeholder="Regional"
            required
            className="w-full min-w-0 rounded border border-ink/15 px-3 py-2"
          />
          <span className="text-ink/30">↕</span>
          <input
            type="text"
            name="y_top"
            placeholder="National"
            required
            className="w-full min-w-0 rounded border border-ink/15 px-3 py-2"
          />
        </div>
      </div>

      <p className="text-sm font-semibold text-ink/70">Competitors</p>
      {rows.map((row) => (
        <input
          key={row}
          type="text"
          name="competitor_name"
          placeholder="Competitor name"
          required
          className="rounded border border-ink/15 px-3 py-2"
        />
      ))}
      <button
        type="button"
        onClick={() => setRows((r) => [...r, r.length])}
        className="self-start text-sm text-brand hover:underline"
      >
        + Add another competitor
      </button>

      <button
        type="submit"
        className="mt-2 self-start rounded bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-dark"
      >
        Add exercise
      </button>
    </form>
  );
}
