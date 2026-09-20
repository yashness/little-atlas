/** Shared vocabulary. No browser, storage, or source-provider dependencies. */
export const REGIONS = ['North America', 'South America', 'Europe', 'Africa', 'Asia', 'Oceania'] as const;
export type Region = typeof REGIONS[number];
export type RegionMode = 'single' | 'spans' | 'convention';
export type Feature = 'circle' | 'stars' | 'cross' | 'vertical' | 'horizontal' | 'crescent' | 'sun' | 'animal' | 'text' | 'triangle' | 'tree';
export interface Source { label: string; url: string; snapshot: string }
export interface Language { code: string; name: string }
export interface FlagStory { summary: string; detail: string; source: Source; note?: string }
export interface Country {
  code: string;
  name: string;
  mapId: string;
  regions: Region[];
  regionMode: RegionMode;
  regionNote: string;
  coordinates: readonly [number, number]; // longitude, latitude; approximate locator, not capital
  geography: string;
  colors: string[]; // main colors, not every tiny detail in a coat of arms
  shape: string;
  features: Feature[];
  bands: number | null; // visible background bands; null for designs not sensibly counted
  visualTitle: string;
  mnemonic: string; // explicitly not flag history
  clue: string;
  compareWith: string;
  scope: 'member' | 'observer' | 'additional';
  story: FlagStory;
  languages: Language[];
  borderCodes: string[];
  borderNote: string;
  timeZones: string[];
  beliefs: { text: string; note: string; source: Source } | null;
  sources: Source[];
}
export type Axis = 'first-steps' | 'alphabetical' | 'continent' | 'colors' | 'patterns' | 'bands' | 'similarity' | 'neighbors' | 'languages' | 'clocks' | 'unvisited';
export interface ExplorerOptions {
  axis: Axis;
  region: Region | 'all';
  color: string;
  feature: Feature | 'all';
  bands: string;
  anchor: string;
  language: string;
  clockWindowMinutes: number;
  search: string;
}
export interface Selection { countries: Country[]; description: string; emptyReason: string }
export type GameKind = 'flags' | 'shapes' | 'places' | 'neighbors' | 'clocks' | 'pairs';
export interface GameOptions { kind: GameKind; rounds: number; choices: 2 | 3 | 4; clues: boolean }
export interface Choice { id: string; label: string; correct: boolean; countryCode?: string; regions?: Region[] }
export interface Question {
  kind: Exclude<GameKind, 'pairs'>;
  targetCode: string;
  prompt: string;
  clue: string;
  explanation: string;
  choices: Choice[];
}
export type QuestionResult = { ok: true; question: Question } | { ok: false; reason: string };
export interface Progress { stars: number; stamps: string[] }
export type TopicId = 'countries' | 'rivers' | 'deserts' | 'forests' | 'languages' | 'wonders' | 'places';
export interface Topic { id: TopicId; name: string; available: boolean }
