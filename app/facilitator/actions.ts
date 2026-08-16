"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { isFacilitatorAuthed } from "@/lib/facilitator-auth";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ExerciseType, ImageItem, Pair, VisualReactionConfig } from "@/lib/types";

const VISUAL_REACTION_BUCKET = "visual-reaction";

const PAIR_EXERCISE_TYPES: ExerciseType[] = ["values_tension", "word_choice"];

// Server Actions are POST endpoints Next.js routes to the page that
// defined them - proxy.ts's matcher covers that for pages under
// /facilitator, but Next's own docs warn a matcher change or refactor can
// silently drop that coverage, so every mutating action here checks the
// PIN-gated cookie itself rather than relying on proxy.ts alone.
async function requireFacilitator() {
  if (!(await isFacilitatorAuthed())) {
    throw new Error("Not authenticated");
  }
}

async function nextExercisePosition(
  supabase: SupabaseClient,
  sessionId: string
): Promise<number> {
  const { data, error } = await supabase
    .from("exercises")
    .select("position")
    .eq("session_id", sessionId)
    .order("position", { ascending: false })
    .limit(1);
  if (error) throw new Error(error.message);
  return (data?.[0]?.position ?? -1) + 1;
}

// Named createClientRecord, not createClient, to avoid colliding with the
// Supabase client factories of the same name imported elsewhere in the app.
export async function createClientRecord(formData: FormData) {
  await requireFacilitator();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const supabase = createAdminClient();
  const { error } = await supabase.from("clients").insert({ name });
  if (error) throw new Error(error.message);

  revalidatePath("/facilitator");
}

