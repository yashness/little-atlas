import outlines from "../../../data/continent-outlines.json";
import WORLD from "../../../data/world-map.json";
import type { Country, Region } from "../../contracts/atlas";
import { flag } from "./art";
import { escapeHtml as h } from "../../utils/html";

const project = ([lon, lat]: readonly number[]) => [
  (Number(lon) + 180) * 2.5,
  (85 - Number(lat)) * 2.8,
];
export function worldMap({
  selected,
  pins = [],
  regions = [],
  labels = true,
  interactive = false,
}: {
  selected?: Country;
  pins?: readonly Country[];
  regions?: readonly Region[];
  labels?: boolean;
  interactive?: boolean;
} = {}): string {
  const land = WORLD.map((p) => `<path class="land" d="${p.d}"/>`).join("");
  const highlights = regions
    .map((region) =>
      region === "Oceania"
        ? WORLD.filter((p) => p.continent === "Oceania")
            .map((p) => `<path class="continent-active" d="${p.d}"/>`)
            .join("")
        : `<path class="continent-active" d="${outlines[region]}"/>`,
    )
    .join("");
  const chosen = selected
    ? WORLD.filter((p) => p.id === selected.mapId)
        .map((p) => `<path class="highlight" d="${p.d}"/>`)
        .join("")
    : "";
  const names: [string, number, number][] = [
    ["NORTH AMERICA", -106, 42],
    ["SOUTH AMERICA", -62, -13],
    ["EUROPE", 18, 62],
    ["AFRICA", 20, 10],
    ["ASIA", 88, 50],
    ["OCEANIA", 145, -44],
  ];
  const text = labels
    ? names
        .map(([name, lon, lat]) => {
          const [x, y] = project([lon, lat]);
          return `<text class="map-label" text-anchor="middle" x="${x}" y="${y}">${name}</text>`;
        })
        .join("")
    : "";
  const markers = (selected ? [selected] : pins)
    .map((c) => {
      const [x, y] = project(c.coordinates);
      return `<g class="pin" transform="translate(${x},${y})" ${interactive ? `role="button" tabindex="0" aria-label="Explore ${h(c.name)}" data-country="${c.code}"` : ""}>${interactive ? '<rect x="-70" y="-98" width="140" height="140" fill="transparent"/>' : ""}<circle r="10" fill="#ef8c5c" opacity=".3"/><circle r="4" fill="#e3653a" stroke="#fff" stroke-width="2"/><path d="M0 -4v-16" stroke="#536864" stroke-width="2"/><rect class="pin-card" x="-25" y="-56" width="50" height="36" rx="5"/><image href="${flag(c.code)}" x="-20" y="-52" width="40" height="27" preserveAspectRatio="xMidYMid meet"/></g>`;
    })
    .join("");
  return `<svg class="world-map" viewBox="0 0 900 415" role="${interactive ? "group" : "img"}" aria-label="${h(selected ? `${selected.name} highlighted on a world map` : regions.length ? `${regions.join(" and ")} highlighted as geographic guides` : "World map. Choose a country flag to explore.")}">${land}${highlights}${chosen}${text}${markers}</svg>`;
}
