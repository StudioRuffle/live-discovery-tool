import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPairExerciseType, type PairExerciseConfig } from "@/lib/types";
import { ResultsPanel } from "./results-panel";
import { KeepCutPanel } from "./keep-cut-panel";

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

  return (
    <main className="min-h-screen bg-gray-950 p-8 text-white">
      {isPairExerciseType(exercise.type) ? (
        <ResultsPanel
          exerciseId={exerciseId}
          pairs={(exercise.config as PairExerciseConfig).pairs ?? []}
        />
      ) : exercise.type === "keep_cut" ? (
        <KeepCutPanel exerciseId={exerciseId} />
      ) : (
        <p className="text-gray-500">
          Results view for &quot;{exercise.type}&quot; isn&apos;t built yet.
        </p>
      )}
    </main>
  );
}
