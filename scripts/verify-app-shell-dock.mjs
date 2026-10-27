/**
 * A docked sidebar's motion, read off real frames in Chromium.
 *
 * Hiding and showing the sidebar of the Window story, every animation frame
 * records the content card's start edge and the sidebar's far edge. Both must
 * follow ONE spring (response 0.215 s, damping ratio 0.79) — the card's edge
 * from 190 to 7 and back, the sidebar from 190 to 0 — within 2 points of its
 * closed form, with no JavaScript running per frame (the motion is a CSS
 * transition of a registered custom property). Then the peek: resting the
 * pointer on the window's start edge floats the same sidebar 5 points from the
 * window's edges while the card does not move, and leaving it slides it out.
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE ?? 'playwright');

function springOf(response, ratio) {
  return (t) => {
    if (t <= 0) return 0;
    const omega = (2 * Math.PI) / response;
    const wd = omega * Math.sqrt(1 - ratio * ratio);
    return (
      1 -
      Math.exp(-ratio * omega * t) * (Math.cos(wd * t) + ((ratio * omega) / wd) * Math.sin(wd * t))
    );
  };
}
const spring = springOf(0.215, 0.79);
const peekSpring = springOf(0.185, 0.77);

const base = process.env.STORYBOOK_URL ?? 'http://localhost:6007';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
try {
  await page.goto(`${base}/iframe.html?id=blocks-app-shell-window--docked-sidebar&viewMode=story`);
  await page.getByTestId('window-navigation-host').waitFor();
  // Away from the window's edge: the pointer starts at its corner.
  await page.mouse.move(700, 400);
  await page.waitForTimeout(600);

  const edges = () =>
    page.evaluate(() => {
      const card = document.querySelector('[data-bloom-panel-index="0"]').getBoundingClientRect();
      const host = document
        .querySelector('[data-testid="window-navigation-host"]')
        .getBoundingClientRect();
      return { card: card.left, cardRight: card.right, top: card.top, host: host.right };
    });
  const rest = await edges();
  assert.equal(rest.card, 190, 'docked: the card starts at the sidebar');
  assert.equal(rest.top, 6, 'the card sits 6 from the top');
  assert.equal(Math.round(rest.cardRight), 1280 - 7, 'and 7 from the end edge');

  // Each sample reads the transition's own clock (its `currentTime`) and the
  // laid-out edges at that instant, so frame pacing cannot skew the comparison.
  const trace = async (press) =>
    page.evaluate(async (testId) => {
      const root = document.querySelector('[data-testid="window"]');
      const card = document.querySelector('[data-bloom-panel-index="0"]');
      const host = document.querySelector('[data-testid="window-navigation-host"]');
      const samples = [];
      document.querySelector(`[data-testid="${testId}"]`).click();
      const begun = performance.now();
      await new Promise((resolve) => {
        const frame = () => {
          const motion = root
            .getAnimations()
            .find((animation) => animation.transitionProperty === '--bloom-nav-dock');
          if (motion && motion.currentTime != null)
            samples.push({
              t: motion.currentTime,
              card: card.getBoundingClientRect().left,
              host: host.getBoundingClientRect().right,
            });
          if (performance.now() - begun < 600) requestAnimationFrame(frame);
          else resolve();
        };
        requestAnimationFrame(frame);
      });
      return samples;
    }, press);

  const check = (samples, from, to, key, label) => {
    assert.ok(samples.length >= 5, `${label}: ${samples.length} frames sampled`);
    let worst = 0;
    for (const { t, [key]: x } of samples)
      worst = Math.max(worst, Math.abs(from + (to - from) * spring(t / 1000) - x));
    assert.ok(worst <= 1, `${label}: worst ${worst.toFixed(2)} pt from the spring`);
    return worst;
  };

  const hide = await trace('toggle-Page');
  const hideCard = check(hide, 190, 7, 'card', 'hiding, the card edge');
  const hideHost = check(hide, 190, 0, 'host', 'hiding, the sidebar edge');
  const away = await edges();
  assert.equal(away.card, 7, 'hidden: the card starts 7 from the window');

  const show = await trace('toggle-Page');
  const showCard = check(show, 7, 190, 'card', 'showing, the card edge');
  const settled = await edges();
  assert.equal(settled.card, 190, 'shown again: the card is back at the sidebar');
  const overshoot = Math.max(...show.map((sample) => sample.card)) - 190;
  assert.ok(overshoot > 0.5 && overshoot < 4, `showing overshoots ${overshoot.toFixed(2)} pt`);

  await page.getByTestId('toggle-Page').click();
  await page.waitForTimeout(500);
  // The peek slides in on its own spring, from past the edge (its far side 7
  // beyond it, shadow included) to 5 from the window, as the pointer rests on
  // the edge; the card never moves.
  await page.evaluate(() => {
    const host = document.querySelector('[data-testid="window-navigation-host"]');
    const samples = [];
    window.__bloomPeekStart = () => {
      const begun = performance.now();
      return new Promise((resolve) => {
        const frame = () => {
          const motion = host
            .getAnimations()
            .find((animation) => animation.transitionProperty === '--bloom-nav-peek');
          if (motion && motion.currentTime != null)
            samples.push({ t: motion.currentTime, left: host.getBoundingClientRect().left });
          if (performance.now() - begun < 500) requestAnimationFrame(frame);
          else resolve(samples);
        };
        requestAnimationFrame(frame);
      });
    };
  });
  await page.mouse.move(2, 400);
  const peekSamples = await page.evaluate(() => window.__bloomPeekStart());
  assert.ok(peekSamples.length >= 5, `peek: ${peekSamples.length} frames sampled`);
  let peekWorst = 0;
  for (const { t, left } of peekSamples)
    peekWorst = Math.max(peekWorst, Math.abs(5 - 202 * (1 - peekSpring(t / 1000)) - left));
  assert.ok(peekWorst <= 1, `peek: worst ${peekWorst.toFixed(2)} pt from its spring`);
  await page.waitForTimeout(200);
  const peek = await page.evaluate(() => {
    const host = document
      .querySelector('[data-testid="window-navigation-host"]')
      .getBoundingClientRect();
    const card = document.querySelector('[data-bloom-panel-index="0"]').getBoundingClientRect();
    return { left: host.left, top: host.top, bottom: innerHeight - host.bottom, card: card.left };
  });
  assert.deepEqual(
    { left: Math.round(peek.left), top: Math.round(peek.top), bottom: Math.round(peek.bottom) },
    { left: 5, top: 5, bottom: 5 },
    'the peek floats 5 from the window',
  );
  assert.equal(peek.card, 7, 'the card stays where it is');
  await page.mouse.move(700, 400);
  await page.waitForTimeout(600);
  const gone = await page.evaluate(
    () =>
      document.querySelector('[data-testid="window-navigation-host"]').getBoundingClientRect()
        .right,
  );
  assert.ok(gone <= 0, `the peek leaves past the edge (${gone})`);

  // Right to left: the same frame, mirrored.
  await page.getByTestId('toggle-Page').click();
  await page.waitForTimeout(500);
  await page.evaluate(() => document.documentElement.setAttribute('dir', 'rtl'));
  await page.waitForTimeout(300);
  const mirrored = await page.evaluate(() => {
    const card = document.querySelector('[data-bloom-panel-index="0"]').getBoundingClientRect();
    const host = document
      .querySelector('[data-testid="window-navigation-host"]')
      .getBoundingClientRect();
    return { cardRight: card.right, cardLeft: card.left, hostLeft: host.left };
  });
  assert.equal(Math.round(mirrored.cardRight), 1280 - 190, 'RTL: the card ends at the sidebar');
  assert.equal(Math.round(mirrored.cardLeft), 7, 'RTL: and starts 7 from the left edge');
  assert.equal(Math.round(mirrored.hostLeft), 1280 - 190, 'RTL: the sidebar is on the right');
  await page.getByTestId('toggle-Page').click();
  await page.waitForTimeout(500);
  const mirroredAway = await page.evaluate(() => ({
    card: document.querySelector('[data-bloom-panel-index="0"]').getBoundingClientRect().right,
    host: document.querySelector('[data-testid="window-navigation-host"]').getBoundingClientRect()
      .left,
  }));
  assert.equal(
    Math.round(mirroredAway.card),
    1280 - 7,
    'RTL hidden: the card ends 7 from the edge',
  );
  assert.ok(mirroredAway.host >= 1280, 'RTL hidden: the sidebar is past the right edge');
  await page.evaluate(() => document.documentElement.removeAttribute('dir'));

  // Reduced motion lands at once.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  await page.getByTestId('window-navigation-host').waitFor();
  await page.mouse.move(700, 400);
  await page.waitForTimeout(400);
  await page.getByTestId('toggle-Page').click();
  await page.waitForTimeout(32);
  const reduced = await page.evaluate(
    () => document.querySelector('[data-bloom-panel-index="0"]').getBoundingClientRect().left,
  );
  assert.equal(reduced, 7, 'reduced motion: hidden at once');

  console.log(
    `PASS dock: card ±${hideCard.toFixed(2)}/±${showCard.toFixed(2)} pt and sidebar ±${hideHost.toFixed(2)} pt of the spring, ${overshoot.toFixed(2)} pt overshoot; peek ±${peekWorst.toFixed(2)} pt of its spring at 5/5/5, card still; RTL mirrored; reduced motion instant`,
  );
} finally {
  await browser.close();
}
