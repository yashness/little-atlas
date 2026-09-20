import type { Country, GameOptions, MemoryBoard, Question } from "./atlas";
export type LessonTab = "look" | "story" | "people";
export interface AnswerState {
  selected: number | null;
  answered: boolean;
  attempted: boolean;
}
export interface RoundSession {
  type: "visit" | "quiz";
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
  countries: Country[];
  board: MemoryBoard;
  feedback: string;
  complete: boolean;
}
export type Session = RoundSession | MemorySession | { type: "guide" };
