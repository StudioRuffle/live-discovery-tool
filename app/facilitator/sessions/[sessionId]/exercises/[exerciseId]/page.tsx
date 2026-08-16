import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PairExerciseConfig } from "@/lib/types";
import { ResultsPanel } from "./results-panel";

export default async function ExerciseResultsPage({
  params,
}: {
  params: Promise<{ sessionId: string; exerciseId: string }>;
}) {
  const { exerciseId } = await params;
  const supabase = createAdminClient();

  const { data: exercise } = await supabase
    .from("exercises")
    .select("*")
    .eq("id", exerciseId)
    .single();

  if (!exercise) notFound();

  const config = exercise.config as PairExerciseConfig;

  return (
    <main className="min-h-screen bg-gray-950 p-8 text-white">
      <ResultsPanel exerciseId={exerciseId} pairs={config.pairs ?? []} />
    </main>
  );
}
