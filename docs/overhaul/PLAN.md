# Little Atlas 1.1 — learn through connections

## Goals
1. Geography/data audit first: a canonical multi-region model, no contradictory quiz choices, explicit conventions and source provenance.
2. Larger readable type and an unmistakable continent/world-region banner in every country lesson and result.
3. Configurable journeys: A–Z, continent, colors, patterns/band counts, visual similarity, land neighbors, shared languages, nearby UTC offsets, and unvisited places.
4. Configurable, varied games: flag detective, shape safari, continent explorer, neighbor hop, clock buddies, and matching pairs. Respect the selected country pool and difficulty; handle small/empty pools honestly.
5. Rich country profiles: sourced flag explanation separate from invented mnemonic, listed languages, land-border neighbors, time zones, and carefully framed belief-tradition source notes. Keep the first child-facing screen simple; deeper material is opt-in.
6. An extensible topic/axis registry for later rivers, deserts, forests, wonders and places; do not pretend those future lessons exist now.

## Data policy
- Sources are locally snapshotted and attributed, with retrieval/version provenance.
- Use multi-region membership for clearly transcontinental cases; do not imply that political membership is physical geography.
- Oceania is explicitly a world region, not a seventh inhabited continent; Antarctica has no country entries here.
- Border lists are land-border connections, not claims that maritime neighbors touch. Disputed/overseas boundaries are disclosed and not used as ambiguous wrong answers.
- Language listings are not an assertion that every resident speaks only those languages.
- Beliefs are plural, optional context, never a stereotype or a quiz about an individual's identity. Avoid presenting undated percentages as current.
- Time-zone proximity is based on current IANA UTC offsets, including DST, not longitude. Multi-zone countries can match through any listed zone. Explain the reference clock and date.
- Existing recorded audio must match displayed geographic claims; regenerate affected clips. No browser-TTS fallback.

## Work mode and release
Serial work: no worktrees or other agent delegation. The public repository is https://github.com/yashness/little-atlas; commit d5ba037 preserves the working 1.0 release. Develop the typed foundations and feature upgrade on `feat/learning-connections`, then verify and merge to main without a PR. Existing dev URL: http://little-atlas.localhost:1355. Existing production: https://little-atlas-9da.pages.dev/.

Preserve version 1.0.0 and existing local progress. Release only after local and preview validation; then verify production and capture desktop/mobile proof. Existing production deployment bf72b20a is the rollback baseline.
