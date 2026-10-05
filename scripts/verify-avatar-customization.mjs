/** Real editor interactions. Observes public runtime callbacks so a changed
 * selection cannot pass merely because the previous portrait is still visible.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';

const { chromium } = createRequire(import.meta.url)(
  process.env.BLOOM_PLAYWRIGHT_MODULE || 'playwright',
);
const options = JSON.parse(
  execFileSync(
    'bun',
    [
      '-e',
      "import {CHARACTER_OPTIONS} from './src/agent-creator/constants'; console.log(JSON.stringify(CHARACTER_OPTIONS));",
    ],
    { cwd: new URL('..', import.meta.url), encoding: 'utf8' },
  ),
);
const base = process.argv[2] || 'http://localhost:6006';
const browser = await chromium.launch({ args: ['--no-sandbox'] });
try {
  const page = await browser.newPage({
    viewport: { width: 1400, height: 1200 },
    reducedMotion: 'reduce',
  });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  // The editor still calls the real runtime; only its public callbacks and
  // update props are observed. No production source or control is mocked.
  await page.route('**/bloom-character/runtime.mjs?*', (route) => {
    if (route.request().url().includes('customization-core'))
      return route.continue();
    return route.fulfill({
      contentType: 'text/javascript',
      body: `
      import * as runtime from '/bloom-character/runtime.mjs?customization-core';
      export * from '/bloom-character/runtime.mjs?customization-core';
      window.customizationGate ??= {entries:[], errors:[], runtime};
      export async function createAvatar(canvas, props, callbacks) {
        const entry = {canvas, props, paints:0, paintedKey:null, capabilities:null};
        customizationGate.entries.push(entry);
        const controller = await runtime.createAvatar(canvas, props, {
          ...callbacks,
          onCapabilities(value) {entry.capabilities=value; callbacks.onCapabilities?.(value);},
          onPaint() {entry.paints++; entry.paintedKey=entry.capabilities?.key; callbacks.onPaint?.();},
          onError(error) {customizationGate.errors.push(String(error)); callbacks.onError?.(error);},
        });
        return {...controller, update(next) {entry.props=next; controller.update(next);}};
      }
      globalThis[Symbol.for('bloom.character.runtimes')].set(import.meta.url, {createAvatar});
    `,
    });
  });
  await page.goto(
    `${base}/iframe.html?id=application-agent-avatar-characters--clippo&viewMode=story`,
  );
  const snapshot = () =>
    page.evaluate(() => {
      const entry = customizationGate.entries.find((item) =>
        item.canvas.closest('[data-testid="clippo-preview"]'),
      );
      if (!entry) return null;
      const canvas = entry.canvas;
      const data = canvas
        .getContext('2d')
        .getImageData(0, 0, canvas.width, canvas.height).data;
      let painted = 0,
        hash = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 24) painted++;
        hash =
          (Math.imul(hash, 31) +
            data[i] +
            data[i + 1] +
            data[i + 2] +
            data[i + 3]) |
          0;
      }
      return {
        paints: entry.paints,
        character: entry.props.config.character,
        capabilities: entry.capabilities,
        paintedKey: entry.paintedKey,
        painted,
        hash,
      };
    });
  const settle = async (previous = -1) => {
    await page
      .locator('[data-testid="clippo-preview"]')
      .scrollIntoViewIfNeeded();
    try {
      await page.waitForFunction(
        (previous) => {
          const gate = window.customizationGate;
          if (!gate) return false;
          const entry = gate.entries.find((item) =>
            item.canvas.closest('[data-testid="clippo-preview"]'),
          );
          if (gate.errors.length) throw new Error(gate.errors.join('\n'));
          return (
            entry?.paints > previous &&
            entry.paintedKey === JSON.stringify(entry.props.config.character)
          );
        },
        previous,
        { timeout: 180000 },
      );
    } catch (error) {
      console.error(
        await page.evaluate(() => ({
          gate: window.customizationGate?.entries.map((e) => ({
            connected: e.canvas.isConnected,
            host: e.canvas
              .closest('[data-testid]')
              ?.getAttribute('data-testid'),
            props: e.props,
            paints: e.paints,
            paintedKey: e.paintedKey,
            capabilities: e.capabilities,
          })),
          text: document.body.innerText,
        })),
      );
      await page.screenshot({
        path: '/tmp/bloom-customization-failure.png',
        fullPage: true,
      });
      throw error;
    }
    const state = await snapshot();
    console.log('Painted', state.character);
    assert.ok(state.painted > 300, 'Selected recipe must paint actual pixels');
    assert.equal(
      await page.getByText('Avatar unavailable', { exact: true }).count(),
      0,
    );
    return state;
  };
  await settle();
  const choose = async (label, title) => {
    await page.getByRole('button', { name: label, exact: true }).click();
    const item = page.getByRole('radio', { name: title, exact: true });
    assert.equal(
      await item.isEnabled(),
      true,
      `${label}: ${title} must be available`,
    );
    await item.click();
  };
  const initial = await snapshot();
  await choose('Avatar style', 'Todd');
  let state = await settle(initial.paints);
  assert.equal(state.character.preset, 'lime_frog');
  const toddShape = state.capabilities.selected.shape;
  const results = [];
  for (const [id, title] of options.eyes.filter(([id]) => id !== 'todd')) {
    const before = state;
    const chip = page.getByRole('button', { name: title, exact: true });
    assert.equal(await chip.isEnabled(), true, `Todd body supports ${id}`);
    await chip.click();
    state = await settle(before.paints);
    assert.equal(state.capabilities.selected.eyes, id);
    assert.equal(
      state.capabilities.selected.shape,
      toddShape,
      'Eye changes retain Todd body',
    );
    assert.equal(state.character.preset, 'lime_frog');
    assert.notEqual(
      state.hash,
      before.hash,
      `${id} must change visible eye geometry`,
    );
    results.push({
      eyes: id,
      shape: toddShape,
      painted: state.painted,
      hash: state.hash,
    });
  }
  await page.getByRole('button', { name: 'Todd', exact: true }).click();
  state = await settle(state.paints);
  assert.equal(
    await page
      .getByRole('slider', { name: 'Eye spacing', exact: true })
      .count(),
    0,
    'Each shape supplies its own eye layout',
  );
  const shape = page.getByRole('listbox', {
    name: 'Avatar shape',
    exact: true,
  });
  assert.equal(await shape.locator('canvas').count(), 0);
  await shape.focus();
  await page.keyboard.press('ArrowRight');
  state = await settle(state.paints);
  assert.equal(
    state.capabilities.selected.eyes,
    'todd',
    'Shape changes keep the selected eyes',
  );
  assert.equal(
    state.character.eyeSpacing,
    undefined,
    'Shape changes do not write a spacing override',
  );
  const beforePreset = state;
  await choose('Avatar style', 'Clippo');
  state = await settle(beforePreset.paints);
  for (const title of ['Felipe’s beret', 'Headphones', 'Hat', 'Off']) {
    const before = state;
    await choose('Accessory', title);
    state = await settle(before.paints);
    await page.screenshot({
      path: `/tmp/bloom-clippo-accessory-${title.replaceAll(/[^a-z]/gi, '-')}.png`,
      fullPage: true,
    });
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(await page.evaluate(() => customizationGate.errors), []);
  fs.writeFileSync(
    '/tmp/bloom-customization-editor.json',
    JSON.stringify(results, null, 2),
  );
  console.log(
    'PASS: Todd body accepts every eye through the editor, shape-owned eye placement has no editor slider, shape changes preserve choices, and Clippo accessories paint.',
  );
} finally {
  await browser.close();
}
