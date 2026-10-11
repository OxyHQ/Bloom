// Original shaders/programs, shared within ONE real context. The logical objects
// remain separate because Emscripten stores mutable IDs and uniform caches on them.
// This wrapper does not own the context and never suppresses context loss itself.
// Mali-G715 rejects this GLSL ES array constructor even with an explicit
// precision qualifier. Lower only the two known original-engine expressions;
// assigning the same four values separately preserves their evaluation order.
// Keep the source binaries intact and leave unrelated shaders byte-for-byte alone.
export function compatibleShaderSource(source) {
  return source
    .replace(
      "float felipeLTC(vec3 p,mat3 transform,vec3 rect[4]) {",
      "float felipeLTC(vec3 p,mat3 transform,highp vec3 rect[4]) {",
    )
    .replace(
      "vec3 rect[4]=vec3[4](light+right-up,light-right-up,light-right+up,light+right+up);",
      "highp vec3 rect[4];rect[0]=light+right-up;rect[1]=light-right-up;rect[2]=light-right+up;rect[3]=light+right+up;",
    );
}

export function createSharedProgramPool(gl) {
  const shaders = new WeakMap(),
    programs = new WeakMap(),
    locations = new WeakMap();
  const shaderCache = new Map(),
    programCache = new Map();
  const livePrograms = new Set(),
    liveShaders = new Set(),
    bound = new Map();
  let current = null,
    disposed = false,
    shaderCompiles = 0,
    programLinks = 0,
    uniformReplays = 0,
    uniformReplaySkips = 0,
    blockReplays = 0,
    blockReplaySkips = 0;

  const shaderKey = (s) => JSON.stringify([s.type, s.source]);
  function collectShader(entry) {
    if (!entry || entry.records.size || entry.programs.size) return;
    gl.deleteShader(entry.real);
    if (shaderCache.get(entry.key) === entry) shaderCache.delete(entry.key);
  }
  function releaseShader(s) {
    if (!s.deleted || s.attached.size) return;
    liveShaders.delete(s);
    s.entry?.records.delete(s);
    collectShader(s.entry);
  }
  function compile(s) {
    const key = shaderKey(s);
    if (s.entry?.key === key) return s.entry;
    let entry = shaderCache.get(key);
    if (!entry) {
      const real = gl.createShader(s.type);
      gl.shaderSource(real, compatibleShaderSource(s.source));
      gl.compileShader(real);
      shaderCompiles++;
      entry = { key, real, records: new Set(), programs: new Set() };
      shaderCache.set(key, entry);
    }
    const previous = s.entry;
    previous?.records.delete(s);
    entry.records.add(s);
    s.entry = entry;
    collectShader(previous);
    return entry;
  }
  function releaseProgramEntry(p) {
    const entry = p.entry;
    if (!entry) return;
    p.entry = null;
    entry.refs.delete(p);
    if (entry.owner === p) entry.owner = null;
    if (entry.refs.size) return;
    gl.deleteProgram(entry.real);
    if (programCache.get(entry.key) === entry) programCache.delete(entry.key);
    for (const shader of entry.shaders) {
      shader.programs.delete(entry);
      collectShader(shader);
    }
  }
  // Active uniform reflection provides complete defaults, including uniforms an
  // alias has never assigned. Otherwise switching to a new alias leaks old values.
  const types = new Map([
    [gl.FLOAT, ["uniform1fv", 1, Float32Array]],
    [gl.FLOAT_VEC2, ["uniform2fv", 2, Float32Array]],
    [gl.FLOAT_VEC3, ["uniform3fv", 3, Float32Array]],
    [gl.FLOAT_VEC4, ["uniform4fv", 4, Float32Array]],
    [gl.INT, ["uniform1iv", 1, Int32Array]],
    [gl.INT_VEC2, ["uniform2iv", 2, Int32Array]],
    [gl.INT_VEC3, ["uniform3iv", 3, Int32Array]],
    [gl.INT_VEC4, ["uniform4iv", 4, Int32Array]],
    [gl.UNSIGNED_INT, ["uniform1uiv", 1, Uint32Array]],
    [gl.UNSIGNED_INT_VEC2, ["uniform2uiv", 2, Uint32Array]],
    [gl.UNSIGNED_INT_VEC3, ["uniform3uiv", 3, Uint32Array]],
    [gl.UNSIGNED_INT_VEC4, ["uniform4uiv", 4, Uint32Array]],
    [gl.BOOL, ["uniform1iv", 1, Int32Array]],
    [gl.BOOL_VEC2, ["uniform2iv", 2, Int32Array]],
    [gl.BOOL_VEC3, ["uniform3iv", 3, Int32Array]],
    [gl.BOOL_VEC4, ["uniform4iv", 4, Int32Array]],
    [gl.FLOAT_MAT2, ["uniformMatrix2fv", 4, Float32Array]],
    [gl.FLOAT_MAT3, ["uniformMatrix3fv", 9, Float32Array]],
    [gl.FLOAT_MAT4, ["uniformMatrix4fv", 16, Float32Array]],
    [gl.FLOAT_MAT2x3, ["uniformMatrix2x3fv", 6, Float32Array]],
    [gl.FLOAT_MAT2x4, ["uniformMatrix2x4fv", 8, Float32Array]],
    [gl.FLOAT_MAT3x2, ["uniformMatrix3x2fv", 6, Float32Array]],
    [gl.FLOAT_MAT3x4, ["uniformMatrix3x4fv", 12, Float32Array]],
    [gl.FLOAT_MAT4x2, ["uniformMatrix4x2fv", 8, Float32Array]],
    [gl.FLOAT_MAT4x3, ["uniformMatrix4x3fv", 12, Float32Array]],
  ]);
  for (const name of [
    "SAMPLER_2D",
    "SAMPLER_CUBE",
    "SAMPLER_3D",
    "SAMPLER_2D_SHADOW",
    "SAMPLER_2D_ARRAY",
    "SAMPLER_2D_ARRAY_SHADOW",
    "SAMPLER_CUBE_SHADOW",
    "INT_SAMPLER_2D",
    "INT_SAMPLER_3D",
    "INT_SAMPLER_CUBE",
    "INT_SAMPLER_2D_ARRAY",
    "UNSIGNED_INT_SAMPLER_2D",
    "UNSIGNED_INT_SAMPLER_3D",
    "UNSIGNED_INT_SAMPLER_CUBE",
    "UNSIGNED_INT_SAMPLER_2D_ARRAY",
  ])
    types.set(gl[name], ["uniform1iv", 1, Int32Array]);

  function reflect(real) {
    const uniforms = [],
      names = new Map();
    for (let i = 0; i < gl.getProgramParameter(real, gl.ACTIVE_UNIFORMS); i++) {
      const active = gl.getActiveUniform(real, i);
      const location = gl.getUniformLocation(real, active.name);
      if (location === null) continue; // Uniform block members use buffers.
      const type = types.get(active.type);
      if (!type)
        throw new Error(`Unsupported shared uniform type: ${active.type}`);
      const [method, width, ArrayType] = type;
      const uniform = {
        name: active.name,
        size: active.size,
        method,
        width,
        ArrayType,
        matrix: method.startsWith("uniformMatrix"),
        location,
        type: active.type,
      };
      const index = uniforms.push(uniform) - 1;
      for (let element = 0; element < active.size; element++) {
        const name = active.name.includes("[0]")
          ? active.name.replace("[0]", `[${element}]`)
          : active.name;
        names.set(name, { index, element });
      }
      if (active.name.endsWith("[0]"))
        names.set(active.name.slice(0, -3), { index, element: 0 });
    }
    return {
      uniforms,
      names,
      blocks: gl.getProgramParameter(real, gl.ACTIVE_UNIFORM_BLOCKS),
    };
  }
  function link(p) {
    const attached = [...p.attached].map((shader) =>
      compile(shaders.get(shader)),
    );
    const bindings = [...p.bindings].sort(([a], [b]) => a.localeCompare(b));
    const key = JSON.stringify([
      attached.map((s) => s.key).sort(),
      bindings,
      p.feedback,
    ]);
    let entry = programCache.get(key);
    if (!entry) {
      const real = p.unlinked ?? gl.createProgram();
      p.unlinked = null;
      for (const shader of attached) gl.attachShader(real, shader.real);
      for (const [name, index] of bindings)
        gl.bindAttribLocation(real, index, name);
      if (p.feedback) gl.transformFeedbackVaryings(real, ...p.feedback);
      gl.linkProgram(real);
      programLinks++;
      const linked = gl.getProgramParameter(real, gl.LINK_STATUS);
      const reflection = linked
        ? reflect(real)
        : { uniforms: [], names: new Map(), blocks: 0 };
      entry = {
        key,
        real,
        linked,
        shaders: attached,
        refs: new Set(),
        owner: null,
        ...reflection,
      };
      programCache.set(key, entry);
      for (const shader of attached) shader.programs.add(entry);
    }
    // Hold the new reference before releasing a same-key previous link.
    const previous = p.entry;
    if (previous !== entry) {
      releaseProgramEntry(p);
      entry.refs.add(p);
      p.entry = entry;
    }
    if (p.unlinked) {
      gl.deleteProgram(p.unlinked);
      p.unlinked = null;
    }
    p.values = entry.uniforms.map((u) => new u.ArrayType(u.width * u.size));
    p.blockBindings = new Uint32Array(entry.blocks);
    p.locations.clear();
    p.generation++;
    // Relinking resets the logical program's uniforms even when its source key
    // stays identical. A later useProgram must replay the reset values.
    if (entry.owner === p) entry.owner = null;
    if (current === p) use(p);
  }
  function realProgram(p) {
    return p.entry?.real ?? (p.unlinked ??= gl.createProgram());
  }
  function equalValues(a, b) {
    if (!a || a.length !== b.length) return false;
    // Signed zero can be observable inside GLSL, so ordinary === is not enough.
    for (let i = 0; i < b.length; i++) if (!Object.is(a[i], b[i])) return false;
    return true;
  }
  function use(p) {
    gl.useProgram(p ? realProgram(p) : null);
    current = p;
    if (!p?.entry || p.entry.owner === p) return;
    const entry = p.entry;
    const previous = entry.owner;
    // The last owner records the physical program's complete uniform state,
    // including partial writes. Deletion/relinking invalidates that owner, so
    // unknown state still receives a complete replay, including all defaults.
    for (let i = 0; i < entry.uniforms.length; i++) {
      const u = entry.uniforms[i];
      if (equalValues(previous?.values[i], p.values[i])) {
        uniformReplaySkips++;
        continue;
      }
      if (u.matrix) gl[u.method](u.location, false, p.values[i]);
      else gl[u.method](u.location, p.values[i]);
      uniformReplays++;
    }
    for (let i = 0; i < p.blockBindings.length; i++) {
      if (previous && previous.blockBindings[i] === p.blockBindings[i]) {
        blockReplaySkips++;
        continue;
      }
      gl.uniformBlockBinding(entry.real, i, p.blockBindings[i]);
      blockReplays++;
    }
    entry.owner = p;
  }
  function uniformCall(method, args) {
    if (args[0] == null) return gl[method](...args);
    const location = locations.get(args[0]);
    if (!location) return gl[method](...args);
    const { program: p, index, element, real, generation } = location;
    if (current !== p || generation !== p.generation || p.deleted)
      throw new Error("Shared uniform belongs to another logical program");
    const result = gl[method](real, ...args.slice(1));
    const u = p.entry.uniforms[index];
    const vector = method.endsWith("v"),
      matrix = method.startsWith("uniformMatrix");
    if (matrix && args[1] !== false) return result;
    let values;
    if (vector) {
      const at = matrix ? 2 : 1,
        data = args[at];
      const offset = args[at + 1] ?? 0,
        length = args[at + 2] || data.length - offset;
      values = Array.prototype.slice.call(data, offset, offset + length);
    } else values = args.slice(1);
    const offset = element * u.width;
    if (
      values.length % u.width === 0 &&
      offset + values.length <= p.values[index].length
    )
      p.values[index].set(values, offset);
    return result;
  }
  const api = {
    createShader(type) {
      const virtual = Object.create(WebGLShader.prototype);
      const s = {
        type,
        source: "",
        entry: null,
        attached: new Set(),
        deleted: false,
      };
      shaders.set(virtual, s);
      liveShaders.add(s);
      return virtual;
    },
    shaderSource(shader, source) {
      shaders.get(shader).source = String(source);
    },
    compileShader(shader) {
      compile(shaders.get(shader));
    },
    deleteShader(shader) {
      if (!shader) return;
      const s = shaders.get(shader);
      if (!s) return gl.deleteShader(shader);
      s.deleted = true;
      releaseShader(s);
    },
    getShaderSource(shader) {
      return shaders.get(shader)?.source ?? gl.getShaderSource(shader);
    },
    getShaderParameter(shader, parameter) {
      const s = shaders.get(shader);
      if (!s) return gl.getShaderParameter(shader, parameter);
      if (parameter === gl.DELETE_STATUS) return s.deleted;
      if (parameter === gl.SHADER_TYPE) return s.type;
      return gl.getShaderParameter(compile(s).real, parameter);
    },
    getShaderInfoLog(shader) {
      return gl.getShaderInfoLog(compile(shaders.get(shader)).real);
    },
    isShader(shader) {
      const s = shaders.get(shader);
      return s ? !s.deleted : gl.isShader(shader);
    },
    createProgram() {
      const virtual = Object.create(WebGLProgram.prototype);
      const p = {
        virtual,
        entry: null,
        unlinked: null,
        attached: new Set(),
        bindings: new Map(),
        feedback: null,
        values: [],
        blockBindings: [],
        locations: new Map(),
        generation: 0,
        deleted: false,
      };
      programs.set(virtual, p);
      livePrograms.add(p);
      return virtual;
    },
    attachShader(program, shader) {
      const p = programs.get(program),
        s = shaders.get(shader);
      p.attached.add(shader);
      s.attached.add(p);
    },
    detachShader(program, shader) {
      const p = programs.get(program),
        s = shaders.get(shader);
      p.attached.delete(shader);
      s.attached.delete(p);
      releaseShader(s);
    },
    getAttachedShaders(program) {
      return [...programs.get(program).attached];
    },
    bindAttribLocation(program, index, name) {
      programs.get(program).bindings.set(name, index);
    },
    transformFeedbackVaryings(program, varyings, mode) {
      programs.get(program).feedback = [[...varyings], mode];
    },
    linkProgram(program) {
      link(programs.get(program));
    },
    useProgram(program) {
      use(program == null ? null : programs.get(program));
    },
    deleteProgram(program) {
      if (!program) return;
      const p = programs.get(program);
      if (!p) return gl.deleteProgram(program);
      if (p.deleted) return;
      p.deleted = true;
      if (current === p) {
        gl.useProgram(null);
        current = null;
      }
      for (const shader of p.attached) {
        const s = shaders.get(shader);
        s.attached.delete(p);
        releaseShader(s);
      }
      p.attached.clear();
      releaseProgramEntry(p);
      if (p.unlinked) gl.deleteProgram(p.unlinked);
      p.locations.clear();
      p.values = [];
      livePrograms.delete(p);
    },
    isProgram(program) {
      const p = programs.get(program);
      return p ? !p.deleted : gl.isProgram(program);
    },
    getProgramParameter(program, parameter) {
      const p = programs.get(program);
      if (!p) return gl.getProgramParameter(program, parameter);
      if (parameter === gl.DELETE_STATUS) return p.deleted;
      if (parameter === gl.ATTACHED_SHADERS) return p.attached.size;
      return gl.getProgramParameter(realProgram(p), parameter);
    },
    getUniformLocation(program, name) {
      const p = programs.get(program),
        entry = p.entry;
      if (p.locations.has(name)) return p.locations.get(name);
      const real = gl.getUniformLocation(realProgram(p), name);
      if (real === null) return null;
      const slot = entry.names.get(name);
      if (!slot) throw new Error(`Unknown shared uniform: ${name}`);
      const virtual = Object.create(WebGLUniformLocation.prototype);
      locations.set(virtual, {
        program: p,
        real,
        ...slot,
        generation: p.generation,
      });
      p.locations.set(name, virtual);
      return virtual;
    },
    getUniform(program, uniform) {
      const location = locations.get(uniform);
      if (!location)
        return gl.getUniform(realProgram(programs.get(program)), uniform);
      const p = programs.get(program);
      if (location.program !== p || location.generation !== p.generation)
        throw new Error("Invalid shared uniform query");
      const u = p.entry.uniforms[location.index];
      const value = p.values[location.index].slice(
        location.element * u.width,
        (location.element + 1) * u.width,
      );
      return u.width === 1 ? value[0] : value;
    },
    uniformBlockBinding(program, index, binding) {
      const p = programs.get(program);
      p.blockBindings[index] = binding;
      // This is a program operation, so it can be called while another alias is
      // active. Do not overwrite that alias's live block bindings.
      if (p.entry.owner === p)
        gl.uniformBlockBinding(p.entry.real, index, binding);
    },
    getActiveUniformBlockParameter(program, index, parameter) {
      const p = programs.get(program);
      if (parameter === gl.UNIFORM_BLOCK_BINDING) return p.blockBindings[index];
      return gl.getActiveUniformBlockParameter(
        realProgram(p),
        index,
        parameter,
      );
    },
    getParameter(parameter) {
      if (parameter === gl.CURRENT_PROGRAM) return current?.virtual ?? null;
      return gl.getParameter(parameter);
    },
  };
  const programFirst = new Set([
    "getProgramInfoLog",
    "validateProgram",
    "getActiveAttrib",
    "getAttribLocation",
    "getActiveUniform",
    "getUniformIndices",
    "getActiveUniforms",
    "getUniformBlockIndex",
    "getActiveUniformBlockName",
    "getTransformFeedbackVarying",
    "getFragDataLocation",
  ]);
  const context = new Proxy(gl, {
    get(target, property) {
      if (Object.hasOwn(api, property)) return api[property];
      if (bound.has(property)) return bound.get(property);
      const value = Reflect.get(target, property, target);
      if (typeof value !== "function") return value;
      if (!bound.has(property)) {
        if (
          /^uniform(?:[1-4](?:f|i|ui)v?|Matrix[2-4](?:x[2-4])?fv)$/.test(
            String(property),
          )
        )
          bound.set(property, (...args) => uniformCall(property, args));
        else if (programFirst.has(property))
          bound.set(property, (program, ...args) =>
            value.call(
              target,
              programs.has(program)
                ? realProgram(programs.get(program))
                : program,
              ...args,
            ),
          );
        else bound.set(property, value.bind(target));
      }
      return bound.get(property);
    },
  });
  return {
    context,
    stats: () => ({
      logicalPrograms: livePrograms.size,
      logicalShaders: liveShaders.size,
      programs: programCache.size,
      shaders: shaderCache.size,
      programLinks,
      shaderCompiles,
      uniformReplays,
      uniformReplaySkips,
      blockReplays,
      blockReplaySkips,
    }),
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const p of [...livePrograms]) api.deleteProgram(p.virtual);
      for (const s of [...liveShaders]) {
        s.deleted = true;
        releaseShader(s);
      }
      bound.clear();
    },
  };
}
