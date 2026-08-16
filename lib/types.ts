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
