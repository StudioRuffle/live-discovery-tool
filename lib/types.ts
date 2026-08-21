export type ExerciseType =
  | "values_tension"
  | "word_choice"
  | "keep_cut"
  | "visual_reaction"
  | "perceptual_map"
  | "priority_ranking"
  | "questionnaire";

// Exercise types answered async, before the session, via their own public
// link - excluded from /join/[sessionId]'s live in-room exercise queue.
export function isPreSessionType(type: ExerciseType): boolean {
  return type === "questionnaire";
}

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

export interface Competitor {
  id: string;
  name: string;
}

export interface PerceptualMapConfig {
  xAxis: { left: string; right: string };
  yAxis: { bottom: string; top: string };
  competitors: Competitor[];
}

export interface Placement {
  competitorId: string;
  x: number; // 0..1, normalized within xAxis bounds
  y: number; // 0..1, normalized within yAxis bounds
}

export interface PerceptualMapResponsePayload {
  placements: Placement[];
}

export interface RankItem {
  id: string;
  label: string;
}

export interface PriorityRankingConfig {
  items: RankItem[];
}

// order[0] is the attendee's top priority, order[length-1] their last -
// one row per attendee for the whole exercise, same as perceptual_map.
export interface PriorityRankingResponsePayload {
  order: string[];
}

export interface QuestionnaireQuestion {
  id: string;
  text: string;
}

export interface QuestionnaireConfig {
  questions: QuestionnaireQuestion[];
}

export interface QuestionnaireAnswer {
  questionId: string;
  text: string;
}

// One row per respondent for the whole exercise, same shape as
// perceptual_map/priority_ranking - item_key is ''.
export interface QuestionnaireResponsePayload {
  answers: QuestionnaireAnswer[];
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
