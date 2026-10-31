/** Dedicated Android page only. Never performs pixel reads before timing. */
import { send, evaluate, wait, socket } from './fixtures/avatar/physical-web/cdp.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
const family = process.env.PRESENTER_FAMILY || 'webgpu';
const fixtureModule = await import(
  process.env.AVATAR_PRESENTER_MODULE ||
    `./fixtures/avatar/presentation/${family === 'pbo' ? 'pbo-atlas-fixture' : 'webgpu-fixture'}.mjs`
);
const start = fixtureModule.startPBOAtlasFixture || fixtureModule.startWebGPUPresentationFixture;
const sourceRevision = process.env.AVATAR_SOURCE_REVISION,
  fixtureURL = process.env.AVATAR_FIXTURE_URL;
if (!sourceRevision || !fixtureURL)
  throw Error('AVATAR_SOURCE_REVISION and AVATAR_FIXTURE_URL are required');
const count = Number(process.env.COUNT || 24),
  mode = process.env.MODE || family,
  cssSize = Number(process.env.SIZE || 96),
  kind = process.env.KIND || 'authored';
const output = process.env.AVATAR_OUTPUT || '.local/avatar-presentation';
await mkdir(output, { recursive: true });
await send('Page.navigate', { url: fixtureURL });
await wait(700);
const result = { family, count, mode, cssSize, kind, sourceRevision };
try {
  result.initial = await evaluate(start, {
    mode,
    count,
    cssSize,
    kind,
    engineRoot: process.env.AVATAR_ENGINE_ROOT || '/runtime',
    readbackRoot: process.env.AVATAR_READBACK_ROOT,
    sourceRevision,
  });
  await evaluate(() => {
    document.body.style.margin = '4px';
    for (const d of document.querySelectorAll('div'))
      if (d.children.length > 1 && d.querySelector('canvas')) d.style.gap = '4px';
  });
  await wait(3000);
  result.layout = await evaluate(() => ({
    hidden: document.hidden,
    viewport: [innerWidth, innerHeight, devicePixelRatio],
    visible: [...document.querySelectorAll('div>canvas')].filter((c) => {
      const r = c.getBoundingClientRect();
      return (
        r.width > 0 && r.top < innerHeight && r.bottom > 0 && r.left < innerWidth && r.right > 0
      );
    }).length,
  }));
  result.afterWarmup = await evaluate(() =>
    (globalThis.__avatarPBOFixture || globalThis.__avatarWebGPUFixture).read(),
  );
  if (result.afterWarmup.errors.length || !result.afterWarmup.completed)
    throw Error('First presentation failed');
  result.sample = await evaluate(() =>
    (globalThis.__avatarPBOFixture || globalThis.__avatarWebGPUFixture).sample(5000),
  );
  console.log(
    JSON.stringify({
      family,
      count,
      mode,
      completed: result.sample.after.completed - result.sample.before.completed,
      elapsed: result.sample.elapsed,
      errors: result.sample.after.errors,
      layout: result.layout,
    }),
  );
} catch (error) {
  result.failure = String(error);
  throw error;
} finally {
  await writeFile(
    `${output}/${process.env.ID || `${family}-${mode}-${count}`}.json`,
    `${JSON.stringify(result, null, 2)}\n`,
  );
  if (!process.env.KEEP)
    await evaluate(() =>
      (globalThis.__avatarPBOFixture || globalThis.__avatarWebGPUFixture)?.dispose(),
    ).catch(() => {});
  socket.close();
}
