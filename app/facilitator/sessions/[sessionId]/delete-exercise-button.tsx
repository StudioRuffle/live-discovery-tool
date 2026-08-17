"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteExercise } from "../../actions";

export function DeleteExerciseButton({
  sessionId,
  exerciseId,
}: {
  sessionId: string;
  exerciseId: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (
      !confirm(
        "Remove this exercise? Its setup and any responses already submitted for it will be deleted. This can't be undone."
      )
    ) {
      return;
    }
    setDeleting(true);
    const formData = new FormData();
    formData.set("session_id", sessionId);
    formData.set("exercise_id", exerciseId);
    try {
      await deleteExercise(formData);
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      aria-label="Remove exercise"
      className="text-sm text-ink/40 hover:text-red-600 disabled:pointer-events-none disabled:opacity-40"
    >
      {deleting ? "Removing…" : "Remove"}
    </button>
  );
}
