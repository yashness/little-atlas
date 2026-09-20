# Little Atlas

Small, durable learning software. Prefer less code and fewer, higher-signal tests.

## Ring-first development
Build in this order: **infrastructure → layer contracts → shared library → small utilities → specific features**.

- `scripts/`, build/test/deploy setup: repeatable infrastructure; never ship credentials or developer tools.
- `src/contracts/`: explicit TypeScript data and platform boundaries; no DOM or I/O.
- `src/lib/`: pure, reusable learning rules. Share one selector/question engine across lessons and games.
- `src/utils/`: tiny, domain-independent helpers only when genuinely reused. No miscellaneous dumping ground.
- `src/platform/`: browser/storage/audio adapters; isolate side effects here.
- `src/features/`: compose the lower rings into screens and interactions. Shared code must not import a feature.

Keep dependencies acyclic. Define a shared contract before adding a second consumer, not a second implementation.

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
- Test invariants and user journeys, not private functions or snapshots of incidental markup. Add a regression for each real bug.
- Run typecheck, data audit, unit tests, browser tests, and the allowlisted production build before publishing.
- Inspect desktop/mobile screenshots and verify the deployed URL, including audio and missing/private paths.
- Make focused conventional commits and push meaningful milestones. Never commit `.env*`, dependency folders, caches, or test recordings.
- Keep main releasable; document source changes and rollback targets. Preserve existing user work.
- Follow the inherited `notify.py` instructions for decisions, milestones, blockers, and completion proof.
