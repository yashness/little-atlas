import {
  REGIONS,
  type Country,
  type ExplorerOptions,
  type GameOptions,
} from "../../contracts/atlas";
import { AXES } from "../../library/atlas/selection";
import { escapeHtml as h, optionsHtml } from "../../utils/html";

const field = (
  prefix: string,
  key: string,
  label: string,
  values: readonly { value: string; label: string }[],
  selected: string,
) =>
  `<label class="control-field" for="${prefix}-${key}"><span>${label}</span><select id="${prefix}-${key}" data-setting="${key}" data-owner="${prefix}">${optionsHtml(values, selected)}</select></label>`;
const simple = (values: readonly string[]) =>
  values.map((value) => ({ value, label: value }));
export function explorerControls(
  catalog: readonly Country[],
  options: ExplorerOptions,
  prefix: "learn" | "game",
  count: number,
): string {
  const axis = field(
    prefix,
    "axis",
    "Choose a connection",
    AXES.map((a) => ({ value: a.id, label: `${a.icon}  ${a.title}` })),
    options.axis,
  );
  const region = field(
    prefix,
    "region",
    "Continent / world region",
    [{ value: "all", label: "The whole world" }, ...simple(REGIONS)],
    options.region,
  );
  const countries = [...catalog]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((c) => ({ value: c.code, label: c.name }));
  let extra = "";
  if (["similarity", "neighbors", "clocks"].includes(options.axis))
    extra += field(
      prefix,
      "anchor",
      "Start from this country",
      countries,
      options.anchor,
    );
  if (options.axis === "colors")
    extra += field(
      prefix,
      "color",
      "Follow this color",
      simple([
        "red",
        "blue",
        "green",
        "yellow",
        "white",
        "black",
        "orange",
        "purple",
      ]),
      options.color,
    );
  if (options.axis === "patterns")
    extra += field(
      prefix,
      "feature",
      "Look for this feature",
      [
        { value: "circle", label: "Circles" },
        { value: "stars", label: "Stars" },
        { value: "cross", label: "Crosses" },
        { value: "vertical", label: "Standing stripes" },
        { value: "horizontal", label: "Lying-down stripes" },
        { value: "crescent", label: "Crescent moons" },
        { value: "sun", label: "Suns with rays" },
        { value: "animal", label: "Animals" },
        { value: "text", label: "Writing" },
        { value: "tree", label: "Trees & leaves" },
        { value: "triangle", label: "Triangles" },
      ],
      options.feature,
    );
  if (options.axis === "bands")
    extra += field(
      prefix,
      "bands",
      "Count background bands",
      [
        { value: "2", label: "2 bands" },
        { value: "3", label: "3 bands" },
        { value: "4", label: "4 bands" },
        { value: "5+", label: "5 or more bands" },
      ],
      options.bands,
    );
  if (options.axis === "languages") {
    const languages = new Map(
      catalog.flatMap((c) => c.languages.map((l) => [l.code, l.name] as const)),
    );
    extra += field(
      prefix,
      "language",
      "A listed language",
      [...languages]
        .sort((a, b) => a[1].localeCompare(b[1]))
        .map(([value, label]) => ({ value, label })),
      options.language,
    );
  }
  if (options.axis === "clocks")
    extra += field(
      prefix,
      "clockWindowMinutes",
      "How close are the clocks?",
      [
        { value: "0", label: "Same UTC offset today" },
        { value: "30", label: "Within 30 minutes" },
        { value: "60", label: "Within 1 hour" },
        { value: "120", label: "Within 2 hours" },
        { value: "240", label: "Within 4 hours" },
      ],
      String(options.clockWindowMinutes),
    );
  return `<div class="explorer-controls"><div class="controls-heading"><span class="eyebrow">YOUR ADVENTURE, YOUR WAY</span><span class="pool-count" role="status">${count} ${count === 1 ? "place" : "places"}</span></div><div class="control-grid">${axis}${region}${extra}</div><div class="axis-shortcuts">${[
    ["alphabetical", "A–Z"],
    ["colors", "Colors"],
    ["similarity", "Look-alikes"],
    ["neighbors", "Neighbors"],
    ["clocks", "Clocks"],
  ]
    .map(
      ([id, title]) =>
        `<button class="axis-chip ${options.axis === id ? "active" : ""}" data-axis="${id}" data-owner="${prefix}" aria-pressed="${options.axis === id}">${h(title)}</button>`,
    )
    .join("")}</div></div>`;
}
export function gameControls(
  options: GameOptions & { order: "shuffle" | "journey" },
): string {
  return `<fieldset class="game-settings"><legend>Make it your kind of game</legend><div class="control-grid">${field(
    "game",
    "choices",
    "Choices / challenge",
    [
      { value: "2", label: "Little explorer · 2 choices" },
      { value: "3", label: "Curious explorer · 3 choices" },
      { value: "4", label: "Flag detective · 4 choices" },
    ],
    String(options.choices),
  )}${field(
    "game",
    "rounds",
    "Quiz rounds",
    [
      { value: "3", label: "A tiny trip · 3 rounds" },
      { value: "5", label: "A little adventure · 5 rounds" },
      { value: "10", label: "A world tour · 10 rounds" },
    ],
    String(options.rounds),
  )}${field(
    "game",
    "order",
    "Visit order",
    [
      { value: "shuffle", label: "Surprise me" },
      { value: "journey", label: "Follow my journey order" },
    ],
    options.order,
  )}</div><label class="checkbox-control"><input type="checkbox" id="game-clues" data-setting="clues" data-owner="game" ${options.clues ? "checked" : ""}> Show the helpful clues straight away</label><p class="control-note">Memory pairs use ${options.choices + 1} pairs on one board. Quiz rounds apply to the other games.</p></fieldset>`;
}
