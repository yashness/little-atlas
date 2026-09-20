import {
  REGIONS,
  type Axis,
  type ExplorerOptions,
  type Feature,
  type GameKind,
  type GameOptions,
  type Country,
} from "./contracts/atlas";
import {
  LESSON_TABS,
  type Session,
  type RoundSession,
  type LessonTab,
  type AnswerState,
} from "./contracts/session";
import { COUNTRIES, BY_CODE, country } from "./platform/catalog";
import { loadProgress, saveProgress } from "./platform/browser/progress";
import { createNarrator } from "./platform/browser/audio";
import { showDialog } from "./platform/browser/dialog";
import {
  DEFAULT_EXPLORER,
  AXES,
  selectCountries,
} from "./library/atlas/selection";
import { eligibleTargets, makeQuestion } from "./library/atlas/questions";
import { countryCue, questionCues } from "./library/atlas/narration";
import { createBoard, resetTurn, turnCard } from "./library/atlas/memory";
import { shuffled } from "./utils/collections";
import { element, escapeHtml } from "./utils/html";
import { icon } from "./shared/ui/art";
import { emptyState } from "./shared/ui/components";
import { home } from "./features/explore/home";
import { explorerPage } from "./features/explore/page";
import { gamesPage } from "./features/games/page";
import {
  questionView,
  memoryView,
  completionView,
} from "./features/games/views";
import { lessonView } from "./features/learn/view";
import { guideView } from "./features/learn/guide";
import { passportPage } from "./features/passport/page";

type Page = "explore" | "world" | "games" | "passport";
let page: Page = "explore";
let sound = false;
let active: Session | null = null;
let learn: ExplorerOptions = { ...DEFAULT_EXPLORER };
let gameSelection: ExplorerOptions = {
  ...DEFAULT_EXPLORER,
  axis: "first-steps",
};
let game: GameOptions = {
  kind: "flags",
  rounds: 5,
  choices: 2,
  clues: true,
  order: "shuffle",
};
let progress = loadProgress(new Set(BY_CODE.keys()));
const freshAnswer = (): AnswerState => ({
  selected: null,
  answered: false,
  attempted: false,
});
const dialog = element<HTMLDialogElement>("#adventure");
const announce = (text: string) => {
  element("#announcement").textContent = text;
};
const narrator = createNarrator((playing, channel) => {
  document
    .querySelectorAll<HTMLButtonElement>('[data-action="listen"]')
    .forEach((button) => {
      const selected =
        playing && (button.dataset["cue"] ?? "session") === channel;
      button.setAttribute("aria-pressed", String(selected));
      const label = button.dataset["label"] ?? "Hear Pip’s clue";
      button.innerHTML =
        icon("sound") +
        `<span>${escapeHtml(selected ? "Pip is speaking · Stop" : label)}</span>`;
    });
}, announce);
function counters(): void {
  element("#star-count").textContent = String(progress.stars);
  element("#stamp-count").textContent = String(progress.stamps.length);
}
function persist(): void {
  if (!saveProgress(progress))
    announce(
      "Progress works for this visit, but this browser could not save it.",
    );
  counters();
}
function close(): void {
  narrator.stop();
  active = null;
  dialog.close();
}
function selected(options: ExplorerOptions, at = new Date()): Country[] {
  return selectCountries(COUNTRIES, options, progress.stamps, at).countries;
}

