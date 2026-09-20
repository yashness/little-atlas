const { test, expect } = require('./fixtures.cjs');
const fs = require('node:fs');
const path = require('node:path');

test('full coverage: 193 members, 2 observers, 2 labeled extras; every entry has content and a local flag', async ({ page }) => {
  await page.goto('/#world');
  const info = await page.evaluate(() => ({
    total:COUNTRIES.length,
    members:COUNTRIES.filter(f=>!f.scope||f.scope==='member').length,
    observers:COUNTRIES.filter(f=>f.scope==='observer').map(f=>f.c).sort(),
    additional:COUNTRIES.filter(f=>f.scope==='additional').map(f=>f.c).sort(),
    codes:COUNTRIES.map(f=>f.c),
    missing:COUNTRIES.filter(f=>!f.title||!f.memory||!f.geo||!f.hint||!BY[f.other]||!f.xy.every(Number.isFinite)||!REGIONS.includes(f.r)).map(f=>f.c),
  }));
  expect(info.total).toBe(197); expect(info.members).toBe(193);
  expect(info.observers).toEqual(['ps','va']); expect(info.additional).toEqual(['tw','xk']);
  expect(new Set(info.codes).size).toBe(197); expect(info.missing).toEqual([]);
  for(const c of info.codes)expect(fs.existsSync(path.resolve(`assets/flags/${c}.svg`))).toBe(true);
  await page.locator('#country-search').fill('Kosovo');
  await expect(page.locator('#atlas-results .country-tile')).toHaveCount(1);
  await expect(page.locator('#atlas-results')).toContainText('Additional entry');
  await page.locator('.country-tile[data-country="xk"]').click();
  await expect(page.locator('.lesson-map .highlight')).toHaveCount(1);
  await expect(page.locator('.location-fact')).toContainText('not a UN member/observer state');
});

test('recorded audio: complete manifest and every referenced MP3 exists', async ({ page }) => {
  await page.goto('/');
  const data=await page.evaluate(()=>{
    const missing=[];
    for(const f of COUNTRIES){
      const cues=[`Hello, ${f.n}! ${f.hint} ${f.geo}`,`Can you find the flag of ${f.n}? ${f.hint}`,`${f.n} is in ${f.r}. Look for ${f.r} on the map.`,`You found it! Hello, ${f.n}!`,`You found its home! ${f.n} is in ${f.r}.`,`Hello, world! You found the flag and home of ${f.n}. Your passport has a new memory.`];
      for(const cue of cues)if(!PIP_AUDIO[cue]?.length)missing.push(cue);
    }
    return {missing,files:[...new Set(Object.values(PIP_AUDIO).flat())]};
  });
  expect(data.missing).toEqual([]);
  for(const filename of data.files){
    expect(fs.existsSync(path.resolve(filename)),filename).toBe(true);
    expect(fs.statSync(path.resolve(filename)).size,filename).toBeGreaterThan(1000);
  }
});

test('recorded audio actually plays, stops, replays, and cancels on close without browser TTS', async ({ page }) => {
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');
  await page.evaluate(()=>{if(window.speechSynthesis)window.speechSynthesis.speak=()=>{throw new Error('Browser TTS must not be used');};});
  await page.getByRole('button',{name:'Let’s go exploring'}).click();
  await page.getByRole('button',{name:'Hear Pip’s clue'}).click();
  await expect.poll(()=>page.evaluate(()=>pipAudio.readyState)).toBeGreaterThanOrEqual(2);
  await expect.poll(()=>page.evaluate(()=>pipAudio.currentTime)).toBeGreaterThan(0);
  expect(await page.evaluate(()=>pipAudio.currentSrc)).toContain('/assets/audio/learn-jp.mp3');
  await page.getByRole('button',{name:'Pip is speaking · Stop'}).click();
  expect(await page.evaluate(()=>pipAudio.paused)).toBe(true);
  await page.getByRole('button',{name:'Hear Pip’s clue'}).click();
  await expect.poll(()=>page.evaluate(()=>pipAudio.paused)).toBe(false);
  await page.getByRole('button',{name:'Close adventure'}).click();
  expect(await page.evaluate(()=>pipAudio.paused)).toBe(true);
  expect(errors).toEqual([]);
});

test('page and dialog headings have no accidental outline; keyboard controls retain focus indication', async ({ page }) => {
  await page.goto('/#passport');
  await page.locator('main').focus();
  expect(await page.locator('main').evaluate(el=>getComputedStyle(el).outlineStyle)).toBe('none');
  await page.locator('.stamp[data-country="jp"]').click();
  await expect(page.locator('#dialog-title')).toBeFocused();
  expect(await page.locator('#dialog-title').evaluate(el=>getComputedStyle(el).outlineStyle)).toBe('none');
  await page.keyboard.press('Tab');
  expect(await page.evaluate(()=>getComputedStyle(document.activeElement).outlineWidth)).toBe('3px');
  await page.keyboard.press('Escape');
  await page.locator('main').focus();
  await page.screenshot({path:'evidence/passport-no-outline.png'});
});
