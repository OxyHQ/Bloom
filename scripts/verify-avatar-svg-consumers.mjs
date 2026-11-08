/** Exercise production consumers: character avatars must stay local SVG, including animated visible rows. */
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH, headless: true, args: ['--no-sandbox'] });
const routes = [
  ['agents-conversation-sidebar--default', 'animated'],
  ['agents-multi-agent-chat--default', 'animated'],
  ['agents-agent-creator--basic', 'animated'],
  ['base-avatar--bot-character', 'animated'],
  ['base-avatar--character-or-image-or-initials', 'animated'],
  ['agents-agent-reply--thinking', 'animated'],
  ['agents-agent-reply--profiles', 'animated'],
  ['agents-ai-profile-card--default', 'image'],
];
try {
  for (const [id, expected] of routes.filter(([id]) => !process.env.AVATAR_STORY_FILTER || id === process.env.AVATAR_STORY_FILTER)) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 1000 });
    const errors = [], forbidden = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (/bloom-character|character-runtime\/|runtime\.mjs|\.glb(?:\?|$)|\.ktx2(?:\?|$)/.test(request.url())) forbidden.push(request.url()); });
    await page.goto(`${process.env.STORYBOOK_URL || 'http://localhost:6006'}/iframe.html?id=${id}&viewMode=story`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForSelector(expected === 'image' ? '[data-testid=profile-avatar]' : expected === 'animated' ? '[data-bloom-vector-avatar] svg path' : '[data-bloom-vector-avatar] svg path, [data-bloom-vector-portrait] svg path', {timeout:120000});
    const count = await page.evaluate(() => ({
      animated: document.querySelectorAll('[data-bloom-vector-avatar] svg').length,
      portraits: document.querySelectorAll('[data-bloom-vector-portrait] svg').length,
      canvas: document.querySelectorAll('canvas, webview').length,
    }));
    assert.equal(count.canvas, 0, `${id}: old rendering surface`);
    assert.deepEqual(forbidden, [], `${id}: old runtime fetch`);
    assert.deepEqual(errors, [], `${id}: browser exception`);
    if (expected === 'animated') assert.ok(count.animated > 0, `${id}: no animated SVG`);
    if (expected === 'animated') {
      const readFrames = () => page.evaluate(() => [...document.querySelectorAll('[data-bloom-vector-avatar]')]
        .filter(node => { const r = node.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0 && r.right > 0 && r.left < innerWidth; })
        .map(node => Number(node.dataset.frame)));
      const before = await readFrames();
      await new Promise(resolve => setTimeout(resolve, 1000));
      const after = await readFrames();
      assert.ok(before.length > 0, `${id}: no visible animated character`);
      for (let index = 0; index < before.length; index++) assert.ok(after[index] > before[index], `${id}: visible character ${index} frozen`);
    }
    if (process.env.AVATAR_SCREENSHOT_DIR) await page.screenshot({path:`${process.env.AVATAR_SCREENSHOT_DIR}/${id}.png`});
    console.log(id, JSON.stringify(count));
    await page.close();
  }
} finally { await browser.close(); }
