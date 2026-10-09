/** Original Todd eyes + Felipe beret on all visible shapes, with real pixels,
 * work/reaction, generic return and cleanup. Requires Storybook/Bun/Playwright.
 * BLOOM_PLAYWRIGHT_MODULE may name an installed Playwright package.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)(
  process.env.BLOOM_PLAYWRIGHT_MODULE || 'playwright',
);
const recipes = JSON.parse(
  execFileSync(
    'bun',
    [
      '-e',
      `
import {FOLD_CONFIG,FOLD_SHAPES,DEFAULT_CONFIG,SHAPES} from './src/agent-avatar/model';
import {legacyRecipe} from './src/agent-avatar/legacy-recipe';
import {CHARACTER_OPTIONS} from './src/agent-creator/constants';
const selections={eyes:'todd',accessory:'felipe_beret'};
const old=[...FOLD_SHAPES.map(foldShape=>({...FOLD_CONFIG,foldShape})),...SHAPES.map(shape=>({...DEFAULT_CONFIG,shape}))].map(config=>({...config,character:{preset:'bloom',selections}})).map(config=>({config,legacy:legacyRecipe(config)})).filter(item=>item.legacy.points);
console.log(JSON.stringify([...CHARACTER_OPTIONS.shape.map(([shape])=>({config:{character:{preset:'blue_beret',selections:{shape,...selections}}}})),...old]));
`,
    ],
    { cwd: new URL('..', import.meta.url), encoding: 'utf8' },
  ),
);
assert.equal(recipes.length, 21);
const migratedIndex = recipes.findIndex((recipe) => recipe.legacy);
assert.ok(migratedIndex > 0);
const clippoIndex = recipes.findIndex(
  (recipe) => recipe.config.character.selections.shape === 'clippo',
);
assert.ok(clippoIndex >= 0);
const nativeIndex = recipes.findIndex(
  (recipe) =>
    recipe.config.character.selections.shape === 'circle' && !recipe.legacy,
);
assert.ok(nativeIndex >= 0);
const browser = await chromium.launch({ args: ['--no-sandbox'] });
try {
  const page = await browser.newPage({
    viewport: { width: 1000, height: 700 },
  });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (/GL_INVALID|GL ERROR|too many active webgl/i.test(message.text()))
      errors.push(message.text());
  });
  await page.route('**/__authored.html', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<!doctype html><body>' }),
  );
  await page.goto(
    `${process.argv[2] || 'http://localhost:6006'}/__authored.html`,
  );
  await page.evaluate(async (recipes) => {
    const runtime = await import('/bloom-character/runtime.mjs');
    const { authoredAssemblyRecords } =
      await import('/bloom-character/authored-parts.mjs');
    window.gate = {
      runtime,
      controls: [],
      props: [],
      canvases: [],
      errors: [],
      capabilities: [],
      assemblies: [],
      requests: new Map(),
    };
    const NativeWorker = Worker;
    window.Worker = class extends NativeWorker {
      constructor(...args) {
        super(...args);
        this.addEventListener('message', ({ data }) => {
          const request = gate.requests.get(data.id);
          if (data.bytes && request?.authoredParts) {
            const info = authoredAssemblyRecords(data.bytes);
            gate.assemblies.push({
              parts: request.authoredParts,
              quality: request.quality,
              vertices: info.records.map((p) => p.vertexCount),
            });
          }
        });
      }
      postMessage(data, ...args) {
        gate.requests.set(data.id, data);
        return super.postMessage(data, ...args);
      }
    };
    const grid = document.createElement('div');
    grid.style.cssText =
      'display:grid;grid-template-columns:repeat(7,120px);gap:12px';
    document.body.append(grid);
    for (let i = 0; i < recipes.length; i++) {
      const canvas = document.createElement('canvas');
      canvas.id = `part-${i}`;
      canvas.style.cssText = 'width:120px;height:120px';
      grid.append(canvas);
      const props = {
        ...recipes[i],
        interactive: true,
        paused: false,
        workingKey: 0,
        reactionKey: 0,
        workingCycles: 2,
      };
      gate.props.push(props);
      gate.canvases.push(canvas);
      gate.controls.push(
        await runtime.createAvatar(canvas, props, {
          onError: (error) => gate.errors.push(`${i}:${error}`),
          onCapabilities: (capabilities) =>
            (gate.capabilities[i] = capabilities),
        }),
      );
    }
    gate.read64 = (index) => {
      const copy = document.createElement('canvas');
      copy.width = copy.height = 64;
      const ctx = copy.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(gate.canvases[index], 0, 0, 64, 64);
      return ctx.getImageData(0, 0, 64, 64).data;
    };
    gate.pixels = () =>
      gate.canvases.map((canvas, index) => {
        const copy = document.createElement('canvas');
        copy.width = copy.height = 64;
        const ctx = copy.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(canvas, 0, 0, 64, 64);
        const data = ctx.getImageData(0, 0, 64, 64).data;
        let alpha = 0,
          white = 0,
          dark = 0,
          cyan = 0,
          hash = 0,
          newLowerWhite = 0,
          newLowerBlue = 0;
        const base =
          gate.workBase?.index === index ? gate.workBase.data : undefined;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] > 32) {
            alpha++;
            if (Math.min(data[i], data[i + 1], data[i + 2]) > 180) white++;
            if (Math.max(data[i], data[i + 1], data[i + 2]) < 70) dark++;
            if (
              (data[i + 1] > data[i] + 25 &&
                data[i + 2] > data[i] + 40 &&
                data[i + 1] > data[i + 2] * 0.75) ||
              (data[i] > data[i + 1] + 25 && data[i + 2] > data[i + 1] + 25)
            )
              cyan++;
            if (
              base &&
              Math.floor(i / 4 / 64) >= 38 &&
              (i / 4) % 64 >= 16 &&
              (i / 4) % 64 <= 56
            ) {
              if (
                Math.min(data[i], data[i + 1], data[i + 2]) > 180 &&
                !(
                  base[i + 3] > 32 &&
                  Math.min(base[i], base[i + 1], base[i + 2]) > 180
                )
              )
                newLowerWhite++;
              if (
                data[i + 2] > data[i] + 25 &&
                data[i + 2] > data[i + 1] + 10 &&
                base[i + 3] <= 32
              )
                newLowerBlue++;
            }
          }
          hash =
            (Math.imul(hash, 31) + data[i] + data[i + 1] + data[i + 2]) | 0;
        }
        return { alpha, white, dark, cyan, hash, newLowerWhite, newLowerBlue };
      });
  }, recipes);
  await page.waitForFunction(
    () =>
      gate.errors.length ||
      gate.controls.every(
        (c) => c.diagnostics()?.ready && !c.diagnostics()?.pending,
      ),
    {},
    { timeout: 240000 },
  );
  assert.deepEqual(await page.evaluate(() => gate.errors), []);
  await page
    .waitForFunction(
      () => {
        const pixels = gate.pixels();
        gate.whiteSeen ??= pixels.map(() => 0);
        for (let i = 0; i < pixels.length; i++)
          gate.whiteSeen[i] = Math.max(gate.whiteSeen[i], pixels[i].white);
        return gate.errors.length || gate.whiteSeen.every((n) => n > 2);
      },
      {},
      { timeout: 60000 },
    )
    .catch(async (error) => {
      await page.screenshot({ path: '/tmp/bloom-authored-failure.png' });
      fs.writeFileSync(
        '/tmp/bloom-authored-failure.json',
        JSON.stringify(
          await page.evaluate(() => ({
            pixels: gate.pixels(),
            whiteSeen: gate.whiteSeen,
            caps: gate.capabilities,
            errors: gate.errors,
            diagnostics: gate.controls.map((control) => control.diagnostics()),
            stats: gate.runtime.runtimeStats(),
          })),
          null,
          2,
        ),
      );
      throw error;
    });
  const first = await page.evaluate(() => ({
    pixels: gate.pixels(),
    whiteSeen: gate.whiteSeen,
    stats: gate.runtime.runtimeStats(),
    caps: gate.capabilities,
    assemblies: gate.assemblies,
  }));
  await page.screenshot({ path: '/tmp/bloom-authored-all-shapes.png' });
  fs.writeFileSync(
    '/tmp/bloom-authored-all-shapes-metrics.json',
    JSON.stringify(first, null, 2),
  );
  assert.equal(first.stats.surface.contexts, 1);
  assert.equal(first.stats.legacy.sharedModules, 1);
  assert.equal(first.pixels.length, recipes.length);
  for (let i = 0; i < recipes.length; i++) {
    assert.ok(first.pixels[i].alpha > 300, `Shape ${i} must paint a body`);
    assert.ok(
      first.whiteSeen[i] > 2,
      `Shape ${i} must paint Todd's authored white eye rims`,
    );
    assert.ok(
      first.pixels[i].dark > 8,
      `Shape ${i} must paint the pupils and Felipe hat`,
    );
    assert.equal(first.caps[i].selected.eyes, 'todd');
    assert.equal(first.caps[i].selected.accessory, 'felipe_beret');
    assert.equal(first.caps[i].available['eyes:todd'], true);
    assert.equal(first.caps[i].available['accessory:felipe_beret'], true);
  }
  assert.ok(first.assemblies.length >= recipes.length);
  for (const assembly of first.assemblies) {
    assert.deepEqual(
      assembly.vertices.slice(1).sort((a, b) => a - b),
      assembly.quality === 0
        ? [402, 769, 769, 1152, 1252, 3185, 3185]
        : [769, 769, 802, 2302, 2498, 3185, 3185],
    );
  }
  await page.screenshot({ path: '/tmp/bloom-authored-all-shapes.png' });
  // Clippo's eyes/brows are independent authored parts, including on the
  // migrated contours and native bodies with protruding ears.
  await page.evaluate(() => {
    gate.clippoWhiteSeen = gate.canvases.map(() => 0);
    gate.controls.forEach((control, index) => {
      const old = gate.props[index],
        character = old.config.character;
      gate.props[index] = {
        ...old,
        config: {
          ...old.config,
          character: {
            ...character,
            selections: { ...character.selections, eyes: 'clippo' },
          },
        },
        ...(old.legacy ? { legacy: { ...old.legacy, eyes: 'clippo' } } : {}),
      };
      control.update(gate.props[index]);
    });
  });
  await page.waitForFunction(
    () =>
      gate.errors.length ||
      gate.controls.every(
        (control, index) =>
          gate.capabilities[index]?.selected.eyes === 'clippo' &&
          control.diagnostics()?.ready &&
          !control.diagnostics()?.pending,
      ),
    {},
    { timeout: 240000 },
  );
  assert.deepEqual(await page.evaluate(() => gate.errors), []);
  await page.waitForFunction(
    () => {
      const pixels = gate.pixels();
      pixels.forEach(
        (pixel, index) =>
          (gate.clippoWhiteSeen[index] = Math.max(
            gate.clippoWhiteSeen[index],
            pixel.white,
          )),
      );
      return gate.errors.length || gate.clippoWhiteSeen.every((n) => n > 2);
    },
    {},
    { timeout: 60000 },
  );
  const clippoEyes = await page.evaluate(() => ({
    pixels: gate.pixels(),
    whiteSeen: gate.clippoWhiteSeen,
    caps: gate.capabilities,
  }));
  await page.screenshot({
    path: '/tmp/bloom-authored-clippo-eyes-all-shapes.png',
  });
  fs.writeFileSync(
    '/tmp/bloom-authored-clippo-eyes-all-shapes-metrics.json',
    JSON.stringify(clippoEyes, null, 2),
  );
  assert.deepEqual(await page.evaluate(() => gate.errors), []);
  for (let i = 0; i < recipes.length; i++) {
    assert.ok(
      clippoEyes.pixels[i].alpha > 300,
      `Clippo eyes on shape ${i} must retain the body`,
    );
    assert.ok(
      clippoEyes.whiteSeen[i] > 2,
      `Clippo eyes on shape ${i} must paint the white eye rims`,
    );
    assert.ok(
      clippoEyes.pixels[i].dark > 8,
      `Clippo eyes on shape ${i} must paint pupils/brows/headwear`,
    );
    assert.equal(clippoEyes.caps[i].selected.eyes, 'clippo');
    assert.equal(clippoEyes.caps[i].selected.accessory, 'felipe_beret');
    assert.equal(clippoEyes.caps[i].available['eyes:clippo'], true);
  }
  await page.evaluate(() =>
    gate.controls.forEach((c, i) => {
      gate.props[i] = { ...gate.props[i], paused: true };
      c.update(gate.props[i]);
    }),
  );
  const inherited = await page.evaluate(async () => {
    const results = [];
    for (const character of [
      { preset: 'lime_frog', selections: { eyes: 'todd' } },
      { preset: 'blue_beret', selections: { accessory: 'felipe_beret' } },
      { preset: 'lime_frog', bodyColor: '#4567ab' },
      { preset: 'blue_beret', bodyColor: '#ab6745' },
    ]) {
      const index = gate.canvases.length;
      const canvas = document.createElement('canvas');
      canvas.id = `part-${index}`;
      canvas.style.cssText = 'width:120px;height:120px';
      document.body.append(canvas);
      gate.canvases.push(canvas);
      const control = await gate.runtime.createAvatar(
        canvas,
        { config: { character }, paused: true },
        {
          onError: (error) => gate.errors.push(`${index}:${error}`),
          onCapabilities: (c) => (gate.capabilities[index] = c),
        },
      );
      gate.controls.push(control);
      const started = performance.now();
      while (
        !gate.errors.length &&
        !(control.diagnostics()?.ready && !control.diagnostics()?.pending)
      ) {
        if (performance.now() - started > 60000)
          throw Error('Authored preset case did not settle');
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
      results.push({
        character,
        capabilities: gate.capabilities[index],
        pixels: gate.pixels()[index],
      });
    }
    return results;
  });
  assert.deepEqual(await page.evaluate(() => gate.errors), []);
  for (const item of inherited) {
    assert.ok(item.pixels.alpha > 300);
    assert.equal(
      item.capabilities.selected[
        item.character.preset === 'lime_frog' ? 'eyes' : 'accessory'
      ],
      item.character.preset === 'lime_frog' ? 'todd' : 'felipe_beret',
    );
  }
  // Test native, migrated and Clippo bodies. Other previews stay static while
  // these three exercise the original engine's work/reaction controllers.
  for (const index of [nativeIndex, migratedIndex, clippoIndex]) {
    await page.evaluate((index) => {
      gate.workBase = { index, data: gate.read64(index) };
      gate.props[index] = {
        ...gate.props[index],
        paused: false,
        workingKey: 1,
      };
      gate.controls[index].update(gate.props[index]);
    }, index);
    await page.waitForFunction(
      (index) =>
        gate.errors.length ||
        (gate.controls[index].diagnostics()?.lastActivityResult === 0 &&
          gate.controls[index].diagnostics()?.ready &&
          !gate.controls[index].diagnostics()?.pending),
      index,
      { timeout: 60000 },
    );
    // Original panels can be cyan, magenta or blue. For blue panels, require
    // newly painted lower-half white hands/text plus blue over the previously
    // transparent region; an unchanged blue body cannot satisfy this evidence.
    try {
      await page.waitForFunction(
        (index) => {
          const pixel = gate.pixels()[index];
          return (
            gate.errors.length ||
            pixel.cyan > 20 ||
            (pixel.newLowerWhite > 8 && pixel.newLowerBlue > 20)
          );
        },
        index,
        { timeout: 30000 },
      );
    } catch (error) {
      await page.screenshot({
        path: `/tmp/bloom-authored-work-failure-${index}.png`,
      });
      fs.writeFileSync(
        `/tmp/bloom-authored-work-failure-${index}.json`,
        JSON.stringify(
          await page.evaluate(
            (index) => ({
              props: gate.props[index],
              diagnostics: gate.controls[index].diagnostics(),
              pixels: gate.pixels()[index],
              errors: gate.errors,
            }),
            index,
          ),
          null,
          2,
        ),
      );
      throw error;
    }
    await page.evaluate((index) => {
      gate.props[index] = { ...gate.props[index], reactionKey: 1 };
      gate.controls[index].update(gate.props[index]);
    }, index);
    await page.waitForFunction(
      (index) =>
        gate.errors.length ||
        gate.controls[index].diagnostics()?.lastReaction === 0,
      index,
      { timeout: 60000 },
    );
  }
  assert.deepEqual(await page.evaluate(() => gate.errors), []);
  await page.evaluate((index) => {
    const old = gate.props[index];
    const selections = { eyes: 'dots', accessory: 'none' };
    gate.props[index] = {
      ...old,
      paused: false,
      workingKey: 2,
      config: { ...old.config, character: { preset: 'bloom', selections } },
      legacy: {
        ...old.legacy,
        eyes: 'dots',
        selections: { accessory: 'none' },
      },
    };
    gate.controls[index].update(gate.props[index]);
  }, migratedIndex);
  await page.waitForFunction(
    (index) =>
      gate.errors.length ||
      (gate.capabilities[index]?.selected.eyes === 'dots' &&
        gate.capabilities[index]?.selected.accessory === 'none' &&
        gate.controls[index].diagnostics()?.lastActivityResult === 0 &&
        gate.controls[index].diagnostics()?.activityMode &&
        gate.controls[index].diagnostics()?.ready &&
        !gate.controls[index].diagnostics()?.pending),
    migratedIndex,
    { timeout: 60000 },
  );
  assert.deepEqual(await page.evaluate(() => gate.errors), []);
  await page.evaluate(() => gate.controls.forEach((c) => c.dispose()));
  await page.waitForFunction(
    () => {
      const s = gate.runtime.runtimeStats();
      return (
        !s.instances &&
        !s.surface.contexts &&
        !s.legacy.characters &&
        !s.legacy.pending &&
        !s.legacy.worker
      );
    },
    {},
    { timeout: 60000 },
  );
  assert.deepEqual(errors, []);
  console.log(
    'PASS: all 21 shapes contain the actual Todd eyes and Felipe hat, compatible selections, native/migrated work/reaction, generic return and zero live resources.',
    JSON.stringify({ first, inherited }),
  );
} finally {
  await browser.close();
}
