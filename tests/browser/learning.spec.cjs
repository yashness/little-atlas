const { test, expect } = require("@playwright/test");

test("Türkiye keeps both continents visible in its lesson, story, and quiz answer", async ({
  page,
}) => {
  await page.goto("/#world");
  await page.locator('.country-tile[data-country="tr"]').click();
  await expect(page.locator(".region-banner")).toContainText("Asia");
  await expect(page.locator(".region-banner")).toContainText("Europe");
  await expect(page.getByRole("tab", { name: "Flag story" })).toHaveCount(0);
  await expect(page.locator(".story-summary")).toBeVisible();
  await expect(page.locator(".story-panel")).toContainText("Ottoman");
  await page.getByRole("tab", { name: "People & places" }).click();
  await expect(page.locator(".people-panel")).toContainText("Turkish");
  await expect(page.locator(".people-panel")).toContainText("Greece");
  await page.getByRole("button", { name: "Try this flag" }).click();
  await page
    .locator(".answer")
    .filter({ has: page.locator('img[src="assets/flags/tr.svg"]') })
    .click();
  await page.locator("#next").click();
  await expect(
    page.getByRole("button", { name: "Asia & Europe", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Asia", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Europe", exact: true }),
  ).toHaveCount(0);
});

test("A–Z is a real ordered learning journey, not just a sorted grid", async ({
  page,
}) => {
  await page.goto("/#world");
  await page.locator("#learn-axis").selectOption("alphabetical");
  await page.getByRole("button", { name: "Start this journey" }).click();
  await expect(
    page.getByRole("heading", { name: "Afghanistan", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Next stop" }).click();
  await expect(
    page.getByRole("heading", { name: "Albania", exact: true }),
  ).toBeVisible();
});

test("a one-country journey offers a new path instead of looping the same country", async ({
  page,
}) => {
  await page.goto("/#world");
  await page.locator("#country-search").fill("Japan");
  await page.getByRole("button", { name: "Start this journey" }).click();
  await page.getByRole("button", { name: "Try this flag" }).click();
  await page
    .locator(".answer")
    .filter({ has: page.locator('img[src="assets/flags/jp.svg"]') })
    .click();
  await page.locator("#next").click();
  await page.getByRole("button", { name: "Asia", exact: true }).click();
  await page.locator("#next").click();
  await page.getByRole("button", { name: "Meet another country" }).click();
  await expect(page.locator("dialog")).not.toBeVisible();
  await expect(page.locator("#atlas-results .country-tile")).toHaveCount(197);
});

test("neighbors, language, and nearby-clock axes have different meaningful pools", async ({
  page,
}) => {
  await page.goto("/#world");
  await page.locator("#learn-axis").selectOption("neighbors");
  await page.locator("#learn-anchor").selectOption("tr");
  await expect(
    page.locator('#atlas-results .country-tile[data-country="gr"]'),
  ).toBeVisible();
  await expect(
    page.locator('#atlas-results .country-tile[data-country="jp"]'),
  ).toHaveCount(0);
  await page.locator("#learn-anchor").selectOption("lk");
  await expect(page.locator("#atlas-results")).toContainText(
    "No countries match",
  );
  await page.locator("#learn-axis").selectOption("languages");
  await page.locator("#learn-language").selectOption("spa");
  await expect(
    page.locator('#atlas-results .country-tile[data-country="mx"]'),
  ).toBeVisible();
  await page.locator("#learn-axis").selectOption("clocks");
  await page.locator("#learn-anchor").selectOption("in");
  await expect(
    page.locator('#atlas-results .country-tile[data-country="np"]'),
  ).toBeVisible();
  await expect(
    page.locator('#atlas-results .country-tile[data-country="gb"]'),
  ).toHaveCount(0);
  await page.locator("#learn-axis").selectOption("similarity");
  await expect(page.locator(".reference-country")).toContainText("France");
  await expect(page.locator(".reference-country img")).toHaveAttribute(
    "src",
    "assets/flags/fr.svg",
  );
  await expect(
    page.locator('#atlas-results .country-tile[data-country="fr"]'),
  ).toHaveCount(0);
});

test("game settings actually change country pool, order, number of choices, and rounds", async ({
  page,
}) => {
  await page.goto("/#games");
  await expect(page.locator('[data-game="flags"]')).toBeInViewport();
  await page.locator(".game-configuration > summary").click();
  await page.locator("#game-axis").selectOption("continent");
  await page.locator("#game-region").selectOption("Europe");
  await page.locator("#game-choices").selectOption("4");
  await page.locator("#game-rounds").selectOption("3");
  await page.locator("#game-order").selectOption("journey");
  await page.locator('[data-game="flags"]').click();
  await expect(page.locator(".dialog-header")).toContainText("1 OF 3");
  await expect(page.locator(".answer")).toHaveCount(4);
  await expect(
    page.getByRole("heading", { name: "Can you find Albania?" }),
  ).toBeVisible();
});

test("larger lesson type and region badges remain readable on a small phone", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/#world");
  await page.locator('.country-tile[data-country="tr"]').click();
  expect(
    await page
      .locator(".region-pill")
      .first()
      .evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
  ).toBeGreaterThanOrEqual(20);
  expect(
    await page
      .locator(".memory")
      .evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
  ).toBeGreaterThanOrEqual(16);
  expect(
    await page
      .locator("dialog")
      .evaluate((el) => el.scrollWidth <= el.clientWidth),
  ).toBe(true);
});
