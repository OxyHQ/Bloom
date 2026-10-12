/** Runtime transforms and pixels against independent native pointer observations. */
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
const require = createRequire(import.meta.url),
  puppeteer = require(process.env.BLOOM_PUPPETEER_MODULE || 'puppeteer-core'),
  { PNG } = require('pngjs');
const cell = Number(process.env.AVATAR_GAZE_CELL || 112);
const high = cell > 128;
const sourceRoot = high ? '.local/avatar-gaze-high' : '.local/avatar-pointer-validation';
const tmp = await mkdtemp('.local/gaze-browser-');
async function load(name) {
  const p = `${tmp}/${name}.mjs`;
  await writeFile(
    p,
    ts.transpileModule(await readFile(`runtime/avatar/${name}.ts`, 'utf8'), {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
    }).outputText,
  );
  return import(pathToFileURL(`${process.cwd()}/${p}`));
}
const { AvatarGazeController } = await load('gaze-controller'),
  { AvatarPointerController } = await load('pointer-controller'),
  { AvatarEyeGazeController, eyeClosureFromMorph } = await load('eye-gaze-controller');
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
});
const ocular = {
  alfred: [],
  purple_heart: [],
  lime_frog: [],
  coral_monocle: [],
  gus: [],
  blue_spectacles: [],
  lime_headphones: [],
};
try {
  const page = await browser.newPage(),
    errors = [],
    forbidden = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('request', (r) => {
    if (r.url().includes('character-runtime')) forbidden.push(r.url());
  });
  await page.setViewport({ width: cell * 2, height: cell, deviceScaleFactor: 1 });
  const cdp = await page.createCDPSession();
  await cdp.send('Fetch.enable', { patterns: [{ urlPattern: '*avatar-gaze-check.html' }] });
  cdp.on('Fetch.requestPaused', (e) =>
    cdp.send('Fetch.fulfillRequest', {
      requestId: e.requestId,
      responseCode: 200,
      responseHeaders: [{ name: 'Content-Type', value: 'text/html' }],
      body: Buffer.from('<!doctype html><html><body></body></html>').toString('base64'),
    }),
  );
  await page.goto('http://localhost:6006/avatar-gaze-check.html');
  await cdp.send('Fetch.disable');
  await page.evaluate(async (cell) => {
    document.body.style.cssText = 'margin:0;background:#f5f5f2';
    const canvas = document.createElement('canvas');
    canvas.style.cssText = `display:block;width:${cell * 2}px;height:${cell}px`;
    document.body.append(canvas);
    const { AuthoredAvatarEngine } = await import(
      '/runtime/avatar/authored-engine.ts'
    );
    const { loadAuthoredAsset } = await import('/runtime/avatar/catalog.ts');
    window.engine = new AuthoredAvatarEngine(canvas, {
      count: 2,
      size: cell,
      preset: 'alfred',
      poseOverrides: true,
      assetLoader: loadAuthoredAsset,
    });
    await window.engine.loaded;
    const Matrix4 = window.engine.states[0].matrix.constructor;
    window.pose = (draws) =>
      window.engine.asset(window.engine.states[0].preset).parts.map((p, i) => {
        const block = draws[i].blocks.DrawBlock,
          names = [
            'colorRoughness',
            'parameters',
            'referencePose',
            'emissiveMetallic',
            'coverage',
            'eyeCurveOriginAmount',
            'eyeCurveRightWidth',
            'eyeCurveUp',
            'paletteBounds',
            'paletteClosure',
            'paletteReference',
            'fur',
            'furEye0',
            'furEye1',
            'signatureDeform',
          ];
        return {
          id: `${p.source.fur ? 'fur' : 'mesh'}:${p.source.id}`,
          world: new Matrix4().fromArray(block),
          normalMatrix: new Matrix4().fromArray(block.slice(16, 32)),
          fields: Object.fromEntries(
            names.map((name, k) => [name, block.slice(32 + k * 4, 36 + k * 4)]),
          ),
        };
      });
  }, cell);
  const settle = () =>
    page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  await settle();
  const canvas = await page.$('canvas'),
    snap = async () => PNG.sync.read(Buffer.from(await canvas.screenshot()));
  const report = [];
  for (const [preset, excluded] of Object.entries(ocular).filter(
    ([preset]) =>
      !high ||
      ['lime_frog', 'lime_headphones', 'blue_spectacles', 'coral_monocle'].includes(preset),
  )) {
    const read = async (name) =>
      JSON.parse(await readFile(`${sourceRoot}/${preset}/${name}-raw.json`, 'utf8'));
    const blinkReference =
      preset === 'lime_headphones'
        ? JSON.parse(await readFile(`${sourceRoot}/lime_frog/idle-raw.json`, 'utf8'))
        : null;
    const frames = await read(high ? 'diagonal' : 'pointer'),
      base = new Map((await read('idle')).map((f) => [f.time, f]));
    const pointer = new AvatarPointerController(),
      gaze = new AvatarGazeController(),
      eyes = new AvatarEyeGazeController();
    let previous = 0;
    await page.evaluate(async (preset) => {
      await window.engine.setPresets([preset]);
    }, preset);
    await settle();
    for (let f = 0; f < frames.length; f++) {
      const frame = frames[f];
      pointer.sample(frame.time);
      if ([8, 20, 34, 55, 85].includes(f)) {
        const idle = base.get(frame.time);
        await page.evaluate(
          ({ idle, yaw, pitch, dragYaw, dragPitch, eyeX, eyeY, closure }) => {
            const e = window.engine;
            e.resetAppearance();
            const idlePose = window.pose(idle.draws);
            idlePose[0].fields.eyeBlink = [closure, 0, 0, 0];
            e.setPose(0, idlePose);
            e.setPose(1, window.pose(idle.draws));
            const s = e.states[0];
            s.gaze.yaw = s.gaze.targetYaw = yaw;
            s.gaze.pitch = s.gaze.targetPitch = pitch;
            s.pointer.active = true;
            s.pointer.yaw = dragYaw;
            s.pointer.pitch = dragPitch;
            s.eyes.x = s.eyes.targetX = eyeX;
            s.eyes.y = s.eyes.targetY = eyeY;
          },
          {
            idle,
            yaw: gaze.yaw,
            pitch: gaze.pitch,
            dragYaw: pointer.yaw,
            dragPitch: pointer.pitch,
            eyeX: eyes.x,
            eyeY: eyes.y,
            closure: blinkReference
              ? eyeClosureFromMorph(
                  blinkReference[f].draws[1].blocks.DrawBlock.slice(36, 40),
                  'integrated',
                )
              : 0,
          },
        );
        await settle();
        const uploads = await page.evaluate(() =>
          window.engine.batches.map((b) => ({
            world: Array.from(b.mesh.instanceMatrix.array.slice(0, 16)),
            normal: Array.from(b.part.motionTexture.image.data.slice(0, 12)),
          })),
        );
        let worldMax = 0,
          normalRelativeMax = 0;
        uploads.forEach((part, p) => {
          if (excluded.includes(p)) return;
          const native = frame.draws[p].blocks.DrawBlock;
          part.world.forEach((v, k) => (worldMax = Math.max(worldMax, Math.abs(v - native[k]))));
          const scale = Math.max(1, ...native.slice(16, 32).map(Math.abs));
          part.normal.forEach(
            (v, k) =>
              (normalRelativeMax = Math.max(
                normalRelativeMax,
                Math.abs(v - native[k + 16]) / scale,
              )),
          );
        });
        assert(worldMax < 1e-6, `${preset}/${f}: uploaded world ${worldMax}`);
        assert(normalRelativeMax < 3e-7, `${preset}/${f}: uploaded normal ${normalRelativeMax}`);
        let pixels;
        if (!excluded.length) {
          const predicted = await snap();
          await page.evaluate(
            ({ idle, frame }) => {
              const e = window.engine;
              e.resetAppearance();
              e.setPose(0, window.pose(frame.draws));
              e.setPose(1, window.pose(idle.draws));
            },
            { idle, frame },
          );
          await settle();
          const native = await snap();
          let total = 0,
            changed = 0,
            neighbor = 0,
            max = 0;
          for (let y = 0; y < cell; y++)
            for (let x = 0; x < cell * 2; x++) {
              let any = false;
              for (let c = 0; c < 4; c++) {
                const at = (y * cell * 2 + x) * 4 + c,
                  d = Math.abs(predicted.data[at] - native.data[at]);
                if (x < cell) {
                  total += d;
                  max = Math.max(max, d);
                }
                any ||= d !== 0;
              }
              if (any) {
                if (x < cell) changed++;
                else neighbor++;
              }
            }
          pixels = { meanAbsoluteChannelError: total / (cell * cell * 4), changed, max, neighbor };
          assert.equal(neighbor, 0);
          assert(
            pixels.meanAbsoluteChannelError < 0.0001 && pixels.max <= 1,
            JSON.stringify({ preset, f, pixels }),
          );
        }
        report.push({ preset, time: frame.time, worldMax, normalRelativeMax, pixels });
      }
      gaze.advance(frame.time - previous);
      eyes.advance(frame.time - previous);
      previous = frame.time;
      for (const e of frame.events) {
        if (e.kind === 'pointer-down') pointer.down(e.x, e.y, frame.time);
        else if (e.kind === 'pointer') pointer.move(e.x, e.y);
        else pointer.up(frame.time);
        gaze.point(e.x, e.y);
        eyes.point(e.x, e.y);
      }
    }
  }
  await page.evaluate(async () => {
    const e = window.engine;
    e.resetAppearance();
    await e.setPresets(['alfred']);
    e.setPaused(true);
  });
  await settle();
  const resting = await snap();
  await page.evaluate((cell) => window.engine.point(cell * 0.78, cell * 0.25), cell);
  await page.waitForFunction(
    () =>
      window.engine.states[0].gaze.yaw > 0 &&
      window.engine.states[0].gaze.pitch < 0 &&
      !window.engine.raf,
  );
  assert.equal(
    await page.evaluate(() => window.engine.states[1].gaze.yaw),
    0,
    'Hover belongs to one avatar',
  );
  const hovered = await snap();
  let changedHover = 0;
  for (let y = 0; y < cell; y++)
    for (let x = 0; x < cell * 2; x++) {
      const p = (y * cell * 2 + x) * 4;
      const changed = [0, 1, 2, 3].some((c) => hovered.data[p + c] !== resting.data[p + c]);
      if (x >= cell) assert(!changed, 'Hovered neighbor pixels stay exact');
      else if (changed) changedHover++;
    }
  assert(changedHover > 100);
  const heldFrames = await page.evaluate(() => window.engine.stats().frames);
  await page.evaluate((cell) => window.engine.point(cell * 0.78, cell * 0.25), cell);
  await new Promise((r) => setTimeout(r, 200));
  assert.equal(
    await page.evaluate(() => window.engine.stats().frames),
    heldFrames,
    'Settled repeated hover does no GPU work',
  );
  await page.evaluate(() => window.engine.point(-1, -1));
  await page.waitForFunction(
    () =>
      window.engine.states[0].gaze.yaw === 0 &&
      window.engine.states[0].gaze.pitch === 0 &&
      !window.engine.raf,
  );
  assert(
    (await snap()).data.equals(resting.data),
    'Pointer leave restores exact pixels and stops RAF',
  );
  await page.evaluate(() => window.engine.dispose());
  assert.deepEqual(errors, []);
  assert.deepEqual(forbidden, []);
  await mkdir(`.local/avatar-gaze-browser-${cell}`, { recursive: true });
  await writeFile(
    `.local/avatar-gaze-browser-${cell}/report.json`,
    JSON.stringify(
      {
        report,
        hover: {
          changedHover,
          neighborPixelsExact: true,
          returnPixelsExact: true,
          quiescent: true,
        },
        errors,
        forbidden,
      },
      null,
      2,
    ),
  );
  console.log(
    JSON.stringify({
      cases: report.length,
      pixels: report.filter((r) => r.pixels),
      errors,
      forbidden,
    }),
  );
} finally {
  await browser.close();
  await rm(tmp, { recursive: true, force: true });
}
