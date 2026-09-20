# Deployment

## Addresses and ownership

- **Canonical production:** https://littleatlas.pages.dev/
- **Cloudflare Pages project:** `littleatlas`, production branch `main`, direct uploads.
- **Source:** https://github.com/yashness/little-atlas
- **Previous URL:** https://little-atlas-9da.pages.dev/ remains on the verified 1.0 baseline for existing bookmarks. It is not the current deploy target.
- Browser-local progress belongs to its origin; it does not automatically transfer between domains. Version upgrades on the same domain preserve the existing progress format.

## Release workflow

```sh
npm ci
npm run check
npm run test:unit
ATLAS_CDP=http://127.0.0.1:9223 npm test  # omit ATLAS_CDP for normal Playwright
npm run build
wrangler pages deploy dist --project-name littleatlas --branch release-check

# Verify the preview before promoting the identical code.
ATLAS_URL=https://release-check.littleatlas.pages.dev \
  ATLAS_CDP=http://127.0.0.1:9223 npm test
npm run verify:deploy -- https://release-check.littleatlas.pages.dev

# Merge tested work to main, tag the canonical package version, then publish.
npm run deploy
ATLAS_URL=https://littleatlas.pages.dev \
  ATLAS_CDP=http://127.0.0.1:9223 npm test
npm run verify:deploy -- https://littleatlas.pages.dev
```

GitHub CI independently checks types, formatting, unit/data rules, build boundaries, and browser journeys. It does **not** auto-publish unverified commits. Wrangler must be authenticated locally.

## What ships

Only the allowlisted `dist/` output: compiled JS/CSS, HTML, original-proportion flags, local fonts, map/profile content, active narration, licenses, security headers, and a custom 404. No secrets, source caches, tests, development tools, or unrelated poster files.

Release 1.1: **197 entries, 627 audio clips, 844 public assets** plus `_headers`. Audio is loaded on demand; the whole audio library is not downloaded when opening the page. Complete-file HTTP 200 audio responses are valid; the verifier checks their content hash and browser tests check actual playback.

## Verification record

- **Current production 1.1.1:** https://1469adce.littleatlas.pages.dev, canonical https://littleatlas.pages.dev/; tag `v1.1.1`, merge `e321d47`. Meaning/story is visible in the default lesson. Type/format/ring checks, 13 unit/data tests, 19 preview and production browser tests, and all 844 asset checks pass. See `docs/slices.md` for slice ownership and acceptance.

- 1.0 clean-URL baseline: `9b39692d`, source tag `v1.0.0` / commit `d5ba037`; 19 browser tests passed.
- 1.1 local: strict types/formatting, 13 unit/data tests, 19 browser tests; 627 MP3s validated with no invalid files.
- 1.1 preview: https://ac8a035b.littleatlas.pages.dev / branch alias `release-v1-1`; all 19 browser tests and all 844 asset checks passed.
- **1.1 production:** https://6d283966.littleatlas.pages.dev, served at https://littleatlas.pages.dev/; source tag `v1.1.0`, merge commit `a7c13b6`. All 19 production browser tests passed, including every country journey, audio, configurable games, and mobile layouts. All 844 public assets and deployed entrypoint hashes verified; private paths return 404.
- Main was rechecked after merging: strict types/formatting, runtime ring/cycle checks, 13 unit/data tests, and the allowlisted build all pass.

Detailed local proof is in ignored `evidence/`; CI results remain visible on GitHub. Canonical version lives in `package.json`.

## Rollback

Cloudflare retains the baseline deployment as a dashboard rollback target. A source-based rollback does not require changing the working checkout:

```sh
restore=$(mktemp -d /tmp/little-atlas-restore.XXXXXX)
git archive v1.1.0 | tar -x -C "$restore"
(cd "$restore" && npm ci && npm run build && \
  wrangler pages deploy dist --project-name littleatlas --branch main)
```

Do not delete either browser profile, reset progress, or redirect the old origin as part of a routine deployment.
