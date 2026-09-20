import type {
  Country,
  ExplorerOptions,
  GameKind,
  GameOptions,
  Progress,
} from "../../contracts/atlas";
import {
  explorerControls,
  gameControls,
} from "../../shared/ui/explorer-controls";
import { selectCountries } from "../../library/atlas/selection";
import { eligibleTargets } from "../../library/atlas/questions";
import { icon } from "../../shared/ui/art";
import { escapeHtml as h } from "../../utils/html";

export const GAMES: ReadonlyArray<{
  kind: GameKind;
  name: string;
  picture: string;
  description: string;
}> = [
  {
    kind: "flags",
    name: "Flag detective",
    picture: "🚩",
    description:
      "Follow the clue and choose the flag. More choices make the mystery a little trickier.",
  },
  {
    kind: "shapes",
    name: "Shape safari",
    picture: "✦",
    description:
      "Hunt for stars, circles, stripes, and symbols. A new way to notice what you see.",
  },
  {
    kind: "places",
    name: "Continent explorer",
    picture: "🌍",
    description:
      "Meet a country, then find its region. Countries spanning two get both in their answer.",
  },
  {
    kind: "neighbors",
    name: "Neighbor hop",
    picture: "↔",
    description:
      "Who lives next door? Match countries that share a listed land border.",
  },
  {
    kind: "clocks",
    name: "Clock buddies",
    picture: "◷",
    description:
      "Find a country with a time zone within one hour of your starting place today.",
  },
  {
    kind: "pairs",
    name: "Memory postcards",
    picture: "▧",
    description:
      "Turn over the postcards. Find matching flags and remember who lives behind each one.",
  },
];
export function gamesPage(
  catalog: readonly Country[],
  selectionOptions: ExplorerOptions,
  options: GameOptions,
  progress: Progress,
  at: Date,
  settingsOpen = false,
): string {
  const selection = selectCountries(
    catalog,
    selectionOptions,
    progress.stamps,
    at,
  );
  return `<section class="page-enter"><div class="page-intro"><div class="eyebrow">A LITTLE PLAY. A LOT OF CONNECTIONS.</div><h1>What shall we play today?</h1><p>Choose your countries once. Try them in six different adventures. No timers, no lost lives—just useful little discoveries.</p></div><details class="game-configuration" ${settingsOpen ? "open" : ""}><summary><span>${icon("compass")} Choose countries & level</span><span class="config-summary">${selection.countries.length} places · ${options.choices} choices · ${options.rounds} quiz rounds</span></summary>${explorerControls(catalog, selectionOptions, "game", selection.countries.length)}<p class="selection-note">${h(selection.description)}</p>${gameControls(options)}</details><div class="games-grid">${GAMES.map(
    (game, i) => {
      const possible = eligibleTargets(
        selection.countries,
        { ...options, kind: game.kind },
        at,
      ).length;
      return `<article class="game-card game-${game.kind}"><div class="game-illustration" aria-hidden="true">${game.picture}</div><span class="eyebrow">ADVENTURE ${String(i + 1).padStart(2, "0")}</span><h3>${game.name}</h3><p>${game.description}</p><span class="game-availability">${possible ? `${possible} eligible starting places · answers stay in your set` : game.kind === "pairs" ? `Choose at least ${options.choices + 1} visually distinct flags for this board.` : "This set has no fair questions for this game. Try a broader connection or fewer choices."}</span><button class="button ${i === 0 ? "primary" : ""}" data-game="${game.kind}" ${possible ? "" : "disabled"}>Let’s play ${icon("arrow")}</button></article>`;
    },
  ).join(
    "",
  )}</div><div class="reassurance">${icon("heart")}<div><h3>Try again is part of the adventure.</h3><p>Hints stay available even when hidden at first. Small sets may repeat for practice. Neighbors mean land, not sea; clock distance means UTC offset, not physical distance.</p></div></div></section>`;
}
