/** Original-engine migration gate. Requires running Storybook and Bun.
 * BLOOM_PLAYWRIGHT_MODULE can point to an existing Playwright installation.
 * node scripts/verify-legacy-avatars.mjs [http://localhost:6006]
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.BLOOM_PLAYWRIGHT_MODULE || 'playwright');
const recipes = JSON.parse(
  execFileSync(
    'bun',
    [
      '-e',
      `
import { FOLD_CONFIG, FOLD_SHAPES, DEFAULT_CONFIG, SHAPES } from './src/agent-avatar/model';
import { legacyRecipe } from './src/agent-avatar/legacy-recipe';
const configs = [
 ...FOLD_SHAPES.map(foldShape => ({id:'fold-'+foldShape, config:{...FOLD_CONFIG, foldShape}})),
 ...SHAPES.map(shape => ({id:'blob-'+shape, config:{...DEFAULT_CONFIG, shape}})),
];
console.log(JSON.stringify(configs.map(item => ({...item, legacy:legacyRecipe(item.config)}))));
`,
    ],
    { cwd: new URL('..', import.meta.url), encoding: 'utf8' },
  ),
);
const browser = await chromium.launch({ args: ['--no-sandbox'] });
try {
  const page = await browser.newPage({
    viewport: { width: 1100, height: 900 },
  });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/__bloom_avatar_gate.html', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><html><body></body></html>',
    }),
  );
  await page.goto(`${process.argv[2] || 'http://localhost:6006'}/__bloom_avatar_gate.html`);
  await page.evaluate(async (recipes) => {
    document.body.replaceChildren();
    document.body.style.cssText = 'display:grid;grid-template-columns:repeat(5,150px);gap:8px';
    window.runtime = await import('/bloom-character/runtime.mjs');
    window.completed = 0;
    window.failures = [];
    window.controls = [];
    for (const item of recipes) {
      const canvas = document.createElement('canvas');
      canvas.style.cssText = 'width:150px;height:150px';
      canvas.dataset.recipe = item.id;
      document.body.appendChild(canvas);
      controls.push(
        await runtime.createAvatar(
          canvas,
          { ...item, portrait: true, paused: true },
          {
            onReady: () => completed++,
            onError: (error) => failures.push(String(error)),
          },
        ),
      );
    }
  }, recipes);
  await page.waitForFunction(() => completed === 15 || failures.length, {}, { timeout: 120000 });
  const result = await page.evaluate(() => ({
    completed,
    failures,
    stats: runtime.runtimeStats(),
    portraits: [...document.querySelectorAll('canvas:not([id])')].map((c) => {
      const data = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      let painted = 0;
      for (let i = 3; i < data.length; i += 4) if (data[i] > 24) painted++;
      return { id: c.dataset.recipe, painted, pixels: c.toDataURL() };
    }),
  }));
  assert.deepEqual(result.failures, []);
  assert.equal(result.completed, 15);
  assert.ok(result.portraits.every((p) => p.painted > 300));
  assert.equal(
    new Set(result.portraits.map((p) => p.pixels)).size,
    15,
    'Contour caches must not serve another recipe’s geometry or eye transforms',
  );
  assert.equal(result.stats.instances, 0);
  assert.equal(result.stats.legacy.modules, 0);
  const triangle = recipes.find((r) => r.id === 'blob-triangle');
  assert.equal(triangle.legacy.shape, 'rounded_triangle');
  assert.ok(!triangle.legacy.points, 'Use the actual beta triangle, not a duplicate migrated mesh');
  await page.evaluate(() => controls.forEach((c) => c.dispose()));
  const cloud = recipes.find((r) => r.id === 'fold-cloud');
  const star = recipes.find((r) => r.id === 'fold-star');
  await page.evaluate(async (item) => {
    document.body.replaceChildren();
    window.ready = false;
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'width:280px;height:280px';
    document.body.appendChild(canvas);
    window.props = {
      ...item,
      interactive: true,
      reactionKey: 0,
      workingKey: 0,
    };
    window.control = await runtime.createAvatar(canvas, props, {
      onReady: () => (ready = true),
      onError: (error) => failures.push(String(error)),
    });
  }, cloud);
  await page.waitForFunction(() => ready || failures.length, {}, { timeout: 30000 });
  await page.locator('canvas').first().click();
  assert.equal(await page.evaluate(() => control.diagnostics().lastReaction), 0);
  await page.evaluate(() => {
    props = { ...props, workingKey: 1 };
    control.update(props);
  });
  await page.waitForFunction(
    () => control.diagnostics()?.activityMode && control.diagnostics()?.ready,
    {},
    { timeout: 30000 },
  );
  assert.equal(await page.evaluate(() => control.diagnostics().lastActivityResult), 0);
  await page.waitForFunction(
    () => !control.diagnostics()?.activityMode && control.diagnostics()?.ready,
    {},
    { timeout: 30000 },
  );
  await page.evaluate(() => {
    props = { ...props, paused: true };
    control.update(props);
  });
  await page.waitForFunction(() => runtime.runtimeStats().active === 0);
  const frozen = await page
    .locator('canvas')
    .first()
    .evaluate((c) => c.toDataURL());
  await page.waitForTimeout(150);
  assert.equal(
    await page
      .locator('canvas')
      .first()
      .evaluate((c) => c.toDataURL()),
    frozen,
  );
  await page.evaluate((item) => {
    window.ready = false;
    window.transition = [];
    window.sampling = true;
    const capture = () => {
      const c = document.querySelector('canvas');
      const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      let n = 0;
      for (let i = 3; i < d.length; i += 4) if (d[i] > 24) n++;
      transition.push(n);
      if (sampling) requestAnimationFrame(capture);
    };
    capture();
    props = { ...props, ...item };
    control.update(props);
  }, star);
  await page.waitForFunction(
    () => (ready && runtime.runtimeStats().active === 0) || failures.length,
    {},
    { timeout: 30000 },
  );
  await page.evaluate(() => (sampling = false));
  assert.ok(
    await page.evaluate(() => transition.every((n) => n > 300)),
    'Keep painted pixels throughout a contour change',
  );
  assert.notEqual(
    await page
      .locator('canvas')
      .first()
      .evaluate((c) => c.toDataURL()),
    frozen,
  );
  // Coalesce color edits and retain the final paint, without changing the saved shape.
  await page.evaluate(() => {
    for (const bodyColor of ['#aa4444', '#22bb77', '#8866ee']) {
      props = {
        ...props,
        legacy: {
          ...props.legacy,
          patch: { ...props.legacy.patch, bodyColor },
        },
      };
      control.update(props);
    }
  });
  await page.waitForTimeout(120);
  await page.waitForFunction(() => runtime.runtimeStats().active === 0, {}, { timeout: 30000 });
  assert.deepEqual(await page.evaluate(() => failures), []);
  // Superseded async creation and unmount must not revive a discarded contour.
  await page.evaluate(
    (items) => {
      for (const item of items) control.update({ ...props, ...item });
      control.dispose();
      control.update({ ...props, ...items[0] });
    },
    [cloud, triangle, star],
  );
  await page.waitForFunction(
    () => runtime.runtimeStats().legacy.modules === 0 && runtime.runtimeStats().instances === 0,
    {},
    { timeout: 30000 },
  );
  // A queued portrait must finish even when its selector moves it offscreen.
  await page.evaluate(async (item) => {
    const c = document.createElement('canvas');
    c.style.cssText = 'position:absolute;left:-2000px;width:60px;height:60px';
    document.body.appendChild(c);
    window.offscreenReady = false;
    window.offscreen = await runtime.createAvatar(
      c,
      { ...item, portrait: true, paused: true },
      {
        onReady: () => (offscreenReady = true),
        onError: (error) => failures.push(String(error)),
      },
    );
  }, cloud);
  await page.waitForFunction(() => offscreenReady || failures.length, {}, { timeout: 20000 });
  assert.deepEqual(await page.evaluate(() => failures), []);
  await page.evaluate(() => offscreen.dispose());
  // Every migrated contour must accept the original eye meshes, including
  // highlighted eyes whose extra surface records differ from plain oval eyes.
  for (const item of recipes.filter((r) => r.legacy.points)) {
    await page.evaluate(async (item) => {
      document.body.replaceChildren();
      const c = document.createElement('canvas');
      c.style.cssText = 'width:200px;height:200px';
      document.body.appendChild(c);
      window.eyeProps = { ...item, interactive: true };
      window.eyeControl = await runtime.createAvatar(c, eyeProps, {
        onError: (error) => failures.push(`${item.id}: ${String(error)}`),
        onCapabilities: (caps) => (window.eyeCapabilities = caps),
      });
    }, item);
    for (const eyes of [
      'oval',
      'dots',
      'swept_lids',
      'sparkle_capsules',
      'highlight_capsules',
      'double_highlights',
      'crescent_inset',
      'sleepy_lids',
    ]) {
      await page.evaluate((eyes) => {
        eyeProps = { ...eyeProps, legacy: { ...eyeProps.legacy, eyes } };
        eyeControl.update(eyeProps);
      }, eyes);
      await page.waitForFunction(
        () =>
          failures.length ||
          (eyeControl.diagnostics()?.ready && !eyeControl.diagnostics()?.pending),
        {},
        { timeout: 30000 },
      );
      assert.deepEqual(await page.evaluate(() => failures), [], `${item.id}/${eyes}`);
      assert.equal(await page.evaluate(() => eyeCapabilities.selected.eyes), eyes);
      assert.ok(
        await page
          .locator('canvas')
          .first()
          .evaluate((c) =>
            c
              .getContext('2d')
              .getImageData(0, 0, c.width, c.height)
              .data.some((v, i) => i % 4 === 3 && v > 24),
          ),
        `${item.id}/${eyes} must paint`,
      );
    }
    await page.evaluate(() => {
      for (const eyes of ['sparkle_capsules', 'double_highlights', 'oval', 'highlight_capsules']) {
        eyeProps = { ...eyeProps, legacy: { ...eyeProps.legacy, eyes } };
        eyeControl.update(eyeProps);
      }
    });
    await page.waitForFunction(
      () =>
        failures.length || (eyeControl.diagnostics()?.ready && !eyeControl.diagnostics()?.pending),
      {},
      { timeout: 30000 },
    );
    assert.deepEqual(await page.evaluate(() => failures), [], `${item.id} rapid eye edits`);
    assert.equal(await page.evaluate(() => eyeCapabilities.selected.eyes), 'highlight_capsules');
    // Cover every original accessory and eyewear type on each contour. The
    // engine's availability remains authoritative for shape-dependent pairs.
    for (const [category, ids] of Object.entries({
      accessory: [
        'headphones',
        'bow',
        'beanie',
        'hat',
        'beret',
        'orb',
        'three_lobe',
        'crown',
        'none',
      ],
      eyewear: [
        'monocle',
        'tall_oval_frames',
        'separate_trapezoid_lenses',
        'classic_sunglasses',
        'round_sunglasses',
        'none',
      ],
    })) {
      for (const id of ids) {
        if (
          id !== 'none' &&
          !(await page.evaluate(
            ({ category, id }) => eyeCapabilities.available[`${category}:${id}`],
            { category, id },
          ))
        )
          continue;
        await page.evaluate(
          ({ category, id }) => {
            eyeProps = {
              ...eyeProps,
              legacy: {
                ...eyeProps.legacy,
                selections: { ...eyeProps.legacy.selections, [category]: id },
              },
            };
            eyeControl.update(eyeProps);
          },
          { category, id },
        );
        await page.waitForFunction(
          () =>
            failures.length ||
            (eyeControl.diagnostics()?.ready && !eyeControl.diagnostics()?.pending),
          {},
          { timeout: 30000 },
        );
        assert.deepEqual(await page.evaluate(() => failures), [], `${item.id}/${category}/${id}`);
        assert.equal(
          await page.evaluate((category) => eyeCapabilities.selected[category], category),
          id,
        );
      }
    }
    await page.evaluate(() => {
      eyeProps = { ...eyeProps, reactionKey: 1 };
      eyeControl.update(eyeProps);
    });
    assert.equal(
      await page.evaluate(() => eyeControl.diagnostics().lastReaction),
      0,
      `${item.id} must accept a native reaction`,
    );
    assert.equal(await page.evaluate(() => eyeControl.diagnostics().lastReactionKind), 1);
    await page.evaluate(() => eyeControl.dispose());
  }
  // Exercise the React editor too: its old controls must feed the 3D canvas.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(
    `${process.argv[2] || 'http://localhost:6006'}/iframe.html?id=application-agent-avatar-characters--editor&viewMode=story`,
  );
  await page.waitForFunction(
    () => {
      const c = document.querySelector('canvas:not([id])');
      return (
        c &&
        c
          .getContext('2d')
          .getImageData(0, 0, c.width, c.height)
          .data.some((v, i) => i % 4 === 3 && v > 24)
      );
    },
    {},
    { timeout: 60000 },
  );
  const preview = page.locator('canvas:not([id])').first();
  let before = await preview.evaluate((c) => c.toDataURL());
  const shapes = page.getByRole('listbox', {
    name: 'Avatar shape',
    exact: true,
  });
  await shapes.press('End');
  await shapes.press('ArrowLeft');
  await shapes.press('ArrowLeft');
  await shapes.press('ArrowLeft');
  await page.waitForFunction(
    () =>
      document
        .querySelector('[role="option"][aria-label="Cloud shape"]')
        ?.getAttribute('aria-selected') === 'true',
  );
  await page.waitForFunction(
    (previous) => {
      const c = document.querySelector('canvas:not([id])');
      return (
        c &&
        c.toDataURL() !== previous &&
        c
          .getContext('2d')
          .getImageData(0, 0, c.width, c.height)
          .data.some((v, i) => i % 4 === 3 && v > 24)
      );
    },
    before,
    { timeout: 30000 },
  );
  assert.equal(
    await shapes.locator('canvas').count(),
    0,
    'shape chips must not create avatar renderers',
  );
  assert.ok((await shapes.locator('svg').count()) > 0, 'migrated shapes use static silhouettes');
  before = await preview.evaluate((c) => c.toDataURL());
  await page.getByRole('button', { name: 'Blue avatar', exact: true }).click();
  await page.waitForFunction(
    (previous) => document.querySelector('canvas:not([id])')?.toDataURL() !== previous,
    before,
    { timeout: 30000 },
  );
  before = await preview.evaluate((c) => c.toDataURL());
  await page.getByRole('button', { name: 'Dots', exact: true }).click();
  await page.waitForFunction(
    (previous) => document.querySelector('canvas:not([id])')?.toDataURL() !== previous,
    before,
    { timeout: 30000 },
  );
  let selectableEyes = 0;
  for (const name of [
    'Swept lids',
    'Oval',
    'Sparkle capsules',
    'Highlight capsules',
    'Round highlights',
    'Round inset',
    'Crescent inset',
    'Sleepy lids',
  ]) {
    const eye = page.getByRole('button', { name, exact: true });
    if (!(await eye.isEnabled())) continue;
    await eye.click();
    await page.waitForFunction(
      (name) =>
        document
          .querySelector(`[role="button"][aria-label="${name}"]`)
          ?.getAttribute('aria-pressed') === 'true',
      name,
    );
    await page.waitForTimeout(1200);
    assert.equal(
      await page.getByText('Avatar unavailable', { exact: true }).count(),
      0,
      `${name} must finish preparing without losing the avatar`,
    );
    assert.equal(await preview.count(), 1, `${name} must retain the live canvas`);
    selectableEyes++;
  }
  assert.ok(selectableEyes >= 7, 'compatible eye choices must stay selectable after edits');
  for (const [controlName, option] of [
    ['Accessory', 'Bulb'],
    ['Eyewear', 'Monocle'],
  ]) {
    before = await preview.evaluate((c) => c.toDataURL());
    const trigger = page.getByRole('button', {
      name: controlName,
      exact: true,
    });
    await trigger.click();
    await page.getByRole('radio', { name: option, exact: true }).click();
    await page.waitForFunction(
      ({ controlName, option }) =>
        document
          .querySelector(`[aria-label="${controlName}"][role="button"]`)
          ?.textContent.includes(option),
      { controlName, option },
    );
    await page.waitForFunction(
      (previous) => document.querySelector('canvas:not([id])')?.toDataURL() !== previous,
      before,
      { timeout: 30000 },
    );
    await page.waitForTimeout(1200);
    assert.equal(await page.getByText('Avatar unavailable', { exact: true }).count(), 0);
    assert.equal(await preview.count(), 1);
  }
  // The original working panel has cyan translucent pixels, unlike the orange
  // body. This distinguishes the actual activity from ordinary idle motion.
  await page.getByRole('button', { name: 'Orange avatar', exact: true }).click();
  await page.waitForFunction(
    () => {
      const c = document.querySelector('canvas:not([id])');
      if (!c) return false;
      const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      let orange = 0;
      for (let i = 0; i < d.length; i += 4)
        if (d[i + 3] > 128 && d[i] > d[i + 1] + 30 && d[i + 1] > d[i + 2] + 20) orange++;
      return orange > 300;
    },
    {},
    { timeout: 30000 },
  );
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.getByRole('button', { name: 'Work', exact: true }).click();
  await page.waitForFunction(
    () => {
      const c = document.querySelector('canvas:not([id])');
      if (!c) return false;
      const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      let cyan = 0;
      for (let i = 0; i < d.length; i += 4)
        if (d[i + 3] > 15 && d[i + 1] > d[i] + 20 && d[i + 2] > d[i] + 20) cyan++;
      return cyan > 20;
    },
    {},
    { timeout: 30000 },
  );
  assert.deepEqual(errors, []);
  console.log(
    'PASS: 15 visible recipes, original triangle reuse, original wave/work, pause, contour transitions, color edits, async unmount cleanup, 64 migrated shape/eye combinations, catalog accessories and eyewear on all migrated contours, native reactions, rapid eye edits, React editor static shapes/color/original eyes',
  );
} finally {
  await browser.close();
}
