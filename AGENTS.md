# Little Atlas

Small, durable learning software. Read `ARCHITECTURE.md` first. Prefer less code and fewer, higher-signal tests.

## Ring-first development
Build in this order: **infrastructure → layer contracts → shared library → small utilities → specific features**.

- `scripts/`, build/test/deploy setup: repeatable infrastructure; never ship credentials or developer tools.
- `src/contracts/`: explicit TypeScript data and platform boundaries; no DOM or I/O.
- `src/library/atlas/` and `src/shared/ui/`: pure learning rules and reusable components; one engine per responsibility.
- `src/utils/`: tiny, domain-independent helpers only when genuinely reused. No dumping ground.
- `src/platform/`: validated data and browser/storage/audio adapters; isolate side effects here.
- `src/features/<topic>/`: compose lower rings. Shared code must not import a feature.

Keep dependencies acyclic. Define a shared contract before adding a second consumer, not a second implementation.

## Work in distinct slices
- Plan a slice as **intent → observable outcome**, with acceptance tests, owned files, dependencies, and an integration gate. Track active slices in `docs/slices.md`.
- Establish shared infra/contracts first. Parallelize only disjoint consumers after those contracts are agreed; one owner integrates shared files and reconciles tested slices serially.
- Prefer serial work for small, coupled changes. If using Herdr/Pi, verify availability first; use the user’s GitHub Copilot Astra/Opus-5, long-context, high-thinking preferences where supported—never silently substitute.

## Coding conventions
- Strict TypeScript for new application code. Validate external data at the boundary; use `unknown`, not `any`.
- Prefer small functions, explicit state, composition, and immutable inputs. Use classes only when they simplify real state/lifecycle ownership.
- Apply SOLID pragmatically: one reason to change, narrow interfaces, interchangeable implementations, side effects behind boundaries.
- Apply DRY to knowledge and behavior—not coincidentally similar markup. One authoritative country fact, one rule, many views.
- Do not build speculative frameworks. New topics should extend data/registries before inventing another engine.
- Make errors and empty pools visible. Never quietly ignore a chosen filter, invent a fact, or mark an ambiguous answer wrong.

## Learning quality
- Cite/version factual sources; distinguish history, geography, conventions, and invented memory aids.
- Represent transcontinental membership explicitly. Narration, filters, maps, and quizzes must agree.
- Dates matter for time zones and demographic snapshots. Beliefs/languages never describe every individual.
- Accessible big controls, visible keyboard focus, reduced motion, no punitive timers. Preserve progress through upgrades.

## Verify and ship
- TDD: write a failing behavior/regression test first, then the smallest implementation. Test invariants and journeys, not private functions or incidental markup.
- Run typecheck, data audit, unit tests, browser tests, and the allowlisted production build before publishing.
- Inspect desktop/mobile screenshots and verify the deployed URL, including audio and missing/private paths.
- Make focused conventional commits and push meaningful milestones. Never commit `.env*`, dependency folders, caches, or test recordings.
- Keep main releasable; document source changes and rollback targets. Preserve existing user work.
- Follow the inherited `notify.py` instructions for decisions, milestones, blockers, and completion proof.
