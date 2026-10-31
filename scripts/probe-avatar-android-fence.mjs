/** Physical diagnostic fixture. Timing canvases must never be read with getImageData/toDataURL. */
import { evaluate, socket } from './fixtures/avatar/physical-web/cdp.mjs';
import { writeFile, mkdir } from 'node:fs/promises';
const output = process.env.AVATAR_OUTPUT || '.local/avatar-physical-web';
await mkdir(output, { recursive: true });
const result = await evaluate(async () => {
  const gl = document.querySelector('[data-avatar-renderer]').getContext('webgl2');
  const original = CanvasRenderingContext2D.prototype.drawImage;
  let pending = false;
  const results = [];
  let finish;
  const done = new Promise((r) => (finish = r));
  const timeout = setTimeout(() => finish(), 15000);
  CanvasRenderingContext2D.prototype.drawImage = function (...args) {
    if (this.canvas === canvases[0] && !pending && results.length < 25) {
      pending = true;
      const t = performance.now(),
        sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      let polls = 0;
      function poll() {
        polls++;
        const at = performance.now(),
          status = gl.clientWaitSync(sync, 0, 0);
        if (status === gl.TIMEOUT_EXPIRED) {
          setTimeout(poll, 1);
          return;
        }
        results.push({ latencyMs: at - t, polls, status });
        gl.deleteSync(sync);
        pending = false;
        if (results.length === 25) finish();
      }
      setTimeout(poll, 0);
    }
    return original.apply(this, args);
  };
  await done;
  clearTimeout(timeout);
  CanvasRenderingContext2D.prototype.drawImage = original;
  return {
    results,
    note: 'Diagnostic gl.flush+fence before first destination copy; wall latency includes command queue, GPU work and main-thread polling delay. Not GPU timer or performance baseline.',
    glError: gl.getError(),
  };
});
await writeFile(`${output}/control24-fence.json`, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result));
socket.close();
