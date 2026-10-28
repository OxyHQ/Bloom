/**
 * Proportional splits keep their ratio through a window resize; drop zones stage and resolve.
 *
 * Every wait is on a condition the page reaches (a layout that has stopped
 * changing, a target that has settled at a stage), never on elapsed time, so
 * a loaded machine makes it slower, not wrong. The timeouts only bound a hang.
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { PANEL_DROP_EDGES, panelDropZoneRect } = await import('../src/app-shell/panel-drop.ts');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const base = process.env.STORYBOOK_URL ?? 'http://localhost:6007';
const HANG = 30000;
const STILL_FRAMES = 6;
const browser = await chromium.launch();

/**
 * The three panes' widths once they have stopped moving: the same for
 * `STILL_FRAMES` frames in a row, and (given `changedFrom`) no longer all equal
 * to those, so a layout that has not reacted yet is not mistaken for a settled one.
 */
async function settledWidths(page, changedFrom = null) {
  await page.evaluate(() => {
    window.__splitHistory = [];
  });
  const handle = await page.waitForFunction(
    ({ changedFrom, still }) => {
      const widths = ['left', 'stack', 'right'].map(
        (id) =>
          document
            .querySelector(`[data-testid="proportional-split-panels-${id}"]`)
            ?.getBoundingClientRect().width ?? Number.NaN,
      );
      const history = window.__splitHistory;
      history.push(widths);
      if (history.length > still) history.shift();
      if (widths.some(Number.isNaN)) return false;
      if (changedFrom && widths.every((w, i) => Math.abs(w - changedFrom[i]) < 0.5)) return false;
      const steady = history.every((frame) =>
        frame.every((w, i) => Math.abs(w - widths[i]) < 0.01),
      );
      return history.length === still && steady ? widths : false;
    },
    { changedFrom, still: STILL_FRAMES },
    { polling: 'raf', timeout: HANG },
  );
  return handle.jsonValue();
}

