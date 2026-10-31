/** Isolated presenter experiment. Same committed WebGL engine, shaders, assets,
 * resolution and live motion in both arms. WebGPU only replaces presentation.
 * At most two submitted batches; engine scheduling defers rather than dropping
 * frames. GPU completion counts are NOT compositor-presented frame counts. */
export async function startWebGPUPresentationFixture({
  mode = 'direct',
  count = 24,
  cssSize = 96,
  kind = 'authored',
  engineRoot = '/runtime',
  sourceRevision = 'unspecified',
  allowFallbackAdapter = false,
} = {}) {
  await globalThis.__avatarWebGPUFixture?.dispose();
  const root = engineRoot;
  const [{ AuthoredAvatarEngine }, { createCatalogAssetResolver }, { createCatalogMotion }] =
    await Promise.all([
      import(`${root}/avatar/authored-engine.ts`),
      import(`${root}/avatar/catalog-assets.ts`),
      import(`${root}/avatar/catalog-motion-factory.ts`),
    ]);
  const columns = Math.ceil(Math.sqrt(count)),
    rows = Math.ceil(count / columns),
    size = cssSize <= 64 ? 64 : cssSize <= 128 ? 128 : 320;
  const stage = document.createElement('canvas');
  stage.style.cssText = `position:fixed;left:0;top:0;width:${columns * size}px;height:${rows * size}px;opacity:0;pointer-events:none`;
  document.body.append(stage);
  const layer = document.createElement('div');
  layer.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px';
  document.body.append(layer);
  const canvases = Array.from({ length: count }, () => {
    const c = document.createElement('canvas');
    c.style.width = c.style.height = cssSize + 'px';
    c.width = c.height = Math.round(cssSize * Math.min(devicePixelRatio, 2));
    layer.append(c);
    return c;
  });
  const pending = new Set(),
    errors = [];
  let metrics = {
      frames: 0,
      submissions: 0,
      completed: 0,
      destinations: 0,
      maxPending: 0,
      copyMs: 0,
      drawMs: 0,
    },
    callback = () => {},
    disposed = false,
    captureRequest;
  let device,
    pipeline,
    texture,
    sampler,
    uniforms,
    bindings,
    contexts,
    format,
    textureWidth = 0,
    textureHeight = 0,
    adapterInfo;
  if (mode === 'webgpu') {
    const adapter = await navigator.gpu?.requestAdapter();
    if (!adapter) throw Error('WebGPU adapter unavailable');
    adapterInfo = {
      vendor: adapter.info?.vendor,
      architecture: adapter.info?.architecture,
      isFallbackAdapter: adapter.info?.isFallbackAdapter,
    };
    if (adapterInfo.isFallbackAdapter === true && !allowFallbackAdapter)
      throw Error('Software WebGPU adapter excluded from this hardware experiment');
    device = await adapter.requestDevice();
    device.addEventListener('uncapturederror', (event) => errors.push(String(event.error)));
    device.lost.then((info) => {
      if (!disposed) errors.push(`Device lost: ${info.message}`);
    });
    format = navigator.gpu.getPreferredCanvasFormat();
    contexts = canvases.map((canvas) => {
      const context = canvas.getContext('webgpu');
      context.configure({ device, format, alphaMode: 'premultiplied', colorSpace: 'srgb' });
      return context;
    });
    const shader = device.createShaderModule({
      code: `
    struct Out { @builtin(position) position:vec4f, @location(0) uv:vec2f };
    @group(0) @binding(0) var atlas:texture_2d<f32>;
    @group(0) @binding(1) var linearSampler:sampler;
    @group(0) @binding(2) var<uniform> rect:vec4f;
    @vertex fn vertex(@builtin(vertex_index) i:u32)->Out {
      let positions=array<vec2f,3>(vec2f(-1,1),vec2f(-1,-3),vec2f(3,1));
      let uvs=array<vec2f,3>(vec2f(0,0),vec2f(0,2),vec2f(2,0));
      var output:Out;output.position=vec4f(positions[i],0,1);output.uv=uvs[i];return output;
    }
    @fragment fn fragment(input:Out)->@location(0) vec4f {
      // Canvas2D drawImage filters across source-rectangle boundaries inside
      // the same image. Only the original atlas boundary clamps.
      let uv=rect.xy+input.uv*rect.zw;
      return textureSample(atlas,linearSampler,uv);
    }
  `,
    });
    pipeline = await device.createRenderPipelineAsync({
      layout: 'auto',
      vertex: { module: shader, entryPoint: 'vertex' },
      fragment: { module: shader, entryPoint: 'fragment', targets: [{ format }] },
      primitive: { topology: 'triangle-list' },
    });
    sampler = device.createSampler({ minFilter: 'linear', magFilter: 'linear' });
    uniforms = canvases.map(() =>
      device.createBuffer({ size: 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST }),
    );
  } else contexts = canvases.map((canvas) => canvas.getContext('2d'));
  const engine = new AuthoredAvatarEngine(stage, {
    count,
    size,
    preset: 'blue_beret',
    lazyWork: true,
    resolveAsset: createCatalogAssetResolver(createCatalogMotion),
    onFrame: () => {
      try {
        callback();
      } catch (error) {
        errors.push(String(error));
        engine.setPaused(true);
      }
    },
  });
  await engine.loaded;
  engine.setPaused(true);
  const presets = [
    'blue_beret',
    'alfred',
    'purple_heart',
    'lime_frog',
    'coral_monocle',
    'gus',
    'blue_spectacles',
    'lime_headphones',
  ];
  for (let index = 0; index < count; index++) {
    const catalogs = [
      { shape: 'heart', eyes: 'cyclops', eyewear: 'none', accessory: 'crown' },
      { shape: 'six_lobed_flower', eyes: 'todd', eyewear: 'monocle', accessory: 'none' },
    ];
    const preset =
      kind === 'mixed' && index % 10 >= 8
        ? 'catalog:' + JSON.stringify(catalogs[(index % 10) - 8])
        : kind === 'blue'
          ? 'blue_beret'
          : presets[index % presets.length];
    await engine.setPreset(index, preset);
    engine.setColor(index, '#' + (0x46719b + index * 10007).toString(16).padStart(6, '0'));
    engine.idle(index);
  }
  const invalidate = engine.invalidate.bind(engine);
  let queued = false,
    urgent = false;
  engine.invalidate = (value) => {
    if (pending.size >= 2) {
      queued = true;
      urgent ||= value;
      return;
    }
    invalidate(value);
  };
  callback = () => {
    if (disposed) return;
    metrics.frames++;
    const tile = stage.width / columns;
    const capture = captureRequest;
    captureRequest = undefined;
    const references = capture
      ? canvases.map((canvas, index) => {
          const target = document.createElement('canvas');
          target.width = canvas.width;
          target.height = canvas.height;
          target
            .getContext('2d')
            .drawImage(
              stage,
              (index % columns) * tile,
              Math.floor(index / columns) * tile,
              tile,
              tile,
              0,
              0,
              target.width,
              target.height,
            );
          return target;
        })
      : null;
    const finishCapture = async () => {
      if (!capture) return;
      try {
        await new Promise(requestAnimationFrame);
        const read = (canvas) => {
          const target = document.createElement('canvas');
          target.width = canvas.width;
          target.height = canvas.height;
          const context = target.getContext('2d');
          context.drawImage(canvas, 0, 0);
          return context.getImageData(0, 0, target.width, target.height).data;
        };
        const compare = (a, b) => {
          let changed = 0,
            maxChannel = 0,
            maxAlpha = 0,
            maxPremult = 0,
            absolute = 0,
            alphaPixels = 0;
          for (let i = 0; i < a.length; i += 4) {
            let change = 0;
            for (let c = 0; c < 4; c++) {
              const difference = Math.abs(a[i + c] - b[i + c]);
              change = Math.max(change, difference);
              maxChannel = Math.max(maxChannel, difference);
              absolute += difference;
            }
            if (change) changed++;
            if (a[i + 3]) alphaPixels++;
            maxAlpha = Math.max(maxAlpha, Math.abs(a[i + 3] - b[i + 3]));
            for (let c = 0; c < 3; c++)
              maxPremult = Math.max(
                maxPremult,
                Math.abs(
                  Math.round((a[i + c] * a[i + 3]) / 255) - Math.round((b[i + c] * b[i + 3]) / 255),
                ),
              );
          }
          return {
            pixels: a.length / 4,
            changed,
            maxChannel,
            maxAlpha,
            maxPremult,
            absolute,
            alphaPixels,
          };
        };
        const cells = [];
        for (let index = 0; index < count; index++) {
          const reference = references[index],
            canvas = canvases[index],
            expected = read(reference),
            actual = read(canvas),
            png = canvas.toDataURL('image/png'),
            image = new Image();
          image.src = png;
          await image.decode();
          const decoded = document.createElement('canvas');
          decoded.width = image.width;
          decoded.height = image.height;
          decoded.getContext('2d').drawImage(image, 0, 0);
          let submittedPNG;
          if (capture.submittedPNGs) {
            const submittedImage = new Image();
            submittedImage.src = capture.submittedPNGs[index];
            await submittedImage.decode();
            const submitted = document.createElement('canvas');
            submitted.width = submittedImage.width;
            submitted.height = submittedImage.height;
            submitted.getContext('2d').drawImage(submittedImage, 0, 0);
            submittedPNG = compare(expected, read(submitted));
          }
          cells.push({
            index,
            width: canvas.width,
            height: canvas.height,
            rgba: compare(expected, actual),
            png: compare(expected, read(decoded)),
            submittedPNG,
            ...(capture.images && (capture.images === 'all' || index === 0)
              ? { referencePNG: reference.toDataURL('image/png'), actualPNG: png }
              : {}),
          });
        }
        capture.resolve({
          mode,
          sourceRevision,
          cssSize,
          sourceTile: tile,
          kind: capture.kind,
          time: capture.time,
          cells,
          errors: [...errors],
        });
      } catch (error) {
        capture.reject(error);
      }
    };
    if (mode === 'direct') {
      for (let index = 0; index < count; index++) {
        const canvas = canvases[index],
          context = contexts[index],
          start = performance.now();
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(
          stage,
          (index % columns) * tile,
          Math.floor(index / columns) * tile,
          tile,
          tile,
          0,
          0,
          canvas.width,
          canvas.height,
        );
        metrics.drawMs += performance.now() - start;
        metrics.destinations++;
      }
      if (capture) capture.submittedPNGs = canvases.map((canvas) => canvas.toDataURL('image/png'));
      metrics.completed++;
      void finishCapture();
      return;
    }
    if (pending.size >= 2) throw Error('Presenter backpressure exceeded');
    if (textureWidth !== stage.width || textureHeight !== stage.height) {
      texture?.destroy();
      textureWidth = stage.width;
      textureHeight = stage.height;
      texture = device.createTexture({
        size: [textureWidth, textureHeight],
        format: 'rgba8unorm',
        usage:
          GPUTextureUsage.COPY_DST |
          GPUTextureUsage.TEXTURE_BINDING |
          GPUTextureUsage.RENDER_ATTACHMENT,
      });
      bindings = uniforms.map((buffer) =>
        device.createBindGroup({
          layout: pipeline.getBindGroupLayout(0),
          entries: [
            { binding: 0, resource: texture.createView() },
            { binding: 1, resource: sampler },
            { binding: 2, resource: { buffer } },
          ],
        }),
      );
    }
    const start = performance.now();
    device.queue.copyExternalImageToTexture(
      { source: stage },
      { texture, premultipliedAlpha: true, colorSpace: 'srgb' },
      [stage.width, stage.height],
    );
    metrics.copyMs += performance.now() - start;
    const encoder = device.createCommandEncoder();
    for (let index = 0; index < count; index++) {
      device.queue.writeBuffer(
        uniforms[index],
        0,
        new Float32Array([
          (index % columns) / columns,
          Math.floor(index / columns) / rows,
          1 / columns,
          1 / rows,
        ]),
      );
      const pass = encoder.beginRenderPass({
        colorAttachments: [
          {
            view: contexts[index].getCurrentTexture().createView(),
            loadOp: 'clear',
            storeOp: 'store',
            clearValue: { r: 0, g: 0, b: 0, a: 0 },
          },
        ],
      });
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, bindings[index]);
      pass.draw(3);
      pass.end();
      metrics.destinations++;
    }
    device.queue.submit([encoder.finish()]);
    if (capture) capture.submittedPNGs = canvases.map((canvas) => canvas.toDataURL('image/png'));
    metrics.submissions++;
    let task;
    task = device.queue
      .onSubmittedWorkDone()
      .then(() => {
        metrics.completed++;
        void finishCapture();
      })
      .catch((error) => errors.push(String(error)))
      .finally(() => {
        pending.delete(task);
        if (queued && !disposed && !errors.length) {
          const requested = urgent;
          queued = urgent = false;
          invalidate(requested);
        }
      });
    pending.add(task);
    metrics.maxPending = Math.max(metrics.maxPending, pending.size);
  };
  const read = () => ({
    mode,
    sourceRevision,
    count,
    cssSize,
    size,
    viewport: [innerWidth, innerHeight, devicePixelRatio],
    backing: canvases.map((c) => [c.width, c.height]),
    stage: [stage.width, stage.height],
    adapter: adapterInfo,
    ...metrics,
    pending: pending.size,
    errors: [...errors],
    engine: engine.stats(),
  });
  globalThis.__avatarWebGPUFixture = {
    read,
    async captureHeld({ kind = 'idle', time = 0.5, images = false } = {}) {
      if (captureRequest) throw Error('Capture already pending');
      engine.setPaused(true);
      await Promise.all(pending);
      if (kind === 'work') await Promise.all(canvases.map((_, index) => engine.prepareWork(index)));
      return await new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          captureRequest = undefined;
          reject(Error('Held capture timed out'));
        }, 15000);
        captureRequest = {
          kind,
          time,
          images,
          resolve: (value) => {
            clearTimeout(timer);
            resolve(value);
          },
          reject: (error) => {
            clearTimeout(timer);
            reject(error);
          },
        };
        for (let index = 0; index < count; index++) {
          engine.setWander(index, false);
          engine.setMotionFrame(index, kind, time);
        }
        invalidate(true);
      });
    },
    async sample(duration = 5000) {
      const before = read(),
        start = performance.now();
      await new Promise((resolve) => setTimeout(resolve, duration));
      return { before, after: read(), elapsed: performance.now() - start };
    },
    async dispose() {
      disposed = true;
      captureRequest?.reject(Error('Fixture disposed'));
      captureRequest = undefined;
      engine.setPaused(true);
      engine.invalidate = invalidate;
      await Promise.all(pending);
      engine.dispose();
      contexts.forEach((context) => context.unconfigure?.());
      uniforms?.forEach((buffer) => buffer.destroy());
      texture?.destroy();
      device?.destroy();
      stage.remove();
      layer.remove();
    },
  };
  engine.setPaused(false);
  return read();
}
