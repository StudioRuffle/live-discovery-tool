"use client";

import { useRef, useState } from "react";
import { createPerceptualMapExercise } from "../../actions";

export function PerceptualMapForm({ sessionId }: { sessionId: string }) {
  const nextId = useRef(1);
  const [rows, setRows] = useState([0]);

  function addRow() {
    setRows((r) => [...r, nextId.current++]);
  }

  function removeRow(id: number) {
    setRows((r) => (r.length > 1 ? r.filter((row) => row !== id) : r));
  }

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
        <div key={row} className="flex items-center gap-2">
          <input
            type="text"
            name="competitor_name"
            placeholder="Competitor name"
            required
            className="min-w-0 flex-1 rounded border border-ink/15 px-3 py-2"
          />
          <button
            type="button"
            onClick={() => removeRow(row)}
            disabled={rows.length === 1}
            aria-label="Remove competitor"
            className="shrink-0 rounded px-2 py-2 text-ink/40 hover:text-brand disabled:pointer-events-none disabled:opacity-20"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
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