try {
  for (const dir of ['ltr', 'rtl']) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${base}/iframe.html?id=blocks-app-shell--proportional-split&viewMode=story`);
    await page.getByTestId('proportional-split-panels-left').waitFor();
    await page.evaluate(() => document.fonts.ready);
    if (dir === 'rtl') {
      await page.evaluate(() => document.documentElement.setAttribute('dir', 'rtl'));
      await page.waitForFunction(
        () => {
          const box = (id) =>
            document
              .querySelector(`[data-testid="proportional-split-panels-${id}"]`)
              .getBoundingClientRect();
          return box('left').left > box('right').left;
        },
        null,
        { polling: 'raf', timeout: HANG },
      );
    }
    const [a0, b0, c0] = await settledWidths(page);
    assert.ok(Math.abs(a0 - b0) < 1 && Math.abs(b0 - c0) < 1, `equal thirds: ${a0} ${b0} ${c0}`);
    const grip = page.getByTestId('proportional-split-panels-left-divider');
    const box = await grip.boundingBox();
    const sign = dir === 'rtl' ? -1 : 1;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    for (let step = 1; step <= 10; step++)
      await page.mouse.move(box.x + box.width / 2 + sign * 15 * step, box.y + box.height / 2);
    await page.mouse.up();
    const [a1, b1, c1] = await settledWidths(page, [a0, b0, c0]);
    assert.ok(Math.abs(a1 - (a0 + 150)) < 2, `dragged 150: ${a0} → ${a1}`);
    assert.ok(Math.abs(b1 - (b0 - 150)) < 2, `neighbour gave 150: ${b0} → ${b1}`);
    assert.ok(Math.abs(c1 - c0) < 1, `third pane untouched: ${c0} → ${c1}`);
    await page.setViewportSize({ width: 1000, height: 900 });
    const [a2, b2, c2] = await settledWidths(page, [a1, b1, c1]);
    for (const [before, after, name] of [
      [a1 / (a1 + b1 + c1), a2 / (a2 + b2 + c2), 'left'],
      [b1 / (a1 + b1 + c1), b2 / (a2 + b2 + c2), 'stack'],
    ])
      assert.ok(
        Math.abs(before - after) < 0.003,
        `${dir} ${name} keeps its share: ${before} → ${after}`,
      );
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    assert.equal(overflow, false);
    console.log(
      `PASS ${dir} split: ${a1.toFixed(1)}/${b1.toFixed(1)}/${c1.toFixed(1)} at 1440 → ${a2.toFixed(1)}/${b2.toFixed(1)}/${c2.toFixed(1)} at 1000`,
    );
    await page.close();
  }

  // The story sweeps a simulated drag across the window, so each target passes
  // through its stages on its own. A stage is judged once a target has REACHED
  // it: at the stage, at the size `panelDropZoneRect` gives it. The first frame
  // a stage shows is mid-motion, its width anywhere between the previous
  // stage's and its own, so comparing first frames compared two points of an
  // animation and failed whenever a loaded machine sampled them late.
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${base}/iframe.html?id=blocks-app-shell--panel-drop-zones&viewMode=story`);
  await page.waitForFunction(
    () => document.querySelectorAll('[data-bloom-panel-drop-stage]').length === 4,
    null,
    { polling: 'raf', timeout: HANG },
  );
  const overlays = await page.evaluate(() =>
    Object.fromEntries(
      [...document.querySelectorAll('[data-testid^="bloom-panel-drop-zones-"]')].map((node) => {
        const box = node.getBoundingClientRect();
        return [node.getAttribute('data-testid'), { width: box.width, height: box.height }];
      }),
    ),
  );
  const goals = {};
  for (const [overlay, size] of Object.entries(overlays))
    for (const edge of PANEL_DROP_EDGES)
      for (const stage of ['grown', 'active'])
        goals[`${overlay} ${edge} ${stage}`] = panelDropZoneRect(
          { x: 0, y: 0, ...size },
          edge,
          stage,
        ).width;
  await page.evaluate(
    ({ goals, overlays }) => {
      const state = { frames: 0, problems: [], stages: new Set(), reached: {} };
      window.__dropZones = state;
      const note = (problem) => {
        if (state.problems.length < 5) state.problems.push(problem);
      };
      const tick = () => {
        state.frames++;
        const zones = [...document.querySelectorAll('[data-bloom-panel-drop-stage]')];
        if (zones.length !== 4) note(`${zones.length} targets, not two on each pane`);
        for (const node of zones) {
          const overlay = node.parentElement;
          if (getComputedStyle(overlay).pointerEvents !== 'none')
            note('a target overlay takes the pointer');
          const id = overlay.getAttribute('data-testid');
          const box = overlay.getBoundingClientRect();
          if (box.width !== overlays[id]?.width || box.height !== overlays[id]?.height)
            note(`${id} resized while a fixed window held still`);
          const stage = node.getAttribute('data-bloom-panel-drop-stage');
          state.stages.add(stage);
          const goal = goals[`${id} ${node.getAttribute('data-bloom-panel-drop')} ${stage}`];
          const width = node.getBoundingClientRect().width;
          if (goal !== undefined && Math.abs(width - goal) < 0.5 && !(stage in state.reached))
            state.reached[stage] = {
              width,
              goal,
              background: getComputedStyle(node).backgroundColor,
            };
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    },
    { goals, overlays },
  );
  await page.waitForFunction(
    () => {
      const { reached } = window.__dropZones;
      return 'grown' in reached && 'active' in reached;
    },
    null,
    { polling: 'raf', timeout: HANG },
  );
  const seen = await page.evaluate(() => {
    const state = window.__dropZones;
    return {
      frames: state.frames,
      problems: state.problems,
      stages: [...state.stages],
      reached: state.reached,
    };
  });
  assert.deepEqual(seen.problems, [], `over ${seen.frames} frames`);
  const { grown, active } = seen.reached;
  assert.notEqual(active.background, grown.background, 'the active target is painted differently');
  assert.ok(active.width > grown.width, `active ${active.width} wider than grown ${grown.width}`);
  console.log(
    `PASS drop zones: stages ${seen.stages.join(', ')} over ${seen.frames} frames; grown reached ${grown.width.toFixed(1)}px (goal ${grown.goal.toFixed(1)}), active ${active.width.toFixed(1)}px (goal ${active.goal.toFixed(1)})`,
  );
  await page.close();
} finally {
  await browser.close();
}
