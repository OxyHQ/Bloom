/** Steady-state diagnostic on a setup-only crowd fixture; no initial-ready claims. */
import { evaluate, socket } from './fixtures/avatar/physical-web/cdp.mjs';
import { writeFile, mkdir } from 'node:fs/promises';
await mkdir(process.env.AVATAR_OUTPUT || '.local/avatar-physical-web', { recursive: true });
import { installAtlasBitmapProbe } from './fixtures/avatar/presentation/atlas-bitmap-probe.mjs';
await evaluate(installAtlasBitmapProbe, { premultiplyAlpha: 'none', repremultiply: true });
const results = [];
try {
  for (const mode of ['direct', 'bitmap', 'direct']) {
    results.push(
      await evaluate(async (mode) => {
        await __avatarPresentationProbe.setMode(mode);
        await new Promise((r) => setTimeout(r, 2000));
        __avatarPresentationProbe.reset();
        const before = await auditRead();
        const probeBefore = __avatarPresentationProbe.read(),
          start = performance.now();
        await new Promise((r) => setTimeout(r, 5000));
        const elapsed = performance.now() - start,
          presentation = __avatarPresentationProbe.read();
        const after = await auditRead();
        return { mode, before, after, probeBefore, elapsed, presentation };
      }, mode),
    );
    console.log(JSON.stringify(results.at(-1).presentation));
  }
} finally {
  await evaluate(() => __avatarPresentationProbe.dispose());
  socket.close();
}
await writeFile(
  `${process.env.AVATAR_OUTPUT || '.local/avatar-physical-web'}/${process.env.ID || 'physical-cpu-roundtrip'}.json`,
  JSON.stringify(
    {
      results,
      note: 'Experimental steady-state bitmap injection after ready, same pool/engine/canvases; timing canvases never read. Not production routing or first-ready/lifecycle proof.',
    },
    null,
    2,
  ),
);
