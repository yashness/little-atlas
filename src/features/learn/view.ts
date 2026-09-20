import type { Country } from "../../contracts/atlas";
import type { DialogView } from "../../contracts/ui";
import {
  colorTags,
  regionBanner,
  actionButton,
  listenButton,
} from "../../shared/ui/components";
import { flag, icon } from "../../shared/ui/art";
import { worldMap } from "../../shared/ui/map";
import { escapeHtml as h } from "../../utils/html";
import {
  localClock,
  offsetLabel,
  utcOffset,
} from "../../library/atlas/geography";

import type { LessonTab } from "../../contracts/session";
function storyPanel(c: Country): string {
  return `<div class="story-panel"><div class="story-flag"><img src="${flag(c.code)}" alt="Flag of ${h(c.name)}"></div><div><span class="eyebrow">A FLAG IS MORE THAN ITS COLORS</span><h3>The story behind ${h(c.name)}’s flag</h3><p class="story-summary">${h(c.story.summary)}</p><p class="story-note">${h(c.story.note ?? "Historical interpretations can vary.")}</p><details class="source-details"><summary>Read the source explanation</summary><p>${h(c.story.detail).replace(/\n/g, "<br>")}</p></details><a class="source-link" href="${h(c.story.source.url)}" target="_blank" rel="noopener">${h(c.story.source.label)} ↗</a><p class="source-date">${h(c.story.source.snapshot)}</p></div></div>`;
}
function peoplePanel(
  c: Country,
  catalog: readonly Country[],
  at: Date,
): string {
  const borders = c.borderCodes
    .map((code) => catalog.find((item) => item.code === code))
    .filter((item): item is Country => Boolean(item));
  return `<div class="people-panel"><article class="fact-panel"><span class="eyebrow">WORDS WE SHARE</span><h3>Languages you may hear</h3><div class="fact-chips">${c.languages.map((l) => `<button data-language="${h(l.code)}">${h(l.name)} ${icon("arrow")}</button>`).join("")}</div><p>Selected languages listed in the source—not a complete list, and not a claim about every person. Tap one to meet more countries that list it.</p></article><article class="fact-panel"><span class="eyebrow">NEXT-DOOR PLACES</span><h3>Land-border neighbors</h3><div class="fact-chips">${borders.length ? borders.map((b) => `<button data-country="${b.code}"><img src="${flag(b.code)}" alt="">${h(b.name)}</button>`).join("") : "<span>No land-border neighbor in this atlas.</span>"}</div><p>${h(c.borderNote)}</p></article><article class="fact-panel"><span class="eyebrow">SAME PLANET, DIFFERENT CLOCKS</span><h3>Clocks in ${h(c.name)}</h3><div class="clock-list">${c.timeZones
    .slice(0, 4)
    .map((zone) => {
      const offset = utcOffset(zone, at);
      return `<div><b>${h(localClock(zone, at))}</b><span>${h(zone.replaceAll("_", " "))}</span><small>${offset === null ? "Not supported by this device" : offsetLabel(offset)}</small></div>`;
    })
    .join(
      "",
    )}</div>${c.timeZones.length > 4 ? `<details><summary>All ${c.timeZones.length} listed zones</summary><p>${c.timeZones.map(h).join(" · ")}</p></details>` : ""}<p>Snapshot: ${h(at.toLocaleString("en", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }))} UTC. Seasonal clock changes are included; some countries have several zones.</p><button class="text-button" data-clock-country="${c.code}">Find nearby clocks ${icon("arrow")}</button></article><article class="fact-panel"><span class="eyebrow">PEOPLE ARE NOT ALL THE SAME</span><h3>Faith & belief traditions</h3><p>People in one country can follow many traditions—or none. This is context to explore with a grown-up, not a label for a person.</p>${c.beliefs ? `<details><summary>See the source’s community notes</summary><p>${h(c.beliefs.text)}</p><p>${h(c.beliefs.note)}</p><a class="source-link" href="${h(c.beliefs.source.url)}" target="_blank" rel="noopener">Read the archived source ↗</a><p class="source-date">${h(c.beliefs.source.snapshot)}</p></details>` : "<p>We have not added a verified country-wide source note here yet, rather than guess.</p>"}</article></div><div class="profile-sources"><b>Where these facts come from</b>${c.sources.map((source) => `<a href="${h(source.url)}" target="_blank" rel="noopener">${h(source.label)} ↗</a>`).join("")}<p>Flag history, map conventions, language listings and demographic snapshots are different kinds of evidence. Estimates can be older than the source snapshot.</p></div>`;
}
export function lessonView(
  c: Country,
  catalog: readonly Country[],
  tab: LessonTab,
  at: Date,
  {
    position = 0,
    total = 1,
    game = false,
  }: { position?: number; total?: number; game?: boolean } = {},
): DialogView {
  const look = `<div class="lesson-grid"><div><div class="flag-theater"><img src="${flag(c.code)}" alt="Flag of ${h(c.name)}"></div><h3 class="look-title">${h(c.visualTitle)}</h3><span class="memory-label">A LITTLE MEMORY TRICK · NOT FLAG HISTORY</span><p class="memory">${h(c.mnemonic)}</p>${colorTags(c)}</div><div><div class="lesson-map"><p>HERE’S ITS HOME</p>${worldMap({ selected: c, regions: c.regions })}</div><div class="location-fact"><h3>Let’s find ${h(c.name)}.</h3><p>${h(c.geography)}</p>${c.scope === "additional" ? '<p class="source-date">Additional entry · not a UN member/observer state</p>' : ""}<button class="text-button" data-lesson-tab="story">What does the flag mean? ${icon("arrow")}</button></div></div></div>`;
  return {
    title: `Hello, ${c.name}!`,
    eyebrow: game
      ? "A LITTLE MAP LESSON BEFORE WE PLAY"
      : total > 1
        ? `STOP ${position + 1} OF ${total} · YOUR LEARNING PATH`
        : "A NEW LITTLE FRIEND",
    step: 0,
    body: `${regionBanner(c)}<div class="lesson-tabs" role="tablist" aria-label="Explore this country">${(["look", "story", "people"] as const).map((id, i) => `<button id="tab-${id}" role="tab" aria-selected="${tab === id}" aria-controls="lesson-panel" data-lesson-tab="${id}">${["Look & remember", "Flag story", "People & places"][i]}</button>`).join("")}</div><div id="lesson-panel" role="tabpanel" aria-labelledby="tab-${tab}">${tab === "look" ? look : tab === "story" ? storyPanel(c) : peoplePanel(c, catalog, at)}</div>`,
    actions: `${listenButton(tab === "story" ? "Hear the flag story" : "Hear Pip’s introduction")}<div class="lesson-actions">${!game && total > 1 ? actionButton("browse-next", "Next stop", false) : ""}${actionButton("practice", game ? "Find its home" : "Try this flag")}</div>`,
  };
}
