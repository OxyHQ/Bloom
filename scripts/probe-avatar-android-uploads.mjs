/** Physical diagnostic fixture. Timing canvases must never be read with getImageData/toDataURL. */
import { evaluate, socket } from './fixtures/avatar/physical-web/cdp.mjs';
import { writeFile, mkdir } from 'node:fs/promises';
const output = process.env.AVATAR_OUTPUT || '.local/avatar-physical-web';
await mkdir(output, { recursive: true });
const result = await evaluate(async () => {
  const renderer = auditRenderers[0],
    gl = renderer.getContext();
  const originals = {
    bufferSubData: gl.bufferSubData,
    texSubImage2D: gl.texSubImage2D,
    render: renderer.render,
  };
  let mode = 'normal',
    calls = {},
    skipped = {};
  for (const name of ['bufferSubData', 'texSubImage2D'])
    gl[name] = function (...args) {
      calls[name] = (calls[name] || 0) + 1;
      if (mode === name || mode === 'both') {
        skipped[name] = (skipped[name] || 0) + 1;
        return;
      }
      return originals[name].apply(this, args);
    };
  renderer.render = function (...args) {
    calls.render = (calls.render || 0) + 1;
    if (mode === 'allRender') {
      skipped.render = (skipped.render || 0) + 1;
      return;
    }
    return originals.render.apply(this, args);
  };
  const results = [];
  try {
    for (const next of [
      'normal',
      'bufferSubData',
      'texSubImage2D',
      'both',
      'allRender',
      'normal',
    ]) {
      mode = next;
      await new Promise((r) => setTimeout(r, 1000));
      calls = {};
      skipped = {};
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
        raf: audit.raf.slice(),
        glError: gl.getError(),
      });
    }
  } finally {
    renderer.render = originals.render;
    gl.bufferSubData = originals.bufferSubData;
    gl.texSubImage2D = originals.texSubImage2D;
  }
  return {
    results,
    note: 'Attribution-only frozen GPU buffers/textures or all render passes skipped. Invalid/frozen visuals, not a product gain. All uploads/calls restored in finally. Pose generation and destination copies continue; allRender also suppresses upload execution inside Three.',
  };
});
await writeFile(`${output}/upload-ablation.json`, JSON.stringify(result, null, 2));
console.log(
  JSON.stringify(
    result.results.map((r) => ({
      mode: r.mode,
      fps:
        (r.after.pools[0].stats.frames - r.before.pools[0].stats.frames) /
        ((r.after.time - r.before.time) / 1000),
      calls: r.calls,
      skipped: r.skipped,
      glError: r.glError,
    })),
  ),
);
socket.close();
