"use client";

import { useState } from "react";
import { createValuesTensionExercise } from "../../actions";

export function PairsForm({ sessionId }: { sessionId: string }) {
  const [rows, setRows] = useState([0]);

  return (
    <form action={createValuesTensionExercise} className="flex flex-col gap-3">
      <input type="hidden" name="session_id" value={sessionId} />
      <p className="text-sm font-semibold text-gray-600">
        Values in Tension — word pairs
      </p>

      {rows.map((row) => (
        <div key={row} className="flex items-center gap-2">
          <input
            type="text"
            name="pair_left"
            placeholder="Speed"
            required
            className="flex-1 rounded border px-3 py-2"
          />
          <span className="text-gray-400">vs</span>
          <input
            type="text"
            name="pair_right"
            placeholder="Craft"
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