/** Composition only: country rules live in the library; side effects in adapters. */
function renderPage(): void {
  const focused =
    document.activeElement instanceof HTMLElement
      ? document.activeElement.id
      : "";
  const selection =
    document.activeElement instanceof HTMLInputElement
      ? document.activeElement.selectionStart
      : null;
  element("#main").innerHTML =
    page === "explore"
      ? home(progress.stamps)
      : page === "world"
        ? explorerPage(COUNTRIES, learn, progress, new Date())
        : page === "games"
          ? gamesPage(
              COUNTRIES,
              gameSelection,
              game,
              progress,
              new Date(),
              document.querySelector<HTMLDetailsElement>(".game-configuration")
                ?.open ?? false,
            )
          : passportPage(COUNTRIES, progress);
  if (focused) {
    const replacement = document.getElementById(focused);
    replacement?.focus({ preventScroll: true });
    if (
      selection !== null &&
      replacement instanceof HTMLInputElement &&
      replacement.type === "search"
    )
      replacement.setSelectionRange(selection, selection);
  }
  document.querySelectorAll<HTMLAnchorElement>(".nav-link").forEach((link) => {
    const current =
      link.dataset["page"] === page ||
      (page === "world" && link.dataset["page"] === "explore");
    link.classList.toggle("active", current);
    if (current) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  counters();
}
function route(): void {
  if (dialog.open) close();
  const name = location.hash.slice(1);
  page =
    name === "games" || name === "passport" || name === "world"
      ? name
      : "explore";
  renderPage();
  window.scrollTo(0, 0);
}
function goWorld(options: Partial<ExplorerOptions>): void {
  learn = { ...DEFAULT_EXPLORER, ...options };
  if (dialog.open) close();
  if (location.hash === "#world") {
    page = "world";
    renderPage();
  } else location.hash = "world";
}
function activeCues(hint = false): string[] {
  if (!active || active.type === "guide") return [];
  if (active.type === "memory")
    return [active.complete ? "complete-game" : "game-pairs"];
  if (active.stage === "complete")
    return [active.type === "visit" ? "stamp" : "complete-game"];
  const c = active.countries[active.index]!;
  if (active.stage === "learn") return [countryCue(c, "learn")];
  return active.question
    ? questionCues(
        active.question,
        country(active.question.targetCode),
        hint || active.options.clues || active.answer.attempted,
      )
    : [];
}
function playActive(force = false): void {
  if (sound || force) narrator.play(activeCues(force));
}
function renderSession(narrate = false): void {
  if (!active) return;
  narrator.stop();
  if (active.type === "guide") {
    showDialog(guideView());
    return;
  }
  if (active.type === "memory") {
    showDialog(
      active.complete
        ? completionView(active.countries, false)
        : memoryView(active.board, COUNTRIES, active.feedback),
    );
    if (narrate) playActive();
    return;
  }
  const s = active,
    c = s.countries[s.index]!;
  if (s.stage === "complete")
    showDialog(
      completionView(
        s.type === "visit" ? [c] : s.countries,
        s.type === "visit",
      ),
    );
  else if (s.stage === "learn")
    showDialog(
      lessonView(c, COUNTRIES, s.tab, s.at, {
        position: s.index,
        total: s.countries.length,
        game: s.type === "quiz",
      }),
    );
  else {
    if (!s.question) {
      const options =
        s.type === "visit"
          ? {
              ...s.options,
              kind: s.step === 1 ? ("flags" as const) : ("places" as const),
            }
          : s.options;
      const result = makeQuestion(c, s.pool, options, s.at);
      if (!result.ok) {
        showDialog({
          title: "Try another little connection",
          eyebrow: "NO GUESSING GAMES HERE",
          body: emptyState(result.reason),
          actions:
            '<button class="button secondary" data-action="close">Choose another set</button>',
        });
        return;
      }
      s.question = result.question;
    }
    showDialog(
      questionView(s.question, COUNTRIES, s.options, s.answer, {
        index: s.index,
        total: s.countries.length,
        visit: s.type === "visit",
        stage: s.step,
      }),
    );
  }
  if (narrate) playActive();
}
function startCountry(code: string, queue: Country[] = selected(learn)): void {
  const c = country(code);
  if (!queue.some((item) => item.code === code)) queue = [c];
  active = {
    type: "visit",
    countries: queue,
    pool: COUNTRIES,
    index: queue.findIndex((item) => item.code === code),
    stage: "learn",
    tab: "look",
    step: 1,
    question: null,
    answer: freshAnswer(),
    options: { ...game, kind: "flags", choices: 2, clues: true },
    at: new Date(),
  };
  renderSession(true);
}
function startGame(kind: GameKind): void {
  game = { ...game, kind };
  const at = new Date(),
    pool = selected(gameSelection, at),
    eligible = eligibleTargets(pool, game, at);
  if (!eligible.length) {
    announce("No fair questions match these settings. Choose a broader set.");
    return;
  }
  const ordered = game.order === "shuffle" ? shuffled(eligible) : eligible;
  if (kind === "pairs") {
    const countries = ordered.slice(0, game.choices + 1);
    active = {
      type: "memory",
      countries,
      board: createBoard(countries.map((c) => c.code)),
      feedback: "Turn over two postcards. Take your time.",
      complete: false,
    };
  } else {
    active = {
      type: "quiz",
      countries: Array.from(
        { length: game.rounds },
        (_, i) => ordered[i % ordered.length]!,
      ),
      pool,
      index: 0,
      stage: kind === "places" ? "learn" : "question",
      tab: "look",
      step: 1,
      question: null,
      answer: freshAnswer(),
      options: { ...game },
      at,
    };
  }
  renderSession(true);
}
function answer(index: number): void {
  if (
    !active ||
    active.type === "guide" ||
    active.type === "memory" ||
    active.stage !== "question" ||
    !active.question ||
    active.answer.answered
  )
    return;
  const choice = active.question.choices[index];
  if (!choice) return;
  active.answer = {
    selected: index,
    attempted: true,
    answered: choice.correct,
  };
  if (choice.correct) {
    progress.stars++;
    persist();
  }
  renderSession();
  if (choice.correct) {
    element("#next").focus({ preventScroll: true });
    if (sound) narrator.play(["found"]);
  } else {
    document
      .querySelector<HTMLButtonElement>(`[data-answer="${index}"]`)
      ?.focus({ preventScroll: true });
    if (sound) narrator.play(["retry", ...activeCues(true)]);
  }
}
function advance(s: RoundSession): void {
  if (!s.answer.answered) return;
  if (s.type === "visit") {
    if (s.step === 1) {
      s.step = 2;
      s.stage = "question";
      s.question = null;
      s.answer = freshAnswer();
    } else {
      s.stage = "complete";
      const code = s.countries[s.index]!.code;
      if (!progress.stamps.includes(code)) progress.stamps.push(code);
      persist();
    }
  } else if (s.index + 1 === s.countries.length) s.stage = "complete";
  else {
    s.index++;
    s.stage = s.options.kind === "places" ? "learn" : "question";
    s.question = null;
    s.answer = freshAnswer();
    s.tab = "look";
  }
  renderSession(true);
}
function chooseAxis(owner: "learn" | "game", axis: Axis): void {
  const previous = owner === "learn" ? learn : gameSelection;
  const next: ExplorerOptions = {
    ...DEFAULT_EXPLORER,
    axis,
    region: previous.region,
    anchor: axis === "similarity" ? "fr" : axis === "neighbors" ? "tr" : "in",
    color: axis === "colors" ? "red" : "all",
    feature: axis === "patterns" ? "stars" : "all",
    bands: axis === "bands" ? "3" : "all",
    language: axis === "languages" ? "eng" : "all",
  };
  if (owner === "learn") learn = next;
  else gameSelection = next;
  renderPage();
}
function updateSetting(control: HTMLSelectElement | HTMLInputElement): void {
  const key = control.dataset["setting"],
    owner = control.dataset["owner"];
  if (owner !== "learn" && owner !== "game") return;
  if (key === "axis" && AXES.some((a) => a.id === control.value)) {
    chooseAxis(owner, control.value as Axis);
    return;
  }
  const options = owner === "learn" ? learn : gameSelection;
  switch (key) {
    case "region":
      if (control.value === "all" || REGIONS.some((r) => r === control.value))
        options.region = control.value as ExplorerOptions["region"];
      break;
    case "anchor":
      if (BY_CODE.has(control.value)) options.anchor = control.value;
      break;
    case "color":
      options.color = control.value;
      break;
    case "feature":
      options.feature = control.value as Feature;
      break;
    case "bands":
      options.bands = control.value;
      break;
    case "language":
      options.language = control.value;
      break;
    case "clockWindowMinutes":
      if ([0, 30, 60, 120, 240].includes(Number(control.value)))
        options.clockWindowMinutes = Number(control.value);
      break;
    case "choices":
      if ([2, 3, 4].includes(Number(control.value)))
        game.choices = Number(control.value) as 2 | 3 | 4;
      break;
    case "rounds":
      if ([3, 5, 10].includes(Number(control.value)))
        game.rounds = Number(control.value);
      break;
    case "order":
      if (control.value === "shuffle" || control.value === "journey")
        game.order = control.value;
      break;
    case "clues":
      if (control instanceof HTMLInputElement) game.clues = control.checked;
      break;
  }
  renderPage();
}
function setTab(tab: LessonTab): void {
  if (
    active &&
    (active.type === "visit" || active.type === "quiz") &&
    active.stage === "learn"
  ) {
    active.tab = tab;
    renderSession();
    element(`#tab-${tab}`).focus({ preventScroll: true });
  }
}

document.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest<HTMLElement>(
    "[data-country],[data-game],[data-action],[data-answer],[data-card],[data-axis],[data-lesson-tab],[data-language],[data-clock-country]",
  );
  if (!button) return;
  const data = button.dataset;
  if (data["country"] && BY_CODE.has(data["country"])) {
    startCountry(data["country"]);
    return;
  }
  if (data["game"]) {
    startGame(data["game"] as GameKind);
    return;
  }
  if (data["answer"] !== undefined) {
    answer(Number(data["answer"]));
    return;
  }
  if (data["axis"]) {
    chooseAxis(
      data["owner"] === "game" ? "game" : "learn",
      data["axis"] as Axis,
    );
    return;
  }
  if (data["lessonTab"]) {
    setTab(data["lessonTab"] as LessonTab);
    return;
  }
  if (data["language"]) {
    goWorld({ axis: "languages", language: data["language"] });
    return;
  }
  if (data["clockCountry"]) {
    goWorld({ axis: "clocks", anchor: data["clockCountry"] });
    return;
  }
  if (data["card"] !== undefined && active?.type === "memory") {
    const index = Number(data["card"]),
      result = turnCard(active.board, index);
    active.board = result.board;
    if (result.matchedCode) {
      const c = country(result.matchedCode);
      active.feedback = `A pair! Hello, ${c.name}!`;
      progress.stars++;
      persist();
    } else
      active.feedback =
        active.board.faceUp.length === 2
          ? "Two different postcards. Take a look, then turn them back."
          : "Who has the matching flag?";
    renderSession();
    const focus =
      active.board.matched.length === active.board.cards.length
        ? '[data-action="finish-memory"]'
        : active.board.faceUp.length === 2
          ? '[data-action="turn-back"]'
          : `[data-card="${index}"]:not(:disabled)`;
    document
      .querySelector<HTMLButtonElement>(focus)
      ?.focus({ preventScroll: true });
    if (result.matchedCode && sound) narrator.play(["found"]);
    return;
  }
  switch (data["action"]) {
    case "close":
      close();
      break;
    case "start":
      startCountry(
        COUNTRIES.find((c) => !progress.stamps.includes(c.code))?.code ?? "jp",
        COUNTRIES,
      );
      break;
    case "start-journey": {
      const queue = selected(learn);
      if (queue[0]) startCountry(queue[0].code, queue);
      break;
    }
    case "shapes":
      goWorld({ axis: "patterns", feature: "circle" });
      break;
    case "stripes":
      goWorld({ axis: "patterns", feature: "vertical" });
      break;
    case "twins":
      goWorld({ axis: "similarity", anchor: "fr" });
      break;
    case "listen": {
      const cue = data["cue"];
      if (narrator.isPlaying(cue ?? "session")) narrator.stop();
      else if (cue) narrator.play([cue], cue);
      else playActive(true);
      break;
    }
    case "practice":
      if (active && (active.type === "visit" || active.type === "quiz")) {
        active.stage = "question";
        active.question = null;
        active.answer = freshAnswer();
        renderSession(true);
      }
      break;
    case "next":
      if (active && (active.type === "visit" || active.type === "quiz"))
        advance(active);
      break;
    case "browse-next":
      if (active?.type === "visit") {
        const queue = active.countries;
        if (queue.length === 1) goWorld({ axis: "alphabetical" });
        else
          startCountry(queue[(active.index + 1) % queue.length]!.code, queue);
      }
      break;
    case "turn-back":
      if (active?.type === "memory") {
        active.board = resetTurn(active.board);
        active.feedback = "A fresh little try. What do you remember?";
        renderSession();
      }
      break;
    case "finish-memory":
      if (
        active?.type === "memory" &&
        active.board.matched.length === active.board.cards.length
      ) {
        active.complete = true;
        renderSession(true);
      }
      break;
    case "replay":
      startGame(game.kind);
      break;
    case "passport":
      close();
      if (location.hash === "#passport") {
        page = "passport";
        renderPage();
      } else location.hash = "passport";
      break;
    case "reset-prompt":
      button.textContent = "Yes, clear my stamps and stars";
      button.dataset["action"] = "reset-confirm";
      element("#reset-note").textContent =
        "This cannot be undone. Close this window to keep your passport.";
      break;
    case "reset-confirm":
      progress = { stars: 0, stamps: [] };
      persist();
      button.textContent = "Fresh passport, ready to explore!";
      if (button instanceof HTMLButtonElement) button.disabled = true;
      break;
  }
});
document.addEventListener("change", (event) => {
  if (
    event.target instanceof HTMLSelectElement ||
    event.target instanceof HTMLInputElement
  )
    updateSetting(event.target);
});
document.addEventListener("input", (event) => {
  if (
    event.target instanceof HTMLInputElement &&
    event.target.id === "country-search"
  ) {
    learn.search = event.target.value;
    renderPage();
  }
});
document.addEventListener("keydown", (event) => {
  if (!(event.target instanceof Element)) return;
  const pin = event.target.closest<SVGElement>("g[data-country]");
  if (pin && (event.key === "Enter" || event.key === " ")) {
    event.preventDefault();
    const code = pin.dataset["country"];
    if (code) startCountry(code);
  }
  const tab = event.target.closest('[role="tab"]');
  if (
    tab &&
    ["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key) &&
    active &&
    (active.type === "visit" || active.type === "quiz")
  ) {
    event.preventDefault();
    const i = LESSON_TABS.indexOf(active.tab);
    setTab(
      LESSON_TABS[
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? LESSON_TABS.length - 1
            : (i + (event.key === "ArrowRight" ? 1 : LESSON_TABS.length - 1)) %
              LESSON_TABS.length
      ]!,
    );
  }
});
element("#sound").addEventListener("click", () => {
  sound = !sound;
  element("#sound").setAttribute("aria-pressed", String(sound));
  element("#sound").setAttribute(
    "aria-label",
    `Turn spoken guidance ${sound ? "off" : "on"}`,
  );
  element("#sound-label").textContent = sound ? "Sound on" : "Sound off";
  if (sound) narrator.play(["welcome"]);
  else narrator.stop();
});
element("#grownups").addEventListener("click", () => {
  active = { type: "guide" };
  renderSession();
});
dialog.addEventListener("cancel", () => narrator.stop());
dialog.addEventListener("close", () => {
  if (!dialog.open) {
    narrator.stop();
    active = null;
    renderPage();
  }
});
window.addEventListener("hashchange", route);
document.querySelectorAll<HTMLElement>("[data-icon]").forEach((node) => {
  node.innerHTML = icon(node.dataset["icon"] ?? "spark");
});
route();
