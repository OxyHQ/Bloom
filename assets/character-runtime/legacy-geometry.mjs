// Adapter for the recovered renderer's prepared vertex layout. Packaged meshes,
// resource manifests, the WASM binary, and the appearance record stay untouched.
const decoder = new TextDecoder(), encoder = new TextEncoder();
const BODY = ':body:no-shadow:studio-fur-v6:';
// Highlights are separate non-shadow-casting meshes in the original renderer.
const SURFACES = [':surface:shadow', ':surface:no-shadow'];
const SURFACE_KEY = /^[a-f0-9]{64}:surface:(?:shadow|no-shadow)$/;
const FUR_SURFACE_KEY = /^[a-f0-9]{64}:surface:shadow:studio-fur-v6:/;
const STRIDE = 96, TAU = Math.PI * 2;
function invalid(message) { throw new Error(`Unsupported prepared avatar geometry: ${message}`); }
function finite(value) { if (!Number.isFinite(value)) invalid('non-finite coordinate'); return value; }
function findAll(bytes, text) {
  const needle = encoder.encode(text), result = [];
  outer: for (let i = 0; i <= bytes.length - needle.length; i++) {
    if (bytes[i] !== needle[0]) continue;
    for (let j = 1; j < needle.length; j++) if (bytes[i + j] !== needle[j]) continue outer;
    result.push(i);
  }
  return result;
}

/** Inspect the bounded, length-prefixed mesh records; reject unknown layouts. */
export function inspectLegacyAssembly(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length < 400) invalid('truncated assembly');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const uint = at => { if (at < 0 || at + 4 > bytes.length) invalid('truncated count'); return view.getUint32(at, true); };
  const bodies = findAll(bytes, BODY);
  if (bodies.length !== 1) invalid('expected one furry body');
  const bodyStart = bodies[0] - 64;
  const starts = [bodyStart, ...SURFACES.flatMap(kind => findAll(bytes, kind)
    .map(i => i - 64)
    .filter(i => {
      if (i <= bodyStart || i < 4) return false;
      const length = uint(i - 4);
      if (length < 79 || length > 8192 || i + length > bytes.length) return false;
      const name = decoder.decode(bytes.subarray(i, i + length));
      return SURFACE_KEY.test(name) || FUR_SURFACE_KEY.test(name);
    }))
    .sort((a, b) => a - b)];
  const meshCount = uint(0);
  if (meshCount !== starts.length || meshCount > 40) invalid('mesh count/key mismatch');
  const parts = starts.map((nameOffset, part) => {
    const nameLength = uint(nameOffset - 4), name = decoder.decode(bytes.subarray(nameOffset, nameOffset + nameLength));
    if (nameLength < 79 || nameLength > 8192 || nameOffset + nameLength > bytes.length || !/^[a-f0-9]{64}:/.test(name)) invalid('mesh identity');
    if (part === 0 ? !name.includes(BODY) : !SURFACE_KEY.test(name) && !FUR_SURFACE_KEY.test(name)) invalid('mesh kind');
    const vertexCount = uint(nameOffset + nameLength), vertexOffset = nameOffset + nameLength + 4;
    if (vertexCount < 3 || vertexCount > 1000000) invalid('vertex count');
    let at = vertexOffset + vertexCount * STRIDE;
    const count32 = uint(at); at += 4;
    if (count32 > 6000000 || at + count32 * 4 > bytes.length) invalid('32-bit indices');
    for (let i = 0; i < count32; i++) if (uint(at + i * 4) >= vertexCount) invalid('index outside mesh');
    at += count32 * 4;
    const count16 = uint(at); at += 4;
    if (count16 > 6000000 || at + count16 * 2 > bytes.length) invalid('16-bit indices');
    for (let i = 0; i < count16; i++) if (view.getUint16(at + i * 2, true) >= vertexCount) invalid('index outside mesh');
    at += count16 * 2;
    // Empty supplemental vertex buffer followed by three boolean mesh flags.
    if (at + 7 > bytes.length || uint(at) !== 0 || bytes[at + 4] > 1 || bytes[at + 5] > 1 || bytes[at + 6] > 1) invalid('mesh flags');
    const hasFur = bytes[at + 6] === 1; at += 7;
    const furCount = hasFur ? uint(at) : 0, furOffset = hasFur ? at + 4 : 0;
    if (furCount > 1000000 || hasFur && furOffset + furCount * 64 > bytes.length) invalid('fur records');
    const geometryEnd = hasFur ? furOffset + furCount * 64 : at;
    if (geometryEnd > (starts[part + 1] === undefined ? bytes.length : starts[part + 1] - 4)) invalid('overlapping meshes');
    if (part === 0 && !hasFur) invalid('body lacks fur layout');
    if (FUR_SURFACE_KEY.test(name) && !hasFur) invalid('accessory lacks fur layout');
    const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < vertexCount; i++) for (let k = 0; k < 24; k++) {
      const value = finite(view.getFloat32(vertexOffset + i * STRIDE + k * 4, true));
      if (k < 3) { min[k] = Math.min(min[k], value); max[k] = Math.max(max[k], value); }
    }
    return { part, name, nameOffset, nameLength, vertexCount, vertexOffset, furCount, furOffset, bounds: { min, max } };
  });
  return { body: parts[0], parts };
}

