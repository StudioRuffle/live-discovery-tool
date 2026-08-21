"use client";

import { useRef, useState } from "react";
import { createQuestionnaireExercise } from "../../actions";

export function QuestionnaireForm({ sessionId }: { sessionId: string }) {
  const nextId = useRef(1);
  const [rows, setRows] = useState([0]);

  function addRow() {
    setRows((r) => [...r, nextId.current++]);
  }

  function removeRow(id: number) {
    setRows((r) => (r.length > 1 ? r.filter((row) => row !== id) : r));
  }

  return (
    <form action={createQuestionnaireExercise} className="flex flex-col gap-3">
      <input type="hidden" name="session_id" value={sessionId} />
      <p className="text-sm font-semibold text-ink/70">Pre-Session Questionnaire</p>
      <p className="text-sm text-ink/50">
        Answered before the session via its own link (see below once
        added) — not part of the live in-room flow.
      </p>

      {rows.map((row) => (
        <div key={row} className="flex items-center gap-2">
          <input
            type="text"
            name="question_text"
            placeholder="Question"
            required
            className="min-w-0 flex-1 rounded border border-ink/15 px-3 py-2"
          />
          <button
            type="button"
            onClick={() => removeRow(row)}
            disabled={rows.length === 1}
            aria-label="Remove question"
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
        + Add another question
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
