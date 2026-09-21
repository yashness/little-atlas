const { defineConfig } = require('@playwright/test');
const { existsSync } = require('node:fs');

// Automated tests never attach to a running browser. Playwright launches its own
// headless process and temporary profile. This Mac needs the patched Canary build
// because the older bundled Chromium crashes in macOS power-notification setup.
const canary = '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary';
const executablePath = process.env.ATLAS_TEST_BROWSER ||
  (process.platform === 'darwin' && existsSync(canary) ? canary : undefined);

module.exports = defineConfig({
  testDir: './tests/browser',
  timeout: 60000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { outputFolder: 'evidence/test-report', open: 'never' }]],
  use: {
    baseURL: process.env.ATLAS_URL || 'http://little-atlas.localhost:1355',
    headless: true,
    launchOptions: executablePath ? { executablePath } : {},
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
    screenshot: 'off',
    trace: 'off',
  },
  webServer: process.env.ATLAS_URL ? undefined : {
    command: 'npm run dev',
    url: 'http://little-atlas.localhost:1355',
    reuseExistingServer: true,
    timeout: 30000,
  },
});
