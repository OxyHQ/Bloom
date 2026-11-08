import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
const require = createRequire(process.env.PLAYWRIGHT_PACKAGE_JSON);
const { chromium } = require('@playwright/test');
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH,
  args: ['--no-sandbox'],
});
const page = await browser.newPage({ viewport: { width: 600, height: 600 } });
const output = process.env.VIEWPORT_OUTPUT ?? '.local/issue-663/viewport';
mkdirSync(output, { recursive: true });
const entry = `import {observeCanvasHost,visibleCanvasWindow} from ${JSON.stringify(resolve('src/canvas/observe-host.ts'))};
import {canvasVisibleRect,canvasSafeArea} from ${JSON.stringify(resolve('src/canvas/geometry.ts'))};
Object.assign(window,{observeCanvasHost,visibleCanvasWindow,canvasVisibleRect,canvasSafeArea});`;
writeFileSync(`${output}/entry.ts`, entry);
execFileSync(
  'bun',
  ['build', `${output}/entry.ts`, '--target=browser', `--outfile=${output}/entry.js`],
  { stdio: 'pipe' },
);
try {
  await page.setContent(
    '<style>body{margin:0}#outer{position:absolute;left:80px;top:70px;width:300px;height:300px;overflow:auto}#room{height:900px;padding-top:160px;padding-left:20px}#host{width:250px;height:400px;background:#ddd}#child{height:60px;overflow:auto}#child div{height:400px}</style><div id="outer"><div id="room"><div id="host"><div id="child"><div></div></div></div></div></div>',
  );
  await page.addScriptTag({ content: readFileSync(`${output}/entry.js`, 'utf8') });
  await page.evaluate(() => {
    const host = document.getElementById('host');
    window.framesSeen = [];
    const measure = () => {
      const r = host.getBoundingClientRect();
      window.framesSeen.push({
        host: { x: r.x, y: r.y, width: r.width, height: r.height },
        viewport: window.canvasVisibleRect(
          r.width,
          r.height,
          r.x,
          r.y,
          window.visibleCanvasWindow(host),
        ),
      });
    };
    window.stopObserver = window.observeCanvasHost(host, measure);
    measure();
  });
  await page.waitForTimeout(100);
  const initial = await page.evaluate(() => window.framesSeen.at(-1));
  assert.equal(initial.host.x, 100);
  assert.equal(initial.host.y, 230);
  assert.equal(initial.viewport.height, 140);
  await page.evaluate(() => (document.getElementById('outer').scrollTop = 200));
  await page.waitForTimeout(100);
  const moved = await page.evaluate(() => window.framesSeen.at(-1));
  assert.equal(moved.host.y, 30);
  assert.equal(moved.viewport.y, 40);
  assert.equal(moved.viewport.height, 300);
  await page.evaluate(() => {
    document.getElementById('host').style.width = '500px';
    document.getElementById('room').style.width = '900px';
    document.getElementById('outer').scrollLeft = 60;
  });
  await page.waitForTimeout(100);
  const horizontal = await page.evaluate(() => window.framesSeen.at(-1));
  assert.equal(horizontal.host.x, 40);
  assert.equal(horizontal.viewport.x, 40);
  assert.equal(horizontal.viewport.width, 300);
  assert.equal(horizontal.host.width-horizontal.viewport.x-horizontal.viewport.width,160);
  const before = await page.evaluate(() => window.framesSeen.length);
  await page.evaluate(() => (document.getElementById('child').scrollTop = 40));
  await page.waitForTimeout(100);
  assert.equal(
    await page.evaluate(() => window.framesSeen.length),
    before,
    'descendant scrolling must not schedule host measurement',
  );
  await page.evaluate(() => window.stopObserver());
  await page.evaluate(() => (document.getElementById('outer').scrollTop = 0));
  await page.waitForTimeout(100);
  assert.equal(
    await page.evaluate(() => window.framesSeen.length),
    before,
    'unmounted observer must detach',
  );
  writeFileSync(
    `${output}/result.json`,
    JSON.stringify({ initial, moved, horizontal, descendantIgnored: true, cleanup: true }, null, 2),
  );
  await page.screenshot({ path: `${output}/nested-host.png` });
  console.log(
    'Embedded host: local translation, ancestor clipping/scroll, descendant isolation and cleanup passed.',
  );
} finally {
  await browser.close();
}
