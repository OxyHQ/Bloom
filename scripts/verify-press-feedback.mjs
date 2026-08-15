/**
 * Browser gate for the press feedback of the six non-glass families.
 *
 * Both halves are asserted, because each is trivially satisfiable without the
 * other: "the background moved" passes with the scale silently removed, and
 * "the scale ran" passes with the colour feedback gone — which is the state four
 * of these six were in on desktop before this landed.
 *
 * Usage: start Storybook, then
 *   node scripts/verify-press-feedback.mjs [--url http://localhost:6006]
 *
 * `Button` is deliberately absent: its filled variants are GLASS, so a state
 * layer there would composite onto a translucent tint over expo-blur's material
 * over an unknown backdrop — a different computation from the one measured here,
 * and one nobody has measured yet. It keeps the scale alone.
 *
 * The scale only runs under a coarse pointer (`SUPPORTS_PRESS_SCALE`, resolved
 * at module load), so the media feature is emulated before the bundle evaluates
 * — otherwise a missing transform reads as "the scale is gone" when it is merely
 * suppressed, which is correct behaviour.
 */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const puppeteer = require('/home/nate/Oxy/Homiio/node_modules/puppeteer-core');

const CASES = [
  { name: 'Fab',               story: 'components-fab--default',                click: 'button.bloom-fab',                measure: 'button.bloom-fab',            raw: true },
  { name: 'FrostedIconButton', story: 'components-frostediconbutton--over-image', click: 'button.bloom-frosted-icon-btn', measure: 'button.bloom-frosted-icon-btn', raw: true },
  { name: 'Chip',              story: 'data-display-chip--selectable',          click: '[data-bloom-chip]',               measure: '[data-bloom-chip]' },
  { name: 'Tabs',              story: 'components-tabs--basic',                 click: '[role="tab"]',                    measure: '[role="tab"]', index: 1 },
  { name: 'Checkbox',          story: 'forms-checkbox--basic',                  click: '[data-bloom-checkbox]',           measure: '[data-bloom-checkbox] > *' },
  // The indicator sits one node deeper: the Pressable's first child is the
  // Animated.View that carries the scale, and the circle is inside THAT.
  { name: 'Radio',             story: 'forms-radio--group',                     click: '[role="radio"][aria-checked="false"]', measure: '[role="radio"][aria-checked="false"] > * > *' },
];

const argUrl = process.argv.indexOf('--url');
const BASE = argUrl !== -1 ? process.argv[argUrl + 1] : 'http://localhost:6006';

const b = await puppeteer.launch({ executablePath: '/opt/google/chrome/chrome', headless: false,
  args: ['--no-sandbox'], defaultViewport: { width: 1000, height: 800, hasTouch: true, isMobile: true } });
const p = await b.newPage();
const cdp = await p.createCDPSession();
await cdp.send('Emulation.setEmulatedMedia', { features: [
  { name: 'pointer', value: 'coarse' }, { name: 'any-pointer', value: 'coarse' }] });

let fails = 0;
let measured = 0;
for (const c of CASES) {
  await p.goto(`${BASE}/iframe.html?id=${c.story}&viewMode=story`, { waitUntil: 'networkidle0' });
  await p.waitForSelector(c.click);
  const read = () => p.evaluate(([sel, i]) => {
    const el = document.querySelectorAll(sel)[i ?? 0];
    if (!el) return null;
    const cs = getComputedStyle(el);
    // The scale may live on this node or on an animated wrapper just above it.
    let t = cs.transform, hop = 0, n = el;
    while (t === 'none' && n.parentElement && hop < 2) { n = n.parentElement; t = getComputedStyle(n).transform; hop++; }
    return { bg: cs.backgroundColor, transform: t };
  }, [c.measure, c.index]);

  const rest = await read();
  if (!rest) { console.log(`FAIL  ${c.name}: nothing matched ${c.measure}`); fails++; continue; }
  measured++;
  const pt = await p.evaluate(([sel, i]) => {
    const el = document.querySelectorAll(sel)[i ?? 0]; const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }, [c.click, c.index]);
  // The two RAW-DOM forks have no JS press state at all — their held state is a
  // CSS `:active` rule, which a synthetic touch does not trigger. They take a
  // real mouse press; the react-native-web controls take a real touch, because
  // their scale is gated on a coarse pointer.
  if (c.raw) await p.mouse.move(pt.x, pt.y);
  if (c.raw) await p.mouse.down(); else await p.touchscreen.touchStart(pt.x, pt.y);
  await new Promise((r) => setTimeout(r, 420));
  const held = await read();
  if (c.raw) await p.mouse.up(); else await p.touchscreen.touchEnd();
  await new Promise((r) => setTimeout(r, 300));

  const bgMoved = rest.bg !== held.bg;
  const scaled = held.transform !== 'none' && held.transform !== 'matrix(1, 0, 0, 1, 0, 0)';
  if (!bgMoved || !scaled) fails++;
  console.log(`${bgMoved && scaled ? 'PASS' : 'FAIL'}  ${c.name.padEnd(19)} bg ${rest.bg} → ${held.bg}`);
  console.log(`      ${' '.repeat(19)} transform held = ${held.transform}  ${scaled ? '' : '(NO SCALE)'}`);
}
await b.close();
if (measured !== CASES.length) {
  console.log(`\nINVALID: measured ${measured} of ${CASES.length} cases.`);
  process.exit(1);
}
console.log(fails === 0 ? '\nAll six: background moves AND the 0.99 scale runs.' : `\n${fails} failing.`);
process.exit(fails === 0 ? 0 : 1);
