# Active delivery slices

Small, behavior-first plans; this is not an event bus or a second task system.

## Clear details and review navigation — release 1.2.0

**Intents → outcomes:** open/scroll a country → its name stays prominent; open people/place facts → belief information is already visible; use Back/Forward in a game → prior choices, answers, or cards are restored without new rewards.

| Slice | Ownership / contract | Acceptance | Status |
|---|---|---|---|
| Navigation foundation | Session IDs, bounded snapshots, forward reuse, reward claims in `library/atlas/navigation.ts` | Same question/order/answer returns; memory matches cannot earn twice | Unit checks green |
| Details presentation | Shared dialog header, learning view and CSS | Sticky large country name, one source link per URL, no duplicate story/source text or belief expander | Focused browser checks green |
| Integration | Controller navigation boundaries and full game journeys | All five quizzes and memory support review through completion; audio stops on navigation; existing progress survives | Local verification complete: 15 unit/data and 27 browser tests pass; screenshots inspected. Preview/production gates pending. |

**Execution:** serial, because the header, controller and shared session contract are coupled. One small history mechanism—not separate back stacks per game. Country data is shared, not deep-copied. Navigation reviews history; it does not undo earned stars. Keep v1.1.1 as the rollback baseline.

## Inline flag meaning — release 1.1.1

**Intent → outcome:** open a country → its flag, memory clue, factual meaning, and location are available on the default learning view without selecting a story tab.

| Slice | Ownership / contract | Acceptance | Status |
|---|---|---|---|
| 1. Shared interaction | `contracts/session.ts`, narrator adapter, shared listen control; two lesson tabs and one player with independently identified controls | Story is visible on entry; switching intro → story is one click; only the active control says Stop | Complete; red tests reproduced, then shared contract and playback controls verified |
| 2. Lesson composition | `features/learn/view.ts`, shared learning CSS; reuse the existing sourced story, do not duplicate the flag or data | Flag meaning is inline at desktop/mobile widths; full source remains available; quiz/map flow unchanged | Complete; desktop/mobile inspected, no duplicate flag or data |
| 3. Integration | `main.ts`, browser regressions, release docs/version | Keyboard tab wrapping, every country, audio stop/switch/close, progress, and deployed checks pass | Complete: 13 unit/data checks and 19 browser tests pass locally, in preview, and on production; runtime import/cycle checks and all 844 asset checks pass |

**Execution:** serial. These slices share the same controller/render/audio boundary, so parallel workers would create more reconciliation work than they save. No new runtime dependency or infrastructure is needed. Reuse the existing compile/ring checks, contracts, narrator, and Pages pipeline.

**Release:** merged to main as `e321d47`, tagged/pushed `v1.1.1`, and deployed as `1469adce` at https://littleatlas.pages.dev/. Desktop/mobile proof and production logs are in ignored `evidence/inline/`. No open slice tasks or parallel workers remain.

**Release gate completed:** type/format/ring checks → unit/data tests → browser journeys → desktop/mobile screenshots → Pages preview → serial merge/tag → production verification. Keep v1.1.0 as the rollback baseline.
