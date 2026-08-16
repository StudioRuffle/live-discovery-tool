"use client";

import { useState } from "react";
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
  const [rows, setRows] = useState([0]);

  return (
    <form action={createPairExercise} className="flex flex-col gap-3">
      <input type="hidden" name="session_id" value={sessionId} />
      <input type="hidden" name="type" value={type} />
      <p className="text-sm font-semibold text-gray-600">{title}</p>

      {rows.map((row) => (
        <div key={row} className="flex items-center gap-2">
          <input
            type="text"
            name="pair_left"
            placeholder={leftPlaceholder}
            required
            className="flex-1 rounded border px-3 py-2"
          />
          <span className="text-gray-400">vs</span>
          <input
            type="text"
            name="pair_right"
            placeholder={rightPlaceholder}
            required
            className="flex-1 rounded border px-3 py-2"
          />
        </div>
      ))}

      <button
        type="button"
        onClick={() => setRows((r) => [...r, r.length])}
        className="self-start text-sm text-blue-600 hover:underline"
      >
        + Add another pair
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
