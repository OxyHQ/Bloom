// Blend only the original engine's reflected pose blocks. Vertex/index buffers,
// material values and shader switches are never rewritten by this adapter.
const identity = () =>
  new Float64Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
export function multiplyMatrix(a, b) {
  const out = new Float64Array(16);
  for (let c = 0; c < 4; c++)
    for (let r = 0; r < 4; r++)
      for (let k = 0; k < 4; k++) out[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k];
  return out;
}
export function inverseMatrix(m) {
  const a = Array.from({ length: 4 }, (_, r) =>
    Array.from({ length: 8 }, (_, c) =>
      c < 4 ? m[c * 4 + r] : +(c - 4 === r),
    ),
  );
  for (let c = 0; c < 4; c++) {
    let pivot = c;
    for (let r = c + 1; r < 4; r++)
      if (Math.abs(a[r][c]) > Math.abs(a[pivot][c])) pivot = r;
    if (Math.abs(a[pivot][c]) < 1e-10) return null;
    [a[c], a[pivot]] = [a[pivot], a[c]];
    const divisor = a[c][c];
    for (let k = 0; k < 8; k++) a[c][k] /= divisor;
    for (let r = 0; r < 4; r++)
      if (r !== c) {
        const f = a[r][c];
        for (let k = 0; k < 8; k++) a[r][k] -= f * a[c][k];
      }
  }
  return Float64Array.from(
    { length: 16 },
    (_, i) => a[i % 4][4 + Math.floor(i / 4)],
  );
}
function dot(a, b) {
  return a.reduce((s, x, i) => s + x * b[i], 0);
}
function normalized(a) {
  const n = Math.hypot(...a);
  return n > 1e-10 ? a.map((x) => x / n) : null;
}
function quaternion(m) {
  const t = m[0] + m[5] + m[10];
  let x, y, z, w, s;
  if (t > 0) {
    s = Math.sqrt(t + 1) * 2;
    w = s / 4;
    x = (m[6] - m[9]) / s;
    y = (m[8] - m[2]) / s;
    z = (m[1] - m[4]) / s;
  } else if (m[0] > m[5] && m[0] > m[10]) {
    s = Math.sqrt(1 + m[0] - m[5] - m[10]) * 2;
    w = (m[6] - m[9]) / s;
    x = s / 4;
    y = (m[4] + m[1]) / s;
    z = (m[8] + m[2]) / s;
  } else if (m[5] > m[10]) {
    s = Math.sqrt(1 + m[5] - m[0] - m[10]) * 2;
    w = (m[8] - m[2]) / s;
    x = (m[4] + m[1]) / s;
    y = s / 4;
    z = (m[9] + m[6]) / s;
  } else {
    s = Math.sqrt(1 + m[10] - m[0] - m[5]) * 2;
    w = (m[1] - m[4]) / s;
    x = (m[8] + m[2]) / s;
    y = (m[9] + m[6]) / s;
    z = s / 4;
  }
  return normalized([x, y, z, w]);
}
function decompose(m) {
  if (
    !Array.from(m).every(Number.isFinite) ||
    Math.abs(m[3]) + Math.abs(m[7]) + Math.abs(m[11]) + Math.abs(m[15] - 1) >
      1e-5
  )
    return null;
  const scales = [
    Math.hypot(m[0], m[1], m[2]),
    Math.hypot(m[4], m[5], m[6]),
    Math.hypot(m[8], m[9], m[10]),
  ];
  if (scales.some((x) => x < 1e-8)) return null;
  const determinant =
    m[0] * (m[5] * m[10] - m[6] * m[9]) -
    m[4] * (m[1] * m[10] - m[2] * m[9]) +
    m[8] * (m[1] * m[6] - m[2] * m[5]);
  if (determinant < 0) scales[0] *= -1;
  const rotation = identity();
  for (let c = 0; c < 3; c++)
    for (let r = 0; r < 3; r++) rotation[c * 4 + r] = m[c * 4 + r] / scales[c];
  const axes = [
    Array.from(rotation.slice(0, 3)),
    Array.from(rotation.slice(4, 7)),
    Array.from(rotation.slice(8, 11)),
  ];
  if (
    Math.abs(dot(axes[0], axes[1])) +
      Math.abs(dot(axes[0], axes[2])) +
      Math.abs(dot(axes[1], axes[2])) >
    1e-3
  )
    return null;
  return { q: quaternion(rotation), s: scales, p: Array.from(m.slice(12, 15)) };
}
function slerp(a, b, t) {
  let cosine = dot(a, b);
  if (cosine < 0) {
    b = b.map((x) => -x);
    cosine = -cosine;
  }
  if (cosine > 0.9995) return normalized(a.map((x, i) => x + (b[i] - x) * t));
  const angle = Math.acos(Math.min(1, cosine)),
    d = Math.sin(angle);
  return a.map(
    (x, i) => (x * Math.sin((1 - t) * angle) + b[i] * Math.sin(t * angle)) / d,
  );
}
function compose({ q: [x, y, z, w], s, p }) {
  const m = identity();
  m[0] = 1 - 2 * (y * y + z * z);
  m[1] = 2 * (x * y + z * w);
  m[2] = 2 * (x * z - y * w);
  m[4] = 2 * (x * y - z * w);
  m[5] = 1 - 2 * (x * x + z * z);
  m[6] = 2 * (y * z + x * w);
  m[8] = 2 * (x * z + y * w);
  m[9] = 2 * (y * z - x * w);
  m[10] = 1 - 2 * (x * x + y * y);
  for (let c = 0; c < 3; c++) for (let r = 0; r < 3; r++) m[c * 4 + r] *= s[c];
  m.set(p, 12);
  return m;
}
export function interpolateTransform(a, b, t) {
  if (t <= 0) return new Float64Array(a);
  if (t >= 1) return new Float64Array(b);
  const from = decompose(a),
    to = decompose(b);
  if (!from?.q || !to?.q || from.s.some((x, i) => x * to.s[i] <= 0))
    return null;
  return compose({
    q: slerp(from.q, to.q, t),
    s: from.s.map((x, i) => x + (to.s[i] - x) * t),
    p: from.p.map((x, i) => x + (to.p[i] - x) * t),
  });
}
function point(m, x, y, z) {
  const w = m[3] * x + m[7] * y + m[11] * z + m[15];
  if (Math.abs(w) < 1e-10) return null;
  return [0, 1, 2].map(
    (r) => (m[r] * x + m[4 + r] * y + m[8 + r] * z + m[12 + r]) / w,
  );
}
function camera(frame) {
  const vp = frame.slice(0, 16),
    inv = inverseMatrix(vp);
  if (!inv) return null;
  const center = point(inv, 0, 0, -1),
    right = point(inv, 1, 0, -1),
    up = point(inv, 0, 1, -1),
    far = point(inv, 0, 0, 1);
  if (!center || !right || !up || !far) return null;
  const axes = [
    normalized(right.map((v, i) => v - center[i])),
    normalized(up.map((v, i) => v - center[i])),
    normalized(center.map((v, i) => v - far[i])),
  ];
  if (axes.some((a) => !a)) return null;
  const world = identity();
  axes.forEach((a, i) => world.set(a, i * 4));
  const position = frame[51] === 1 ? frame.slice(48, 51) : point(inv, 0, 0, 0);
  if (!position) return null;
  world.set(position, 12);
  return { world, projection: multiplyMatrix(vp, world) };
}
export function blendFramePose(from, to, t) {
  const out = new Float32Array(to);
  if (t <= 0) {
    out.set(from.subarray(0, 32), 0);
    out.set(from.subarray(48, 51), 48);
    return out;
  }
  if (t >= 1) return out;
  const a = camera(from),
    b = camera(to);
  if (!a || !b || from[51] !== to[51]) return null;
  // Interpolate within one projection family, never perspective to orthographic.
  if (Math.abs(a.projection[15] - b.projection[15]) > 1e-4) return null;
  const world = interpolateTransform(a.world, b.world, t);
  if (!world) return null;
  const view = inverseMatrix(world);
  if (!view) return null;
  const projection = a.projection.map((v, i) => v + (b.projection[i] - v) * t);
  const vp = multiplyMatrix(projection, view),
    inv = inverseMatrix(vp);
  if (!inv) return null;
  out.set(vp, 0);
  out.set(inv, 16);
  if (to[51] === 1) out.set(world.slice(12, 15), 48);
  else for (let i = 48; i < 51; i++) out[i] = from[i] + (to[i] - from[i]) * t;
  return out;
}
export function blendDrawPose(from, to, t) {
  const out = new Float32Array(to),
    world = interpolateTransform(from.slice(0, 16), to.slice(0, 16), t);
  if (!world) return null;
  const normal = inverseMatrix(world);
  if (!normal) return null;
  out.set(world, 0);
  if (t <= 0) out.set(from.subarray(16, 32), 16);
  // Native normalMatrix is an inverse-transpose of the world linear transform.
  // Retain its unused fourth row/column and every non-pose field verbatim.
  if (t > 0 && t < 1)
    for (let c = 0; c < 3; c++)
      for (let r = 0; r < 3; r++) out[16 + c * 4 + r] = normal[r * 4 + c];
  for (const i of [37, 38, 39, 88, 89, 90, 91])
    out[i] = from[i] + (to[i] - from[i]) * t;
  return out;
}

