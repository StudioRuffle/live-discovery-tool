"use client";

import { useRef, useState } from "react";
import { createPairExercise } from "../../actions";
import type { ExerciseType } from "@/lib/types";

// One shared form for every forced-choice-pair exercise type - only the
// type and placeholder copy differ per instance (see session page).
export function PairExerciseForm({
  sessionId,
  type,
  title,
  leftPlaceholder,
  rightPlaceholder,
}: {
  sessionId: string;
  type: ExerciseType;
  title: string;
  leftPlaceholder: string;
  rightPlaceholder: string;
}) {
  const nextId = useRef(1);
  const [rows, setRows] = useState([0]);

  function addRow() {
    setRows((r) => [...r, nextId.current++]);
  }

  function removeRow(id: number) {
    setRows((r) => (r.length > 1 ? r.filter((row) => row !== id) : r));
  }

  return (
    <form action={createPairExercise} className="flex flex-col gap-3">
      <input type="hidden" name="session_id" value={sessionId} />
      <input type="hidden" name="type" value={type} />
      <p className="text-sm font-semibold text-ink/70">{title}</p>

      {rows.map((row) => (
        <div key={row} className="flex items-center gap-2">
          <input
            type="text"
            name="pair_left"
            placeholder={leftPlaceholder}
            required
            className="min-w-0 flex-1 rounded border border-ink/15 px-3 py-2"
          />
          <span className="text-ink/30">vs</span>
          <input
            type="text"
            name="pair_right"
            placeholder={rightPlaceholder}
            required
            className="min-w-0 flex-1 rounded border border-ink/15 px-3 py-2"
          />
          <button
            type="button"
            onClick={() => removeRow(row)}
            disabled={rows.length === 1}
            aria-label="Remove pair"
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
        + Add another pair
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
