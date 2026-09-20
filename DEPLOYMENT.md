# Little Atlas — Cloudflare Pages

## Production

- Canonical live URL: **https://littleatlas.pages.dev/**
- Cloudflare project: `littleatlas`
- Previous URL remains available: https://little-atlas-9da.pages.dev/ (`little-atlas` project)
- Production branch: `main` (direct upload; no Git provider)
- Release: `1.0.0`
- Verified clean-URL baseline deployment: https://9b39692d.littleatlas.pages.dev (artifact from Git tag `v1.0.0`, commit `d5ba037`)
- Initial preview: https://release-check.little-atlas-9da.pages.dev

`little-atlas.pages.dev` was already taken, so the first project received a suffix. The clean `littleatlas.pages.dev` address was subsequently created and verified against the same release (19 browser tests passed). Future releases target `littleatlas`. Browser-local progress is origin-specific and does not automatically move between the two domains.

## Reproduce

```sh
npm run check
npm run build
ATLAS_CDP=http://127.0.0.1:9223 npm test
npm run deploy
npm run verify:deploy -- https://littleatlas.pages.dev
ATLAS_URL=https://littleatlas.pages.dev \
  ATLAS_CDP=http://127.0.0.1:9223 npm test
```

Wrangler must be installed and authenticated. Node 24+ is recommended for the development-only Portless dependency. The uploaded site itself has no Node, Python, Portless, database, server-side functions, or runtime package dependencies.

## Release contents

508 allowlisted files, 87.4 MiB. Cloudflare consumes `_headers` as configuration, leaving 507 public assets:

- HTML, CSS, app code, fonts, map/country data, and licenses
- 197 flags
- 287 recorded narration clips, loaded only on demand
- Custom 404 (prevents SPA fallback from disguising missing/private paths)
- Content Security Policy, frame blocking, MIME sniffing protection, permissions policy, and separate page/asset cache policies

Excluded: `.env.local`, package/config files, `node_modules`, tests, screenshots, local server scripts, generation cache, unrelated poster source files.

## Verification

- Local pre-deploy suite: **19 passed**.
- Preview URL suite: **19 passed**.
- Final production URL suite: **19 passed (56.1 seconds)**.
- All 507 public assets returned HTTP 200.
- Deployed HTML, JS, CSS, country data, and audio manifest hashes match the inspected local build.
- Private/development paths return 404.
- Audio MIME type and full MP3 content verified; actual playback, stop, replay, and close tested in the production browser.
- All 197 lessons completed flag → region → stamp; duplicate stamps rejected.
- Mobile/tablet/desktop widths 375/768/1440 checked; screenshots captured from production.

Evidence: `evidence/build.json`, `evidence/deployed-assets.json`, `evidence/production-tests.log`, `evidence/live-desktop.png`, `evidence/live-mobile.png`.

## Deployment notes

The first HTTP check expected byte-range audio delivery (206), but Cloudflare returned complete audio files (200), which is valid HTTP behavior and worked in browser playback tests. The verifier now accepts either a valid partial response or a complete MP3 matching the release hash; it does not silently accept arbitrary data.

An overlapping cache-header rule was corrected during release verification. Cloudflare briefly served old headers while the deployment propagated; the final verifier confirms one unambiguous max-age policy. No browser gameplay/audio failure occurred.

This checkout is not a Git repository, so no commit or release tag was fabricated. `package.json` is the canonical version source.

## Recovery

The verified release snapshot is `/tmp/little-atlas-1.0.0-static.tar.gz` on this machine. To restore those exact static assets while that snapshot is available:

```sh
restore=$(mktemp -d /tmp/little-atlas-restore.XXXXXX)
tar -xzf /tmp/little-atlas-1.0.0-static.tar.gz -C "$restore"
wrangler pages deploy "$restore" --project-name littleatlas --branch main
```

For later deployments, Cloudflare Pages also retains the verified deployment above as a rollback target in the dashboard. The initial release had no earlier production version to roll back to.