export async function createSession(formData: FormData) {
  await requireFacilitator();
  const clientId = String(formData.get("client_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!clientId || !name) return;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("sessions")
    .insert({ client_id: clientId, name });
  if (error) throw new Error(error.message);

  revalidatePath(`/facilitator/clients/${clientId}`);
}

export async function closeSession(formData: FormData) {
  await requireFacilitator();
  const sessionId = String(formData.get("session_id") ?? "");
  if (!sessionId) return;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("sessions")
    .update({ status: "closed" })
    .eq("id", sessionId);
  if (error) throw new Error(error.message);

  revalidatePath(`/facilitator/sessions/${sessionId}`);
}

// Shared by every forced-choice-pair exercise type (values_tension,
// word_choice, ...) - only the type and the copy around the form differ,
// see PairExerciseForm.
export async function createPairExercise(formData: FormData) {
  await requireFacilitator();
  const sessionId = String(formData.get("session_id") ?? "");
  const type = String(formData.get("type") ?? "") as ExerciseType;
  const lefts = formData.getAll("pair_left") as string[];
  const rights = formData.getAll("pair_right") as string[];

  if (!PAIR_EXERCISE_TYPES.includes(type)) return;

  const pairs: Pair[] = lefts
    .map((left, i) => ({
      id: crypto.randomUUID(),
      left: left.trim(),
      right: (rights[i] ?? "").trim(),
    }))
    .filter((p) => p.left && p.right);

  if (!sessionId || pairs.length === 0) return;

  const supabase = createAdminClient();
  const nextPosition = await nextExercisePosition(supabase, sessionId);

  const { error } = await supabase.from("exercises").insert({
    session_id: sessionId,
    type,
    position: nextPosition,
    config: { pairs },
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/facilitator/sessions/${sessionId}`);
}

export async function createKeepCutExercise(formData: FormData) {
  await requireFacilitator();
  const sessionId = String(formData.get("session_id") ?? "");
  if (!sessionId) return;

  const supabase = createAdminClient();
  const nextPosition = await nextExercisePosition(supabase, sessionId);

  const { error } = await supabase.from("exercises").insert({
    session_id: sessionId,
    type: "keep_cut",
    position: nextPosition,
    config: {},
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/facilitator/sessions/${sessionId}`);
}

// Flips a keep_cut exercise to revealed. One-way: there is no un-reveal.
export async function revealExercise(exerciseId: string) {
  await requireFacilitator();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("exercises")
    .update({ reveal_state: "revealed" })
    .eq("id", exerciseId);
  if (error) throw new Error(error.message);
}

export async function createVisualReactionExercise(formData: FormData) {
  await requireFacilitator();
  const sessionId = String(formData.get("session_id") ?? "");
  if (!sessionId) return;

  const supabase = createAdminClient();
  const nextPosition = await nextExercisePosition(supabase, sessionId);

  const { error } = await supabase.from("exercises").insert({
    session_id: sessionId,
    type: "visual_reaction",
    position: nextPosition,
    config: { images: [] },
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/facilitator/sessions/${sessionId}`);
}

// Resizing/compression happens client-side (see image-manager.tsx) before
// the file ever reaches this action - keeps this server free of an image
// library, which would add real weight to a serverless function bundle.
export async function uploadImages(formData: FormData) {
  await requireFacilitator();
  const exerciseId = String(formData.get("exercise_id") ?? "");
  const files = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  if (!exerciseId || files.length === 0) return;

  const supabase = createAdminClient();

  const { data: exercise, error: fetchError } = await supabase
    .from("exercises")
    .select("session_id, config")
    .eq("id", exerciseId)
    .single();
  if (fetchError || !exercise) throw new Error(fetchError?.message ?? "Exercise not found");

  const existingImages = ((exercise.config as VisualReactionConfig).images ?? []);
  let nextOrder = existingImages.reduce((max, img) => Math.max(max, img.order), -1) + 1;

  const newImages: ImageItem[] = [];
  for (const file of files) {
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${exerciseId}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(VISUAL_REACTION_BUCKET)
      .upload(path, file, { contentType: file.type });
    if (uploadError) throw new Error(uploadError.message);

    const { data: publicUrlData } = supabase.storage
      .from(VISUAL_REACTION_BUCKET)
      .getPublicUrl(path);

    newImages.push({ id: crypto.randomUUID(), url: publicUrlData.publicUrl, path, order: nextOrder++ });
  }

  const { error: updateError } = await supabase
    .from("exercises")
    .update({ config: { images: [...existingImages, ...newImages] } })
    .eq("id", exerciseId);
  if (updateError) throw new Error(updateError.message);

  revalidatePath(`/facilitator/sessions/${exercise.session_id}/exercises/${exerciseId}`);
}

export async function removeImage(formData: FormData) {
  await requireFacilitator();
  const exerciseId = String(formData.get("exercise_id") ?? "");
  const imageId = String(formData.get("image_id") ?? "");
  if (!exerciseId || !imageId) return;

  const supabase = createAdminClient();

  const { data: exercise, error: fetchError } = await supabase
    .from("exercises")
    .select("session_id, config")
    .eq("id", exerciseId)
    .single();
  if (fetchError || !exercise) throw new Error(fetchError?.message ?? "Exercise not found");

  const images = (exercise.config as VisualReactionConfig).images ?? [];
  const target = images.find((img) => img.id === imageId);
  if (!target) return;

  const { error: removeError } = await supabase.storage
    .from(VISUAL_REACTION_BUCKET)
    .remove([target.path]);
  if (removeError) throw new Error(removeError.message);

  const remaining = images.filter((img) => img.id !== imageId);
  const { error: updateError } = await supabase
    .from("exercises")
    .update({ config: { images: remaining } })
    .eq("id", exerciseId);
  if (updateError) throw new Error(updateError.message);

  revalidatePath(`/facilitator/sessions/${exercise.session_id}/exercises/${exerciseId}`);
}

// direction: -1 moves the image earlier, +1 moves it later (swaps `order`
// with its neighbor in that direction).
export async function reorderImage(formData: FormData) {
  await requireFacilitator();
  const exerciseId = String(formData.get("exercise_id") ?? "");
  const imageId = String(formData.get("image_id") ?? "");
  const direction = Number(formData.get("direction") ?? 0);
  if (!exerciseId || !imageId || (direction !== -1 && direction !== 1)) return;

  const supabase = createAdminClient();

  const { data: exercise, error: fetchError } = await supabase
    .from("exercises")
    .select("session_id, config")
    .eq("id", exerciseId)
    .single();
  if (fetchError || !exercise) throw new Error(fetchError?.message ?? "Exercise not found");

  const images = [...((exercise.config as VisualReactionConfig).images ?? [])].sort(
    (a, b) => a.order - b.order
  );
  const index = images.findIndex((img) => img.id === imageId);
  const swapWith = index + direction;
  if (index === -1 || swapWith < 0 || swapWith >= images.length) return;

  const tmp = images[index].order;
  images[index].order = images[swapWith].order;
  images[swapWith].order = tmp;

  const { error: updateError } = await supabase
    .from("exercises")
    .update({ config: { images } })
    .eq("id", exerciseId);
  if (updateError) throw new Error(updateError.message);

  revalidatePath(`/facilitator/sessions/${exercise.session_id}/exercises/${exerciseId}`);
}

export async function goToResults(formData: FormData) {
  const sessionId = String(formData.get("session_id") ?? "");
  const exerciseId = String(formData.get("exercise_id") ?? "");
  redirect(`/facilitator/sessions/${sessionId}/exercises/${exerciseId}`);
}
