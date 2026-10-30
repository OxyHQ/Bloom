/**
 * The baked web material paints the same pixels as the live one, and stays live
 * wherever its backdrop is not one known colour (`src/surface/baked-material.ts`).
 *
 * For each story, in light and dark: the whole viewport with every material
 * live (`data-bloom-material-bake="off"` on the root, the measurement control),
 * then baked, compared pixel by pixel. Fails on any channel more than
 * `TOLERANCE` levels apart, on a story on the flat canvas that bakes nothing,
 * on a host that must bake and does not, and on one that bakes over a picture.
 *
 *   STORYBOOK_URL=http://localhost:6006 CHROME_PATH=… node scripts/verify-surface-baked-material.mjs
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const puppeteer = require(process.env.PUPPETEER_MODULE ?? 'puppeteer-core');

const TOLERANCE = 2;
/**
 * A material host's own antialiased outline, the pixels it only partly covers,
 * is the one place the two may differ more: the live edge light brightens a
 * backdrop that already holds the outline's mix with what is outside, the baked
 * one brightens its own body under the same coverage (and a live host on a
 * baked one antialiases against a different render surface). Measured up to 11
 * levels, on that outline's antialiased pixels and the two either side. The ring is found by painting every body
 * black, then white, and keeping the pixels in between.
 */
const OUTLINE_TOLERANCE = 12;
const BASE = process.env.STORYBOOK_URL ?? 'http://localhost:6006';
const WIDTH = 1100;
const HEIGHT = 800;

/** Stories on the flat canvas: something must bake, and nothing may move. */
const FLAT = [
  { id: 'base-surface--nested', baked: ['nested-outer', 'nested-card'] },
  { id: 'base-surface--border-lighting' },
  { id: 'base-surface--baked-and-live', baked: ['baked-canvas', 'baked-nested'] },
];
/** Hosts that must stay live, by test id, wherever they appear. */
const LIVE = ['live-ancestor-image', 'live-sibling-layer', 'side-reflection', 'surface-material'];
/** Stories whose every material is over a picture: nothing may bake. */
const UNKNOWN = [{ id: 'base-surface--material' }, { id: 'base-surface--backdrop-reflection' }];

const settle = (page) =>
  page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 50))),
      ),
  );

async function bakedHosts(page) {
  return page.evaluate(() => {
    const hosts = [...document.querySelectorAll('[data-bloom-material="baked"]')];
    const id = (el) => el.closest('[data-testid]')?.getAttribute('data-testid');
    return { count: hosts.length, ids: hosts.map(id).filter(Boolean) };
  });
}

const shot = async (page) =>
  `data:image/png;base64,${await page.screenshot({ encoding: 'base64' })}`;

/**
 * Every material body alone (baked, and live on a baked one), black or white
 * by how deeply it is nested (`flip` swaps them), with nothing else drawn: a
 * nested body's outline then shows against the one it sits on, as an outer
 * one's shows against the page.
 */
async function bodiesIn(page, flip) {
  await page.evaluate((flip) => {
    const hosts = [...document.querySelectorAll('body *')].filter(
      (el) =>
        el.getAttribute('data-bloom-material') === 'baked' ||
        getComputedStyle(el, '::before').backdropFilter !== 'none',
    );
    // A SurfacePaint layer covers its host: the host is the region it paints.
    const region = (el) => (el.hasAttribute('data-bloom-paint-layer') ? el.parentElement : el);
    for (const host of hosts) {
      const depth = hosts.filter(
        (other) =>
          other !== host && region(other) !== region(host) && region(other).contains(region(host)),
      ).length;
      host.setAttribute('data-gate-shade', String((depth + (flip ? 1 : 0)) % 2));
    }
  }, flip);
  const style = await page.addStyleTag({
    content: `
body * { visibility: hidden !important; }
[data-gate-shade] { visibility: visible !important; }
[data-gate-shade] * { visibility: hidden !important; }
[data-gate-shade] [data-gate-shade] { visibility: visible !important; }
[data-gate-shade="0"]::before { background-color: #000 !important; backdrop-filter: none !important; opacity: 1 !important; }
[data-gate-shade="1"]::before { background-color: #fff !important; backdrop-filter: none !important; opacity: 1 !important; }
[data-gate-shade]::after { display: none !important; }`,
  });
  await settle(page);
  const image = await shot(page);
  await style.evaluate((node) => node.remove());
  await page.evaluate(() => {
    for (const el of document.querySelectorAll('[data-gate-shade]'))
      el.removeAttribute('data-gate-shade');
  });
  await settle(page);
  return image;
}

