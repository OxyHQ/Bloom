/** Exact-content texture pooling regression in Chrome against original native draws.
 * Requires Storybook. BLOOM_PLAYWRIGHT_MODULE may identify Playwright.
 * node scripts/verify-avatar-shared-textures.mjs [http://localhost:6006]
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(
  process.env.BLOOM_PLAYWRIGHT_MODULE || 'playwright',
);
const browser = await chromium.launch({ args: ['--no-sandbox'] });
try {
  const page = await browser.newPage(),
    errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/__bloom_texture_pool.html', (r) =>
    r.fulfill({ contentType: 'text/html', body: '<!doctype html><body>' }),
  );
  await page.goto(
    `${process.argv[2] || 'http://localhost:6006'}/__bloom_texture_pool.html`,
  );
  const aliases = await page.evaluate(async () => {
    const { createSharedTexturePool } =
      await import('/bloom-character/shared-textures.mjs');
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 4;
    const real = canvas.getContext('webgl2'),
      pool = createSharedTexturePool(real),
      gl = pool.context;
    const assert = (v, m) => {
      if (!v) throw Error(m);
    };
    const program = gl.createProgram();
    for (const [type, source] of [
      [
        gl.VERTEX_SHADER,
        '#version 300 es\nvoid main(){vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));gl_Position=vec4(p*2.-1.,0.,1.);}',
      ],
      [
        gl.FRAGMENT_SHADER,
        '#version 300 es\nprecision highp float;uniform sampler2D tex;uniform int level;out vec4 color;void main(){color=texelFetch(tex,level==0?ivec2(256):ivec2(0),level);}',
      ],
    ]) {
      const s = gl.createShader(type);
      gl.shaderSource(s, source);
      gl.compileShader(s);
      assert(
        gl.getShaderParameter(s, gl.COMPILE_STATUS),
        gl.getShaderInfoLog(s),
      );
      gl.attachShader(program, s);
      gl.deleteShader(s);
    }
    gl.linkProgram(program);
    gl.useProgram(program);
    const data = new Uint8Array(512 * 512 * 4 + 12);
    for (let i = 12; i < data.length; i += 4) {
      data[i] = 255;
      data[i + 3] = 255;
    }
    function texture() {
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texStorage2D(gl.TEXTURE_2D, 10, gl.RGBA8, 512, 512);
      gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_MIN_FILTER,
        gl.LINEAR_MIPMAP_LINEAR,
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
      gl.texSubImage2D(
        gl.TEXTURE_2D,
        0,
        0,
        0,
        512,
        512,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        data,
        12,
      );
      gl.generateMipmap(gl.TEXTURE_2D);
      return t;
    }
    const a = texture();
    a.name = 3;
    const b = texture();
    b.name = 7;
    assert(a.name === 3 && b.name === 7, 'metadata');
    assert(
      pool.stats().physicalTextures === 1,
      'identical textures not shared',
    );
    function draw(unit, level = 0) {
      gl.uniform1i(gl.getUniformLocation(program, 'tex'), unit);
      gl.uniform1i(gl.getUniformLocation(program, 'level'), level);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      const pixel = new Uint8Array(4);
      real.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
      assert(gl.getError() === 0, 'GL error');
      return [...pixel];
    }
    const red = '[255,0,0,255]',
      blue = '[0,0,255,255]';
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, a);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, b);
    assert(
      JSON.stringify(draw(0, 9)) === red && JSON.stringify(draw(1, 9)) === red,
      'shared mips',
    );
    // Same mutable source pointer, different contents: mutation must not leak.
    for (let i = 12; i < data.length; i += 4) {
      data[i] = 0;
      data[i + 2] = 255;
    }
    assert(JSON.stringify(draw(0)) === red, 'retained source pointer');
    gl.texSubImage2D(
      gl.TEXTURE_2D,
      0,
      0,
      0,
      512,
      512,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      data,
      12,
    );
    gl.generateMipmap(gl.TEXTURE_2D);
    assert(
      pool.stats().physicalTextures === 2 && pool.stats().copies === 1,
      'copy on upload',
    );
    assert(
      JSON.stringify(draw(0, 9)) === red && JSON.stringify(draw(1, 9)) === blue,
      'COW mip or units leaked',
    );
    // Identical bytes may share only with identical sampler parameters.
    const c = texture();
    assert(pool.stats().physicalTextures === 2, 'blue bytes should share');
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    assert(pool.stats().physicalTextures === 3, 'parameter COW');
    gl.bindTexture(gl.TEXTURE_2D, b);
    assert(
      gl.getTexParameter(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S) === gl.REPEAT,
      'sampler mutation leaked',
    );
    // Attaching a still-shared texture to an FBO makes it private before rendering.
    const d = texture();
    assert(pool.stats().physicalTextures === 3, 'd shares blue');
    gl.bindTexture(gl.TEXTURE_2D, a);
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      d,
      0,
    );
    assert(
      gl.getFramebufferAttachmentParameter(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME,
      ) === d,
      'attachment identity',
    );
    assert(
      gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE,
      'FBO incomplete',
    );
    assert(
      gl.getParameter(gl.TEXTURE_BINDING_2D) === a,
      'FBO COW changed unrelated binding',
    );
    gl.clearColor(0, 1, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, b);
    assert(JSON.stringify(draw(1)) === blue, 'FBO write leaked');
    gl.bindTexture(gl.TEXTURE_2D, d);
    assert(JSON.stringify(draw(1)) === '[0,255,0,255]', 'FBO write missing');

    // Partial upload under different unpack state must reconstruct the old base first.
    const e = texture();
    gl.pixelStorei(gl.UNPACK_ROW_LENGTH, 2);
    gl.texSubImage2D(
      gl.TEXTURE_2D,
      0,
      256,
      256,
      1,
      1,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([255, 255, 0, 255, 0, 0, 0, 0]),
    );
    assert(
      gl.getParameter(gl.UNPACK_ROW_LENGTH) === 2,
      'unpack state not restored',
    );
    assert(JSON.stringify(draw(1)) === '[255,255,0,255]', 'partial COW pixel');
    gl.pixelStorei(gl.UNPACK_ROW_LENGTH, 0);
    const f = texture(),
      pbo = gl.createBuffer();
    gl.bindBuffer(gl.PIXEL_UNPACK_BUFFER, pbo);
    gl.bufferData(
      gl.PIXEL_UNPACK_BUFFER,
      new Uint8Array([255, 0, 255, 255]),
      gl.STATIC_DRAW,
    );
    gl.texSubImage2D(
      gl.TEXTURE_2D,
      0,
      256,
      256,
      1,
      1,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      0,
    );
    assert(
      gl.getParameter(gl.PIXEL_UNPACK_BUFFER_BINDING) === pbo,
      'unpack buffer not restored',
    );
    assert(JSON.stringify(draw(1)) === '[255,0,255,255]', 'PBO COW pixel');
    gl.bindBuffer(gl.PIXEL_UNPACK_BUFFER, null);
    gl.deleteBuffer(pbo);
    gl.bindTexture(gl.TEXTURE_2D, b);
    assert(JSON.stringify(draw(1, 9)) === blue, 'other owner changed');
    gl.deleteTexture(e);
    gl.deleteTexture(f);
    const before = pool.stats();
    gl.deleteFramebuffer(fb);
    for (const t of [a, b, c, d]) gl.deleteTexture(t);
    // The one-level NPOT atlas must share immediately after its full upload.
    const atlasData = new Uint8Array(576 * 960 * 4);
    for (let i = 0; i < atlasData.length; i += 4) {
      atlasData[i] = 255;
      atlasData[i + 3] = 255;
    }
    function atlas() {
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, 576, 960);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texSubImage2D(
        gl.TEXTURE_2D,
        0,
        0,
        0,
        576,
        960,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        atlasData,
      );
      return texture;
    }
    const atlasA = atlas(),
      atlasB = atlas();
    assert(pool.stats().physicalTextures === 1, 'NPOT atlas not shared');
    assert(
      pool.stats().mipBytesSaved === 576 * 960 * 4,
      'NPOT allocation accounting',
    );
    assert(JSON.stringify(draw(1)) === red, 'NPOT shared pixels');
    gl.texSubImage2D(
      gl.TEXTURE_2D,
      0,
      256,
      256,
      1,
      1,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([0, 255, 0, 255]),
    );
    assert(
      pool.stats().physicalTextures === 2,
      'NPOT partial upload must split',
    );
    assert(
      JSON.stringify(draw(1)) === '[0,255,0,255]',
      'NPOT partial upload lost',
    );
    gl.bindTexture(gl.TEXTURE_2D, atlasA);
    assert(JSON.stringify(draw(1)) === red, 'NPOT partial upload leaked');
    gl.deleteTexture(atlasA);
    gl.deleteTexture(atlasB);
    gl.deleteProgram(program);
    const after = pool.stats();
    assert(
      after.physicalTextures === 0 &&
        after.logicalTextures === 0 &&
        after.pooledTextures === 0,
      'leak',
    );
    pool.dispose();
    pool.dispose();
    return { before, after, glError: real.getError() };
  });
  const pixels = await page.evaluate(async () => {
    const { createSharedTexturePool } =
      await import('/bloom-character/shared-textures.mjs');
    const source = document.createElement('canvas'),
      dest = document.createElement('canvas');
    source.id = 'raw';
    source.width = dest.width = 128;
    source.height = dest.height = 128;
    document.body.append(source, dest);
    const get = source.getContext.bind(source),
      raw = get('webgl2', { alpha: true, antialias: false }),
      physical = dest.getContext('webgl2', { alpha: true, antialias: false }),
      pool = createSharedTexturePool(physical),
      pooled = pool.context,
      mapping = new WeakMap(),
      bound = new Map();
    const mapped = (x) =>
      Array.isArray(x)
        ? x.map(mapped)
        : x && typeof x === 'object' && mapping.has(x)
          ? mapping.get(x)
          : x;
    const tee = new Proxy(raw, {
      get(target, k) {
        if (k === 'getExtension')
          return (n) =>
            n === 'WEBGL_lose_context'
              ? { loseContext() {}, restoreContext() {} }
              : target.getExtension(n);
        const value = Reflect.get(target, k, target);
        if (typeof value !== 'function') return value;
        if (!bound.has(k))
          bound.set(k, (...args) => {
            const original = value.apply(target, args);
            const copy = pooled[k](...args.map(mapped));
            if (
              original &&
              typeof original === 'object' &&
              copy &&
              typeof copy === 'object'
            )
              mapping.set(original, copy);
            return original;
          });
        return bound.get(k);
      },
    });
    source.getContext = (type, ...args) =>
      type === 'webgl2' ? tee : get(type, ...args);
    const factory = (await import('/bloom-character/orbit-characters.mjs'))
        .default,
      m = await factory({ locateFile: (f) => '/bloom-character/' + f });
    const chars = [];
    for (const name of ['blue_beret', 'purple_heart', 'lime_frog', 'alfred']) {
      const c = new m.Character('#raw', 128, 128);
      c.setQuality(1);
      c.restore(m.presetAppearance(name));
      c.setReducedMotion(false);
      c.setActive(true);
      chars.push(c);
    }
    let comparisons = 0,
      max = 0,
      channels = 0;
    const perCharacter = chars.map(() => ({
      frames: 0,
      channels: 0,
      max: 0,
      painted: 0,
    }));
    const errors = [];
    const a = new Uint8Array(128 * 128 * 4),
      b = new Uint8Array(a.length);
    for (let frame = 0; frame < 120; frame++) {
      for (let index = 0; index < chars.length; index++) {
        const c = chars[index];
        if (c.render(frame / 30)) {
          raw.readPixels(0, 0, 128, 128, raw.RGBA, raw.UNSIGNED_BYTE, a);
          physical.readPixels(0, 0, 128, 128, raw.RGBA, raw.UNSIGNED_BYTE, b);
          comparisons++;
          perCharacter[index].frames++;
          let painted = 0;
          for (let j = 3; j < a.length; j += 4) if (a[j] > 24) painted++;
          perCharacter[index].painted = Math.max(
            perCharacter[index].painted,
            painted,
          );
          for (let i = 0; i < a.length; i++) {
            const d = Math.abs(a[i] - b[i]);
            if (d) {
              channels++;
              perCharacter[index].channels++;
            }
            max = Math.max(max, d);
            perCharacter[index].max = Math.max(perCharacter[index].max, d);
          }
        }
        if (c.renderError()) errors.push(c.renderError());
      }
      await new Promise((r) => setTimeout(r, 10));
    }
    const before = pool.stats();
    for (const c of chars) c.delete();
    return {
      comparisons,
      channels,
      max,
      perCharacter,
      errors,
      before,
      after: pool.stats(),
      glErrors: [raw.getError(), physical.getError()],
    };
  });
  assert.deepEqual(errors, []);
  assert.ok(pixels.comparisons >= 100);
  assert.ok(
    pixels.perCharacter.every(
      (item) => item.frames >= 20 && item.painted > 500,
    ),
  );
  assert.equal(pixels.channels, 0);
  assert.equal(pixels.max, 0);
  assert.deepEqual(pixels.errors, []);
  assert.deepEqual(pixels.glErrors, [0, 0]);
  assert.equal(pixels.before.logicalTextures, 48);
  assert.equal(pixels.before.physicalTextures, 39);
  assert.equal(pixels.before.pooledTextures, 3);
  assert.equal(pixels.before.hits, 9);
  assert.equal(pixels.before.mipBytesSaved, 6 * 1398100 + 3 * 576 * 960 * 4);
  for (const key of [
    'logicalTextures',
    'physicalTextures',
    'pooledTextures',
    'mipBytesSaved',
  ])
    assert.equal(pixels.after[key], 0, `Dispose ${key}`);
  console.log(JSON.stringify({ aliases, pixels }, null, 2));
} finally {
  await browser.close();
}
