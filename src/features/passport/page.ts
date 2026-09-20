import type { Country, Progress } from "../../contracts/atlas";
import { flag, icon } from "../../shared/ui/art";
import { escapeHtml as h } from "../../utils/html";
import { regionLabel } from "../../library/atlas/geography";

export function passportPage(
  catalog: readonly Country[],
  progress: Progress,
): string {
  const earned = new Set(progress.stamps);
  return `<section class="page-enter"><div class="page-intro"><div class="eyebrow">YOUR LITTLE BOOK OF BIG DISCOVERIES</div><h1>Oh, the places you know!</h1><p>${earned.size ? `You’ve met ${earned.size} of ${catalog.length} places. Each stamp remembers a flag and a home you’ve practiced.` : "Your first adventure is waiting. Meet a country, find its flag and its home, and collect a happy little stamp."}</p><div class="passport-progress" role="progressbar" aria-label="Countries visited" aria-valuenow="${earned.size}" aria-valuemin="0" aria-valuemax="${catalog.length}"><span style="width:${(earned.size / catalog.length) * 100}%"></span></div><p class="inline-note">${earned.size} / ${catalog.length} places · Saved on this browser</p><a class="text-button" href="#world">Choose a new learning path ${icon("arrow")}</a></div><div class="passport-grid">${catalog.map((c) => `<button class="stamp ${earned.has(c.code) ? "earned" : ""}" data-country="${c.code}" aria-label="${earned.has(c.code) ? "Revisit" : "Explore"} ${h(c.name)}">${earned.has(c.code) ? `<img src="${flag(c.code)}" alt="">` : '<span aria-hidden="true">✧</span>'}<b>${h(c.name)}</b><small>${c.scope === "additional" ? "ADDITIONAL ENTRY" : earned.has(c.code) ? h(regionLabel(c)) : "LET’S MEET"}</small></button>`).join("")}</div><div class="reassurance">${icon("spark")}<div><h3>A few little visits make a big memory.</h3><p>Tap a stamp to revisit its story. Stamps record practice—not a claim that someone has mastered a whole country.</p></div></div></section>`;
}
