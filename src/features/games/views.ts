import type { Country, GameOptions, Question } from "../../contracts/atlas";
import type { DialogView } from "../../contracts/ui";
import type { MemoryBoard } from "../../library/atlas/memory";
import { regionLabel } from "../../library/atlas/geography";
import { worldMap } from "../../shared/ui/map";
import {
  actionButton,
  listenButton,
  regionBanner,
} from "../../shared/ui/components";
import { flag, icon } from "../../shared/ui/art";
import { escapeHtml as h } from "../../utils/html";
import { GAMES } from "./page";

import type { AnswerState } from "../../contracts/session";
export function questionView(
  q: Question,
  catalog: readonly Country[],
  options: GameOptions,
  state: AnswerState,
  {
    index = 0,
    total = 5,
    visit = false,
    stage = 1,
  }: { index?: number; total?: number; visit?: boolean; stage?: number } = {},
): DialogView {
  const target = catalog.find((c) => c.code === q.targetCode)!;
  const identify = q.kind === "flags" || q.kind === "shapes";
  const feedback = state.answered
    ? q.explanation
    : state.attempted
      ? `A good try! ${q.clue}`
      : "Take a little look. You can ask Pip for a clue.";
  return {
    title: visit
      ? `A little ${target.name} adventure`
      : (GAMES.find((g) => g.kind === q.kind)?.name ?? "A little adventure"),
    eyebrow: visit
      ? "LOOK, REMEMBER, TRY"
      : `ROUND ${index + 1} OF ${total} · TAKE YOUR TIME`,
    ...(visit ? { step: stage } : {}),
    body: `<div class="challenge" data-target="${q.targetCode}">${!visit ? `<div class="round-progress" role="progressbar" aria-label="Quiz progress" aria-valuenow="${index}" aria-valuemin="0" aria-valuemax="${total}"><span style="width:${(index / total) * 100}%"></span></div>` : ""}${!identify ? `<div class="question-country"><img src="${flag(target.code)}" alt="Flag of ${h(target.name)}"><span>${h(target.name)}</span></div>` : ""}<h3>${h(q.prompt)}</h3><p class="prompt-sub">${h(options.clues ? q.clue : identify ? "Find the right picture. A clue is always one tap away." : "Use what you remember. Pip can help.")}</p><div class="answer-grid choices-${q.choices.length}">${q.choices
      .map((choice, i) => {
        const c = choice.countryCode
          ? catalog.find((item) => item.code === choice.countryCode)
          : undefined;
        const content = choice.regions
          ? `${worldMap({ regions: choice.regions, labels: false })}<span class="answer-label">${h(choice.label)}</span>`
          : c
            ? `<img src="${flag(c.code)}" alt="${identify ? "Flag choice" : `Flag of ${h(c.name)}`}">${identify ? "" : `<span class="answer-label">${h(c.name)}</span>`}`
            : "";
        const label =
          identify && c ? `Flag option ${i + 1}: ${c.clue}` : choice.label;
        return `<button class="answer ${state.answered && choice.correct ? "correct" : state.selected === i ? "retry" : ""}" data-answer="${i}" aria-label="${h(label)}" ${state.answered ? "disabled" : ""}>${content}${state.answered && choice.correct ? '<span class="result-badge" aria-hidden="true">✓</span>' : ""}</button>`;
      })
      .join(
        "",
      )}</div><div class="feedback ${state.attempted && !state.answered ? "try" : ""}" id="feedback" role="status">${state.answered ? "★ " : ""}${h(feedback)}</div>${q.kind === "places" && state.answered ? regionBanner(target) : ""}</div>`,
    actions: `${listenButton("Hear Pip’s clue")}${state.answered ? `<button class="button primary" data-action="next" id="next">${visit ? (q.kind === "places" ? "Get my stamp" : "Find its home") : index + 1 === total ? "Finish my adventure" : "Next discovery"} ${icon("arrow")}</button>` : ""}`,
  };
}
export function memoryView(
  board: MemoryBoard,
  catalog: readonly Country[],
  feedback: string,
): DialogView {
  const done = board.matched.length === board.cards.length;
  return {
    title: "Memory postcards",
    eyebrow: `${board.matched.length / 2} OF ${board.cards.length / 2} PAIRS FOUND · NO TIMER`,
    body: `<div class="challenge"><h3>${done ? "Every postcard has a friend!" : "Who’s hiding behind the postcards?"}</h3><p class="prompt-sub">Turn over two. Find matching flags. A wrong turn never costs a life.</p><div class="memory-board">${board.cards
      .map((code, i) => {
        const c = catalog.find((item) => item.code === code)!;
        const visible = board.faceUp.includes(i) || board.matched.includes(i);
        return `<button class="postcard ${visible ? "revealed" : ""} ${board.matched.includes(i) ? "matched" : ""}" data-card="${i}" aria-label="${visible ? h(c.name) : `Hidden postcard ${i + 1}`}" ${board.matched.includes(i) ? "disabled" : ""}>${visible ? `<img src="${flag(code)}" alt="Flag of ${h(c.name)}"><b>${h(c.name)}</b>` : `<span aria-hidden="true">✦</span><small>little atlas</small>`}</button>`;
      })
      .join(
        "",
      )}</div><div class="feedback" role="status">${h(feedback)}</div></div>`,
    actions: `${listenButton("Hear the instructions")}${done ? actionButton("finish-memory", "My little discoveries") : board.faceUp.length === 2 ? actionButton("turn-back", "Try another pair") : ""}`,
  };
}
export function completionView(
  countries: readonly Country[],
  visit: boolean,
): DialogView {
  const first = countries[0]!;
  return {
    title: visit
      ? "One little place. One big discovery."
      : "High five, little explorer!",
    eyebrow: "A HAPPY LITTLE TRIUMPH",
    body: `<div class="celebration"><span class="big-star" aria-hidden="true">✦</span><h3>${visit ? "Hello, world!" : `${countries.length} little discoveries!`}</h3><p>${visit ? `You found ${h(first.name)}’s flag and practiced its home: ${h(regionLabel(first))}.` : "You noticed patterns, made connections, and tried again. That’s what explorers do."}</p>${visit ? `<div class="new-stamp"><small>LITTLE ATLAS · DISCOVERED</small><img src="${flag(first.code)}" alt="Flag of ${h(first.name)}"><span>${h(first.name)}</span><small>${h(regionLabel(first))}</small></div>` : `<div class="discovered-flags">${countries.map((c) => `<div><img src="${flag(c.code)}" alt=""><span>${h(c.name)}</span></div>`).join("")}</div>`}</div>`,
    actions: `<button class="listen-button" data-action="${visit ? "passport" : "close"}">${icon(visit ? "passport" : "heart")}${visit ? "See my passport" : "Take a happy break"}</button>${actionButton(visit ? "browse-next" : "replay", visit ? "Meet another country" : "Play again")}`,
  };
}
