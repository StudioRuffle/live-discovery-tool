import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  isPairExerciseType,
  type PairExerciseConfig,
  type PerceptualMapConfig,
  type VisualReactionConfig,
} from "@/lib/types";
import { ResultsPanel } from "./results-panel";
import { KeepCutPanel } from "./keep-cut-panel";
import { ImageManager } from "./image-manager";
import { VisualReactionPanel } from "./visual-reaction-panel";
import { PerceptualMapPanel } from "./perceptual-map-panel";

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

  if (exercise.type === "visual_reaction") {
    const images = (exercise.config as VisualReactionConfig).images ?? [];
    return (
      <main className="bg-grain min-h-screen bg-ink px-8 pb-8 pt-20 text-white">
        <div className="mx-auto mb-8 max-w-5xl rounded-lg bg-white p-6 text-ink">
          <h2 className="mb-3 font-semibold">
            Manage images — reorder or remove before the session starts
          </h2>
          <ImageManager exerciseId={exerciseId} images={images} />
        </div>
        <VisualReactionPanel exerciseId={exerciseId} images={images} />
      </main>
    );
  }

  return (
    <main className="bg-grain min-h-screen bg-ink px-8 pb-8 pt-20 text-white">
      {isPairExerciseType(exercise.type) ? (
        <ResultsPanel
          exerciseId={exerciseId}
          pairs={(exercise.config as PairExerciseConfig).pairs ?? []}
        />
      ) : exercise.type === "keep_cut" ? (
        <KeepCutPanel exerciseId={exerciseId} />
      ) : exercise.type === "perceptual_map" ? (
        <PerceptualMapPanel
          exerciseId={exerciseId}
          config={exercise.config as PerceptualMapConfig}
        />
      ) : (
        <p className="text-white/50">
          Results view for &quot;{exercise.type}&quot; isn&apos;t built yet.
        </p>
      )}
    </main>
  );
}
