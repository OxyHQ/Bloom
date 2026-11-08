import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const puppeteer = require(
  process.env.PUPPETEER_PATH || '/home/nate/Oxy/Homiio/node_modules/puppeteer-core',
);
const out = process.env.OUT || '.local/mic-browser';
mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({
  executablePath:
    process.env.CHROME ||
    '/home/nate/.cache/puppeteer/chrome/linux-146.0.7680.31/chrome-linux64/chrome',
  headless: true,
  args: ['--no-sandbox'],
});
const report = { browser: await browser.version(), cases: [] };
try {
  for (const reduced of [false, true]) {
    const page = await browser.newPage();
    await page.emulateMediaFeatures([
      { name: 'prefers-reduced-motion', value: reduced ? 'reduce' : 'no-preference' },
    ]);
    await page.goto(
      `${process.env.STORYBOOK_URL || 'http://localhost:6145'}/iframe.html?id=agents-composer-panel--pill-voice&viewMode=story`,
      { waitUntil: 'networkidle0', timeout: 120000 },
    );
    await page.waitForSelector('button[aria-label="Voice input"]');
    const mic = await page.$('button[aria-label="Voice input"]');
    const read = () =>
      mic.evaluate((button) =>
        [...button.querySelectorAll('div')]
          .map((node) => getComputedStyle(node))
          .filter((style) => style.width === '2.5px')
          .map((style) => ({ animationName: style.animationName, transform: style.transform })),
      );
    const idle = await read();
    assert.equal(idle.length, 4);
    assert(idle.every((bar) => bar.animationName === 'none'));
    await mic.click();
    await page.waitForFunction(
      () =>
        document.querySelector('button[aria-label="Voice input"]')?.getAttribute('aria-pressed') ===
        'true',
    );
    const recording = await read();
    assert(
      recording.every(
        (bar) => bar.animationName === (reduced ? 'none' : 'bloom-composer-mic-bars'),
      ),
    );
    await page.screenshot({ path: `${out}/recording-${reduced ? 'reduced' : 'motion'}.png` });
    await mic.click();
    await page.waitForSelector('button[aria-label="Transcribing"]');
    const transcribing = await read();
    assert(transcribing.every((bar) => bar.animationName === 'none'));
    report.cases.push({ reduced, idle, recording, transcribing });
    await page.close();
  }
  writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} finally {
  await browser.close();
}
