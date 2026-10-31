/** A web-only RGBA8 readback. Unlike a client-memory readPixels, its fence is
 * polled without waiting on the UI thread. Every exit owns its GL cleanup. */
export function readPixelsAsync(
  gl: WebGL2RenderingContext,
  framebuffer: WebGLFramebuffer,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  let buffer: WebGLBuffer | null = null;
  let sync: WebGLSync | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let settled = false;
  let rejectRead: (error: Error) => void = () => {};
  const cleanup = () => {
    if (timer !== undefined) clearTimeout(timer);
    if (sync) gl.deleteSync(sync);
    if (buffer) gl.deleteBuffer(buffer);
    sync = null;
    buffer = null;
  };
  const promise = new Promise<Uint8Array>((resolve, reject) => {
    rejectRead = reject;
    const fail = (error: unknown) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error instanceof Error ? error : new Error(String(error)));
    };
    try {
      buffer = gl.createBuffer();
      if (!buffer) throw new Error('Avatar readback buffer allocation failed');
      const previousFramebuffer = gl.getParameter(gl.READ_FRAMEBUFFER_BINDING);
      const previousBuffer = gl.getParameter(gl.PIXEL_PACK_BUFFER_BINDING);
      try {
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, framebuffer);
        gl.bindBuffer(gl.PIXEL_PACK_BUFFER, buffer);
        gl.bufferData(gl.PIXEL_PACK_BUFFER, width * height * 4, gl.STREAM_READ);
        gl.readPixels(x, y, width, height, gl.RGBA, gl.UNSIGNED_BYTE, 0);
      } finally {
        gl.bindBuffer(gl.PIXEL_PACK_BUFFER, previousBuffer);
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, previousFramebuffer);
      }
      sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      if (!sync) throw new Error('Avatar readback fence allocation failed');
      gl.flush();
      const poll = () => {
        if (settled) return;
        try {
          if (gl.isContextLost()) throw new Error('Avatar readback context lost');
          const status = gl.clientWaitSync(sync!, 0, 0);
          if (status === gl.WAIT_FAILED) throw new Error('Avatar readback fence failed');
          if (status === gl.TIMEOUT_EXPIRED) {
            timer = setTimeout(poll, 4);
            return;
          }
          const pixels = new Uint8Array(width * height * 4);
          const previous = gl.getParameter(gl.PIXEL_PACK_BUFFER_BINDING);
          try {
            gl.bindBuffer(gl.PIXEL_PACK_BUFFER, buffer);
            gl.getBufferSubData(gl.PIXEL_PACK_BUFFER, 0, pixels);
          } finally {
            gl.bindBuffer(gl.PIXEL_PACK_BUFFER, previous);
          }
          settled = true;
          cleanup();
          resolve(pixels);
        } catch (error) {
          fail(error);
        }
      };
      timer = setTimeout(poll, 4);
    } catch (error) {
      fail(error);
    }
  });
  return {
    promise,
    cancel() {
      if (settled) return;
      settled = true;
      cleanup();
      rejectRead(new Error('Avatar readback cancelled'));
    },
  };
}