export function createPoseTransition(gl, { assertAvailable = () => {} } = {}) {
  const blocks = new WeakMap(),
    indexed = new Map(),
    buffers = new Map(),
    methods = new Map();
  const ids = new WeakMap();
  let serial = 0;
  const id = (value) => {
    if (!value) return 0;
    if (!ids.has(value)) ids.set(value, ++serial);
    return ids.get(value);
  };
  let bound = null,
    program = null,
    vao = null,
    frame = new Map(),
    previous = new Map(),
    source = null;
  const starts = new Map();
  let now = 0,
    expires = 0,
    duration = 180,
    ready = true;
  const counters = {
    transitions: 0,
    draws: 0,
    cameras: 0,
    joints: 0,
    unmatched: 0,
    unsupported: 0,
  };
  function programBlocks(p) {
    let value = blocks.get(p);
    if (!value) {
      value = new Map();
      blocks.set(p, value);
    }
    return value;
  }
  function bytes(data, offset = 0, length) {
    if (!ArrayBuffer.isView(data) || !Number.isInteger(data.BYTES_PER_ELEMENT))
      return null;
    const count = length === undefined ? data.length - offset : length;
    if (!Number.isInteger(count) || count < 0) return null;
    return new Uint8Array(
      data.buffer,
      data.byteOffset + offset * data.BYTES_PER_ELEMENT,
      count * data.BYTES_PER_ELEMENT,
    ).slice();
  }
  function upload(range, values) {
    gl.bindBuffer(gl.UNIFORM_BUFFER, range.buffer);
    gl.bufferSubData(gl.UNIFORM_BUFFER, range.offset, values);
    gl.bindBuffer(gl.UNIFORM_BUFFER, bound);
  }
  function rangeFor(name, size) {
    const entry = [...(blocks.get(program)?.values() ?? [])].find(
      (x) => x.name === name && x.binding !== undefined,
    );
    const range = entry && indexed.get(entry.binding),
      data = range && buffers.get(range.buffer);
    if (
      !range ||
      !data ||
      (range.size ?? data.length) !== size ||
      range.offset < 0 ||
      range.offset + size > data.length
    )
      return null;
    return { ...range, data, size };
  }
  function pose(name, range, key, blend) {
    if (!range || frame.has(key)) return;
    let output = new Float32Array(
      range.data.slice(range.offset, range.offset + range.size).buffer,
    );
    const old = source?.get(key);
    if (source) {
      if (old && old.length === output.length) {
        const indices =
          name === 'draws'
            ? [
                ...Array.from({ length: 16 }, (_, i) => i),
                37,
                38,
                39,
                88,
                89,
                90,
                91,
              ]
            : name === 'cameras'
              ? [...Array.from({ length: 16 }, (_, i) => i), 48, 49, 50]
              : Array.from({ length: output.length }, (_, i) => i);
        const changed = indices.some(
          (i) => Math.abs(old[i] - output[i]) > 1e-5,
        );
        if (!starts.has(key) && ready && changed) starts.set(key, null);
        const start = starts.get(key);
        const progress =
          typeof start === 'number'
            ? Math.min(1, Math.max(0, (now - start) / duration))
            : 0;
        if (progress === 1 || !changed) {
          frame.set(key, output);
          return;
        }
        const alpha = progress * progress * (3 - 2 * progress);
        const mixed = blend(old, output, alpha);
        if (mixed) {
          output = mixed;
          upload(range, output);
          counters[name]++;
        } else counters.unsupported++;
      } else counters.unmatched++;
    }
    frame.set(key, new Float32Array(output));
  }
  function beforeDraw() {
    if (!program || !vao) return;
    const draw = rangeFor('DrawBlock', 368);
    if (!draw) return;
    // VAOs identify original geometry; range offsets disambiguate instances
    // such as two eyes sharing a mesh. Newly introduced props have no old pose.
    pose('draws', draw, `draw:${id(vao)}:${draw.offset}`, blendDrawPose);
    const cameraRange = rangeFor('FrameBlock', 464);
    pose(
      'cameras',
      cameraRange,
      `frame:${id(cameraRange?.buffer)}`,
      blendFramePose,
    );
    const skin = rangeFor('SkinBlock', 1536);
    if (skin)
      pose('joints', skin, `skin:${id(skin.buffer)}`, (a, b, t) => {
        const out = new Float32Array(b);
        for (let i = 0; i < 384; i += 16) {
          // Unused joint slots can be zero matrices; leave identical slots alone.
          if (a.subarray(i, i + 16).every((v, k) => v === b[i + k])) continue;
          const matrix = interpolateTransform(
            a.slice(i, i + 16),
            b.slice(i, i + 16),
            t,
          );
          if (!matrix) return null;
          out.set(matrix, i);
        }
        return out;
      });
  }
  const api = {
    getUniformBlockIndex(p, name) {
      const index = gl.getUniformBlockIndex(p, name);
      if (index !== gl.INVALID_INDEX)
        programBlocks(p).set(index, { ...programBlocks(p).get(index), name });
      return index;
    },
    uniformBlockBinding(p, index, binding) {
      const entries = programBlocks(p),
        entry = entries.get(index);
      if (entry) entry.binding = binding;
      return gl.uniformBlockBinding(p, index, binding);
    },
    useProgram(p) {
      program = p;
      return gl.useProgram(p);
    },
    bindVertexArray(value) {
      vao = value;
      return gl.bindVertexArray(value);
    },
    bindBuffer(target, value) {
      if (target === gl.UNIFORM_BUFFER) bound = value;
      return gl.bindBuffer(target, value);
    },
    bindBufferRange(target, index, buffer, offset, size) {
      if (target === gl.UNIFORM_BUFFER) {
        bound = buffer;
        indexed.set(index, { buffer, offset, size });
      }
      return gl.bindBufferRange(target, index, buffer, offset, size);
    },
    bindBufferBase(target, index, buffer) {
      if (target === gl.UNIFORM_BUFFER) {
        bound = buffer;
        indexed.set(index, { buffer, offset: 0, size: undefined });
      }
      return gl.bindBufferBase(target, index, buffer);
    },
    bufferData(target, data, usage, offset, length) {
      if (target === gl.UNIFORM_BUFFER && bound) {
        const copy = bytes(data, offset, length);
        if (copy) buffers.set(bound, copy);
        else buffers.delete(bound);
      }
      return gl.bufferData(
        target,
        data,
        usage,
        ...(offset === undefined
          ? []
          : [offset, ...(length === undefined ? [] : [length])]),
      );
    },
    bufferSubData(target, offset, data, srcOffset, length) {
      if (target === gl.UNIFORM_BUFFER && bound) {
        const copy = bytes(data, srcOffset, length),
          old = buffers.get(bound);
        if (copy && old && offset + copy.length <= old.length)
          old.set(copy, offset);
        else buffers.delete(bound);
      }
      return gl.bufferSubData(
        target,
        offset,
        data,
        ...(srcOffset === undefined
          ? []
          : [srcOffset, ...(length === undefined ? [] : [length])]),
      );
    },
    deleteBuffer(buffer) {
      buffers.delete(buffer);
      return gl.deleteBuffer(buffer);
    },
  };
  const context = new Proxy(gl, {
    get(target, key) {
      if (Object.hasOwn(api, key)) {
        if (!methods.has(key))
          methods.set(key, (...args) => {
            assertAvailable();
            return api[key](...args);
          });
        return methods.get(key);
      }
      if (methods.has(key)) return methods.get(key);
      const value = Reflect.get(target, key, target);
      if (typeof value !== 'function') return value;
      const method =
        /^draw(?:Arrays|Elements|RangeElements)(?:Instanced)?$/.test(
          String(key),
        )
          ? (...args) => {
              assertAvailable();
              beforeDraw();
              return value(...args);
            }
          : value.bind(target);
      methods.set(key, method);
      return method;
    },
  });
  return {
    context,
    beginTransition(milliseconds = 180) {
      if (!Number.isFinite(milliseconds) || milliseconds <= 0 || !previous.size)
        return false;
      source = new Map(previous);
      starts.clear();
      ready = false;
      expires = performance.now() + 5000;
      duration = Math.min(milliseconds, 1000);
      counters.transitions++;
      return true;
    },
    beginFrame(time = performance.now()) {
      now = time;
      frame = new Map();
      if (source && now > expires) source = null;
    },
    presented(time = performance.now()) {
      // Compilation and GPU completion can take longer than the blend itself.
      // Start the clock when its source pose is actually displayed, not queued.
      for (const [key, start] of starts)
        if (start === null) starts.set(key, time);
    },
    endFrame(poseReady = true) {
      if (frame.size) previous = frame;
      ready = poseReady;
    },
    cancel() {
      source = null;
      starts.clear();
    },
    stats: () => ({
      ...counters,
      active: Boolean(source),
      poses: previous.size,
    }),
    dispose() {
      source = null;
      previous.clear();
      frame.clear();
      buffers.clear();
      indexed.clear();
      methods.clear();
    },
  };
}
