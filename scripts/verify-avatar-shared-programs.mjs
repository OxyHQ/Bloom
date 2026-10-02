/** Verify original-engine shared programs in Chrome. Requires Storybook.
 * BLOOM_PLAYWRIGHT_MODULE may identify an installed Playwright package.
 * node scripts/verify-avatar-shared-programs.mjs [http://localhost:6006]
 *
 * The pixel gate mirrors IDENTICAL native GL commands into an ordinary context
 * and a pooled context. Comparing separately animated Character instances would
 * confuse their independent gaze/blink timing with a shader regression.
 */
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { compatibleShaderSource } from "../assets/character-runtime/shared-programs.mjs";
const require = createRequire(import.meta.url);
const { chromium } = require(
  process.env.BLOOM_PLAYWRIGHT_MODULE || "playwright",
);
const parameter = "float felipeLTC(vec3 p,mat3 transform,vec3 rect[4]) {";
const declaration =
  "vec3 rect[4]=vec3[4](light+right-up,light-right-up,light-right+up,light+right+up);";
assert.equal(
  compatibleShaderSource(parameter),
  parameter.replace("vec3 rect", "highp vec3 rect"),
);
assert.equal(
  compatibleShaderSource(declaration),
  "highp vec3 rect[4];rect[0]=light+right-up;rect[1]=light-right-up;rect[2]=light-right+up;rect[3]=light+right+up;",
);
const unrelated = "vec3 rect[4]=vec3[4](vec3(1,2,3),a,b,c);";
assert.equal(
  compatibleShaderSource(unrelated),
  unrelated,
  "Do not parse arbitrary GLSL commas",
);
assert.equal(
  compatibleShaderSource(compatibleShaderSource(parameter + declaration)),
  compatibleShaderSource(parameter + declaration),
);
const browser = await chromium.launch({ args: ["--no-sandbox"] });
const errors = [];
try {
  const page = await browser.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/__bloom_shared_programs.html", (route) =>
    route.fulfill({ contentType: "text/html", body: "<!doctype html><body>" }),
  );
  await page.goto(
    `${process.argv[2] || "http://localhost:6006"}/__bloom_shared_programs.html`,
  );
  const aliases = await page.evaluate(async () => {
    const { createSharedProgramPool } =
      await import("/bloom-character/shared-programs.mjs");
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 4;
    const real = canvas.getContext("webgl2");
    const pool = createSharedProgramPool(real),
      gl = pool.context;
    const assert = (ok, message) => {
      if (!ok) throw new Error(message);
    };
    const vs =
      "#version 300 es\nvoid main(){vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2)); gl_Position=vec4(p*2.-1.,0.,1.);}";
    const fs =
      "#version 300 es\nprecision highp float; uniform vec4 tint; uniform float factors[2]; out vec4 color; void main(){color=vec4(tint.rgb*factors[0]+vec3(factors[1]),tint.a);}";
    function make(name, fragment = fs) {
      const p = gl.createProgram();
      p.name = name;
      p.uniformLocsById = { name };
      for (const [type, source] of [
        [gl.VERTEX_SHADER, vs],
        [gl.FRAGMENT_SHADER, fragment],
      ]) {
        const s = gl.createShader(type);
        gl.shaderSource(s, source);
        gl.compileShader(s);
        assert(
          gl.getShaderParameter(s, gl.COMPILE_STATUS),
          gl.getShaderInfoLog(s),
        );
        gl.attachShader(p, s);
        gl.deleteShader(s);
      }
      gl.linkProgram(p);
      assert(
        gl.getProgramParameter(p, gl.LINK_STATUS),
        gl.getProgramInfoLog(p),
      );
      return p;
    }
    const a = make(7),
      b = make(9);
    assert(
      a.name === 7 && b.name === 9 && a.uniformLocsById !== b.uniformLocsById,
      "metadata leaked",
    );
    assert(
      pool.stats().programs === 1 && pool.stats().shaders === 2,
      "not shared",
    );
    function draw(p) {
      gl.useProgram(p);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      const pixels = new Uint8Array(4);
      real.readPixels(1, 1, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      assert(gl.getError() === 0, "GL error");
      return [...pixels];
    }
    gl.useProgram(a);
    gl.uniform4f(gl.getUniformLocation(a, "tint"), 1, 0, 0, 1);
    gl.uniform1fv(
      gl.getUniformLocation(a, "factors"),
      new Float32Array([1, 0]),
    );
    const red = draw(a);
    const defaults = draw(b);
    gl.uniform4fv(
      gl.getUniformLocation(b, "tint"),
      new Float32Array([0, 1, 0, 1]),
    );
    gl.uniform1f(gl.getUniformLocation(b, "factors[0]"), 0.5);
    gl.uniform1fv(
      gl.getUniformLocation(b, "factors[1]"),
      new Float32Array([99, 0.2, 99]),
      1,
      1,
    );
    const green = draw(b);
    for (let i = 0; i < 20; i++) {
      assert(
        JSON.stringify(draw(a)) === JSON.stringify(red),
        "red alias corrupt",
      );
      assert(
        JSON.stringify(draw(b)) === JSON.stringify(green),
        "green alias corrupt",
      );
    }
    assert(JSON.stringify(red) === "[255,0,0,255]", "unexpected red");
    assert(
      defaults.every((x) => x === 0),
      "nonzero initial uniforms",
    );
    assert(
      Math.abs(green[0] - 51) < 2 && Math.abs(green[1] - 179) < 2,
      "array write wrong",
    );
    // A third alias with identical complete values needs no physical upload.
    const c = make(11);
    gl.useProgram(c);
    gl.uniform4f(gl.getUniformLocation(c, "tint"), 1, 0, 0, 1);
    gl.uniform1fv(
      gl.getUniformLocation(c, "factors"),
      new Float32Array([1, 0]),
    );
    const identicalBefore = pool.stats();
    assert(
      JSON.stringify(draw(a)) === JSON.stringify(red),
      "identical alias corrupted",
    );
    const identicalAfter = pool.stats();
    assert(
      identicalAfter.uniformReplays === identicalBefore.uniformReplays,
      "identical uniforms replayed",
    );
    assert(
      identicalAfter.uniformReplaySkips - identicalBefore.uniformReplaySkips ===
        2,
      "both complete uniforms must be skipped",
    );
    // A cached physical program must still reset this alias's defaults on relink.
    gl.linkProgram(c);
    assert(
      draw(c).every((value) => value === 0),
      "relink did not reset logical defaults",
    );
    gl.deleteProgram(c);
    gl.deleteProgram(a);
    assert(pool.stats().programs === 1, "deleted shared program");
    assert(JSON.stringify(draw(b)) === JSON.stringify(green), "delete corrupt");
    gl.deleteProgram(b);
    assert(pool.stats().programs === 0 && pool.stats().shaders === 0, "leak");
    const blockSource =
      "#version 300 es\nprecision highp float; layout(std140) uniform Paint { vec4 tint; }; out vec4 color; void main(){color=tint;}";
    const left = make(15, blockSource),
      right = make(17, blockSource);
    const buffers = [
      [1, 0, 0, 1],
      [0, 1, 0, 1],
      [0, 0, 1, 1],
    ].map((rgba, index) => {
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.UNIFORM_BUFFER, buffer);
      gl.bufferData(gl.UNIFORM_BUFFER, new Float32Array(rgba), gl.STATIC_DRAW);
      gl.bindBufferBase(gl.UNIFORM_BUFFER, index + 1, buffer);
      return buffer;
    });
    const li = gl.getUniformBlockIndex(left, "Paint"),
      ri = gl.getUniformBlockIndex(right, "Paint");
    gl.uniformBlockBinding(left, li, 1);
    gl.uniformBlockBinding(right, ri, 2);
    assert(
      JSON.stringify(draw(left)) === "[255,0,0,255]",
      "left block binding",
    );
    assert(
      JSON.stringify(draw(right)) === "[0,255,0,255]",
      "right block binding",
    );
    // Updating an inactive alias must not change the live alias's physical state.
    gl.uniformBlockBinding(left, li, 3);
    assert(
      JSON.stringify(draw(right)) === "[0,255,0,255]",
      "inactive block update leaked",
    );
    assert(
      JSON.stringify(draw(left)) === "[0,0,255,255]",
      "inactive block update lost",
    );
    gl.uniformBlockBinding(right, ri, 3);
    const blockBefore = pool.stats();
    assert(
      JSON.stringify(draw(right)) === "[0,0,255,255]",
      "identical block state lost",
    );
    const blockAfter = pool.stats();
    assert(
      blockAfter.blockReplays === blockBefore.blockReplays &&
        blockAfter.blockReplaySkips === blockBefore.blockReplaySkips + 1,
      "identical block binding replayed",
    );
    gl.deleteProgram(left);
    gl.deleteProgram(right);
    buffers.forEach((buffer) => gl.deleteBuffer(buffer));
    pool.dispose();
    pool.dispose();
    return {
      red,
      defaults,
      green,
      stats: pool.stats(),
      lost: real.isContextLost(),
    };
  });
  const pixels = await page.evaluate(async () => {
    const { createSharedProgramPool } =
      await import("/bloom-character/shared-programs.mjs");
    const source = document.createElement("canvas"),
      dest = document.createElement("canvas");
    source.id = "raw";
    source.width = dest.width = 128;
    source.height = dest.height = 128;
    document.body.append(source, dest);
    const get = source.getContext.bind(source),
      raw = get("webgl2", { alpha: true, antialias: false }),
      physical = dest.getContext("webgl2", { alpha: true, antialias: false }),
      pool = createSharedProgramPool(physical),
      pooled = pool.context,
      mapping = new WeakMap(),
      bound = new Map();
    let physicalUniformCalls = 0,
      nativeUniformCalls = 0;
    const uniformMethods = new Set();
    for (
      let prototype = physical;
      prototype;
      prototype = Object.getPrototypeOf(prototype)
    )
      for (const key of Object.getOwnPropertyNames(prototype))
        if (/^uniform(?:[1-4]|Matrix|BlockBinding)/.test(key))
          uniformMethods.add(key);
    for (const key of uniformMethods) {
      const method = physical[key];
      physical[key] = (...args) => {
        physicalUniformCalls++;
        return method.apply(physical, args);
      };
    }
    const mapped = (x) =>
      Array.isArray(x)
        ? x.map(mapped)
        : x && typeof x === "object" && mapping.has(x)
          ? mapping.get(x)
          : x;
    const tee = new Proxy(raw, {
      get(target, k) {
        if (k === "getExtension")
          return (n) =>
            n === "WEBGL_lose_context"
              ? { loseContext() {}, restoreContext() {} }
              : target.getExtension(n);
        const value = Reflect.get(target, k, target);
        if (typeof value !== "function") return value;
        if (!bound.has(k))
          bound.set(k, (...args) => {
            if (uniformMethods.has(k)) nativeUniformCalls++;
            const original = value.apply(target, args);
            const copy = pooled[k](...args.map(mapped));
            if (
              original &&
              typeof original === "object" &&
              copy &&
              typeof copy === "object"
            )
              mapping.set(original, copy);
            return original;
          });
        return bound.get(k);
      },
    });
    source.getContext = (type, ...args) =>
      type === "webgl2" ? tee : get(type, ...args);
    const factory = (await import("/bloom-character/orbit-characters.mjs"))
        .default,
      m = await factory({ locateFile: (f) => "/bloom-character/" + f });
    const chars = [];
    for (const name of ["blue_beret", "purple_heart", "lime_frog", "alfred"]) {
      const c = new m.Character("#raw", 128, 128);
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
      nativeUniformCalls,
      physicalUniformCalls,
      channels,
      max,
      perCharacter,
      errors,
      before,
      after: pool.stats(),
      glErrors: [raw.getError(), physical.getError()],
    };
  });
  assert.ok(pixels.comparisons >= 100, "Measure submitted native frames");
  assert.ok(
    pixels.perCharacter.every(
      (item) => item.frames >= 20 && item.painted > 500,
    ),
    "Every original must paint",
  );
  assert.equal(
    pixels.channels,
    0,
    "Pooled native frames must match original pixels exactly",
  );
  assert.equal(pixels.max, 0);
  assert.deepEqual(pixels.errors, []);
  assert.deepEqual(pixels.glErrors, [0, 0]);
  assert.equal(pixels.before.logicalPrograms, 36);
  assert.equal(pixels.before.programs, 9);
  assert.equal(pixels.before.shaders, 14);
  const avoided =
    pixels.before.uniformReplaySkips + pixels.before.blockReplaySkips;
  assert.ok(
    pixels.physicalUniformCalls > 0,
    "Instrument physical uniform calls",
  );
  assert.ok(
    pixels.before.uniformReplays > 0 && pixels.before.blockReplays > 0,
    "Different and unknown states still replay",
  );
  assert.ok(
    avoided > 3 * pixels.physicalUniformCalls,
    "Skip at least 75% of the prior replay path's uniform calls",
  );
  for (const key of [
    "logicalPrograms",
    "logicalShaders",
    "programs",
    "shaders",
  ])
    assert.equal(pixels.after[key], 0, `Dispose ${key}`);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ aliases, pixels }, null, 2));
} finally {
  await browser.close();
}
