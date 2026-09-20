# Active delivery slices

Small, behavior-first plans; this is not an event bus or a second task system.

## Inline flag meaning — release 1.1.1

**Intent → outcome:** open a country → its flag, memory clue, factual meaning, and location are available on the default learning view without selecting a story tab.

| Slice | Ownership / contract | Acceptance | Status |
|---|---|---|---|
| 1. Shared interaction | `contracts/session.ts`, narrator adapter, shared listen control; two lesson tabs and one player with independently identified controls | Story is visible on entry; switching intro → story is one click; only the active control says Stop | Complete; red tests reproduced, then shared contract and playback controls verified |
| 2. Lesson composition | `features/learn/view.ts`, shared learning CSS; reuse the existing sourced story, do not duplicate the flag or data | Flag meaning is inline at desktop/mobile widths; full source remains available; quiz/map flow unchanged | Complete; desktop/mobile inspected, no duplicate flag or data |
| 3. Integration | `main.ts`, browser regressions, release docs/version | Keyboard tab wrapping, every country, audio stop/switch/close, progress, and deployed checks pass | Local checks green: 13 unit/data and 19 browser tests; preview/production gates pending |

**Execution:** serial. These slices share the same controller/render/audio boundary, so parallel workers would create more reconciliation work than they save. No new runtime dependency or infrastructure is needed. Reuse the existing compile/ring checks, contracts, narrator, and Pages pipeline.

**Release gate:** type/format/ring checks → unit/data tests → browser journeys → desktop/mobile screenshots → Pages preview → serial merge/tag → production verification. Keep v1.1.0 as the rollback baseline.
