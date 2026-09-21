# Architecture — start here

Little Atlas is a small, offline-capable learning app. **Strict TypeScript + browser APIs, not a framework.** A static build runs on Cloudflare Pages. Recorded speech, flags, fonts, and maps are local assets; no runtime account, database, or AI service is required.

## Build from the inside out

Development order: **infra → contracts/layers → shared library/components → utilities → features**. Establish the needed foundation before adding a consumer. This is a work order, not permission for circular imports.

```text
Infrastructure: build, typecheck, tests, data audit, static deployment
       ↓ establishes repeatable boundaries
Contracts: country facts, region conventions, selections, questions, progress
       ↓ consumed by
Shared library: pure atlas rules       Shared UI: reusable presentation
       ↓ supported by                  ↓
Small utilities: collections, escaping, DOM lookup (no business policy)
       ↓ composed with
Platform adapters: browser audio, local storage, validated local data
       ↓ wired by
Features: explore → learn → games → passport
       ↓
main: application composition and event routing
```

Imports must be acyclic. The compiler checks runtime import directions and cycles from esbuild's module graph, and rejects raw source-cache imports. Review also covers type-only dependencies, which disappear from the runtime graph. Contracts import no runtime code. Library functions import contracts and pure utilities, never the DOM, storage, or a feature. Shared UI renders data but does not own a learning session. Platform adapters isolate side effects. Features compose those pieces; a shared module must never import a feature. `main` is the only place that wires feature state to platform effects.

## Where to work

```text
src/
  contracts/atlas.ts          # shared types; keep the vocabulary small
  library/atlas/             # selection, geography/time, fair question generation
  shared/ui/                 # shared map/cards/controls/dialog presentation
  platform/browser/          # audio and progress adapters
  platform/catalog.ts        # validate the local data boundary
  utils/                     # genuinely reusable, domain-independent helpers
  features/
    explore/                 # home, filters, ordered journeys
    learn/                   # country lesson and sourced context
    games/                   # question flow and memory board
    passport/                # saved discoveries
  main.ts                    # composition, not a second domain engine

data/                        # authoring inputs + derived attributed catalog
scripts/{build,data,audio,dev}/ # small tooling groups; never browser dependencies
tests/unit/                  # invariants and pure behavior
tests/browser/               # a small set of complete user journeys
assets/                      # source art, fonts, recorded narration
```

`app.js` and `styles.css` at the root are generated, ignored outputs—not a second implementation. `npm run compile` creates them for the dev server and offline HTML. The old monolithic app, duplicated data globals, obsolete scripts, and 56 unused recordings were removed after the replacement passed the browser journeys.

## One source of truth

- **Country identity + visual clues:** `data/countries.json`.
- **Reviewed exceptions and feature membership:** `data/curation.json`.
- **Attributed derived profiles:** `data/catalog.json`, rebuilt by the data tooling; never manually edit the same fact in both source and output.
- **Provenance/conventions:** `data/provenance.json` and `data/README.md`.
- **One selector:** both learning paths and games use the same country-selection rules.
- **One question engine:** only eligible, unambiguous questions; a small/empty pool is explained, not silently broadened.
- **One region model:** arrays plus `single`, `spans`, or `convention`. Türkiye's Asia and Europe cannot become competing right/wrong answers.
- **One narrator/player and one progress adapter:** no screen-specific storage keys or overlapping audio players.
- **One review history:** `library/atlas/navigation.ts` retains the last 200 view transitions, sharing immutable catalog/question/card data. Back/Forward restore answers and order; natural Next reuses a saved forward step. Reward claims live outside snapshots, so reviewing or replaying an undone move cannot earn twice. An explicit new game gets a new session identity.

Historical interpretations, geography conventions, and invented memory tricks are different kinds of information. Keep their labels and sources. Civil time uses IANA offsets at an explicit instant, not longitude. Faith/language notes describe diverse communities, never every individual.

## How to change behavior

1. Write the smallest failing test for the user-visible rule or regression.
2. Add/change its contract only if needed; implement the pure rule in the shared library.
3. Reuse existing components and adapters; compose the feature last.
4. Run typecheck + unit/data checks, then the relevant browser journey. Inspect desktop and mobile for UI work.
5. Make one focused conventional commit. Push meaningful milestones, not half-wired refactors.

Prefer a table or function to a new hierarchy. No service locator, generic repository, plugin framework, or class per country. Add a utility only when it has real consumers. DRY means one authoritative rule, not clever compression. SOLID means narrow responsibilities and replaceable boundaries, not more files.

## Slices and safe parallel work

Use a small event-modeling-style plan, not an event-sourcing framework:

| Slice contract | Specify |
|---|---|
| Intent → outcome | What the learner does and what becomes observably true |
| Acceptance | A failing behavior test and the important invariants |
| Ownership | Exact files/modules one worker may change |
| Dependencies | Shared contracts/primitives required before starting |
| Reconciliation | Commands, UI evidence, and the owner who integrates |

Keep the active plan in `docs/slices.md`. Finish shared infrastructure and agree contracts first; then independent topic importers or isolated feature views can be parallel slices. Shared session state, routing, schemas, and common UI have one integration owner—do not ask two workers to edit them concurrently. Reconcile passing slices frequently and serially, then run the combined baseline before merging/publishing. A small change touching the same lesson/controller/audio files should stay serial.

Herdr/Pi is optional coordination tooling, not an application dependency. When delegation is justified, use visible, named workers with bounded tasks and isolated branches/worktrees, following the installed orchestration skill. The user prefers GitHub Copilot Astra/Opus-5 models, long context, and high thinking; verify actual model IDs/options before launching and ask before substituting. Do not invent unsupported CLI flags or create an agent framework in this repository.

## Tests and releases

Unit tests cover meaningful invariants: validated source boundaries, coverage, reciprocal and overseas land neighbors, explicit region ambiguity, fair distractors, filter intersection, time-zone offsets/DST, narration contracts, and memory turns. Browser tests cover complete learning/game paths, accessibility, audio cancellation, and responsive layouts. Avoid tests that duplicate private implementation or snapshot incidental markup.

GitHub CI runs formatting/type checks, the unit/data suite, the static build, and browser journeys. The production builder allowlists public files. Never deploy the checkout, `.env*`, test output, source caches, or development dependencies. Verify a Pages preview before promoting production, then check the live URL and audio. See `DEPLOYMENT.md` for commands and rollback. Do not call an unfinished migration a release.

## Next topics

Countries are the first topic. Rivers, deserts, forests, languages, wonders, and places should reuse the selection/session/presentation foundations where the concepts genuinely match. Add topic-specific typed facts and relationships; do not force a river into a `Country` type or build an unused universal geography framework today.
