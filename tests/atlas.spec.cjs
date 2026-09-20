const { test, expect } = require('./fixtures.cjs');
const { resolve } = require('node:path');
const { pathToFileURL } = require('node:url');

async function correctFlag(page, code) {
  await page.locator('.answer').filter({ has: page.locator(`img[src="assets/flags/${code}.svg"]`) }).click();
}
async function next(page) { await page.locator('#next').click(); }

test('homepage has local, successful assets and no JavaScript errors', async ({ page, baseURL }) => {
  const errors = [], failed = [], external = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { if (r.status() >= 400) failed.push(r.url()); });
  page.on('request', r => { if (!r.url().startsWith(baseURL)) external.push(r.url()); });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Small flags. BIG adventures.' })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  expect(await page.locator('img').evaluateAll(xs => xs.every(x => x.complete && x.naturalWidth > 0))).toBe(true);
  expect(errors).toEqual([]); expect(failed).toEqual([]); expect(external).toEqual([]);
  await page.screenshot({ path: 'evidence/desktop.png', fullPage: true });
});

test('gentle retry, flag → geography → stamp, no timed auto-advance, persistent progress', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Let’s go exploring' }).click();
  await expect(page.getByRole('heading', { name: 'Hello, Japan!' })).toBeVisible();
  await page.screenshot({ path: 'evidence/japan-lesson.png' });
  await page.getByRole('button', { name: 'Let’s find its flag' }).click();
  await correctFlag(page, 'bd');
  await expect(page.locator('#feedback')).toContainText('A good try!');
  await expect(page.locator('#star-count')).toHaveText('0');
  await correctFlag(page, 'jp');
  await expect(page.locator('#star-count')).toHaveText('1');
  await page.waitForTimeout(1700);
  await expect(page.getByRole('heading', { name: 'Can you find Japan?' })).toBeVisible();
  await next(page);
  await expect(page.getByRole('heading', { name: 'Where is Japan?' })).toBeVisible();
  await page.getByRole('button', { name: 'Asia', exact: true }).click();
  await next(page);
  await expect(page.locator('.new-stamp')).toContainText('Japan');
  await expect(page.locator('#stamp-count')).toHaveText('1');
  await page.getByRole('button', { name: 'See my passport' }).click();
  await expect(page.locator('.stamp.earned')).toHaveCount(1);
  await page.reload();
  await expect(page.locator('.stamp.earned')).toHaveCount(1);
  await expect(page.locator('#star-count')).toHaveText('2');
});

test('all 197 entries can be learned, located, and stamped; revisits do not duplicate stamps', async ({ page }) => {
  test.setTimeout(240000);
  await page.goto('/#world');
  const countries = await page.evaluate(() => COUNTRIES.map(f => ({ c:f.c, n:f.n, r:f.r })));
  for (const f of [...countries, countries[0]]) {
    await page.locator(`.country-tile[data-country="${f.c}"]`).click();
    await expect(page.locator('.lesson-map .pin')).toHaveCount(1);
    const hasOutline = await page.evaluate(code => WORLD.some(p=>p.id===BY[code].id),f.c);
    await expect(page.locator('.lesson-map .highlight')).toHaveCount(hasOutline?1:0);
    await page.getByRole('button', { name: 'Let’s find its flag' }).click();
    await correctFlag(page, f.c);
    await next(page);
    await page.getByRole('button', { name: f.r, exact: true }).click();
    await next(page);
    await expect(page.locator('.new-stamp')).toContainText(f.n);
    await page.getByRole('button', { name: 'Close adventure' }).click();
    await expect(page.locator('dialog')).not.toBeVisible();
  }
  await expect(page.locator('#stamp-count')).toHaveText('197');
  await expect(page.locator('#star-count')).toHaveText('396');
});

for (const kind of ['flags', 'shapes', 'places']) {
  test(`${kind} game: exactly five rounds, correct feedback, replay, no unearned passport stamps`, async ({ page }) => {
    await page.goto('/#games');
    await page.locator(`[data-game="${kind}"]`).click();
    for (let i = 0; i < 5; i++) {
      if (kind === 'places') await page.getByRole('button', { name: 'Find its home', exact: true }).click();
      await expect(page.locator('.dialog-header .eyebrow')).toContainText(`ROUND ${i + 1} OF 5`);
      const answer = await page.evaluate(() => session.q.choices.findIndex(c => c.correct));
      await page.locator(`[data-answer="${answer}"]`).click();
      await expect(page.locator('#feedback')).toContainText('You found');
      await next(page);
    }
    await expect(page.getByRole('heading', { name: 'Five little discoveries!' })).toBeVisible();
    await expect(page.locator('#star-count')).toHaveText('5');
    await expect(page.locator('#stamp-count')).toHaveText('0');
    await page.getByRole('button', { name: 'Play again' }).click();
    if (kind === 'places') await page.getByRole('button', { name: 'Find its home', exact: true }).click();
    await expect(page.locator('.dialog-header .eyebrow')).toContainText('ROUND 1 OF 5');
  });
}

