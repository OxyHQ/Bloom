/** Explicit test diagnostics only: no readback in the production frame loop. */
import { bridge, createContext } from './node_modules/@oxy.so/bloom/src/agent-avatar/native/bridge';
import { getRuntime } from './node_modules/@oxy.so/bloom/src/agent-avatar/native/runtime';
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export async function probeColdFrame(runtimeUrl) {
  const gl = await createContext();
  const runtime = getRuntime(runtimeUrl);
  let engine,
    armed = false;
  const frames = [];
  try {
    engine = new runtime.AuthoredAvatarEngine(null, {
      count: 1,
      size: 128,
      preset: 'blue_beret',
      lazyWork: true,
      resolveAsset: runtime.createCatalogAssetResolver(runtime.createCatalogMotion),
      host: {
        context: gl,
        getSize: () => ({ width: 128, height: 128, pixelRatio: 2.625 }),
        isHidden: () => false,
        requestFrame: requestAnimationFrame,
        cancelFrame: cancelAnimationFrame,
        onFrame(output) {
          if (!armed) return;
          const rgba = new Uint8Array(output.width * output.height * 4);
          gl.bindFramebuffer(gl.FRAMEBUFFER, output.framebuffer);
          gl.readPixels(0, 0, output.width, output.height, gl.RGBA, gl.UNSIGNED_BYTE, rgba);
          frames.push(rgba);
        },
      },
    });
    await engine.loaded;
    engine.setPaused(true);
    engine.setWander(0, false);
    engine.setMotionFrame(0, 'idle', 0.5);
    armed = true;
    const wait = async (count) => {
      const start = performance.now();
      while (frames.length < count) {
        if (performance.now() - start > 20000) throw Error('Cold pose not delivered');
        await pause(10);
      }
    };
    await wait(1);
    const first = frames[0],
      before = frames.length;
    engine.setMotionFrame(0, 'idle', 0.5);
    await wait(before + 1);
    const stable = frames[frames.length - 1];
    let changedPixels = 0,
      maxChannelDifference = 0,
      nontransparentPixels = 0;
    for (let i = 0; i < first.length; i += 4) {
      let d = 0;
      for (let c = 0; c < 4; c++) d = Math.max(d, Math.abs(first[i + c] - stable[i + c]));
      if (d) changedPixels++;
      maxChannelDifference = Math.max(maxChannelDifference, d);
      if (first[i + 3]) nontransparentPixels++;
    }
    return {
      changedPixels,
      maxChannelDifference,
      nontransparentPixels,
      comparedPixels: first.length / 4,
      glError: gl.getError(),
      fitPasses: engine.stats().fitPasses,
      backingPixelsPerAvatar: engine.stats().backingPixelsPerAvatar,
    };
  } finally {
    engine?.dispose();
    await bridge.destroyContext(gl.contextId);
  }
}
