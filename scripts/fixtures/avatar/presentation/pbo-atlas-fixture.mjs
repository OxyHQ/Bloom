/** TEST ONLY. Identical WebGL engine and destination Canvas2D scaling in both
 * arms; the PBO arm reads one atlas asynchronously into one CPU scratch canvas.
 * Two pending batches maximum: engine scheduling defers, never drops frames.
 * Completion means destination drawImage returned, not compositor presentation. */
export async function startPBOAtlasFixture({
  mode = 'direct',
  count = 24,
  cssSize = 96,
  kind = 'authored',
  engineRoot = '/runtime',
  readbackRoot = engineRoot,
  sourceRevision = 'unspecified',
} = {}) {
  await globalThis.__avatarPBOFixture?.dispose();
  if (!['direct', 'pbo'].includes(mode)) throw Error('Unknown presenter mode');
  const [
    { AuthoredAvatarEngine },
    { createCatalogAssetResolver },
    { createCatalogMotion },
    { readPixelsAsync },
  ] = await Promise.all([
    import(`${engineRoot}/avatar/authored-engine.ts`),
    import(`${engineRoot}/avatar/catalog-assets.ts`),
    import(`${engineRoot}/avatar/catalog-motion-factory.ts`),
    import(`${readbackRoot}/avatar/async-pixels.ts`),
  ]);
  const columns = Math.ceil(Math.sqrt(count));
  const size = cssSize <= 64 ? 64 : cssSize <= 128 ? 128 : 320;
  const stage = document.createElement('canvas');
  stage.style.cssText = `position:fixed;left:0;top:0;width:${columns * size}px;height:${Math.ceil(count / columns) * size}px;opacity:0;pointer-events:none`;
  document.body.append(stage);
  const layer = document.createElement('div');
  layer.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px';
  document.body.append(layer);
  const canvases = Array.from({ length: count }, () => {
    const canvas = document.createElement('canvas');
    canvas.style.width = canvas.style.height = `${cssSize}px`;
    canvas.width = canvas.height = Math.round(cssSize * Math.min(devicePixelRatio, 2));
    layer.append(canvas);
    return canvas;
  });
  const contexts = canvases.map((canvas) => canvas.getContext('2d'));
  const scratch = document.createElement('canvas');
  const scratchContext = scratch.getContext('2d', { willReadFrequently: true });
  const pending = new Set(),
    reads = new Set(),
    activeCaptures = new Set(),
    errors = [];
  const metrics = {
    frames: 0,
    completed: 0,
    destinations: 0,
    submissions: 0,
    maxPending: 0,
    captureCallMs: 0,
    captureLatencyMs: 0,
    convertMs: 0,
    putMs: 0,
    drawMs: 0,
    stale: 0,
  };
  let disposed = false,
    epoch = 0,
    callback = () => {},
    captureRequest,
    lastCommit = Promise.resolve(),
    queued = false,
    urgent = false,
    rgba;
  const engine = new AuthoredAvatarEngine(stage, {
    count,
    size,
    preset: 'blue_beret',
    lazyWork: true,
    resolveAsset: createCatalogAssetResolver(createCatalogMotion),
    onError: (error) => errors.push(String(error)),
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
    const catalog =
      index % 2
        ? { shape: 'heart', eyes: 'cyclops', eyewear: 'none', accessory: 'crown' }
        : { shape: 'six_lobed_flower', eyes: 'todd', eyewear: 'monocle', accessory: 'none' };
    const preset =
      kind === 'blue'
        ? 'blue_beret'
        : kind === 'mixed' && index % 10 >= 8
          ? 'catalog:' + JSON.stringify(catalog)
          : presets[index % presets.length];
    await engine.setPreset(index, preset);
    engine.setColor(index, '#' + (0x46719b + index * 10007).toString(16).padStart(6, '0'));
    engine.idle(index);
  }
  const gl = stage.getContext('webgl2');
  const invalidate = engine.invalidate.bind(engine);
  engine.invalidate = (value) => {
    if (pending.size >= 2) {
      queued = true;
      urgent ||= value;
      return;
    }
    invalidate(value);
  };
  const draw = (source, targets = canvases, targetContexts = contexts) => {
    const tile = stage.width / columns;
    for (let index = 0; index < count; index++) {
      const canvas = targets[index],
        context = targetContexts[index];
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(
        source,
        (index % columns) * tile,
        Math.floor(index / columns) * tile,
        tile,
        tile,
        0,
        0,
        canvas.width,
        canvas.height,
      );
    }
  };
  const compare = (a, b) => {
    let changed = 0,
      maxChannel = 0,
      partialAlpha = 0;
    for (let i = 0; i < a.length; i += 4) {
      let different = false;
      for (let channel = 0; channel < 4; channel++) {
        const delta = Math.abs(a[i + channel] - b[i + channel]);
        maxChannel = Math.max(maxChannel, delta);
        different ||= delta !== 0;
      }
      changed += Number(different);
      partialAlpha += Number(a[i + 3] > 0 && a[i + 3] < 255);
    }
    return { pixels: a.length / 4, changed, maxChannel, partialAlpha };
  };
  const finishCapture = async (capture) => {
    if (!capture) return;
    try {
      const cells = [];
      for (let index = 0; index < count; index++) {
        const canvas = canvases[index],
          reference = capture.references[index];
        const expected = reference
          .getContext('2d')
          .getImageData(0, 0, canvas.width, canvas.height).data;
        const actual = contexts[index].getImageData(0, 0, canvas.width, canvas.height).data;
        // Snapshot immediately after actual presentation, before another RAF.
        const png = canvas.toDataURL('image/png'),
          image = new Image();
        image.src = png;
        await image.decode();
        const decoded = document.createElement('canvas');
        decoded.width = image.width;
        decoded.height = image.height;
        const context = decoded.getContext('2d');
        context.drawImage(image, 0, 0);
        cells.push({
          index,
          rgba: compare(expected, actual),
          png: compare(expected, context.getImageData(0, 0, decoded.width, decoded.height).data),
        });
      }
      capture.resolve({
        mode,
        cssSize,
        kind: capture.kind,
        time: capture.time,
        sourceTile: stage.width / columns,
        cells,
        errors: [...errors],
      });
    } catch (error) {
      capture.reject(error);
    }
  };
  callback = () => {
    if (disposed) return;
    metrics.frames++;
    const capture = captureRequest;
    captureRequest = undefined;
    if (capture) {
      capture.references = canvases.map((canvas) => {
        const target = document.createElement('canvas');
        target.width = canvas.width;
        target.height = canvas.height;
        return target;
      });
      draw(
        stage,
        capture.references,
        capture.references.map((canvas) => canvas.getContext('2d')),
      );
    }
    if (mode === 'direct') {
      const start = performance.now();
      draw(stage);
      metrics.drawMs += performance.now() - start;
      metrics.completed++;
      metrics.destinations += count;
      void finishCapture(capture);
      return;
    }
    if (pending.size >= 2) throw Error('PBO presenter exceeded its pending budget');
    const width = stage.width,
      height = stage.height,
      generation = epoch,
      started = performance.now();
    // The WebGL default framebuffer is valid only within this presentation turn.
    const read = readPixelsAsync(gl, null, 0, 0, width, height);
    metrics.captureCallMs += performance.now() - started;
    metrics.submissions++;
    reads.add(read);
    const previous = lastCommit;
    let task;
    task = read.promise
      .then(async (pixels) => {
        metrics.captureLatencyMs += performance.now() - started;
        await previous;
        if (disposed || generation !== epoch) {
          metrics.stale++;
          return;
        }
        if (scratch.width !== width || scratch.height !== height) {
          scratch.width = width;
          scratch.height = height;
          rgba = new ImageData(width, height);
        }
        const convertStart = performance.now(),
          target = rgba.data;
        for (let y = 0; y < height; y++) {
          let source = (height - y - 1) * width * 4,
            destination = y * width * 4;
          for (let x = 0; x < width; x++, source += 4, destination += 4) {
            const alpha = pixels[source + 3];
            target[destination + 3] = alpha;
            if (alpha === 255) {
              target[destination] = pixels[source];
              target[destination + 1] = pixels[source + 1];
              target[destination + 2] = pixels[source + 2];
            } else if (alpha === 0) {
              target[destination] = target[destination + 1] = target[destination + 2] = 0;
            } else {
              const scale = 255 / alpha;
              target[destination] = Math.round(pixels[source] * scale);
              target[destination + 1] = Math.round(pixels[source + 1] * scale);
              target[destination + 2] = Math.round(pixels[source + 2] * scale);
            }
          }
        }
        metrics.convertMs += performance.now() - convertStart;
        const putStart = performance.now();
        scratchContext.putImageData(rgba, 0, 0);
        metrics.putMs += performance.now() - putStart;
        const drawStart = performance.now();
        draw(scratch);
        metrics.drawMs += performance.now() - drawStart;
        metrics.completed++;
        metrics.destinations += count;
        void finishCapture(capture);
      })
      .catch((error) => {
        if (!disposed && generation === epoch) {
          errors.push(String(error));
          capture?.reject(error);
        }
      })
      .finally(() => {
        reads.delete(read);
        pending.delete(task);
        if (queued && !disposed && !errors.length) {
          const requested = urgent;
          queued = urgent = false;
          invalidate(requested);
        }
      });
    lastCommit = task;
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
    stage: [stage.width, stage.height],
    backing: canvases.map((canvas) => [canvas.width, canvas.height]),
    contextAttributes: gl.getContextAttributes(),
    ...metrics,
    pending: pending.size,
    deferredFrame: queued,
    reads: reads.size,
    errors: [...errors],
    engine: engine.stats(),
  });
  globalThis.__avatarPBOFixture = {
    read,
    async captureHeld({ kind = 'idle', time = 0.5 } = {}) {
      if (disposed) throw Error('Fixture disposed');
      if (captureRequest) throw Error('Capture already pending');
      engine.setPaused(true);
      await Promise.all(pending);
      if (disposed) throw Error('Fixture disposed');
      if (kind === 'work') await Promise.all(canvases.map((_, index) => engine.prepareWork(index)));
      if (disposed) throw Error('Fixture disposed');
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          if (captureRequest === request) captureRequest = undefined;
          request.reject(
            Error(
              'Held capture timed out: ' +
                JSON.stringify({
                  metrics,
                  pending: pending.size,
                  reads: reads.size,
                  errors,
                  queued,
                  engine: engine.stats(),
                }),
            ),
          );
        }, 60000);
        const request = {
          kind,
          time,
          resolve: (value) => {
            clearTimeout(timer);
            activeCaptures.delete(request);
            resolve(value);
          },
          reject: (error) => {
            clearTimeout(timer);
            activeCaptures.delete(request);
            reject(error);
          },
        };
        captureRequest = request;
        activeCaptures.add(request);
        for (let index = 0; index < count; index++) {
          engine.setWander(index, false);
          engine.setMotionFrame(index, kind, time);
        }
        engine.invalidate(true);
      });
    },
    async sample(duration = 5000) {
      const before = read(),
        start = performance.now();
      let frames = 0,
        last = start,
        maximumGap = 0,
        raf = 0;
      const heartbeat = (timestamp) => {
        frames++;
        maximumGap = Math.max(maximumGap, timestamp - last);
        last = timestamp;
        raf = requestAnimationFrame(heartbeat);
      };
      raf = requestAnimationFrame(heartbeat);
      await new Promise((resolve) => setTimeout(resolve, duration));
      cancelAnimationFrame(raf);
      const elapsed = performance.now() - start;
      return {
        before,
        after: read(),
        elapsed,
        globalRAF: { frames, maximumGap, fps: (frames * 1000) / elapsed },
      };
    },
    pause(value = true) {
      engine.setPaused(value);
    },
    resumeLive() {
      for (let index = 0; index < count; index++) {
        engine.idle(index);
        engine.setWander(index, true);
      }
      engine.setPaused(false);
    },
    async dispose() {
      if (disposed) return;
      disposed = true;
      epoch++;
      for (const capture of activeCaptures) capture.reject(Error('Fixture disposed'));
      captureRequest = undefined;
      engine.setPaused(true);
      engine.invalidate = invalidate;
      for (const read of reads) read.cancel();
      await Promise.all(pending);
      engine.dispose();
      stage.remove();
      layer.remove();
    },
  };
  engine.setPaused(false);
  return read();
}
