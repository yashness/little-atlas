import type { DialogView } from "../../contracts/ui";
import { TOPICS } from "../../library/atlas/selection";
import { escapeHtml as h } from "../../utils/html";

export function guideView(): DialogView {
  return {
    title: "A little guide for grown-ups",
    eyebrow: "NOTICE. CONNECT. COME BACK.",
    body: `<div class="grownup-body"><h3>One world, many ways in</h3><p>Start with a few familiar flags. Then follow a color, compare look-alikes, cross a land border, share a word, or compare today’s clocks. Use the same country set in different games to practice the connection—not just guess a name.</p><h3>Geography has conventions</h3><p>We explicitly distinguish countries spanning regions from places classified differently by different sources. Türkiye spans Asia and Europe; both are part of its answer. Cyprus and parts of the Caucasus have convention notes. Oceania is a world region that includes Australia and many Pacific islands. Antarctica has no country entries here.</p><p>Continent badges describe core/mainland territories; overseas exceptions are discussed separately. Simplified map outlines and regional shading are guides, not political boundary endorsements. Pins show approximate locations, not capitals.</p><h3>Stories are not memory tricks</h3><p>“Picture a cherry” helps remember Japan’s red disc; it is not the meaning of the flag. Flag explanations cite their sources. Interpretations, legends, and changing flag usage are labeled rather than presented as settled universal facts.</p><h3>People are wonderfully varied</h3><p>Languages are selected listings, not a complete picture of every person. Faith and belief notes are optional source context for grown-ups: they do not label individuals. We omit demographic percentages rather than suggest older estimates describe everyone today.</p><h3>Clocks and borders</h3><p>Clock proximity uses actual IANA UTC offsets at a stated instant, including seasonal changes and quarter-hour offsets. Multi-zone countries can match through any listed zone. It is not physical distance, and the calendar date can differ. Neighbors means listed land borders; disputed and overseas cases have notes.</p><h3>Gentle and private</h3><p>No punitive timer, lives, account, ads, or analytics. Passport stamps and stars stay in this browser. Progress from the original app is preserved. Recorded narration plays locally—no microphone or live AI request. Hints and stop/replay controls stay available.</p><h3>A foundation that can grow</h3><p>Today’s lessons are countries and flags. Future topic areas: ${TOPICS.filter(
      (t) => !t.available,
    )
      .map((t) => h(t.name))
      .join(
        ", ",
      )}. Those future lessons are not available yet; the shared learning foundations are being built so they won’t need separate copies of the app.</p><p class="inline-note">197 entries: 193 UN members, two observers, and clearly labeled Taiwan and Kosovo. Each profile links its factual sources. Main color groups ignore tiny emblem details.</p><p class="inline-note">Credits: mledoze country metadata (ODbL), archived CIA World Factbook and Natural Earth (public domain), IANA time zones, FlagCDN/Flagpedia and Wikimedia flag artwork, and Outfit / DM Sans fonts (SIL OFL). <a href="https://github.com/yashness/little-atlas/blob/main/data/README.md" target="_blank" rel="noopener">Sources, licenses, and data conventions ↗</a></p></div>`,
    actions:
      '<button class="button secondary" data-action="reset-prompt">Start a fresh passport</button><p class="inline-note" id="reset-note">Clears only this browser’s Little Atlas progress.</p>',
  };
}
