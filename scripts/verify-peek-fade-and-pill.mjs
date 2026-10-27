/**
 * A fading peek and a split's pill divider, read off real frames in Chromium.
 *
 * Fading Peek (App Shell / Window): resting the pointer on the window's start
 * edge slides the hidden sidebar in over 180 ms on an ease-out cubic while it
 * fades. Every frame records the fade's own progress (`--bloom-nav-peek-fade`,
 * read at the transition's `currentTime`), a row's opacity, the opacity of the
 * material button's body layer (`::before`) and every trigger on the button's
 * ancestors. The fade, the row and the material layer must follow the curve
 * together, and no ancestor of the material host may ever take an opacity
 * below 1 or a filter. Leaving fades it out the same way.
 *
 * Pill Dividers: the 4×36 bar sits centred in the 7 pt gap on an 11 pt strip,
 * is invisible at rest, 0.32 under the pointer and 0.55 while dragging, and a
 * drag resizes the panes. Right to left, the strip is still centred in the gap.
 * Reduced motion shows the hover state at once.
 *
 * Usage: start Storybook, then
 *   STORYBOOK_URL=http://localhost:6006 node scripts/verify-peek-fade-and-pill.mjs
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE ?? 'playwright');

function bezier([x1, y1, x2, y2]) {
  const axis = (a, b, t) => 3 * (1 - t) ** 2 * t * a + 3 * (1 - t) * t * t * b + t ** 3;
  return (fraction) => {
    if (fraction <= 0) return 0;
    if (fraction >= 1) return 1;
    let low = 0;
    let high = 1;
    let t = fraction;
    for (let step = 0; step < 40; step++) {
      const x = axis(x1, x2, t);
      if (Math.abs(x - fraction) < 1e-7) break;
      if (x < fraction) low = t;
      else high = t;
      t = (low + high) / 2;
    }
    return axis(y1, y2, t);
  };
}
const easeOutCubic = bezier([0.215, 0.61, 0.355, 1]);
const DURATION = 180;

const base = process.env.STORYBOOK_URL ?? 'http://localhost:6006';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

async function traceFade() {
  return page.evaluate(async () => {
    const host = document.querySelector('[data-testid="window-navigation-host"]');
    const row = Array.from(host.querySelectorAll('div[dir="auto"]')).find(
      (node) => node.textContent === 'Inbox',
    );
    const button = document.querySelector('[data-testid="window-new-tab"]');
    const samples = [];
    const begun = performance.now();
    const pieceOpacity = (node) => {
      let opacity = 1;
      for (let at = node; at && at !== host; at = at.parentElement)
        opacity *= Number.parseFloat(getComputedStyle(at).opacity);
      return opacity;
    };
    await new Promise((resolve) => {
      const frame = () => {
        const fade = host
          .getAnimations()
          .find((animation) => animation.transitionProperty === '--bloom-nav-peek-fade');
        const triggers = [];
        for (let at = button; at; at = at.parentElement) {
          const style = getComputedStyle(at);
          if (Number.parseFloat(style.opacity) < 1) triggers.push(`opacity ${style.opacity}`);
          if (style.filter !== 'none') triggers.push(`filter ${style.filter}`);
        }
        if (fade && fade.currentTime != null)
          samples.push({
            t: fade.currentTime,
            fade: Number.parseFloat(
              getComputedStyle(host).getPropertyValue('--bloom-nav-peek-fade'),
            ),
            row: pieceOpacity(row),
            material: Number.parseFloat(getComputedStyle(button, '::before').opacity),
            left: host.getBoundingClientRect().left,
            triggers,
          });
        else if (triggers.length) samples.push({ t: -1, triggers });
        if (performance.now() - begun < 450) requestAnimationFrame(frame);
        else resolve(samples);
      };
      requestAnimationFrame(frame);
    });
    return samples;
  });
}

function checkFade(samples, direction, label) {
  const moving = samples.filter((sample) => sample.t >= 0);
  assert.ok(moving.length >= 4, `${label}: ${moving.length} frames sampled`);
  let worst = 0;
  let worstRow = 0;
  let worstMaterial = 0;
  for (const sample of moving) {
    const progress = easeOutCubic(sample.t / DURATION);
    const expected = direction === 'in' ? progress : 1 - progress;
    worst = Math.max(worst, Math.abs(sample.fade - expected));
    worstRow = Math.max(worstRow, Math.abs(sample.row - sample.fade));
    worstMaterial = Math.max(worstMaterial, Math.abs(sample.material - sample.fade));
  }
  for (const sample of samples)
    assert.deepEqual(sample.triggers, [], `${label}: a material host's ancestor at ${sample.t}`);
  assert.ok(worst <= 0.02, `${label}: the fade is ${worst.toFixed(3)} off the curve`);
  assert.ok(worstRow <= 0.06, `${label}: the row trails the fade by ${worstRow.toFixed(3)}`);
  assert.ok(
    worstMaterial <= 0.02,
    `${label}: the material layer is ${worstMaterial.toFixed(3)} from the fade`,
  );
  const mid = moving.filter((sample) => sample.fade > 0.15 && sample.fade < 0.85).length;
  assert.ok(mid >= 1, `${label}: ${mid} frames mid-fade`);
  return { worst, worstRow, worstMaterial, frames: moving.length };
}

try {
  await page.goto(`${base}/iframe.html?id=blocks-app-shell-window--fading-peek&viewMode=story`);
  await page.getByTestId('window-navigation-host').waitFor({ state: 'attached' });
  await page.mouse.move(700, 400);
  await page.waitForTimeout(600);
  const resting = await page.evaluate(() => {
    const host = document.querySelector('[data-testid="window-navigation-host"]');
    return getComputedStyle(host).getPropertyValue('--bloom-nav-peek-fade').trim();
  });
  assert.equal(resting, '0', 'hidden: the fade waits at nothing');

  const opening = traceFade();
  await page.mouse.move(2, 400);
  const fadeIn = checkFade(await opening, 'in', 'fading in');
  await page.waitForTimeout(150);
  const open = await page.evaluate(() => {
    const host = document.querySelector('[data-testid="window-navigation-host"]');
    const button = document.querySelector('[data-testid="window-new-tab"]');
    return {
      left: Math.round(host.getBoundingClientRect().left),
      material: getComputedStyle(button, '::before').opacity,
      blur: getComputedStyle(button, '::before').backdropFilter,
    };
  });
  assert.equal(open.left, 5, 'peeking 5 from the window');
  assert.equal(open.material, '1', 'the material is whole once in');
  assert.notEqual(open.blur, 'none', 'and blurs its backdrop');

  // Into the peek, then out to the page: it fades out after the hide delay.
  await page.mouse.move(100, 400);
  const closing = traceFade();
  await page.mouse.move(700, 400);
  const fadeOut = checkFade(await closing, 'out', 'fading out');

  // Pill dividers.
  await page.goto(`${base}/iframe.html?id=blocks-app-shell-window--pill-dividers&viewMode=story`);
  const handle = page.locator('[data-bloom-resize-handle-variant="pill"]').first();
  await handle.waitFor({ state: 'attached' });
  await page.mouse.move(700, 700);
  await page.waitForTimeout(300);
  const read = () =>
    page.evaluate(() => {
      const strip = document.querySelector('[data-bloom-resize-handle-variant="pill"]');
      const pill = strip.querySelector('[data-bloom-resize-handle-pill]');
      const first = document.querySelector('[data-bloom-panel-index="0"]').getBoundingClientRect();
      const second = document.querySelector('[data-bloom-panel-index="1"]').getBoundingClientRect();
      const s = strip.getBoundingClientRect();
      const p = pill.getBoundingClientRect();
      return {
        strip: { left: s.left, width: s.width },
        pill: {
          width: p.width,
          height: p.height,
          centerX: p.left + p.width / 2,
          centerY: p.top + p.height / 2,
        },
        stripCenterY: s.top + s.height / 2,
        gap: { start: Math.min(first.right, second.right), end: Math.max(first.left, second.left) },
        firstWidth: first.width,
        opacity: getComputedStyle(pill).opacity,
        radius: getComputedStyle(pill).borderTopLeftRadius,
        cursor: getComputedStyle(strip).cursor,
      };
    });
  const rest = await read();
  assert.deepEqual(
    { width: rest.pill.width, height: rest.pill.height },
    { width: 4, height: 36 },
    'the pill is 4×36',
  );
  assert.equal(rest.radius, '2px');
  assert.equal(rest.opacity, '0', 'invisible at rest');
  assert.equal(rest.strip.width, 11, 'its strip is the 7 pt gap plus 2 pt of each pane');
  const gapCenter = (rest.gap.start + rest.gap.end) / 2;
  assert.ok(Math.abs(rest.gap.end - rest.gap.start - 7) < 0.6, 'the panes are 7 apart');
  assert.ok(Math.abs(rest.pill.centerX - gapCenter) < 0.6, 'the pill is centred in the gap');
  assert.ok(Math.abs(rest.pill.centerY - rest.stripCenterY) < 0.6, 'and along it');
  assert.equal(rest.cursor, 'col-resize');

  const x = rest.pill.centerX;
  const y = rest.pill.centerY;
  await page.mouse.move(x, y);
  await page.waitForTimeout(250);
  assert.equal((await read()).opacity, '0.32', '0.32 under the pointer');
  await page.mouse.down();
  await page.waitForTimeout(250);
  assert.equal((await read()).opacity, '0.55', '0.55 while dragging');
  await page.mouse.move(x + 60, y, { steps: 6 });
  await page.waitForTimeout(50);
  const dragged = await read();
  assert.ok(
    Math.abs(dragged.firstWidth - rest.firstWidth - 60) < 1.5,
    `the drag resizes the pane (${dragged.firstWidth - rest.firstWidth})`,
  );
  assert.equal(dragged.opacity, '0.55', 'still 0.55 away from the strip mid-drag');
  await page.mouse.up();
  await page.mouse.move(700, 700);
  await page.waitForTimeout(250);
  assert.equal((await read()).opacity, '0', 'gone once the pointer leaves');

  await page.evaluate(() => document.documentElement.setAttribute('dir', 'rtl'));
  await page.waitForTimeout(300);
  const mirrored = await read();
  const mirroredGap = (mirrored.gap.start + mirrored.gap.end) / 2;
  assert.ok(
    Math.abs(mirrored.strip.left + mirrored.strip.width / 2 - mirroredGap) < 0.6,
    'RTL: the strip is centred in the gap',
  );
  assert.ok(Math.abs(mirrored.pill.centerX - mirroredGap) < 0.6, 'RTL: and so is the pill');
  await page.evaluate(() => document.documentElement.removeAttribute('dir'));

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  await handle.waitFor({ state: 'attached' });
  await page.mouse.move(700, 700);
  await page.waitForTimeout(500);
  const reducedRest = await read();
  await page.mouse.move(reducedRest.pill.centerX, reducedRest.pill.centerY);
  await page.waitForTimeout(32);
  assert.equal((await read()).opacity, '0.32', 'reduced motion: the hover state lands at once');

  console.log(
    `PASS peek fade: in ${fadeIn.frames} frames ±${fadeIn.worst.toFixed(3)} of the curve (row ±${fadeIn.worstRow.toFixed(3)}, material ±${fadeIn.worstMaterial.toFixed(3)}), out ${fadeOut.frames} frames ±${fadeOut.worst.toFixed(3)} (row ±${fadeOut.worstRow.toFixed(3)}, material ±${fadeOut.worstMaterial.toFixed(3)}), no material ancestor faded; pill 4×36 centred in the 7 pt gap on an 11 pt strip, 0/0.32/0.55, drag resizes, RTL centred, reduced motion instant`,
  );
} finally {
  await browser.close();
}
