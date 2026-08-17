"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  closeSession,
  duplicateSession,
  resetSessionResponses,
} from "../../actions";
import type { Client, SessionStatus } from "@/lib/types";

export function SessionActions({
  sessionId,
  sessionName,
  status,
  clients,
  currentClientId,
}: {
  sessionId: string;
  sessionName: string;
  status: SessionStatus;
  clients: Client[];
  currentClientId: string;
}) {
  const router = useRouter();
  const [resetting, setResetting] = useState(false);
  const [closing, setClosing] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [showDuplicateForm, setShowDuplicateForm] = useState(false);
  const [duplicateName, setDuplicateName] = useState(`${sessionName} (copy)`);
  const [duplicateClientId, setDuplicateClientId] = useState(currentClientId);

  async function handleReset() {
    if (
      !confirm(
        "Delete all attendee responses for this session? Exercise setup stays intact. This can't be undone."
      )
    ) {
      return;
    }
    setResetting(true);
    const formData = new FormData();
    formData.set("session_id", sessionId);
    try {
      await resetSessionResponses(formData);
      router.refresh();
    } finally {
      setResetting(false);
    }
  }

  async function handleClose() {
    if (
      !confirm(
        "Close this session? Attendees will no longer be able to join or submit. You can still view results anytime."
      )
    ) {
      return;
    }
    setClosing(true);
    const formData = new FormData();
    formData.set("session_id", sessionId);
    try {
      await closeSession(formData);
      router.refresh();
    } finally {
      setClosing(false);
    }
  }

  async function handleDuplicate(e: React.FormEvent) {
    e.preventDefault();
    if (!duplicateName.trim()) return;
    setDuplicating(true);
    const formData = new FormData();
    formData.set("source_session_id", sessionId);
    formData.set("client_id", duplicateClientId);
    formData.set("name", duplicateName.trim());
    try {
      await duplicateSession(formData);
    } finally {
      setDuplicating(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-ink/15 p-6">
      <div className="flex flex-wrap gap-2">
        {status === "open" && (
          <button
            onClick={handleClose}
            disabled={closing}
            className="rounded border border-ink/20 px-4 py-2 text-sm font-semibold text-ink disabled:opacity-50"
          >
            {closing ? "Closing…" : "Close session"}
          </button>
        )}
        <button
          onClick={handleReset}
          disabled={resetting}
          className="rounded border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 disabled:opacity-50"
        >
          {resetting ? "Resetting…" : "Reset responses"}
        </button>
        <button
          onClick={() => setShowDuplicateForm((v) => !v)}
          className="rounded border border-ink/20 px-4 py-2 text-sm font-semibold text-ink"
        >
          Duplicate session
        </button>
      </div>

      {showDuplicateForm && (
        <form onSubmit={handleDuplicate} className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={duplicateName}
            onChange={(e) => setDuplicateName(e.target.value)}
            required
            className="flex-1 rounded border border-ink/15 px-3 py-2"
          />
          <select
            value={duplicateClientId}
            onChange={(e) => setDuplicateClientId(e.target.value)}
            className="rounded border border-ink/15 px-3 py-2"
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={duplicating}
            className="rounded bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
          >
            {duplicating ? "Duplicating…" : "Create copy"}
          </button>
        </form>
      )}
    </div>
  );
}
