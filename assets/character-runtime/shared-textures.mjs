// Exact-content sharing for the original engine's two immutable 512px assets
// and its 576x960 RGBA8 atlas. Only these observed storage layouts are admitted.
// All other textures retain independent native storage. Render targets never
// share. Logical objects keep Emscripten's mutable metadata (.name) independent.
export function createSharedTexturePool(gl) {
  const textures = new WeakMap(),
    physicalEntries = new WeakMap(),
    live = new Set(),
    entries = new Set();
  const cache = new Map(),
    bindings = new Map(),
    methods = new Map();
  const unpackNames = [
    'UNPACK_ALIGNMENT',
    'UNPACK_FLIP_Y_WEBGL',
    'UNPACK_PREMULTIPLY_ALPHA_WEBGL',
    'UNPACK_COLORSPACE_CONVERSION_WEBGL',
    'UNPACK_ROW_LENGTH',
    'UNPACK_IMAGE_HEIGHT',
    'UNPACK_SKIP_PIXELS',
    'UNPACK_SKIP_ROWS',
    'UNPACK_SKIP_IMAGES',
  ];
  const unpack = new Map(
    unpackNames.map((name) => [gl[name], gl.getParameter(gl[name])]),
  );
  let unit = gl.getParameter(gl.ACTIVE_TEXTURE),
    unpackBuffer = null,
    disposed = false;
  let hits = 0,
    copies = 0;
  const key = (target) => `${unit}:${target}`;
  const current = (target) => bindings.get(key(target));
  function equalBytes(a, b) {
    if (!a || !b || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }
  function removeCache(entry) {
    if (!entry.key) return;
    const bucket = cache.get(entry.key);
    bucket?.delete(entry);
    if (!bucket?.size) cache.delete(entry.key);
    entry.key = null;
    entry.snapshot = null;
  }
  function release(entry, record) {
    entry.refs.delete(record);
    if (entry.refs.size) return;
    removeCache(entry);
    entries.delete(entry);
    physicalEntries.delete(entry.real);
    gl.deleteTexture(entry.real);
  }
  function own(real, record) {
    const entry = { real, refs: new Set([record]), key: null, snapshot: null };
    entries.add(entry);
    physicalEntries.set(real, entry);
    return entry;
  }
  function rebind(record) {
    for (const [binding, value] of bindings) {
      if (value !== record) continue;
      const [at, target] = binding.split(':').map(Number);
      gl.activeTexture(at);
      gl.bindTexture(target, record.entry.real);
    }
    gl.activeTexture(unit);
  }
  function makePrivate(record) {
    if (!record || record.deleted) return;
    const previous = record.entry;
    if (previous.refs.size === 1) {
      removeCache(previous);
      return;
    }
    // Only a completed, fully captured candidate can have multiple owners.
    const previousBinding = gl.getParameter(gl.TEXTURE_BINDING_2D);
    const real = gl.createTexture();
    gl.bindTexture(record.target, real);
    gl.texStorage2D(...record.storage);
    if (unpackBuffer) gl.bindBuffer(gl.PIXEL_UNPACK_BUFFER, null);
    for (const [parameter, value] of record.uploadUnpack)
      gl.pixelStorei(parameter, value);
    gl.texSubImage2D(
      record.target,
      0,
      0,
      0,
      record.storage[3],
      record.storage[4],
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      record.pixels,
    );
    if (unpackBuffer) gl.bindBuffer(gl.PIXEL_UNPACK_BUFFER, unpackBuffer);
    for (const [parameter, value] of unpack) gl.pixelStorei(parameter, value);
    for (const [parameter, value] of record.parameters)
      gl.texParameteri(record.target, parameter, value);
    if (record.mipmaps) gl.generateMipmap(record.target);
    record.entry = own(real, record);
    release(previous, record);
    rebind(record);
    gl.bindTexture(
      record.target,
      current(record.target)?.entry.real ?? previousBinding,
    );
    copies++;
  }
  function finish(record) {
    if (
      !record?.eligible ||
      !record.pixels ||
      (!record.mipmaps && record.storage[1] !== 1) ||
      record.renderTarget
    )
      return;
    const descriptor = JSON.stringify([
      record.storage,
      [...record.parameters].sort((a, b) => a[0] - b[0]),
      [...record.uploadUnpack].sort((a, b) => a[0] - b[0]),
    ]);
    const bucket = cache.get(descriptor);
    let match;
    for (const entry of bucket || [])
      if (equalBytes(entry.snapshot.pixels, record.pixels)) {
        match = entry;
        break;
      }
    if (match) {
      if (match === record.entry) return;
      const previous = record.entry;
      match.refs.add(record);
      record.entry = match;
      record.pixels = match.snapshot.pixels;
      release(previous, record);
      rebind(record);
      hits++;
      return;
    }
    removeCache(record.entry);
    record.entry.key = descriptor;
    let allocatedBytes = 0;
    for (let level = 0; level < record.storage[1]; level++)
      allocatedBytes +=
        4 *
        Math.max(1, record.storage[3] >> level) *
        Math.max(1, record.storage[4] >> level);
    record.entry.snapshot = { pixels: record.pixels, allocatedBytes };
    const next = bucket || new Set();
    next.add(record.entry);
    cache.set(descriptor, next);
  }
  function unknownMutation(target, method, args) {
    const record = current(target);
    if (record) {
      makePrivate(record);
      record.eligible = false;
      record.pixels = null;
    }
    return gl[method](...args);
  }
  const api = {
    createTexture() {
      const virtual = Object.create(WebGLTexture.prototype);
      const record = {
        virtual,
        target: null,
        entry: null,
        storage: null,
        pixels: null,
        uploadUnpack: null,
        parameters: new Map(),
        mipmaps: false,
        eligible: false,
        renderTarget: false,
        deleted: false,
      };
      record.entry = own(gl.createTexture(), record);
      textures.set(virtual, record);
      live.add(record);
      return virtual;
    },
    bindTexture(target, texture) {
      const record = textures.get(texture);
      if (record?.deleted)
        throw new Error('Cannot bind a deleted logical texture');
      if (record && !record.target) record.target = target;
      bindings.set(key(target), record || null);
      return gl.bindTexture(target, record ? record.entry.real : texture);
    },
    activeTexture(value) {
      unit = value;
      return gl.activeTexture(value);
    },
    pixelStorei(parameter, value) {
      if (unpack.has(parameter)) unpack.set(parameter, value);
      return gl.pixelStorei(parameter, value);
    },
    bindBuffer(target, buffer) {
      if (target === gl.PIXEL_UNPACK_BUFFER) unpackBuffer = buffer;
      return gl.bindBuffer(target, buffer);
    },
    texStorage2D(...args) {
      const record = current(args[0]);
      if (record) {
        makePrivate(record);
        record.storage = [...args];
        record.pixels = null;
        record.mipmaps = false;
        record.eligible =
          args[0] === gl.TEXTURE_2D &&
          args[2] === gl.RGBA8 &&
          ((args[1] === 10 && args[3] === 512 && args[4] === 512) ||
            (args[1] === 1 && args[3] === 576 && args[4] === 960)) &&
          !record.renderTarget;
      }
      return gl.texStorage2D(...args);
    },
    texSubImage2D(...args) {
      const record = current(args[0]);
      const full =
        record?.eligible &&
        args.length >= 9 &&
        args[1] === 0 &&
        args[2] === 0 &&
        args[3] === 0 &&
        args[4] === record.storage[3] &&
        args[5] === record.storage[4] &&
        args[6] === gl.RGBA &&
        args[7] === gl.UNSIGNED_BYTE &&
        args[8] instanceof Uint8Array &&
        !unpackBuffer &&
        [
          'UNPACK_ROW_LENGTH',
          'UNPACK_IMAGE_HEIGHT',
          'UNPACK_SKIP_PIXELS',
          'UNPACK_SKIP_ROWS',
          'UNPACK_SKIP_IMAGES',
        ].every((name) => !unpack.get(gl[name]));
      if (!full) return unknownMutation(args[0], 'texSubImage2D', args);
      const offset = args[9] || 0,
        length = args[4] * args[5] * 4;
      if (
        !Number.isInteger(offset) ||
        offset < 0 ||
        offset + length > args[8].length
      )
        return unknownMutation(args[0], 'texSubImage2D', args);
      makePrivate(record);
      const result = gl.texSubImage2D(...args);
      record.pixels = args[8].slice(offset, offset + length); // Never identify mutable WASM memory by pointer.
      record.uploadUnpack = new Map(unpack);
      record.mipmaps = false;
      finish(record);
      return result;
    },
    texParameteri(target, parameter, value) {
      const record = current(target);
      if (record && record.parameters.get(parameter) !== value) {
        makePrivate(record);
        record.parameters.set(parameter, value);
      }
      const result = gl.texParameteri(target, parameter, value);
      finish(record);
      return result;
    },
    texParameterf(...args) {
      return unknownMutation(args[0], 'texParameterf', args);
    },
    generateMipmap(target) {
      const record = current(target);
      if (record?.eligible && record.mipmaps) return;
      if (record) makePrivate(record);
      const result = gl.generateMipmap(target);
      if (record) {
        record.mipmaps = true;
        finish(record);
      }
      return result;
    },
    framebufferTexture2D(target, attachment, textureTarget, texture, level) {
      const record = textures.get(texture);
      if (record) {
        makePrivate(record);
        record.renderTarget = true;
        record.eligible = false;
        record.pixels = null;
      }
      return gl.framebufferTexture2D(
        target,
        attachment,
        textureTarget,
        record ? record.entry.real : texture,
        level,
      );
    },
    framebufferTextureLayer(target, attachment, texture, level, layer) {
      const record = textures.get(texture);
      if (record) {
        makePrivate(record);
        record.renderTarget = true;
        record.eligible = false;
        record.pixels = null;
      }
      return gl.framebufferTextureLayer(
        target,
        attachment,
        record ? record.entry.real : texture,
        level,
        layer,
      );
    },
    getFramebufferAttachmentParameter(...args) {
      const value = gl.getFramebufferAttachmentParameter(...args);
      const entry =
        value && typeof value === 'object'
          ? physicalEntries.get(value)
          : undefined;
      // FBO attachment always makes a texture private before it is attached.
      return entry?.refs.size === 1
        ? entry.refs.values().next().value.virtual
        : value;
    },
    deleteTexture(texture) {
      if (!texture) return;
      const record = textures.get(texture);
      if (!record) return gl.deleteTexture(texture);
      if (record.deleted) return;
      record.deleted = true;
      for (const [binding, value] of bindings)
        if (value === record) {
          const [at, target] = binding.split(':').map(Number);
          gl.activeTexture(at);
          gl.bindTexture(target, null);
          bindings.set(binding, null);
        }
      gl.activeTexture(unit);
      release(record.entry, record);
      live.delete(record);
      record.pixels = null;
    },
    isTexture(texture) {
      const record = textures.get(texture);
      return record
        ? !record.deleted && gl.isTexture(record.entry.real)
        : gl.isTexture(texture);
    },
    getParameter(parameter) {
      const targets = new Map([
        [gl.TEXTURE_BINDING_2D, gl.TEXTURE_2D],
        [gl.TEXTURE_BINDING_3D, gl.TEXTURE_3D],
        [gl.TEXTURE_BINDING_CUBE_MAP, gl.TEXTURE_CUBE_MAP],
        [gl.TEXTURE_BINDING_2D_ARRAY, gl.TEXTURE_2D_ARRAY],
      ]);
      if (targets.has(parameter))
        return (
          current(targets.get(parameter))?.virtual || gl.getParameter(parameter)
        );
      return gl.getParameter(parameter);
    },
  };
  const writes = new Set([
    'texImage2D',
    'copyTexImage2D',
    'copyTexSubImage2D',
    'compressedTexImage2D',
    'compressedTexSubImage2D',
    'texStorage3D',
    'texImage3D',
    'texSubImage3D',
    'copyTexSubImage3D',
    'compressedTexImage3D',
    'compressedTexSubImage3D',
  ]);
  const context = new Proxy(gl, {
    get(target, property) {
      if (Object.hasOwn(api, property)) return api[property];
      if (methods.has(property)) return methods.get(property);
      const value = Reflect.get(target, property, target);
      if (typeof value !== 'function') return value;
      if (!methods.has(property))
        methods.set(
          property,
          writes.has(property)
            ? (...args) => unknownMutation(args[0], property, args)
            : value.bind(target),
        );
      return methods.get(property);
    },
  });
  return {
    context,
    stats: () => ({
      logicalTextures: live.size,
      physicalTextures: entries.size,
      pooledTextures: [...cache.values()].reduce((n, v) => n + v.size, 0),
      // RGBA8 storage across allocated levels, including each asset's base level.
      mipBytesSaved: [...cache.values()].reduce(
        (total, bucket) =>
          total +
          [...bucket].reduce(
            (sum, entry) =>
              sum + (entry.refs.size - 1) * entry.snapshot.allocatedBytes,
            0,
          ),
        0,
      ),
      hits,
      copies,
    }),
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const record of [...live]) api.deleteTexture(record.virtual);
      methods.clear();
      bindings.clear();
    },
  };
}
