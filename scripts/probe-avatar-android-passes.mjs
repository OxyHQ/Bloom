/** Physical diagnostic fixture. Timing canvases must never be read with getImageData/toDataURL. */
import { evaluate, socket } from './fixtures/avatar/physical-web/cdp.mjs';
import { writeFile, mkdir } from 'node:fs/promises';
const output = process.env.AVATAR_OUTPUT || '.local/avatar-physical-web';
await mkdir(output, { recursive: true });
const result = await evaluate(async () => {
  const renderer = auditRenderers[0];
  if (!renderer) throw Error('Renderer observation missing');
  const original = renderer.render;
  let mode = 'normal',
    calls = {},
    skipped = {},
    cpu = {},
    uploads = {};
  const gl = renderer.getContext();
  const originals = {};
  for (const name of ['bufferSubData', 'texSubImage2D']) {
    originals[name] = gl[name];
    gl[name] = function (...args) {
      uploads[name] = (uploads[name] || 0) + 1;
      return originals[name].apply(this, args);
    };
  }
  renderer.render = function (scene, camera) {
    const m = scene.children.find((x) => x.visible && x.material)?.material;
    const phase = m?.defines?.ORBIT_ORTHOGRAPHIC_AO
      ? 'aoSample'
      : m?.defines?.ORBIT_RESOLVE_AO
        ? 'aoResolve'
        : m?.uniforms?.fits
          ? 'present'
          : m?.colorWrite === false
            ? 'depth'
            : 'color';
    calls[phase] = (calls[phase] || 0) + 1;
    if (phase === mode) {
      skipped[phase] = (skipped[phase] || 0) + 1;
      return;
    }
    const t = performance.now();
    const result = original.call(this, scene, camera);
    cpu[phase] = (cpu[phase] || 0) + (performance.now() - t);
    return result;
  };
  const results = [];
  try {
    for (const next of ['normal', 'depth', 'color', 'present', 'normal']) {
      mode = next;
      await new Promise((r) => setTimeout(r, 1000));
      calls = {};
      skipped = {};
      cpu = {};
      uploads = {};
      audit.raf = [];
      audit.measuring = true;
      const before = await auditRead();
      await new Promise((r) => setTimeout(r, 3000));
      const after = await auditRead();
      audit.measuring = false;
      results.push({
        mode,
        before,
        after,
        calls: { ...calls },
        skipped: { ...skipped },
        cpu: { ...cpu },
        uploads: { ...uploads },
        raf: audit.raf.slice(),
      });
    }
  } finally {
    renderer.render = original;
    for (const [name, fn] of Object.entries(originals)) gl[name] = fn;
  }
  return {
    results,
    note: 'Attribution-only skip entire renderer.render for one pass, retaining previous framebuffer contents. Invalid visuals or frozen buffers, never acceptance/performance gain. Other passes and canvas copies continue. Deltas include upload migration, dependency and cache effects; wall CPU submission is not GPU time.',
    glError: gl.getError(),
  };
});
await writeFile(`${output}/pass-ablation-confirm.json`, JSON.stringify(result, null, 2));
console.log(
  JSON.stringify(
    result.results.map((r) => ({
      mode: r.mode,
      fps:
        (r.after.pools[0].stats.frames - r.before.pools[0].stats.frames) /
        ((r.after.time - r.before.time) / 1000),
      cpu: r.cpu,
      calls: r.calls,
      skipped: r.skipped,
      uploads: r.uploads,
    })),
  ),
);
socket.close();
