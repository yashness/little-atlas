import type { Country, Region } from "../../contracts/atlas";
import { regionLabel } from "../../library/atlas/geography";
import { escapeHtml as h } from "../../utils/html";
import { flag, icon } from "./art";

export const COLORS: Readonly<Record<string, string>> = {
  red: "#c92f40",
  white: "#fff",
  blue: "#2566a6",
  "light blue": "#8dc8e0",
  green: "#25804d",
  yellow: "#ebc132",
  orange: "#e48a32",
  saffron: "#e89b4b",
  maroon: "#7c2943",
  black: "#243038",
  purple: "#815092",
};
export function regionPills(regions: readonly Region[]): string {
  return regions
    .map((r) => `<span class="region-pill" data-region="${r}">${h(r)}</span>`)
    .join("");
}
export function regionBanner(country: Country): string {
  const label =
    country.regionMode === "spans"
      ? "ONE COUNTRY · TWO WORLD REGIONS"
      : country.regionMode === "convention"
        ? "MAP CONVENTIONS CAN DIFFER"
        : "CONTINENT / WORLD REGION";
  return `<div class="region-banner"><div class="region-banner-title">${icon("globe")} ${label}</div><div class="region-pills">${regionPills(country.regions)}</div>${country.regionMode !== "single" ? `<p>${country.regionMode === "spans" ? "Both are part of its home—not opposing answers." : "Different maps use different groupings. We accept both."}</p>` : country.regions[0] === "Oceania" ? "<p>Oceania includes Australia and many Pacific islands.</p>" : ""}</div>`;
}
export function countryCard(
  country: Country,
  stamps: readonly string[] = [],
  extra = "",
): string {
  return `<button class="country-tile" data-country="${country.code}" aria-label="Explore ${h(country.name)}, ${h(regionLabel(country))}"><img src="${flag(country.code)}" alt="" width="78" height="52" loading="lazy"><span class="flag-name">${h(country.name)}</span><small>${h(regionLabel(country))}${stamps.includes(country.code) ? " · ✓" : ""}</small>${country.scope === "additional" ? "<small>Additional entry</small>" : ""}${extra}</button>`;
}
export function colorTags(country: Country): string {
  return `<div class="color-dots">${country.colors.map((color) => `<span class="color-tag"><i style="background:${COLORS[color] ?? "#777"}"></i>${h(color)}</span>`).join("")}</div>`;
}
export function listenButton(label = "Hear Pip’s clue"): string {
  return `<button class="listen-button" data-action="listen" data-label="${h(label)}" aria-pressed="false">${icon("sound")} <span>${h(label)}</span></button>`;
}
export function actionButton(
  action: string,
  label: string,
  primary = true,
): string {
  return `<button class="button ${primary ? "primary" : "secondary"}" data-action="${action}">${h(label)} ${icon("arrow")}</button>`;
}
export function emptyState(message: string): string {
  return `<div class="empty-note" role="status">${icon("compass")}<p>${h(message)}</p></div>`;
}