function mapper({ points, radii, depthScale = 1 }) {
  if (!Number.isFinite(depthScale) || depthScale <= 0 || depthScale > 4) invalid('depth scale');
  if (points && radii || !points && !radii) invalid('provide points or radii');
  const count = (points || radii).length;
  if (count < 16 || count > 65536) invalid('contour resolution');
  if (points) for (const p of points) { if (p.length !== 2) invalid('contour point'); p.forEach(finite); }
  else for (const radius of radii) if (!(finite(radius) > 0)) invalid('contour radius');
  return (x, y, z) => {
    const radius = Math.hypot(x, y), angle = (Math.atan2(y, x) + TAU) % TAU;
    const slot = angle / TAU * count, index = Math.floor(slot), t = slot - index, next = (index + 1) % count;
    if (points) return [radius * (points[index][0] * (1 - t) + points[next][0] * t), radius * (points[index][1] * (1 - t) + points[next][1] * t), z * depthScale];
    const scale = radii[index] * (1 - t) + radii[next] * t;
    return [x * scale, y * scale, z * depthScale];
  };
}
function derivative(map, p) {
  const epsilon = .00005, base = map(...p);
  const columns = [0, 1, 2].map(k => { const q = [...p]; q[k] += epsilon; return map(...q).map((v, i) => (v - base[i]) / epsilon); });
  const [a, b, c] = columns;
  const cross = (u, v) => [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  const inverse = [cross(b, c), cross(c, a), cross(a, b)];
  const determinant = a.reduce((sum, v, i) => sum + v * inverse[0][i], 0);
  if (Math.abs(determinant) < .000001) invalid('singular contour');
  return { base, vector: v => [0, 1, 2].map(i => columns.reduce((sum, col, j) => sum + col[i] * v[j], 0)), normal: v => [0, 1, 2].map(i => inverse.reduce((sum, col, j) => sum + col[i] * v[j], 0) / determinant) };
}

/** Rigid attachment anchors on the source circle, in the engine's XY units.
 * Headwear attaches at the crown, bow at the chin, tuft on the upper-left rim.
 * Eyewear and headphones retain the original engine's face/ear fitting.
 */
export function legacyAttachmentOffset(points, accessory) {
  let anchor;
  if (accessory === 'bow') anchor = [0, -1, 0];
  else if (accessory === 'three_lobe') anchor = [-.5, Math.sqrt(.75), 0];
  else if (['beanie', 'hat', 'beret', 'orb', 'crown'].includes(accessory)) anchor = [0, 1, 0];
  else return undefined;
  return mapper({ points })(...anchor).map((value, i) => value - anchor[i]);
}

/**
 * Deform a COPY of one prepared circular body. points samples its new XY outline
 * counterclockwise from +X, in renderer units (the source circle radius is 1).
 * radii is the alternative polar representation. geometryKey is a SHA-256 hex
 * identity of the source + deformation, used for the renderer's geometry cache.
 * Attachments may explicitly transform a numbered part around an origin.
 */
export function deformLegacyAssembly(bytes, options) {
  const info = inspectLegacyAssembly(bytes), result = bytes.slice();
  if (!/^[a-f0-9]{64}$/.test(options.geometryKey || '')) invalid('missing geometry cache key');
  const view = new DataView(result.buffer), map = mapper(options);
  const read = at => [0, 1, 2].map(i => view.getFloat32(at + i * 4, true));
  const write = (at, values) => values.forEach((v, i) => view.setFloat32(at + i * 4, finite(v), true));
  const unit = v => { const n = Math.hypot(...v); return n > 1e-9 ? v.map(x => x / n) : v; };
  function transform(part, mapping) {
    for (let i = 0; i < part.vertexCount; i++) {
      const at = part.vertexOffset + i * STRIDE, p = read(at), d = derivative(mapping, p);
      // The two pose positions are DELTAS: preserve zero as zero and deform the
      // target position before subtracting the newly transformed base.
      for (const offset of [24, 48]) { const delta = read(at + offset), target = mapping(...p.map((v, k) => v + delta[k])); write(at + offset, target.map((v, k) => v - d.base[k])); }
      for (const offset of [12, 36, 60, 84]) write(at + offset, unit(d.normal(read(at + offset))));
      write(at, d.base);
    }
    for (let i = 0; i < part.furCount; i++) {
      const at = part.furOffset + i * 64, d = derivative(mapping, read(at));
      write(at, d.base); write(at + 12, unit(d.normal(read(at + 12)))); write(at + 24, unit(d.vector(read(at + 24))));
    }
    result.set(encoder.encode(options.geometryKey), part.nameOffset);
  }
  transform(info.body, map);
  for (const attachment of options.attachments || []) {
    const part = info.parts[attachment.part];
    if (!part || part.part === 0) invalid('attachment index');
    const scale = attachment.scale || [1, 1, 1], origin = attachment.origin || [0, 0, 0], translate = attachment.translate || [0, 0, 0];
    if ([scale, origin, translate].some(v => v.length !== 3 || v.some(x => !Number.isFinite(x))) || scale.some(x => x <= 0)) invalid('attachment transform');
    transform(part, (...p) => p.map((v, k) => (v - origin[k]) * scale[k] + origin[k] + translate[k]));
    // Independent transformed parts must not alias the body's cache identity.
    const key = options.attachmentKeys?.[attachment.part];
    if (!/^[a-f0-9]{64}$/.test(key || '')) invalid('attachment cache key');
    result.set(encoder.encode(key), part.nameOffset);
  }
  // Keep original extents while admitting moved accessories and the new body.
  const transformed = [info.body, ...(options.attachments || []).map(a => info.parts[a.part])];
  for (const part of transformed) for (let i = 0; i < part.vertexCount; i++) {
    const p = read(part.vertexOffset + i * STRIDE);
    for (let k = 0; k < 3; k++) {
      view.setFloat32(4 + k * 4, Math.min(view.getFloat32(4 + k * 4, true), p[k]), true);
      view.setFloat32(16 + k * 4, Math.max(view.getFloat32(16 + k * 4, true), p[k]), true);
    }
  }
  return result;
}
