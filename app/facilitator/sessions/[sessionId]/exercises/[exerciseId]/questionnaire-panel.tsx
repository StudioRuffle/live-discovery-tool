"use client";

import { useEffect, useState } from "react";
import type { QuestionnaireConfig } from "@/lib/types";

interface RespondentAnswer {
  attendeeId: string;
  attendeeName: string;
  answers: { questionId: string; text: string }[];
  submittedAt: string;
}

interface QuestionnaireResultsResponse {
  responses: RespondentAnswer[];
  respondents: number;
}

const POLL_INTERVAL_MS = 3000;

export function QuestionnairePanel({
  exerciseId,
  config,
}: {
  exerciseId: string;
  config: QuestionnaireConfig;
}) {
  const [results, setResults] = useState<QuestionnaireResultsResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`/api/facilitator/questionnaire-results/${exerciseId}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as QuestionnaireResultsResponse;
        if (!cancelled) setResults(data);
      } catch {
        // transient blip - next poll tick retries
      }
    }

    poll();
    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [exerciseId]);

  const questionText = (id: string) =>
    config.questions.find((q) => q.id === id)?.text ?? "";

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <p className="text-lg text-white/60">
        {results?.respondents ?? 0} {results?.respondents === 1 ? "response" : "responses"}
      </p>

      <div className="flex flex-col gap-4">
        {results?.responses.map((r) => (
          <div key={r.attendeeId} className="rounded-lg bg-black/20 p-5">
            <p className="mb-3 font-display text-2xl text-brand">{r.attendeeName}</p>
            <div className="flex flex-col gap-3">
              {r.answers.map((a) => (
                <div key={a.questionId}>
                  <p className="text-sm font-semibold text-white/50">
                    {questionText(a.questionId)}
                  </p>
                  <p className="text-lg">{a.text}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
        {results && results.responses.length === 0 && (
          <p className="text-white/50">No responses yet.</p>
        )}
      </div>
    </div>
  );
}
