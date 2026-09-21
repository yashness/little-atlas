import type { Country, GameOptions, MemoryBoard, Question } from "./atlas";
export const LESSON_TABS = ["look", "people"] as const;
export type LessonTab = (typeof LESSON_TABS)[number];
export interface AnswerState {
  selected: number | null;
  answered: boolean;
  attempted: boolean;
}
export interface RoundSession {
  type: "visit" | "quiz";
  id: number;
  countries: Country[];
  pool: Country[];
  index: number;
  stage: "learn" | "question" | "complete";
  tab: LessonTab;
  step: 1 | 2;
  question: Question | null;
  answer: AnswerState;
  options: GameOptions;
  at: Date;
}
export interface MemorySession {
  type: "memory";
  id: number;
  countries: Country[];
  board: MemoryBoard;
  feedback: string;
  complete: boolean;
}
export type Session = RoundSession | MemorySession | { type: "guide" };
