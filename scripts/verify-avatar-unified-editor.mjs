/** Real keyboard/pointer edits through all 21 shapes. Assert saved recipe,
 * actual completed paints and stable canvas identity across former families. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';

const { chromium } = createRequire(import.meta.url)(
  process.env.BLOOM_PLAYWRIGHT_MODULE || 'playwright',
);
const shapes = JSON.parse(
  execFileSync(
    'bun',
    [
      '-e',
      "import {CHARACTER_SHAPES} from './src/agent-avatar/character-shapes'; console.log(JSON.stringify(CHARACTER_SHAPES));",
    ],
    { cwd: new URL('..', import.meta.url), encoding: 'utf8' },
  ),
);
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const page = await browser.newPage({
  viewport: { width: 1400, height: 1200 },
  reducedMotion: 'reduce',
});
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
try {
  await page.route('**/bloom-character/runtime.mjs?*', (route) => {
    if (route.request().url().includes('unified-editor-core'))
      return route.continue();
    return route.fulfill({
      contentType: 'text/javascript',
      body: `
      import * as runtime from '/bloom-character/runtime.mjs?unified-editor-core';
      export * from '/bloom-character/runtime.mjs?unified-editor-core';
      window.unifiedGate ??= {entries:[], errors:[], runtime};
      export async function createAvatar(canvas, props, callbacks) {
        const entry = {canvas, props, paints:0, paintedKey:null, caps:null};
        unifiedGate.entries.push(entry);
        const control = await runtime.createAvatar(canvas, props, {
          ...callbacks,
          onCapabilities(caps) {entry.caps=caps; callbacks.onCapabilities?.(caps);},
          onPaint() {entry.contextsAtPaint=runtime.runtimeStats().surface.contexts; entry.paints++; entry.paintedKey=entry.caps?.key; callbacks.onPaint?.();},
          onError(error) {unifiedGate.errors.push(String(error)); callbacks.onError?.(error);},
        });
        return {...control, update(next) {entry.props=next; control.update(next);}};
      }
      globalThis[Symbol.for('bloom.character.runtimes')].set(import.meta.url, {createAvatar});
    `,
    });
  });
  await page.goto(
    `${process.argv[2] || 'http://localhost:6006'}/iframe.html?id=application-agent-avatar-characters--universal-customization&viewMode=story`,
  );
  const settle = async (expected = {}) => {
    await page
      .locator('[data-testid="universal-avatar-preview"]')
      .scrollIntoViewIfNeeded();
    await page.waitForFunction(
      (expected) => {
        const gate = window.unifiedGate;
        if (gate?.errors.length) throw Error(gate.errors.join('\n'));
        const e = gate?.entries.find((e) =>
          e.canvas.closest('[data-testid="universal-avatar-preview"]'),
        );
        return (
          e?.paints &&
          e.paintedKey === JSON.stringify(e.props.config.character) &&
          Object.entries(expected).every(
            ([key, value]) =>
              e.props.config.character.selections?.[key] === value,
          )
        );
      },
      expected,
      { timeout: 180000 },
    );
    return page.evaluate(() => {
      const e = unifiedGate.entries.find((e) =>
        e.canvas.closest('[data-testid="universal-avatar-preview"]'),
      );
      const c = e.canvas,
        p = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      let blue = 0,
        painted = 0;
      for (let i = 0; i < p.length; i += 4)
        if (p[i + 3] > 32) {
          painted++;
          if (p[i + 2] > p[i] * 1.4 && p[i + 2] > p[i + 1] * 1.1) blue++;
        }
      return {
        character: e.props.config.character,
        selected: e.caps.selected,
        blue,
        painted,
        mounts: unifiedGate.entries.length,
        contexts: unifiedGate.runtime.runtimeStats().surface.contexts,
        contextsAtPaint: e.contextsAtPaint,
      };
    });
  };
  const choose = async (label, title) => {
    const trigger = page.getByRole('button', { name: label, exact: true });
    assert.equal(await trigger.isEnabled(), true);
    await trigger.click();
    const option = page.getByRole('radio', { name: title, exact: true });
    assert.equal(await option.isEnabled(), true);
    await option.click();
  };
  await settle();
  assert.equal(
    await page
      .getByRole('slider', { name: 'Eye spacing', exact: true })
      .count(),
    0,
    'Eye placement belongs to the shape, not an editor control',
  );
  await page.getByRole('button', { name: 'Blue avatar', exact: true }).click();
  await page.getByRole('button', { name: 'Todd', exact: true }).click();
  await choose('Accessory', 'Felipe’s beret');
  await choose('Eyewear', 'Monocle');
  let state = await settle({
    color: 'blue',
    eyes: 'todd',
    accessory: 'felipe_beret',
    eyewear: 'monocle',
  });
  const mounts = state.mounts;
  const shapeWheel = page.getByRole('listbox', {
    name: 'Avatar shape',
    exact: true,
  });
  assert.equal(await shapeWheel.locator('canvas').count(), 0);
  const rows = [];
  const verify = (state, id, eyes = 'todd') => {
    assert.equal(
      state.character.preset,
      'lime_frog',
      'Body choices retain preset defaults',
    );
    assert.equal(state.character.selections.shape, id);
    assert.equal(state.selected.shape, id);
    assert.equal(state.selected.eyes, eyes);
    assert.equal(state.selected.color, 'blue');
    assert.equal(state.selected.accessory, 'felipe_beret');
    assert.equal(state.selected.eyewear, 'monocle');
    assert.ok(
      state.blue > 80 && state.blue > state.painted * 0.12,
      `${id} paints selected blue, never procedural peach`,
    );
    assert.equal(
      state.mounts,
      mounts,
      'Switching shape retains the mounted renderer',
    );
    assert.ok(state.contextsAtPaint <= 1);
    assert.ok(state.contexts <= 1);
    rows.push({ id, ...state });
    console.log(`Painted ${rows.length}: ${id} (${eyes})`);
  };
  for (const [index, [id]] of shapes.entries()) {
    await shapeWheel.focus();
    await page.keyboard.press(index === 0 ? 'Home' : 'ArrowRight');
    verify(await settle({ shape: id }), id);
  }
  for (let index = shapes.length - 2; index >= 0; index--) {
    await shapeWheel.focus();
    await page.keyboard.press('ArrowLeft');
    verify(await settle({ shape: shapes[index][0] }), shapes[index][0]);
  }
  // Do not wait for the new shape to prepare before choosing the next piece.
  // The old editor disabled every chip while capabilities for that key loaded.
  await shapeWheel.focus();
  await page.keyboard.press('End');
  const single = page.getByRole('button', { name: 'Single eye', exact: true });
  assert.equal(
    await single.isEnabled(),
    true,
    'Known eyes remain available during preparation',
  );
  await single.click();
  verify(
    await settle({ shape: shapes.at(-1)[0], eyes: 'cyclops' }),
    shapes.at(-1)[0],
    'cyclops',
  );
  assert.equal(Math.max(...rows.map((row) => row.contextsAtPaint)), 1);
  await page.screenshot({
    path: '/tmp/bloom-unified-editor.png',
    fullPage: true,
  });
  assert.deepEqual(errors, []);
  assert.deepEqual(await page.evaluate(() => unifiedGate.errors), []);
  fs.writeFileSync(
    '/tmp/bloom-unified-editor.json',
    JSON.stringify(rows, null, 2),
  );
  console.log(
    `PASS: ${rows.length} real edits preserve recipe, blue paint, eyes, hat, eyewear and canvas; pending eye choice accepted.`,
  );
} catch (error) {
  await page.screenshot({
    path: '/tmp/bloom-unified-editor-failure.png',
    fullPage: true,
  });
  console.error(
    await page.evaluate(() => ({
      text: document.body.innerText,
      errors: window.unifiedGate?.errors,
      entries: window.unifiedGate?.entries.map((e) => ({
        connected: e.canvas.isConnected,
        props: e.props,
        caps: e.caps,
        paintedKey: e.paintedKey,
      })),
    })),
  );
  throw error;
} finally {
  await browser.close();
}
