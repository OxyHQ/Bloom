/** Exercise actual WebGL2 texture growth after its first GPU upload. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const puppeteer = createRequire(import.meta.url)(
  process.env.BLOOM_PUPPETEER_MODULE || 'puppeteer-core',
);
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
});
const errors = [];
try {
  const page = await browser.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (/GL_INVALID|GL_OUT_OF_MEMORY|WebGL: INVALID/.test(m.text())) errors.push(m.text());
  });
  await page.setRequestInterception(true);
  page.on('request', (r) =>
    r.url().endsWith('/avatar-pose-check.html')
      ? r.respond({ contentType: 'text/html', body: '<!doctype html><canvas></canvas>' })
      : r.continue(),
  );
  await page.goto('http://localhost:6006/avatar-pose-check.html');
  const result = await page.evaluate(async () => {
    const { AuthoredAvatarEngine } = await import('/runtime/avatar/authored-engine.ts');
    const canvas = document.querySelector('canvas');
    canvas.style.width = canvas.style.height = '48px';
    const engine = new AuthoredAvatarEngine(canvas, { count: 1, size: 48 });
    await engine.loaded;
    const frames = async () => {
      for (let i = 0; i < 3; i++) await new Promise(requestAnimationFrame);
    };
    await frames();
    const initial = engine.stats();
    const initialError = canvas.getContext('webgl2').getError();
    const stages = [];
    for (const count of [3, 17, 65, 200]) {
      const columns = Math.ceil(Math.sqrt(count));
      canvas.style.width = `${columns * 48}px`;
      canvas.style.height = `${Math.ceil(count / columns) * 48}px`;
      engine.setCount(count);
      await frames();
      const stats = engine.stats();
      stages.push({
        count,
        bytes: stats.poseTextureBytes,
        textures: stats.resources.textures,
        error: canvas.getContext('webgl2').getError(),
      });
    }
    engine.dispose();
    return {
      initial: {
        bytes: initial.poseTextureBytes,
        textures: initial.resources.textures,
        error: initialError,
      },
      stages,
      contexts: engine.stats().contexts,
    };
  });
  console.log(JSON.stringify({ result, errors }));
  assert.equal(result.initial.error, 0, 'Initial pose texture upload');
  assert(result.initial.bytes > 0);
  for (const stage of result.stages) {
    const rows = Math.min(200, 2 ** Math.ceil(Math.log2(stage.count)));
    assert.equal(stage.bytes, result.initial.bytes * rows, 'Only allocate required pose rows');
    assert.equal(
      stage.textures,
      result.initial.textures,
      'Growing storage must release old GPU allocation',
    );
    assert.equal(stage.error, 0, 'Immutable WebGL2 texture resized without allocation');
  }
  assert.equal(result.contexts, 0);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify(result));
} finally {
  await browser.close();
}
