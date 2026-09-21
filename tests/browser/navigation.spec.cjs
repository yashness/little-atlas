const { test, expect } = require("@playwright/test");
const catalog = require("../../data/catalog.json");

async function solve(page) {
  for (let i = 0; i < (await page.locator(".answer").count()); i++) {
    await page.locator(".answer").nth(i).click();
    if (await page.locator("#next").count()) return;
  }
}

test("country title stays prominent; beliefs are visible and sources do not repeat the story", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/");
  await page.getByRole("button", { name: "Let’s go exploring" }).click();
  await expect(page.locator("#dialog-title")).toHaveText("Japan");
  expect(
    await page
      .locator("#dialog-title")
      .evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
  ).toBeGreaterThanOrEqual(28);
  await expect(page.locator(".story-summary")).toHaveCount(1);
  await expect(page.locator(".source-details")).toHaveCount(0);
  await page.getByRole("tab", { name: "People & places" }).click();
  const beliefs = page.locator(".beliefs-panel");
  await expect(beliefs.locator(".beliefs-text")).toHaveText(
    catalog.find((c) => c.code === "jp").beliefs.text,
  );
  await expect(beliefs.locator("details")).toHaveCount(0);
  await expect(beliefs).not.toContainText("People in one country");
  const urls = await page
    .locator(".profile-sources a")
    .evaluateAll((xs) => xs.map((x) => x.href));
  expect(new Set(urls).size).toBe(urls.length);
  await page.locator(".profile-sources").scrollIntoViewIfNeeded();
  await expect(page.locator("#dialog-title")).toBeInViewport();
  expect(
    await page
      .locator("dialog")
      .evaluate((el) => el.scrollWidth <= el.clientWidth),
  ).toBe(true);
});

for (const kind of ["flags", "shapes", "places", "neighbors", "clocks"])
  test(`${kind}: back/forward restores answers and choice order without more stars`, async ({
    page,
  }) => {
    await page.goto("/#games");
    await page.locator(`[data-game="${kind}"]`).click();
    if (kind === "places")
      await page
        .getByRole("button", { name: "Find its home", exact: true })
        .click();
    await solve(page);
    const first = await page.locator(".answer-grid").innerHTML();
    await expect(page.locator("#star-count")).toHaveText("1");
    await page.locator("#next").click();
    const second = await page.locator("#dialog-content").innerText();
    await page.getByRole("button", { name: "Go back", exact: true }).click();
    await expect(page.locator(".answer.correct")).toHaveCount(1);
    expect(await page.locator(".answer-grid").innerHTML()).toBe(first);
    await expect(page.locator("#star-count")).toHaveText("1");
    await page.getByRole("button", { name: "Go forward", exact: true }).click();
    await expect(page.locator("#dialog-content")).toContainText(
      second.split("\n").find((x) => x.includes("ROUND 2")) ||
        "A LITTLE MAP LESSON",
    );
    await page.getByRole("button", { name: "Go back", exact: true }).click();
    await page.locator("#next").click();
    await expect(page.locator("#star-count")).toHaveText("1");
    for (let round = 2; round <= 5; round++) {
      if (kind === "places")
        await page
          .getByRole("button", { name: "Find its home", exact: true })
          .click();
      await solve(page);
      await page.locator("#next").click();
    }
    await expect(
      page.getByRole("heading", { name: "5 little discoveries!" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Go back", exact: true }).click();
    await expect(page.locator(".answer.correct")).toHaveCount(1);
    await page.locator("#next").click();
    await expect(page.locator("#star-count")).toHaveText("5");
  });

test("a lesson can be revisited during practice without repeating its reward", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Let’s go exploring" }).click();
  await page.getByRole("button", { name: "Try this flag" }).click();
  await solve(page);
  const choices = await page.locator(".answer-grid").innerHTML();
  await page.getByRole("button", { name: "Go back", exact: true }).click();
  await expect(page.locator(".story-summary")).toBeVisible();
  await page.getByRole("button", { name: "Try this flag" }).click();
  expect(await page.locator(".answer-grid").innerHTML()).toBe(choices);
  await expect(page.locator(".answer.correct")).toHaveCount(1);
  await expect(page.locator("#star-count")).toHaveText("1");
});

test("memory back restores the clicked cards and cannot award the same pair twice", async ({
  page,
}) => {
  await page.goto("/#games");
  await page.locator('[data-game="pairs"]').click();
  const positions = new Map();
  for (let i = 0; i < 6; i += 2) {
    for (const index of [i, i + 1]) {
      const card = page.locator(`[data-card="${index}"]`);
      await card.click();
      const name = await card.getAttribute("aria-label");
      positions.set(name, [...(positions.get(name) || []), index]);
    }
    if (await page.getByRole("button", { name: "Try another pair" }).count())
      await page.getByRole("button", { name: "Try another pair" }).click();
  }
  let pair = [4, 5]; // If all exploration turns matched, this was the last match.
  for (const indices of positions.values()) {
    if (!(await page.locator(`[data-card="${indices[0]}"]`).isDisabled())) {
      pair = indices;
      break;
    }
  }
  const first = page.locator(`[data-card="${pair[0]}"]`),
    second = page.locator(`[data-card="${pair[1]}"]`);
  if (!(await first.isDisabled())) {
    await first.click();
    await second.click();
  }
  // Go back through recent board states, then forward: neither should affect rewards.
  const stars = await page.locator("#star-count").innerText();
  const board = await page.locator(".memory-board").innerHTML();
  await page.getByRole("button", { name: "Go back", exact: true }).click();
  await page.getByRole("button", { name: "Go forward", exact: true }).click();
  expect(await page.locator(".memory-board").innerHTML()).toBe(board);
  await expect(page.locator("#star-count")).toHaveText(stars);
  await page.getByRole("button", { name: "Go back", exact: true }).click();
  await page.locator(`[data-card="${pair[1]}"]`).click();
  await expect(page.locator("#star-count")).toHaveText(stars);
  for (const indices of positions.values()) {
    if (!(await page.locator(`[data-card="${indices[0]}"]`).isDisabled())) {
      await page.locator(`[data-card="${indices[0]}"]`).click();
      await page.locator(`[data-card="${indices[1]}"]`).click();
    }
  }
  await page.getByRole("button", { name: "My little discoveries" }).click();
  await page.getByRole("button", { name: "Go back", exact: true }).click();
  await expect(page.locator(".postcard.matched")).toHaveCount(6);
  await expect(page.locator("#star-count")).toHaveText("3");
});
