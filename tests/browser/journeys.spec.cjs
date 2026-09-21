const { test, expect } = require("@playwright/test");
const catalog = require("../../data/catalog.json");
const { pathToFileURL } = require("node:url");
const { resolve } = require("node:path");
const chooseFlag = (page, code) =>
  page
    .locator(".answer")
    .filter({ has: page.locator(`img[src="assets/flags/${code}.svg"]`) })
    .click();
const next = (page) => page.locator("#next").click();

// Contract tests cover fact/choice correctness. These exercise complete visible behavior.
test("home loads only local assets, and the offline HTML bundle works", async ({
  page,
  context,
  baseURL,
}) => {
  const errors = [],
    failures = [],
    external = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    if (r.status() >= 400) failures.push(r.url());
  });
  page.on("request", (r) => {
    if (r.url().startsWith("http") && !r.url().startsWith(baseURL))
      external.push(r.url());
  });
  expect(
    await page.evaluate(() => navigator.userAgent),
    "Automated suites must use an isolated headless browser",
  ).toContain("HeadlessChrome");
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Small flags. BIG adventures." }),
  ).toBeVisible();
  await page.locator(".country-row").scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      page
        .locator("img")
        .evaluateAll((xs) => xs.every((x) => x.complete && x.naturalWidth > 0)),
    )
    .toBe(true);
  expect(errors).toEqual([]);
  expect(failures).toEqual([]);
  expect(external).toEqual([]);
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({
    path: "evidence/v11/home-desktop.png",
    fullPage: true,
  });
  await context.setOffline(true);
  await page.goto(pathToFileURL(resolve("index.html")).href);
  await page.getByRole("button", { name: "Let’s go exploring" }).click();
  await expect(
    page.getByRole("heading", { name: "Japan", exact: true }),
  ).toBeVisible();
});

test("all 197 journeys award one stamp each, use the shared region labels, and survive reload", async ({
  page,
}) => {
  test.setTimeout(240000);
  await page.goto("/#world");
  for (const c of [...catalog, catalog[0]]) {
    await page.locator(`.country-tile[data-country="${c.code}"]`).click();
    for (const region of c.regions)
      await expect(page.locator(".region-banner")).toContainText(region);
    await expect(page.locator(".story-summary")).toHaveText(c.story.summary);
    await expect(page.locator(".story-summary")).toBeVisible();
    await page.getByRole("button", { name: "Try this flag" }).click();
    await chooseFlag(page, c.code);
    await next(page);
    const label = c.regions.join(
      c.regionMode === "convention" ? " or " : " & ",
    );
    await page.getByRole("button", { name: label, exact: true }).click();
    await next(page);
    await expect(page.locator(".new-stamp")).toContainText(c.name);
    await page.getByRole("button", { name: "Close adventure" }).click();
  }
  await expect(page.locator("#stamp-count")).toHaveText("197");
  await expect(page.locator("#star-count")).toHaveText("396");
  await page.reload();
  await expect(page.locator("#stamp-count")).toHaveText("197");
});

test("retry is gentle, gives no star, and a correct answer never auto-advances", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Let’s go exploring" }).click();
  await page.getByRole("button", { name: "Try this flag" }).click();
  await page
    .locator(".answer")
    .filter({ hasNot: page.locator('img[src="assets/flags/jp.svg"]') })
    .first()
    .click();
  await expect(page.locator("#feedback")).toContainText("A good try");
  await expect(page.locator("#star-count")).toHaveText("0");
  await chooseFlag(page, "jp");
  await expect(page.locator("#star-count")).toHaveText("1");
  await page.waitForTimeout(1600);
  await expect(
    page.getByRole("heading", { name: "Can you find Japan?" }),
  ).toBeVisible();
  await next(page);
  await expect(
    page.getByRole("heading", { name: "Where is Japan?" }),
  ).toBeVisible();
});

for (const kind of ["flags", "shapes", "places", "neighbors", "clocks"])
  test(`${kind}: configured three-round game completes, with no unearned passport stamps`, async ({
    page,
  }) => {
    await page.goto("/#games");
    await page.locator(".game-configuration > summary").click();
    await page.locator("#game-rounds").selectOption("3");
    await page.locator(`[data-game="${kind}"]`).click();
    for (let round = 1; round <= 3; round++) {
      if (kind === "places")
        await page
          .getByRole("button", { name: "Find its home", exact: true })
          .click();
      await expect(page.locator(".dialog-header")).toContainText(
        `ROUND ${round} OF 3`,
      );
      // Exercise visible retry/success behavior; pure tests separately prove answer validity.
      const count = await page.locator(".answer").count();
      for (let i = 0; i < count; i++) {
        await page.locator(".answer").nth(i).click();
        if (await page.locator("#next").count()) break;
      }
      await expect(page.locator(".answer.correct")).toHaveCount(1);
      await next(page);
    }
    await expect(
      page.getByRole("heading", { name: "3 little discoveries!" }),
    ).toBeVisible();
    await expect(page.locator("#star-count")).toHaveText("3");
    await expect(page.locator("#stamp-count")).toHaveText("0");
    await page.getByRole("button", { name: "Play again" }).click();
    if (kind === "places")
      await page
        .getByRole("button", { name: "Find its home", exact: true })
        .click();
    await expect(page.locator(".dialog-header")).toContainText("ROUND 1 OF 3");
  });