test('pattern distractors never share the requested visual feature', async ({ page }) => {
  await page.goto('/');
  const errors = await page.evaluate(() => {
    const errors = [];
    for (const f of COUNTRIES.filter(f => STARTER_CODES.includes(f.c) && ['circle','stars','cross','vertical','horizontal'].includes(f.shape))) {
      session = {type:'game',kind:'shapes',country:f};
      for (let i = 0; i < 50; i++) {
        const q = questionData();
        const wrong = q.choices.find(c => !c.correct);
        if (FEATURES[f.shape].includes(wrong.id)) errors.push(`${f.shape}: ${wrong.id}`);
      }
    }
    return errors;
  });
  expect(errors).toEqual([]);
});

test('world filters combine region and overlapping visual features', async ({ page }) => {
  await page.goto('/#world');
  await expect(page.locator('#atlas-results .country-tile')).toHaveCount(197);
  await page.getByRole('button', { name: 'Circles', exact: true }).click();
  for(const code of ['jp','bd','kr','pw']) await expect(page.locator(`#atlas-results .country-tile[data-country="${code}"]`)).toBeVisible();
  await page.locator('#region').selectOption('Europe');
  await expect(page.locator('#atlas-results')).toContainText('No matches');
  await page.getByRole('button', { name: 'Stripes', exact: true }).click();
  for(const code of ['fr','it','de']) await expect(page.locator(`#atlas-results .country-tile[data-country="${code}"]`)).toBeVisible();
  await expect(page.locator('#atlas-results .country-tile[data-country="jp"]')).toHaveCount(0);
  await page.locator('#region').selectOption('all');
  await page.getByRole('button', { name: 'Stars', exact: true }).click();
  await expect(page.locator('#atlas-results .country-tile[data-country="br"]')).toBeVisible();
});

for (const width of [375, 768, 1440]) {
  test(`responsive ${width}px: all pages and learning dialog fit`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['explore','games','passport','world']) {
      await page.goto('/#'+route);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (width === 375 && route === 'explore') await page.screenshot({ path:'evidence/mobile.png', fullPage:true });
    }
    await page.locator('.country-tile[data-country="np"]').click();
    expect(await page.locator('dialog').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    await page.getByRole('button', { name: 'Let’s find its flag' }).click();
    await expect(page.locator('.answer')).toHaveCount(2);
    expect(await page.locator('dialog').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    if (width === 375) await page.screenshot({path:'evidence/mobile-game.png'});
  });
}

test('keyboard map activation, Escape closes dialog, sound toggle and twins activity', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Turn spoken guidance on' }).click();
  await expect(page.locator('#sound')).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button', { name: 'Turn spoken guidance off' }).click();
  await expect(page.locator('#sound')).toHaveAttribute('aria-pressed','false');
  await page.locator('g[data-country="jp"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Hello, Japan!' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog')).not.toBeVisible();
  await page.locator('[data-action="twins"]').click();
  await expect(page.getByRole('heading', { name: 'Blue for France. Green for Italy.' })).toBeVisible();
  await page.getByRole('button', { name: 'Let’s meet France' }).click();
  await expect(page.getByRole('heading', { name: 'Hello, France!' })).toBeVisible();
});

test('blocked or malformed storage does not prevent playing', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(Storage.prototype, 'getItem', { value: () => { throw new Error('blocked'); } });
    Object.defineProperty(Storage.prototype, 'setItem', { value: () => { throw new Error('blocked'); } });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Let’s go exploring' }).click();
  await page.getByRole('button', { name: 'Let’s find its flag' }).click();
  await correctFlag(page,'jp');
  await expect(page.locator('#star-count')).toHaveText('1');
});

test('a local HTML file works without a server or network', async ({ page, context }) => {
  await context.setOffline(true);
  await page.goto(pathToFileURL(resolve('index.html')).href);
  await expect(page.getByRole('heading', { name: 'Small flags. BIG adventures.' })).toBeVisible();
  await expect(page.locator('.country-tile')).toHaveCount(6);
  expect(await page.locator('img').evaluateAll(xs => xs.every(x => x.complete && x.naturalWidth > 0))).toBe(true);
  await page.getByRole('button', { name: 'Let’s go exploring' }).click();
  await expect(page.getByRole('heading', { name: 'Hello, Japan!' })).toBeVisible();
});

test('development server refuses private files', async ({ request }) => {
  for (const path of ['/.env.local','/package.json','/serve.py','/assets/../.env.local']) {
    const response = await request.get(path); expect(response.status()).toBe(404);
  }
});
