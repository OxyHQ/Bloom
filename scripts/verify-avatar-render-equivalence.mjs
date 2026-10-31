/** Exact fixed-pose pixels, including atlas boundaries and sparse logical slots. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
const require = createRequire(import.meta.url),
  puppeteer = require(process.env.BLOOM_PUPPETEER_MODULE || 'puppeteer-core'),
  { PNG } = require('pngjs');
const origin = process.env.BLOOM_STORYBOOK_URL || 'http://localhost:6008';
const output = process.env.AVATAR_EQUIVALENCE_OUTPUT || '.local/avatar-render-equivalence';
const reference = process.env.AVATAR_EQUIVALENCE_REFERENCE;
const sizes = (process.env.AVATAR_EQUIVALENCE_SIZES || '64:1,128:2,320:2')
  .split(',')
  .map((x) => x.split(':').map(Number));
const families = (process.env.AVATAR_EQUIVALENCE_FAMILIES || 'authored,catalog').split(',');
const onlyCases = process.env.AVATAR_EQUIVALENCE_CASES?.split(',');
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  protocolTimeout: 180000,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
});
const report = {
  origin,
  reference: reference ?? null,
  assertion:
    'Exact RGBA equality inside every actively presented cell; inactive atlas storage is not presented by the pool.',
  cases: [],
  errors: [],
};
await mkdir(output, { recursive: true });
try {
  for (const family of families)
    for (const [size, dpr] of sizes) {
      const count = family === 'authored' ? 8 : 4,
        columns = 4,
        rows = Math.ceil(count / columns),
        page = await browser.newPage();
      page.on('pageerror', (e) => report.errors.push(e.message));
      page.on('console', (m) => {
        if (m.type() === 'error' && !m.location().url?.endsWith('/favicon.ico'))
          report.errors.push(m.text());
      });
      await page.setViewport({
        width: columns * size,
        height: rows * size,
        deviceScaleFactor: dpr,
      });
      const cdp = await page.createCDPSession();
      await cdp.send('Fetch.enable', {
        patterns: [{ urlPattern: '*/avatar-render-equivalence.html' }],
      });
      cdp.on('Fetch.requestPaused', (e) =>
        cdp.send('Fetch.fulfillRequest', {
          requestId: e.requestId,
          responseCode: 200,
          responseHeaders: [{ name: 'Content-Type', value: 'text/html' }],
          body: Buffer.from(
            '<!doctype html><body style="margin:0;background:#f5f5f2"><canvas style="display:block"></canvas>',
          ).toString('base64'),
        }),
      );
      await page.goto(`${origin}/avatar-render-equivalence.html`);
      await cdp.send('Fetch.disable');
      await page.evaluate(
        async ({ family, count, size, columns, rows }) => {
          const { AuthoredAvatarEngine } = await import('/runtime/avatar/authored-engine.ts');
          const { createCatalogAssetResolver } = await import('/runtime/avatar/catalog-assets.ts');
          const { createCatalogMotion } = await import('/runtime/avatar/catalog-motion-factory.ts');
          const { resolveCompleteEditorRecipe } = await import('/runtime/avatar/recipe.ts');
          const { resolveAvatarCharacter } = await import('/src/agent-avatar/character.ts');
          const authored = [
            'blue_beret',
            'alfred',
            'purple_heart',
            'lime_frog',
            'coral_monocle',
            'gus',
            'blue_spectacles',
            'lime_headphones',
          ];
          const characters = [
            { preset: 'blue_beret', shape: 'heart', eyes: 'cyclops', accessory: 'crown' },
            { preset: 'lime_frog', shape: 'six_lobed_flower', eyes: 'todd', eyewear: 'monocle' },
            { preset: 'blue_spectacles', shape: 'cloud', eyes: 'oval', accessory: 'three_lobe' },
            { preset: 'alfred', shape: 'clippo', eyes: 'clippo', accessory: 'bow' },
          ];
          const recipes =
            family === 'authored'
              ? authored.map((preset) => ({ preset }))
              : characters.map((c) =>
                  resolveCompleteEditorRecipe({
                    character: resolveAvatarCharacter(c),
                    reduced: false,
                  }),
                );
          const canvas = document.querySelector('canvas');
          canvas.style.width = `${columns * size}px`;
          canvas.style.height = `${rows * size}px`;
          window.engine = new AuthoredAvatarEngine(canvas, {
            count,
            size,
            preset: recipes[0].preset,
            lazyWork: true,
            resolveAsset: createCatalogAssetResolver(createCatalogMotion),
          });
          await engine.loaded;
          engine.setPaused(true);
          await engine.setPresets(recipes.map((r) => r.preset));
          recipes.forEach((recipe, index) => {
            if (recipe.color) engine.setColor(index, recipe.color);
            engine.setWander(index, false);
            engine.setMotionFrame(index, 'idle', 0.5);
          });
        },
        { family, count, size, columns, rows },
      );
      await page.waitForFunction(() => engine.stats().frames > 0 && !engine.fitPending, {
        timeout: 120000,
      });
      const scenarios = [
        { name: 'base-idle', kind: 'idle', time: 0.5 },
        { name: 'loaded-idle', kind: 'idle', time: 0.5 },
        { name: 'reaction-entry', kind: 'reaction', time: 0 },
        { name: 'reaction', kind: 'reaction', time: 0.8 },
        { name: 'work-entry', kind: 'work', time: 0 },
        { name: 'work', kind: 'work', time: 1.5 },
        { name: 'eyes-gaze', kind: 'idle', time: 1.3, input: 'eyes' },
        { name: 'held-pointer', kind: 'idle', time: 0.8, input: 'pointer' },
        { name: 'sparse-first', kind: 'idle', time: 0.5, active: [0] },
        { name: 'sparse-interior', kind: 'reaction', time: 0.8, active: [Math.floor(count / 2)] },
        { name: 'sparse-last', kind: 'work', time: 1.5, active: [count - 1] },
        {
          name: 'sparse-alternating',
          kind: 'work',
          time: 0.3,
          active: Array.from({ length: count }, (_, i) => i).filter((i) => i % 2 === 0),
        },
        { name: 'restored-all', kind: 'idle', time: 0.5 },
      ];
      let workLoaded = false;
      for (const scenario of scenarios) {
        if (onlyCases && !onlyCases.includes(scenario.name)) continue;
        if (scenario.name !== 'base-idle' && !workLoaded) {
          await page.evaluate(async () => {
            await Promise.all(engine.states.map((_, i) => engine.prepareWork(i)));
          });
          workLoaded = true;
        }
        const active = scenario.active ?? Array.from({ length: count }, (_, i) => i);
        const before = await page.evaluate(
          ({ scenario, active }) => {
            const frames = engine.stats().frames;
            engine.states.forEach((state, i) => {
              engine.setInstanceRendering(i, active.includes(i));
              engine.setWander(i, false);
              state.pointer.reset();
              state.gaze.reset();
              state.eyes.reset();
              state.gazePending = false;
              state.reactionGaze = undefined;
              if (scenario.input === 'eyes') {
                state.gaze.point(0.8, 0.2);
                state.gaze.advance(10);
                state.eyes.point(0.8, 0.2);
                state.eyes.advance(10);
              }
              if (scenario.input === 'pointer') {
                state.pointer.down(0.5, 0.5, 0);
                state.pointer.move(0.7, 0.62);
              }
              if (!engine.setMotionFrame(i, scenario.kind, scenario.time))
                throw Error(`Missing ${scenario.kind} for ${i}`);
            });
            return frames;
          },
          { scenario, active },
        );
        await page.waitForFunction(
          (frames) => engine.stats().frames > frames && !engine.fitPending,
          { timeout: 120000 },
          before,
        );
        const name = `${family}-${size}-dpr${dpr}-${scenario.name}`,
          png = Buffer.from(await page.screenshot({ path: `${output}/${name}.png` }));
        const stats = await page.evaluate(() => {
          const x = engine.stats();
          return {
            ...x,
            states: x.states.map((s) => ({
              preset: s.preset,
              motion: s.motion,
              motionTime: s.motionTime,
            })),
          };
        });
        const result = {
          name,
          active,
          stats,
          differentPixels: 0,
          maxChannelDifference: 0,
          comparedPixels: 0,
        };
        if (reference) {
          const previous = PNG.sync.read(await readFile(`${reference}/${name}.png`)),
            current = PNG.sync.read(png);
          assert.equal(previous.width, current.width);
          assert.equal(previous.height, current.height);
          for (const index of active) {
            const x0 = (index % columns) * size * dpr,
              y0 = Math.floor(index / columns) * size * dpr;
            for (let y = y0; y < y0 + size * dpr; y++)
              for (let x = x0; x < x0 + size * dpr; x++) {
                const at = (y * current.width + x) * 4;
                let difference = 0;
                for (let channel = 0; channel < 4; channel++)
                  difference = Math.max(
                    difference,
                    Math.abs(current.data[at + channel] - previous.data[at + channel]),
                  );
                result.comparedPixels++;
                if (difference) result.differentPixels++;
                result.maxChannelDifference = Math.max(result.maxChannelDifference, difference);
              }
          }
        }
        report.cases.push(result);
        console.log(
          JSON.stringify({
            name,
            differentPixels: result.differentPixels,
            maxChannelDifference: result.maxChannelDifference,
            renderedPixels: stats.renderedPixels ?? null,
          }),
        );
        await writeFile(`${output}/report.json`, `${JSON.stringify(report, null, 2)}\n`);
      }
      await page.evaluate(() => engine.dispose());
      await page.close();
    }
  assert.deepEqual(report.errors, []);
  assert(
    report.cases.every((c) => c.differentPixels === 0),
    'Rendered pixels changed; inspect the paired captures before accepting any optimization',
  );
} catch (error) {
  report.failure = String(error.stack || error);
  throw error;
} finally {
  await writeFile(`${output}/report.json`, `${JSON.stringify(report, null, 2)}\n`);
  await browser.close();
}