test("memory postcards can be observed, turned back, matched, and completed without timers", async ({
  page,
}) => {
  await page.goto("/#games");
  await page.locator('[data-game="pairs"]').click();
  await expect(page.locator(".postcard")).toHaveCount(6);
  const positions = new Map();
  for (let i = 0; i < 6; i += 2) {
    for (const index of [i, i + 1]) {
      const card = page.locator(`[data-card="${index}"]`);
      await card.click();
      const name = await card.getAttribute("aria-label");
      positions.set(name, [...(positions.get(name) || []), index]);
    }
    const reset = page.getByRole("button", { name: "Try another pair" });
    if (await reset.count()) await reset.click();
  }
  for (const indices of positions.values()) {
    const first = page.locator(`[data-card="${indices[0]}"]`);
    if (!(await first.isDisabled())) {
      await first.click();
      await page.locator(`[data-card="${indices[1]}"]`).click();
    }
  }
  await expect(page.locator(".postcard.matched")).toHaveCount(6);
  await expect(page.locator("#star-count")).toHaveText("3");
  await page.getByRole("button", { name: "My little discoveries" }).click();
  await expect(
    page.getByRole("heading", { name: "3 little discoveries!" }),
  ).toBeVisible();
});

test("recorded introduction and story play, cancel on tab change, and stop on close", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      window.__testMedia = this;
      return original.call(this);
    };
    if (window.speechSynthesis)
      window.speechSynthesis.speak = () => {
        throw new Error("Browser TTS must never be used");
      };
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Let’s go exploring" }).click();
  await page.getByRole("button", { name: "Hear Pip’s introduction" }).click();
  await expect
    .poll(() => page.evaluate(() => window.__testMedia?.currentTime || 0))
    .toBeGreaterThan(0);
  expect(await page.evaluate(() => window.__testMedia.currentSrc)).toContain(
    "/learn-jp.mp3",
  );
  await page.getByRole("button", { name: "Hear the flag story" }).click();
  await expect(
    page.getByRole("button", { name: "Hear Pip’s introduction" }),
  ).toHaveAttribute("aria-pressed", "false");
  await expect(
    page.locator('.story-panel [data-action="listen"]'),
  ).toHaveAttribute("aria-pressed", "true");
  await expect
    .poll(() => page.evaluate(() => window.__testMedia.currentTime))
    .toBeGreaterThan(0);
  expect(await page.evaluate(() => window.__testMedia.currentSrc)).toContain(
    "/story-jp.mp3",
  );
  await page.getByRole("tab", { name: "People & places" }).click();
  expect(await page.evaluate(() => window.__testMedia.paused)).toBe(true);
  await page.getByRole("tab", { name: "Flag & meaning" }).click();
  await page.getByRole("button", { name: "Hear the flag story" }).click();
  await expect
    .poll(() => page.evaluate(() => window.__testMedia.paused))
    .toBe(false);
  await page.getByRole("button", { name: "Pip is speaking · Stop" }).click();
  expect(await page.evaluate(() => window.__testMedia.paused)).toBe(true);
  await page.getByRole("button", { name: "Hear the flag story" }).click();
  await page.getByRole("button", { name: "Close adventure" }).click();
  expect(await page.evaluate(() => window.__testMedia.paused)).toBe(true);
});

test("keyboard controls and focus targets work without restoring the page-sized outline", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator('g[data-country="jp"]').focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "Japan", exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Flag & meaning" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("tab", { name: "People & places" }),
  ).toHaveAttribute("aria-selected", "true");
  expect(
    await page
      .getByRole("tab", { name: "People & places" })
      .evaluate((el) => getComputedStyle(el).outlineWidth),
  ).toBe("3px");
  await page.keyboard.press("Escape");
  await expect(page.locator("dialog")).not.toBeVisible();
  await page.locator("main").focus();
  expect(
    await page
      .locator("main")
      .evaluate((el) => getComputedStyle(el).outlineStyle),
  ).toBe("none");
});

test("existing v1 progress is kept; blocked storage still allows a session", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() =>
    localStorage.setItem(
      "little-atlas-v1",
      JSON.stringify({ stars: 7, stamps: ["jp", "not-a-country", "jp"] }),
    ),
  );
  await page.reload();
  await expect(page.locator("#star-count")).toHaveText("7");
  await expect(page.locator("#stamp-count")).toHaveText("1");
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new Error("blocked");
    };
    Storage.prototype.setItem = () => {
      throw new Error("blocked");
    };
  });
  await page.reload();
  await page.getByRole("button", { name: "Let’s go exploring" }).click();
  await page.getByRole("button", { name: "Try this flag" }).click();
  await chooseFlag(page, "jp");
  await expect(page.locator("#star-count")).toHaveText("1");
});

test("phone, tablet, and desktop screens fit; private files remain unavailable", async ({
  page,
  request,
}) => {
  for (const width of [320, 375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ["explore", "world", "games", "passport"]) {
      await page.goto("/#" + route);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${route} @ ${width}`,
      ).toBe(true);
      if (width === 375 && route === "games")
        await page.screenshot({
          path: "evidence/v11/games-mobile.png",
          fullPage: true,
        });
    }
  }
  for (const file of [
    ".env.local",
    "package.json",
    "serve.py",
    "assets/audio/generation.json",
  ])
    expect((await request.get("/" + file)).status()).toBe(404);
});
