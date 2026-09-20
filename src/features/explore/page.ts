import type { Country, ExplorerOptions, Progress } from "../../contracts/atlas";
import { countryCard, emptyState } from "../../shared/ui/components";
import { explorerControls } from "../../shared/ui/explorer-controls";
import { worldMap } from "../../shared/ui/map";
import { icon, flag } from "../../shared/ui/art";
import { escapeHtml as h } from "../../utils/html";
import { selectCountries } from "../../library/atlas/selection";
import { offsets, offsetLabel } from "../../library/atlas/geography";

export function explorerPage(
  catalog: readonly Country[],
  options: ExplorerOptions,
  progress: Progress,
  at: Date,
): string {
  const selection = selectCountries(catalog, options, progress.stamps, at);
  const reference = ["similarity", "neighbors", "clocks"].includes(options.axis)
    ? catalog.find((c) => c.code === options.anchor)
    : undefined;
  const anchor = reference
    ? `<aside class="reference-country"><img src="${flag(reference.code)}" alt="Flag of ${h(reference.name)}"><div><span class="eyebrow">YOUR REFERENCE COUNTRY</span><h3>${h(reference.name)}</h3><p>${h(options.axis === "similarity" ? reference.clue : reference.regions.join(" & "))}</p></div></aside>`
    : "";
  const result = selection.countries.length
    ? selection.countries
        .map((c) =>
          countryCard(
            c,
            progress.stamps,
            options.axis === "clocks"
              ? `<span class="clock-tag">${h(offsets(c, at).map(offsetLabel).join(" · "))}</span>`
              : "",
          ),
        )
        .join("")
    : emptyState(selection.emptyReason);
  return `<section class="page-enter"><div class="page-intro"><div class="eyebrow">ONE WORLD. MANY WAYS TO REMEMBER.</div><h1>Find your kind of adventure.</h1><p>Go A–Z, follow a color, meet a neighbor, or travel between clocks. Learning sticks when things connect.</p></div>${explorerControls(catalog, options, "learn", selection.countries.length)}<div class="journey-launch"><div><h2>${selection.countries.length} little discoveries</h2><p id="selection-description">${h(selection.description)}</p></div><button class="button primary" data-action="start-journey" ${selection.countries.length ? "" : "disabled"}>Start this journey ${icon("arrow")}</button></div>${anchor}<div class="atlas-search"><label for="country-search">Find a country</label><input type="search" id="country-search" name="country" placeholder="Try Türkiye, Turkey, or Japan…" value="${h(options.search)}" autocomplete="off"></div><details class="world-peek"><summary>${icon("globe")} Peek at the whole world</summary><div class="atlas-layout">${worldMap({ pins: catalog.filter((c) => ["ca", "br", "fr", "ke", "jp", "au"].includes(c.code)), interactive: true })}<p class="atlas-hint">North is up. Blue is ocean. Pins are approximate locations, not capitals; region shading is a geographic guide.</p></div></details><div id="atlas-results" class="atlas-grid">${result}</div><p class="atlas-scope">197 entries: 193 UN members, 2 observer states, plus clearly labeled Taiwan and Kosovo. Main color families exclude tiny emblem details; language lists are not exhaustive.</p></section>`;
}
