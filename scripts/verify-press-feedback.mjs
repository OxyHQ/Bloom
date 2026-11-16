/**
 * Real-pointer press-feedback coverage for six integrations of Bloom controls.
 * FAB and icon actions share Button; all current controls keep stable geometry.
 * Selection controls assert their committed state and painted selection; unchecked
 * Checkbox, underline Tabs and Radio deliberately have no held-state color delta.
 * Read each painted layer (including SurfacePaint and pseudo elements), because
 * a transparent host alone says nothing about the material visible behind it.
 * Usage: CHROME_PATH=/path/to/chrome node scripts/verify-press-feedback.mjs
 * Optional: --url http://localhost:6006, HEADED=1.
 */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const puppeteer = require('/home/nate/Oxy/Homiio/node_modules/puppeteer-core');

const CASES = [
  {
    name: 'Fab',
    story: 'base-fab--default',
    click: 'button.bloom-btn[aria-label="Compose"]',
    measure: 'button.bloom-btn[aria-label="Compose"]',
    raw: true,
  },
  {
    name: 'Button icon action',
    story: 'base-glyphbutton--fills',
    click: 'button.bloom-btn[aria-label="Filled at rest"]',
    measure: 'button.bloom-btn[aria-label="Filled at rest"]',
    raw: true,
  },
  {
    name: 'Chip',
    story: 'base-chip--selectable',
    click: '[data-bloom-chip]',
    measure: '[data-bloom-chip]',
  },
  {
    name: 'Tabs',
    story: 'base-tabs--basic',
    click: '[role="tab"]',
    measure: '[role="tab"]',
    index: 1,
    selection: 'aria-selected',
  },
  {
    name: 'Checkbox',
    story: 'base-checkbox--basic',
    selection: 'aria-checked',
    click: '[data-bloom-checkbox]',
    measure: '[data-bloom-checkbox]',
  },
  // The indicator sits one node deeper: the Pressable's first child is the
  // Animated.View that carries the scale, and the circle is inside THAT.
  {
    name: 'Radio',
    story: 'base-radio--group',
    click: '[role="radio"][aria-label="People you follow"]',
    measure: '[role="radio"][aria-label="People you follow"]',
    selection: 'aria-checked',
  },
];

const argUrl = process.argv.indexOf('--url');
const BASE = argUrl !== -1 ? process.argv[argUrl + 1] : 'http://localhost:6006';

const b = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH ?? '/opt/google/chrome/chrome',
  headless: process.env.HEADED !== '1',
  args: ['--no-sandbox'],
  defaultViewport: { width: 1000, height: 800, hasTouch: true, isMobile: true },
});
const p = await b.newPage();
const cdp = await p.createCDPSession();
await cdp.send('Emulation.setEmulatedMedia', {
  features: [
    { name: 'pointer', value: 'coarse' },
    { name: 'any-pointer', value: 'coarse' },
  ],
});

let fails = 0;
let measured = 0;
for (const c of CASES) {
  await p.mouse.move(990, 790);
  await p.goto(`${BASE}/iframe.html?id=${c.story}&viewMode=story`, {
    waitUntil: 'domcontentloaded',
  });
  const selector = `#storybook-root ${c.click}`;
  await p.waitForSelector(selector);
  await p.evaluate(() => document.fonts.ready);
  await new Promise((resolve) => setTimeout(resolve, 250));
  const read = () =>
    p.evaluate(
      ([sel, index]) => {
        const el = document.querySelectorAll(sel)[index ?? 0];
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        const paint = [el, ...el.querySelectorAll('*')].flatMap((node) =>
          [null, '::before', '::after'].map((pseudo) => {
            const style = getComputedStyle(node, pseudo);
            return [
              style.backgroundColor,
              style.backgroundImage,
              style.color,
              style.borderColor,
              style.opacity,
              style.fontWeight,
              style.fill,
              style.stroke,
              style.stopColor,
            ].join('|');
          }),
        );
        return {
          paint,
          width: rect.width,
          height: rect.height,
          selected: el.getAttribute('aria-selected'),
          checked: el.getAttribute('aria-checked'),
        };
      },
      [selector, c.index],
    );

  const rest = await read();
  if (!rest) {
    console.log(`FAIL  ${c.name}: nothing matched ${c.measure}`);
    fails++;
    continue;
  }
  measured++;
  const pt = await p.evaluate(
    ([sel, i]) => {
      const el = document.querySelectorAll(sel)[i ?? 0];
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    },
    [selector, c.index],
  );
  // Actual pointer events exercise CSS :active and React Native Web responders.
  await p.mouse.move(pt.x, pt.y);
  await p.mouse.down();
  await new Promise((r) => setTimeout(r, 420));
  const held = await read();
  await p.mouse.up();
  await new Promise((r) => setTimeout(r, 300));

  if (!held) {
    console.log(`FAIL ${c.name}: target disappeared during press`);
    fails++;
    continue;
  }
  const released = await read();
  const selectionChanged =
    c.selection === 'aria-selected'
      ? rest.selected !== released?.selected
      : rest.checked !== released?.checked;
  const paintMoved = c.selection
    ? selectionChanged && JSON.stringify(rest.paint) !== JSON.stringify(released?.paint)
    : JSON.stringify(rest.paint) !== JSON.stringify(held.paint);
  const stable =
    Math.abs(rest.width - held.width) < 0.5 && Math.abs(rest.height - held.height) < 0.5;
  if (!paintMoved || !stable) {
    fails++;
    console.log({
      rest: { width: rest.width, height: rest.height },
      held: { width: held.width, height: held.height },
    });
  }
  console.log(
    `${paintMoved && stable ? 'PASS' : 'FAIL'} ${c.name}: painted state ${paintMoved ? 'changes' : 'unchanged'}, geometry ${stable ? 'stable' : 'changed'}`,
  );
}
await b.close();
if (measured !== CASES.length) {
  console.log(`\nINVALID: measured ${measured} of ${CASES.length} cases.`);
  process.exit(1);
}
console.log(
  fails === 0
    ? '\nAll six: painted state changes and geometry remains stable.'
    : `\n${fails} failing.`,
);
process.exit(fails === 0 ? 0 : 1);
