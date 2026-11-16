/** Real layout must measure the overflow control, not its stretched probe column. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { resolveHeaderActionLayout } from '../src/page-header/action-layout.ts';
const require = createRequire(import.meta.url);
const puppeteer = require(process.env.PUPPETEER_CORE_PATH ?? 'puppeteer-core');
const output = process.env.BLOOM_MEASUREMENT_OUTPUT || '/tmp/bloom-header-measurement';
mkdirSync(output, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  args: ['--no-sandbox'],
});
const report = [];
const actions = [
  { id: 'find', label: 'Find in document', icon: () => null, group: 'document', onPress() {} },
  {
    id: 'share',
    label: 'Share document',
    icon: () => null,
    group: 'document',
    priority: 10,
    onPress() {},
  },
  { id: 'pin', label: 'Pin document', icon: () => null, group: 'organize', onPress() {} },
  {
    id: 'stop',
    label: 'Stop',
    icon: () => null,
    essential: true,
    labelVisibility: 'hidden',
    onPress() {},
  },
];
try {
  for (const touch of [false, true]) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1100, height: 900, hasTouch: touch, isMobile: touch });
    await page.goto(
      `${process.argv[2] || process.env.STORYBOOK_URL || 'http://localhost:6006'}/iframe.html?id=composition-headers-adaptive-actions--local-width&viewMode=story`,
      { waitUntil: 'domcontentloaded' },
    );
    await page.waitForSelector('[data-testid="action-host"]');
    for (const width of [240, 320, 390, 640, 900]) {
      await page.setViewport({ width, height: 900, hasTouch: touch, isMobile: touch });
      await page.$eval(
        '[data-testid="action-host"]',
        (host, value) => {
          host.style.width = `${value}px`;
        },
        width,
      );
      await new Promise((done) => setTimeout(done, 300));
      const actual = await page.evaluate(() => {
        const get = (id) => document.querySelector(`[data-testid="adaptive-actions-${id}"]`);
        const probe = get('measure-overflow');
        const child = probe.querySelector('button');
        const trigger = get('overflow');
        return {
          documentOverflow:
            document.documentElement.scrollWidth - document.documentElement.clientWidth,
          coarse: matchMedia('(pointer:coarse)').matches,
          probe: probe.getBoundingClientRect().width,
          child: child.getBoundingClientRect().width,
          trigger: trigger.getBoundingClientRect().width,
          budget: parseFloat(
            getComputedStyle(document.querySelector('[data-testid="adaptive-actions"]')).maxWidth,
          ),
          measurements: Object.fromEntries(
            ['find', 'share', 'pin', 'stop'].map((id) => [
              id,
              {
                full: get(`measure-${id}-full`).getBoundingClientRect().width,
                compact: get(`measure-${id}-compact`).getBoundingClientRect().width,
              },
            ]),
          ),
          visible: [...document.querySelectorAll('[data-header-action-id]')]
            .filter((n) => n.getAttribute('aria-hidden') !== 'true')
            .map((n) => n.getAttribute('data-header-action-id')),
        };
      });
      assert.equal(actual.coarse, touch);
      assert.equal(
        actual.documentOverflow,
        0,
        'intrinsic measurement probes must not overflow the document',
      );
      assert.ok(Math.abs(actual.probe - actual.child) < 0.1, 'probe hugs its own button');
      if (actual.trigger > 0)
        assert.ok(
          Math.abs(actual.probe - actual.trigger) < 0.1,
          'probe equals visible overflow recipe',
        );
      assert.equal(actual.probe, touch ? 44 : 36);
      const expected = resolveHeaderActionLayout(
        actions,
        new Map(Object.entries(actual.measurements)),
        Math.max(0, actual.budget - 4),
        actual.child,
        0,
      );
      assert.deepEqual(actual.visible, expected.inline, 'packing uses the real overflow width');
      report.push({ touch, width, ...actual, expected });
    }
    await page.close();
  }
} finally {
  writeFileSync(join(output, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  await browser.close();
}
console.log(JSON.stringify({ cases: report.length }));
