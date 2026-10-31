/** Test-only full-coverage Canvas2D overwrite; preserves destination identity. */
export function installCopyProbe() {
  globalThis.__avatarCopyProbe?.dispose();
  const prototype = CanvasRenderingContext2D.prototype;
  const draw = prototype.drawImage,
    clear = prototype.clearRect;
  const contexts = new Map();
  let mode = 'direct',
    metrics = { draws: 0, clearsSkipped: 0 };
  const register = (context) => {
    if (!contexts.has(context)) contexts.set(context, context.globalCompositeOperation);
    context.globalCompositeOperation = mode === 'copy' ? 'copy' : contexts.get(context);
  };
  for (const canvas of globalThis.canvases ?? []) register(canvas.getContext('2d'));
  prototype.clearRect = function (x, y, width, height) {
    if (
      mode === 'copy' &&
      contexts.has(this) &&
      x === 0 &&
      y === 0 &&
      width === this.canvas.width &&
      height === this.canvas.height
    ) {
      metrics.clearsSkipped++;
      return;
    }
    return clear.call(this, x, y, width, height);
  };
  prototype.drawImage = function (source, ...args) {
    if (source?.dataset?.avatarRenderer === 'shared-editor-scene') {
      register(this);
      if (
        args.length !== 8 ||
        args[4] !== 0 ||
        args[5] !== 0 ||
        args[6] !== this.canvas.width ||
        args[7] !== this.canvas.height
      )
        throw Error('Copy probe requires exact full-canvas destination coverage');
      metrics.draws++;
    }
    return draw.call(this, source, ...args);
  };
  return (globalThis.__avatarCopyProbe = {
    setMode(next) {
      if (next !== 'copy' && next !== 'direct') throw Error('Unknown copy mode');
      mode = next;
      for (const context of contexts.keys()) register(context);
      metrics = { draws: 0, clearsSkipped: 0 };
    },
    read: () => ({ mode, ...metrics }),
    dispose() {
      prototype.drawImage = draw;
      prototype.clearRect = clear;
      for (const [context, operation] of contexts) context.globalCompositeOperation = operation;
      contexts.clear();
    },
  });
}
