"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Pair } from "@/lib/types";

// Named createClientRecord, not createClient, to avoid colliding with the
// Supabase client factories of the same name imported elsewhere in the app.
export async function createClientRecord(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const supabase = createAdminClient();
  const { error } = await supabase.from("clients").insert({ name });
  if (error) throw new Error(error.message);

  revalidatePath("/facilitator");
}

export async function createSession(formData: FormData) {
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

export async function createValuesTensionExercise(formData: FormData) {
  const sessionId = String(formData.get("session_id") ?? "");
  const lefts = formData.getAll("pair_left") as string[];
  const rights = formData.getAll("pair_right") as string[];

  const pairs: Pair[] = lefts
    .map((left, i) => ({
      id: crypto.randomUUID(),
      left: left.trim(),
      right: (rights[i] ?? "").trim(),
    }))
    .filter((p) => p.left && p.right);

  if (!sessionId || pairs.length === 0) return;

  const supabase = createAdminClient();

  const { data: existing, error: countError } = await supabase
    .from("exercises")
    .select("position")
    .eq("session_id", sessionId)
    .order("position", { ascending: false })
    .limit(1);
  if (countError) throw new Error(countError.message);

  const nextPosition = (existing?.[0]?.position ?? -1) + 1;

  const { error } = await supabase.from("exercises").insert({
    session_id: sessionId,
    type: "values_tension",
    position: nextPosition,
    config: { pairs },
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/facilitator/sessions/${sessionId}`);
}

export async function goToResults(formData: FormData) {
  const sessionId = String(formData.get("session_id") ?? "");
  const exerciseId = String(formData.get("exercise_id") ?? "");
  redirect(`/facilitator/sessions/${sessionId}/exercises/${exerciseId}`);
}
