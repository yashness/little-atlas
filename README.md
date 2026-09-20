# Little Atlas

A warm, colorful first adventure into country flags and geography, designed for children around ages 3–6 exploring with a grown-up.

**Live site: https://little-atlas-9da.pages.dev/**

## Open it

**No setup:** open `index.html` in a browser. Keep `app.js`, `styles.css`, and `assets/` beside it. Images, map outlines, fonts, and Pip’s narration are all local; the file-based experience works without a network connection.

**Local development:**

```sh
npm install
npm run dev
# http://little-atlas.localhost:1355
```

Portless is a development-only dependency and recommends Node 24+. This project uses the unprivileged HTTP proxy on port 1355, so it does not require sudo or certificate installation. Python 3.9+ is needed for the development server.

Without Portless or Node:

```sh
python3 serve.py
# http://127.0.0.1:8080
```

The development server serves only the site’s public files, never `.env.local`, source scripts, or project configuration.

## The experience

- **One-tap start:** a big orange button starts the first unvisited country.
- **Look → remember → locate:** see the flag, learn a visual memory clue, and find its home on a real map. Then choose between two flags and two world regions.
- **Pip’s voice:** warm, pre-generated Olivia narration from Azure MAI-Voice-2. Clue buttons play with sound off; sound on enables automatic narration. Tap the clue button again to stop. New clips interrupt old clips rather than overlap.
- **Three five-round games:** flag recognition, visual patterns, and geographic location.
- **A complete visual atlas:** 197 entries: all 193 UN members, the two observer states (Palestine and the Holy See, represented by Vatican City), plus clearly labeled Taiwan and Kosovo entries. Search by name and filter by shapes, stripes, or region. Features overlap: a flag can contain both stars and stripes.
- **A passport:** each completed country visit earns a stamp. Stamps and stars persist in local storage; the app still plays if storage is blocked.
- **Gentle feedback:** no clocks, lost lives, automatic question transitions, or penalties for trying again.
- **Accessible controls:** keyboard-usable map pins, native dialogs, visible keyboard focus on controls, live feedback, and reduced-motion support. Programmatic focus on noninteractive page containers does not create a full-page outline.

## Scope and geography

The first 24 countries form a carefully sized **introductory journey**; the complete atlas has **197 learnable entries**, each with visual memory clues, a map pin, recorded narration, a flag quiz, a location quiz, and a passport stamp. Dependent territories are not counted as separate countries. Taiwan and Kosovo are explicitly marked as additional entries rather than UN member/observer states.

Oceania is described as a geographic region; Antarctica is not shown because it has no sovereign countries. Lessons explain transcontinental cases, and location quizzes avoid ambiguous regional distractors. Syria’s current green-white-black, three-red-star flag is used. Afghanistan uses the white flag of the de facto authorities; that choice is explained in the grown-up guide.

Natural Earth’s 1:110m country boundaries are simplified and illustrative. The equirectangular projection helps locate places but distorts area; pins indicate approximate country locations, not capitals. Tiny islands may be absent at this resolution. Flags keep their original proportions, including Switzerland’s square and Nepal’s nonrectangular shape.

## Publish to Cloudflare Pages

```sh
npm run build   # creates an allowlisted dist/ directory
npm run deploy  # requires authenticated Wrangler; project: little-atlas
```

Upload **only `dist/`**, never the checkout. The build excludes `.env.local`, tests, development tooling, and narration-generation metadata. Cloudflare assigns this project the domain `little-atlas-9da.pages.dev`. See `DEPLOYMENT.md` for release evidence and verification commands.

## Test

```sh
npx playwright install chromium
npm test
```

The suite checks all **197 learning journeys**, coverage counts, all game modes, retries, saved progress, visual-feature distractors, filters, keyboard interaction, mobile/tablet/desktop layouts, offline file opening, recorded-audio playback and cancellation, focus styling, and private-file protection.

For a machine where standalone Chromium cannot launch, connect to an **existing test browser** using its local CDP endpoint:

```sh
ATLAS_CDP=http://127.0.0.1:9223 npm test
```

Tests create their own isolated browser contexts; they do not intentionally navigate existing tabs. Generated screenshots and the test report are in `evidence/`.

## Regenerate the voice

```sh
node scripts/generate-audio.cjs
```

Requires `~/bin/tts.py` and its configured Azure credentials. Generation uses `en-US-Olivia:MAI-Voice-2`, `--rate=-8%`, and `mp3-hq`. It caches unchanged recordings, retries transient service failures, and writes `assets/audio-manifest.js`. Extended-country games reuse country stories and six region recordings; 287 MP3 files cover every narrated cue. Audio loads only when played, not on page load. No keys or live TTS requests are shipped to the browser. Generating new audio uses the configured paid TTS service; playing the app does not.

## Files

- `index.html` — document, navigation, dialog shell
- `styles.css` — responsive brand, components, motion, focus styling
- `app.js` — country content, maps, games, narration player, local progress
- `assets/world-data.js` — local Natural Earth outline paths
- `assets/country-data.js` — 173 extended country lessons
- `assets/flags/` — 197 original-proportion flag SVGs
- `scripts/flag-clues.txt` — editable learning clues for the extended atlas
- `scripts/build-countries.py` — builds extended country data from the source snapshot
- `assets/audio/`, `assets/audio-manifest.js` — Pip’s local narration
- `tests/` — Playwright regression suite
- `serve.py` — development-only static server

## Asset credits

- Country outlines: [Natural Earth](https://www.naturalearthdata.com/), public domain; source: `ne_110m_admin_0_countries.geojson` from the Natural Earth vector repository.
- Country metadata: [mledoze/countries](https://github.com/mledoze/countries), ODbL-1.0. A selected source snapshot is in `assets/countries-source.json`, and its license is in `assets/licenses/countries-ODbL.txt`.
- Flag images: [FlagCDN / Flagpedia](https://flagcdn.com/). Afghanistan’s current de facto white flag: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Flag_of_the_Taliban.svg), public domain.
- Fonts: Outfit and DM Sans, SIL Open Font License; license copies in `assets/licenses/`.
- Pip illustration, icons, interface, learning copy: created for this project.

There are no analytics, ads, accounts, external runtime libraries, microphone access, or live speech-service calls.
