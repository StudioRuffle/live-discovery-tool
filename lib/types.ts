export type ExerciseType =
  | "values_tension"
  | "word_choice"
  | "keep_cut"
  | "visual_reaction"
  | "perceptual_map";

export type SessionStatus = "open" | "closed";
export type RevealState = "hidden" | "revealed";

// config/payload shapes: see docs/responses-payload-shapes.md

export interface Pair {
  id: string;
  left: string;
  right: string;
}

export interface PairExerciseConfig {
  pairs: Pair[];
}

export interface PairResponsePayload {
  pairId: string;
  choice: "left" | "right";
  note?: string;
}

export interface KeepCutResponsePayload {
  keep: string;
  cut: string;
}

export function isPairExerciseType(type: ExerciseType): boolean {
  return type === "values_tension" || type === "word_choice";
}

export interface ImageItem {
  id: string;
  url: string;
  // Storage object path (bucket-relative), kept alongside the public url so
  // removal can delete the actual blob without parsing it back out of a URL.
  path: string;
  order: number;
}

export interface VisualReactionConfig {
  images: ImageItem[];
}

export interface VisualReactionResponsePayload {
  imageId: string;
  reaction: "up" | "down";
  note?: string;
}

export interface Client {
  id: string;
  name: string;
  created_at: string;
}

export interface Session {
  id: string;
  client_id: string;
  name: string;
  status: SessionStatus;
  created_at: string;
}

export interface Exercise {
  id: string;
  session_id: string;
  type: ExerciseType;
  position: number;
  config: unknown;
  reveal_state: RevealState;
  created_at: string;
}

export interface Attendee {
  id: string;
  session_id: string;
  name: string;
  joined_at: string;
}
