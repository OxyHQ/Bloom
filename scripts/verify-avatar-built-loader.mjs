/** Exercise the component's module-script loader, not a direct ESM import. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const require = createRequire(import.meta.url);
const puppeteer = require(process.env.BLOOM_PUPPETEER_MODULE || 'puppeteer-core');
const origin = process.env.BLOOM_STORYBOOK_URL || 'http://localhost:6007';
const directory = resolve(process.env.AVATAR_BUILT_DIRECTORY || 'assets/character-runtime');
const output = process.env.AVATAR_BUILT_LOADER_OUTPUT || '.local/avatar-built-loader';
const manifest = JSON.parse(await readFile(resolve(directory, 'manifest.json'), 'utf8'));
const mount = '/relocated/team-avatar/';
const serverErrors = [];
const server = createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    if (pathname === '/avatar-built-loader.html') {
      response.writeHead(200, { 'Content-Type': 'text/html' });
      response.end(
        '<!doctype html><head><link rel="icon" href="data:,"></head><body style="margin:0"></body>',
      );
      return;
    }
    let file = pathname.startsWith(mount) ? pathname.slice(mount.length) : '';
    if (file === 'engine-alias.mjs') file = manifest.entry;
    if (!Object.hasOwn(manifest.files, file)) {
      response.writeHead(404);
      response.end();
      return;
    }
    response.writeHead(200, {
      'Content-Type': file.endsWith('.mjs')
        ? 'text/javascript'
        : file.endsWith('.json')
          ? 'application/json'
          : 'application/octet-stream',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store',
    });
    response.end(await readFile(resolve(directory, file)));
  } catch (error) {
    serverErrors.push(String(error));
    response.writeHead(500);
    response.end();
  }
});
await new Promise((ready) => server.listen(0, '127.0.0.1', ready));
const address = server.address();
const runtimeBase = `http://127.0.0.1:${address.port}${mount}`;
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
});
const report = { cases: [], errors: [], networkErrors: [], serverErrors };
try {
  for (const entry of ['runtime.mjs?revision=relocated', 'engine-alias.mjs?revision=alias']) {
    const page = await browser.newPage();
    page.on('pageerror', (error) => report.errors.push(error.message));
    page.on('requestfailed', (request) =>
      report.networkErrors.push({ url: request.url(), failure: request.failure() }),
    );
    page.on('console', (message) => {
      if (message.type() === 'error') report.errors.push(message.text());
    });
    await page.setViewport({ width: 320, height: 240, deviceScaleFactor: 1 });
    await page.goto(`http://127.0.0.1:${address.port}/avatar-built-loader.html`);
    const result = await page.evaluate(
      async ({ url, sourceOrigin }) => {
        const { loadCharacterRuntime } = await import(
          `${sourceOrigin}/src/agent-avatar/character-runtime-module.ts`
        );
        const { resolveAvatarCharacter } = await import(
          `${sourceOrigin}/src/agent-avatar/character.ts`
        );
        const runtime = await loadCharacterRuntime(url);
        if (runtime !== (await loadCharacterRuntime(url)))
          throw Error('Runtime registry cache missed');
        const canvas = document.createElement('canvas');
        canvas.style.cssText = 'width:64px;height:64px';
        document.body.append(canvas);
        let ready, fail;
        const painted = new Promise((resolve, reject) => {
          ready = resolve;
          fail = reject;
        });
        const controller = await runtime.createAvatar(
          canvas,
          {
            character: resolveAvatarCharacter({ preset: 'blue_beret' }),
            reduced: false,
            portrait: true,
          },
          { onReady: ready, onError: () => fail(Error('Packaged avatar failed')) },
        );
        await Promise.race([
          painted,
          new Promise((_, reject) =>
            setTimeout(() => reject(Error('Packaged first paint timed out')), 30000),
          ),
        ]);
        const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
        let paintedPixels = 0;
        for (let i = 3; i < pixels.length; i += 4) if (pixels[i]) paintedPixels++;
        const stats = (await runtime.diagnostics())[0].stats;
        const registered = globalThis[Symbol.for('bloom.character.runtimes')].has(url);
        controller.dispose();
        if ((await runtime.diagnostics()).length) throw Error('Packaged avatar did not dispose');
        return {
          registered,
          paintedPixels,
          activeAtlasScissor: stats.activeAtlasScissor,
          fitPasses: stats.fitPasses,
          sharedPoseCopies: stats.sharedPoseCopies,
        };
      },
      { url: runtimeBase + entry, sourceOrigin: origin },
    );
    assert.equal(result.registered, true);
    assert(result.paintedPixels > 100);
    assert.equal(result.activeAtlasScissor, true);
    assert(result.fitPasses > 0);
    assert.equal(typeof result.sharedPoseCopies, 'number');
    report.cases.push({ entry, ...result });
    await page.close();
  }
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${address.port}/avatar-built-loader.html`);
  const source = await page.evaluate(async (sourceOrigin) => {
    const module = await import(`${sourceOrigin}/runtime/avatar-runtime.ts`);
    const { loadCharacterRuntime } = await import(
      `${sourceOrigin}/src/agent-avatar/character-runtime-module.ts`
    );
    const url = new URL(module.CHARACTER_RUNTIME_URL, document.baseURI).href;
    const runtime = await loadCharacterRuntime(url);
    return {
      registered: globalThis[Symbol.for('bloom.character.runtimes')].has(url),
      createAvatarMatches: runtime.createAvatar === module.createAvatar,
    };
  }, origin);
  assert.deepEqual(source, { registered: true, createAvatarMatches: true });
  report.cases.push({ entry: 'source-storybook-alias', ...source });
  await page.close();
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.networkErrors, []);
  assert.deepEqual(serverErrors, []);
} catch (error) {
  report.failure = String(error);
  throw error;
} finally {
  await mkdir(output, { recursive: true });
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2) + '\n');
  await browser.close();
  await new Promise((closed) => server.close(closed));
}
console.log(JSON.stringify(report));
