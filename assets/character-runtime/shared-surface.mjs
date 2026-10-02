// Original Character renderers keep independent state and render targets, but
// their browser contexts are views onto ONE physical WebGL canvas. Only the
// default framebuffer is mapped into atlas regions; private FBOs stay local.
import { createSharedProgramPool } from './shared-programs.mjs';
import { createRenderErrorBoundary } from './render-errors.mjs';
import { createSharedTexturePool } from './shared-textures.mjs';

const atlasKey = Symbol.for('bloom.character.shared-surface.v1');
let serial = 0;
function createAtlas() {
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.display = 'none';
  document.body.append(canvas);
  const physical = canvas.getContext('webgl2', {
    alpha: true,
    antialias: false,
    premultipliedAlpha: true,
    preserveDrawingBuffer: false,
  });
  if (!physical) {
    canvas.remove();
    throw new Error('Shared character WebGL2 context unavailable');
  }
  const renderErrors = createRenderErrorBoundary(physical);
  const programs = createSharedProgramPool(renderErrors.context);
  const textures = createSharedTexturePool(programs.context);
  const resources = Object.fromEntries(
    ['Buffer', 'Texture', 'Framebuffer', 'Renderbuffer', 'VertexArray'].map(
      (name) => [name, new Set()],
    ),
  );
  const resourceMethods = new Map();
  const gl = new Proxy(textures.context, {
    get(target, key) {
      const value = Reflect.get(target, key, target);
      if (typeof value !== 'function') return value;
      if (!resourceMethods.has(key)) {
        const operation =
          /^(create|delete)(Buffer|Texture|Framebuffer|Renderbuffer|VertexArray)$/.exec(
            String(key),
          );
        resourceMethods.set(
          key,
          operation
            ? (...args) => {
                const result = value(...args);
                const set = resources[operation[2]];
                if (operation[1] === 'create' && result) set.add(result);
                else if (operation[1] === 'delete') set.delete(args[0]);
                return result;
              }
            : value,
        );
      }
      return resourceMethods.get(key);
    },
  });
  const entries = new Set();
  const resolves = new Map();
  function resolveTarget(width, height) {
    const key = `${width}:${height}`;
    if (resolves.has(key)) return resolves.get(key);
    const texture = gl.createTexture(),
      framebuffer = gl.createFramebuffer();
    const previous = gl.getParameter(gl.TEXTURE_BINDING_2D);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA8,
      width,
      height,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.bindTexture(gl.TEXTURE_2D, previous);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(
      gl.DRAW_FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0,
    );
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, drawFramebuffer);
    if (resolves.size >= 8) {
      const [oldKey, old] = resolves.entries().next().value;
      gl.deleteFramebuffer(old.framebuffer);
      gl.deleteTexture(old.texture);
      resolves.delete(oldKey);
    }
    resolves.set(key, { framebuffer, texture });
    return resolves.get(key);
  }
  const maximum = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);
  let drawFramebuffer = null,
    readFramebuffer = null;
  let revision = 0;
  function layout() {
    const ordered = [...entries].sort(
      (a, b) => b.canvas.height - a.canvas.height,
    );
    const area = ordered.reduce(
      (sum, e) => sum + e.canvas.width * e.canvas.height,
      0,
    );
    let width = Math.min(
      maximum,
      2 **
        Math.ceil(
          Math.log2(
            Math.max(
              64,
              Math.sqrt(area),
              ...ordered.map((e) => e.canvas.width),
            ),
          ),
        ),
    );
    let height;
    const placements = new Map();
    for (;;) {
      let x = 0,
        y = 0,
        row = 0;
      for (const e of ordered) {
        if (x + e.canvas.width > width) {
          x = 0;
          y += row;
          row = 0;
        }
        placements.set(e, [x, y]);
        x += e.canvas.width;
        row = Math.max(row, e.canvas.height);
      }
      height = Math.max(1, y + row);
      if (height <= maximum) break;
      if (width === maximum)
        throw new Error('Character atlas exceeds device texture size');
      width = Math.min(maximum, width * 2);
    }
    for (const [entry, [x, y]] of placements) {
      entry.x = x;
      entry.y = y;
    }
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    revision++;
  }
  function acquire(parent) {
    const node = document.createElement('canvas');
    node.id = `bloom-character-surface-${++serial}`;
    node.width = node.height = 128;
    node.style.display = 'none';
    node.setAttribute('aria-hidden', 'true');
    parent.append(node);
    const entry = { canvas: node, x: 0, y: 0 };
    entries.add(entry);
    try {
      layout();
    } catch (error) {
      entries.delete(entry);
      node.remove();
      if (!entries.size) {
        textures.dispose();
        programs.dispose();
        physical.getExtension('WEBGL_lose_context')?.loseContext();
        canvas.remove();
        delete globalThis[atlasKey];
      }
      throw error;
    }
    let released = false,
      scissorEnabled = false;
    let scissor = [0, 0, 128, 128],
      viewport = [0, 0, 128, 128];
    for (const dimension of ['width', 'height']) {
      const descriptor = Object.getOwnPropertyDescriptor(
        HTMLCanvasElement.prototype,
        dimension,
      );
      Object.defineProperty(node, dimension, {
        get() {
          return descriptor.get.call(node);
        },
        set(value) {
          if (value === descriptor.get.call(node)) return;
          const previous = descriptor.get.call(node);
          descriptor.set.call(node, value);
          try {
            if (node[dimension] > maximum)
              throw new Error('Character surface exceeds device texture size');
            layout();
          } catch (error) {
            descriptor.set.call(node, previous);
            throw error;
          }
        },
      });
    }
    function clip() {
      if (drawFramebuffer === null) {
        gl.enable(gl.SCISSOR_TEST);
        const [sx, sy, sw, sh] = scissorEnabled
          ? scissor
          : [0, 0, node.width, node.height];
        const x = Math.max(0, sx),
          y = Math.max(0, sy);
        gl.scissor(
          entry.x + x,
          entry.y + y,
          Math.max(0, Math.min(node.width, sx + sw) - x),
          Math.max(0, Math.min(node.height, sy + sh) - y),
        );
      } else {
        if (scissorEnabled) gl.enable(gl.SCISSOR_TEST);
        else gl.disable(gl.SCISSOR_TEST);
        gl.scissor(...scissor);
      }
    }
    function setViewport() {
      const [x, y, w, h] = viewport;
      gl.viewport(
        x + (drawFramebuffer === null ? entry.x : 0),
        y + (drawFramebuffer === null ? entry.y : 0),
        w,
        h,
      );
    }
    const methods = new Map();
    const context = new Proxy(gl, {
      get(target, key) {
        if (key === 'canvas') return node;
        if (key === 'drawingBufferWidth') return node.width;
        if (key === 'drawingBufferHeight') return node.height;
        if (key === 'getExtension')
          return (name) =>
            name === 'WEBGL_lose_context'
              ? { loseContext() {}, restoreContext() {} }
              : gl.getExtension(name);
        if (key === 'getParameter')
          return (name) =>
            name === gl.VIEWPORT
              ? new Int32Array(viewport)
              : name === gl.SCISSOR_BOX
                ? new Int32Array(scissor)
                : gl.getParameter(name);
        if (key === 'isEnabled')
          return (name) =>
            name === gl.SCISSOR_TEST ? scissorEnabled : gl.isEnabled(name);
        if (key === 'bindFramebuffer')
          return (target, buffer) => {
            gl.bindFramebuffer(target, buffer);
            if (target === gl.FRAMEBUFFER || target === gl.DRAW_FRAMEBUFFER)
              drawFramebuffer = buffer;
            if (target === gl.FRAMEBUFFER || target === gl.READ_FRAMEBUFFER)
              readFramebuffer = buffer;
            clip();
            setViewport();
          };
        if (key === 'viewport')
          return (...value) => {
            viewport = value;
            setViewport();
          };
        if (key === 'scissor')
          return (...value) => {
            scissor = value;
            clip();
          };
        if (key === 'enable' || key === 'disable')
          return (value) => {
            if (value === gl.SCISSOR_TEST) {
              scissorEnabled = key === 'enable';
              clip();
            } else gl[key](value);
          };
        if (key === 'blitFramebuffer')
          return (...args) => {
            if (drawFramebuffer === null && readFramebuffer !== null) {
              // WebGL requires identical source/destination bounds for an MSAA
              // resolve. Resolve at local coordinates before translating into the
              // atlas; this scratch attachment is shared by equal-sized avatars.
              const target = resolveTarget(node.width, node.height);
              gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, target.framebuffer);
              gl.disable(gl.SCISSOR_TEST);
              gl.blitFramebuffer(...args);
              gl.bindFramebuffer(gl.READ_FRAMEBUFFER, target.framebuffer);
              gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
              clip();
              gl.blitFramebuffer(
                0,
                0,
                node.width,
                node.height,
                entry.x,
                entry.y,
                entry.x + node.width,
                entry.y + node.height,
                gl.COLOR_BUFFER_BIT,
                gl.NEAREST,
              );
              gl.bindFramebuffer(gl.READ_FRAMEBUFFER, readFramebuffer);
              return;
            }
            if (readFramebuffer === null) {
              args[0] += entry.x;
              args[2] += entry.x;
              args[1] += entry.y;
              args[3] += entry.y;
            }
            if (drawFramebuffer === null) {
              args[4] += entry.x;
              args[6] += entry.x;
              args[5] += entry.y;
              args[7] += entry.y;
            }
            gl.blitFramebuffer(...args);
          };
        if (key === 'readPixels')
          return (x, y, ...args) =>
            gl.readPixels(
              x + (readFramebuffer === null ? entry.x : 0),
              y + (readFramebuffer === null ? entry.y : 0),
              ...args,
            );
        const value = Reflect.get(target, key, target);
        if (typeof value !== 'function') return value;
        if (!methods.has(key)) methods.set(key, value.bind(target));
        return methods.get(key);
      },
    });
    const original = node.getContext.bind(node);
    node.getContext = (type, ...args) =>
      type === 'webgl2' ? context : original(type, ...args);
    return {
      canvas: node,
      render: renderErrors.render,
      create(module, ...options) {
        return new module.Character('#' + node.id, ...options);
      },
      copy(
        output,
        sx = 0,
        sy = 0,
        sw = node.width,
        sh = node.height,
        dx = 0,
        dy = 0,
        dw = node.width,
        dh = node.height,
      ) {
        // A fit can extend beyond its character's surface. Clip to this tile,
        // preserving the destination transform, so neighbours never bleed in.
        const x = Math.max(0, sx),
          y = Math.max(0, sy);
        const w = Math.min(node.width, sx + sw) - x,
          h = Math.min(node.height, sy + sh) - y;
        if (w <= 0 || h <= 0 || sw <= 0 || sh <= 0) return;
        output.drawImage(
          canvas,
          entry.x + x,
          canvas.height - entry.y - node.height + y,
          w,
          h,
          dx + ((x - sx) * dw) / sw,
          dy + ((y - sy) * dh) / sh,
          (w * dw) / sw,
          (h * dh) / sh,
        );
      },
      get revision() {
        return revision;
      },
      release() {
        if (released) return;
        released = true;
        entries.delete(entry);
        node.remove();
        if (!entries.size) {
          textures.dispose();
          programs.dispose();
          gl.getExtension('WEBGL_lose_context')?.loseContext();
          canvas.remove();
          delete globalThis[atlasKey];
        }
        // Retain layout until another allocation/resize, so releasing a surface
        // cannot erase an already submitted neighbour before presentation.
      },
    };
  }
  return {
    acquire,
    render: renderErrors.render,
    stats: () => ({
      contexts: 1,
      surfaces: entries.size,
      width: canvas.width,
      height: canvas.height,
      colorBytes: canvas.width * canvas.height * 4,
      revision,
      programs: programs.stats(),
      textures: textures.stats(),
      resources: Object.fromEntries(
        Object.entries(resources).map(([name, values]) => [
          name,
          name === 'Texture' ? textures.stats().physicalTextures : values.size,
        ]),
      ),
    }),
  };
}
export function acquireSharedSurface(parent) {
  return (globalThis[atlasKey] ??= createAtlas()).acquire(parent);
}
export function renderSharedBatch(operation) {
  const atlas = globalThis[atlasKey];
  return atlas ? atlas.render(operation) : operation();
}
export const sharedSurfaceStats = () =>
  globalThis[atlasKey]?.stats() ?? {
    contexts: 0,
    surfaces: 0,
    width: 0,
    height: 0,
    colorBytes: 0,
    revision: 0,
  };
