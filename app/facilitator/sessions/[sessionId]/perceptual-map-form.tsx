"use client";

import { useState } from "react";
import { createPerceptualMapExercise } from "../../actions";

export function PerceptualMapForm({ sessionId }: { sessionId: string }) {
  const [rows, setRows] = useState([0]);

  return (
    <form action={createPerceptualMapExercise} className="flex flex-col gap-3">
      <input type="hidden" name="session_id" value={sessionId} />
      <p className="text-sm font-semibold text-gray-600">Perceptual Map</p>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="flex flex-1 items-center gap-2">
          <input
            type="text"
            name="x_left"
            placeholder="Legacy"
            required
            className="w-full rounded border px-3 py-2"
          />
          <span className="text-gray-400">↔</span>
          <input
            type="text"
            name="x_right"
            placeholder="Emerging"
            required
            className="w-full rounded border px-3 py-2"
          />
        </div>
        <div className="flex flex-1 items-center gap-2">
          <input
            type="text"
            name="y_bottom"
            placeholder="Regional"
            required
            className="w-full rounded border px-3 py-2"
          />
          <span className="text-gray-400">↕</span>
          <input
            type="text"
            name="y_top"
            placeholder="National"
            required
            className="w-full rounded border px-3 py-2"
          />
        </div>
      </div>

      <p className="text-sm font-semibold text-gray-600">Competitors</p>
      {rows.map((row) => (
        <input
          key={row}
          type="text"
          name="competitor_name"
          placeholder="Competitor name"
          required
          className="rounded border px-3 py-2"
        />
      ))}
      <button
        type="button"
        onClick={() => setRows((r) => [...r, r.length])}
        className="self-start text-sm text-blue-600 hover:underline"
      >
        + Add another competitor
      </button>

      <button
        type="submit"
        className="mt-2 self-start rounded bg-black px-4 py-2 font-semibold text-white"
      >
        Add exercise
      </button>
    </form>
  );
}
