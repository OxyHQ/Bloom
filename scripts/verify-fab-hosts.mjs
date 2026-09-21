/** The default action keeps its geometry in every host, including element icons. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const puppeteer = require(process.env.PUPPETEER_MODULE ?? 'puppeteer-core');
const browser = await puppeteer.launch({ ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' }), headless: true, args: ['--no-sandbox'] });
try {
  const page = await browser.newPage();
  for (const [story, width, selector] of [
    ['base-fab--default', 900, '[aria-label="Compose"]'],
    ['navigation-bottombar--default', 900, '[aria-label="Create"]'],
    ['templates-social--light-olive', 900, '[data-testid="sidebar-primary-action"]'],
    ['templates-social--light-olive', 390, '[aria-label="New post"]'],
  ]) {
    await page.setViewport({ width, height: 900 });
    const url = new URL('iframe.html', process.env.STORYBOOK_URL ?? 'http://localhost:6014');
    url.searchParams.set('id', story); url.searchParams.set('viewMode', 'story');
    await page.goto(url.href, { waitUntil: 'networkidle0' });
    await page.waitForSelector(selector, { visible: true });
    const state = await page.$eval(selector, node => {
      const button = node.getBoundingClientRect();
      const glyph = node.querySelector('svg').getBoundingClientRect();
      return { width: button.width, height: button.height, glyphWidth: glyph.width, glyphHeight: glyph.height,
        foreground: getComputedStyle(node).color, glyphFill: [...node.querySelectorAll('svg path')].map(path => getComputedStyle(path).fill).find(fill => fill !== 'none'),
        offsetX: glyph.x + glyph.width / 2 - button.x - button.width / 2,
        offsetY: glyph.y + glyph.height / 2 - button.y - button.height / 2 };
    });
    for (const key of ['width', 'height']) assert(Math.abs(state[key] - 50) < 1, JSON.stringify(state));
    for (const key of ['glyphWidth', 'glyphHeight']) assert(Math.abs(state[key] - 26) < 1, JSON.stringify(state));
    for (const key of ['offsetX', 'offsetY']) assert(Math.abs(state[key]) < 1, JSON.stringify(state));
    assert.equal(state.glyphFill, state.foreground, 'The icon must follow the action foreground in every host');
    if (story === 'navigation-bottombar--default' || width === 390) {
      const offset = await page.$eval(selector, node => {
        const action = node.getBoundingClientRect();
        const navigation = node.parentElement.parentElement.parentElement.firstElementChild.getBoundingClientRect();
        return action.y + action.height / 2 - navigation.y - navigation.height / 2;
      });
      assert(Math.abs(offset) < 1, `Bottom bar and FAB centers differ by ${offset}px`);
    }
    console.log(`${story} ${width}px: ${JSON.stringify(state)}`);
  }
} finally { await browser.close(); }
