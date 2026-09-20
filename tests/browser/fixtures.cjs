const base = require("@playwright/test");
// Optional connection to an already-running test browser on machines where
// launching Chromium is unavailable. Each test still gets an isolated context.
const test = process.env.ATLAS_CDP
  ? base.test.extend({
      browser: [
        async ({}, use) => {
          const browser = await base.chromium.connectOverCDP(
            process.env.ATLAS_CDP,
          );
          await use(browser);
          // For a CDP connection, close disconnects this client, not the host browser.
          await browser.close();
        },
        { scope: "worker" },
      ],
    })
  : base.test;
module.exports = { test, expect: base.expect };
