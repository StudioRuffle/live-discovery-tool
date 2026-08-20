"use client";

import { useRef, useState } from "react";
import { createPriorityRankingExercise } from "../../actions";

export function PriorityRankingForm({ sessionId }: { sessionId: string }) {
  const nextId = useRef(1);
  const [rows, setRows] = useState([0]);

  function addRow() {
    setRows((r) => [...r, nextId.current++]);
  }

  function removeRow(id: number) {
    setRows((r) => (r.length > 1 ? r.filter((row) => row !== id) : r));
  }

  return (
    <form action={createPriorityRankingExercise} className="flex flex-col gap-3">
      <input type="hidden" name="session_id" value={sessionId} />
      <p className="text-sm font-semibold text-ink/70">Priority Ranking</p>
      <p className="text-sm text-ink/50">
        Attendees reorder the list with up/down arrows, most important first.
      </p>

      {rows.map((row) => (
        <div key={row} className="flex items-center gap-2">
          <input
            type="text"
            name="item_label"
            placeholder="Item to rank"
            required
            className="min-w-0 flex-1 rounded border border-ink/15 px-3 py-2"
          />
          <button
            type="button"
            onClick={() => removeRow(row)}
            disabled={rows.length === 1}
            aria-label="Remove item"
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
        + Add another item
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
