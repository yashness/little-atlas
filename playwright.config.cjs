const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests',
  timeout: 60000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { outputFolder: 'evidence/test-report', open: 'never' }]],
  use: {
    baseURL: process.env.ATLAS_URL || 'http://little-atlas.localhost:1355',
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
    // Capture this app explicitly in tests; never snapshot unrelated CDP tabs.
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