async function compare(page, images) {
  return page.evaluate(async ({ live, baked, black, white }) => {
    const load = async (src) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const context = canvas.getContext('2d');
      context.drawImage(img, 0, 0);
      return { data: context.getImageData(0, 0, img.width, img.height).data, width: img.width };
    };
    const [x, y, b, w] = await Promise.all([live, baked, black, white].map(load));
    const width = x.width;
    const pixels = x.data.length / 4;
    // The two shades swap inside a baked body (black against white: 255 apart)
    // and leave the page alone (0 apart). In between is a body's partial
    // coverage of its outline. Two pixels either side of that ring.
    const partial = new Uint8Array(pixels);
    for (let p = 0; p < pixels; p++) {
      const swing = Math.abs(b.data[p * 4 + 1] - w.data[p * 4 + 1]);
      if (swing > 6 && swing < 249) partial[p] = 1;
    }
    const ring = new Uint8Array(pixels);
    for (let p = 0; p < pixels; p++) {
      if (!partial[p]) continue;
      for (let dy = -2; dy <= 2; dy++)
        for (let dx = -2; dx <= 2; dx++) {
          const q = p + dy * width + dx;
          if (q >= 0 && q < pixels) ring[q] = 1;
        }
    }
    let worst = 0;
    let worstOutline = 0;
    let over = 0;
    for (let p = 0; p < pixels; p++) {
      const i = p * 4;
      const d = Math.max(
        Math.abs(x.data[i] - y.data[i]),
        Math.abs(x.data[i + 1] - y.data[i + 1]),
        Math.abs(x.data[i + 2] - y.data[i + 2]),
      );
      if (ring[p]) worstOutline = Math.max(worstOutline, d);
      else {
        worst = Math.max(worst, d);
        if (d > 2) over++;
      }
    }
    return { worst, worstOutline, over };
  }, images);
}

const browser = await puppeteer.launch({
  ...(process.env.CHROME_PATH
    ? { executablePath: process.env.CHROME_PATH }
    : { channel: 'chrome' }),
  headless: true,
  args: ['--no-sandbox'],
});
const failures = [];
try {
  const page = await browser.newPage();
  await page.setViewport({ width: WIDTH, height: HEIGHT });
  for (const theme of ['light', 'dark']) {
    for (const story of [...FLAT, ...UNKNOWN]) {
      const url = new URL('iframe.html', BASE);
      url.searchParams.set('id', story.id);
      url.searchParams.set('viewMode', 'story');
      url.searchParams.set('globals', `theme:${theme}`);
      await page.goto(url.href, { waitUntil: 'networkidle0', timeout: 180_000 });
      await page.evaluate(() => document.fonts.ready);
      await settle(page);
      const baked = await bakedHosts(page);
      const black = await bodiesIn(page, false);
      const white = await bodiesIn(page, true);
      await page.evaluate(() =>
        document.documentElement.setAttribute('data-bloom-material-bake', 'off'),
      );
      await settle(page);
      const control = await bakedHosts(page);
      const live = await shot(page);
      await page.evaluate(() =>
        document.documentElement.removeAttribute('data-bloom-material-bake'),
      );
      await settle(page);
      const diff = await compare(page, { live, baked: await shot(page), black, white });
      const label = `${story.id} (${theme})`;
      console.log(
        `${label}: ${baked.count} baked [${baked.ids.join(', ')}]; worst ${diff.worst} levels (${diff.over} pixels over ${TOLERANCE}), outline ${diff.worstOutline}`,
      );
      if (control.count !== 0) failures.push(`${label}: the control left ${control.count} baked`);
      if (diff.worst > TOLERANCE)
        failures.push(`${label}: differs from live by ${diff.worst} levels`);
      if (diff.worstOutline > OUTLINE_TOLERANCE)
        failures.push(`${label}: outline differs from live by ${diff.worstOutline} levels`);
      if (FLAT.includes(story) && baked.count === 0) failures.push(`${label}: nothing baked`);
      for (const id of story.baked ?? [])
        if (!baked.ids.includes(id)) failures.push(`${label}: ${id} did not bake`);
      if (UNKNOWN.includes(story) && baked.count !== 0)
        failures.push(`${label}: ${baked.count} baked over a picture`);
      for (const id of LIVE)
        if (baked.ids.includes(id)) failures.push(`${label}: ${id} baked over a picture`);
    }
  }
} finally {
  await browser.close();
}
assert.deepEqual(failures, [], failures.join('\n'));
console.log('baked material: the same pixels where it bakes, live where it must');
