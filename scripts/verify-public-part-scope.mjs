/** Real browser geometry and accessible names for the audited indicator parts. */
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
let puppeteer;
for (const name of ['puppeteer-core', '/home/nate/Oxy/Homiio/node_modules/puppeteer-core']) {
  try {
    puppeteer = require(name);
    break;
  } catch {}
}
if (!puppeteer) throw Error('Install puppeteer-core to run browser checks.');
const b = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH ?? '/opt/google/chrome/chrome',
  headless: true,
  args: ['--no-sandbox'],
});
try {
  for (const mode of ['light', 'dark'])
    for (const width of [390, 1100]) {
      const page = await b.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.setViewport({ width, height: 900 });
      await page.goto(
        `${process.env.STORYBOOK_URL ?? 'http://localhost:6006'}/iframe.html?id=foundations-control-size--indicator-parts&viewMode=story&globals=theme:${mode}`,
        { waitUntil: 'networkidle0' },
      );
      await page.waitForSelector('[data-testid="parts-xs-presence"]');
      const rows = await page.$$eval(
        '[data-testid^="parts-"]:not([data-testid$="-disc"])',
        (nodes) =>
          nodes.map((node) => ({
            id: node.dataset.testid,
            height: node.getBoundingClientRect().height,
            width: node.getBoundingClientRect().width,
            name: node.getAttribute('aria-label'),
          })),
      );
      assert.equal(rows.length, 16);
      for (const row of rows) {
        const [, size, part] = row.id.split('-');
        const small = size === 'xs' || size === 'sm';
        const expected =
          part === 'presence'
            ? small
              ? 12
              : size === 'lg'
                ? 16
                : 14
            : part === 'unread'
              ? small
                ? 16
                : 20
              : part === 'energy'
                ? small
                  ? 20
                  : 24
                : 20;
        assert.equal(row.height, expected, row.id);
        assert.ok(row.name && row.name.trim(), row.id + ' accessible name');
      }
      assert.deepEqual(errors, []);
      console.log(JSON.stringify({ mode, width, rows, errors }));
      await page.close();
    }
} finally {
  await b.close();
}
