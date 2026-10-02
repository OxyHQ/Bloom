// Optional renderer adapter. The generated engine and data alongside it remain unmodified.
import createModule from './orbit-characters.mjs';
import { customizeAppearance, encodeAppearance } from './appearance-codec.mjs';
import { acquireLegacyEngine, legacyEngineStats } from './legacy-engine.mjs';

let modulePromise;
let serial = 0;
let frame = 0;
let lastFrame = -Infinity;
const clients = new Set();
const category = { shape: 0, color: 1, eyes: 2, eyewear: 3, accessory: 4 };
function engine() {
  return (modulePromise ??= createModule({
    locateFile: (file) => new URL(file, import.meta.url).href,
  }).catch((error) => {
    modulePromise = undefined;
    throw error;
  }));
}
function schedule() {
  if (!frame && clients.size && !document.hidden)
    frame = requestAnimationFrame(tick);
}
function tick(time) {
  frame = 0;
  if (document.hidden) return;
  if (time - lastFrame >= 1000 / 30 - 1) {
    lastFrame = time;
    for (const client of [...clients]) client.render(time / 1000);
  }
  schedule();
}
function visibility() {
  for (const client of instances) client.visibility();
  schedule();
}
const instances = new Set();

/** Original engine and shared animation clock; contour caches are isolated by legacy-engine. */
export async function createAvatar(canvas, initial, callbacks = {}) {
  if (!initial.config.character && !initial.legacy)
    throw new Error('A recovered character recipe is required');
  if (initial.portrait) return createPortrait(canvas, initial, callbacks);
  if (initial.legacy) return createLegacyCharacter(canvas, initial, callbacks);
  return createLiveCharacter(canvas, initial, callbacks);
}

async function createLiveCharacter(
  canvas,
  initial,
  callbacks = {},
  isCurrent = () => true,
  previousImage = null,
) {
  const lease = initial.legacy?.points
    ? await acquireLegacyEngine(initial.legacy.points)
    : null;
  const module = lease?.module ?? (await engine());
  if (!isCurrent() || !canvas.isConnected) {
    lease?.release();
    return { update() {}, dispose() {}, diagnostics: () => ({ ready: false }) };
  }
  const id = `bloom-character-${++serial}`;
  const output = canvas.getContext('2d');
  if (!output) {
    lease?.release();
    throw new Error('Character output canvas is unavailable');
  }
  const makeSurface = () => {
    const node = document.createElement('canvas');
    node.id = id;
    node.style.display = 'none';
    node.setAttribute('aria-hidden', 'true');
    canvas.parentElement.appendChild(node);
    return node;
  };
  let surface = makeSurface();
  let character;
  try {
    character = new module.Character(`#${id}`, 128, 128);
  } catch (error) {
    surface.remove();
    lease?.release();
    throw error;
  }
  let activityMode = false;
  let props = initial,
    fingerprint = '',
    appliedRecipe,
    ready = false,
    dirty = true,
    visible = true;
  let fit = null,
    transitionStarted;
  let transitionImage = previousImage;
  const measurement = document.createElement('canvas');
  const measure = measurement.getContext('2d', { willReadFrequently: true });
  let disposed = false,
    sequence = 0n,
    episode = 0n,
    activity = 0;
  let workTimer,
    workDuration,
    lastActivityResult,
    previousWork,
    hasWork = false;
  let pointerId, pointerStart, previousReaction;
  let lastReaction = null,
    lastReactionKind = null;
  character.setQuality(initial.portrait ? 1 : 0); // Original automatic quality; compact static thumbnails.
  // Readiness means painted pixels, not merely an engine submission.
  const play = (kind) => {
    if (activity === kind) return;
    const stopping = kind === 0;
    lastActivityResult = character.applyActivity({
      command: stopping ? 2 : 1,
      sequence: ++sequence,
      episodeId: stopping ? episode : ++episode,
      episodeHighWater: 0n,
      activity: stopping ? activity : kind,
      outcome: 0,
      entry: 0,
    });
    activity = kind;
  };
  const animate = () =>
    !props.paused && !props.reduced && props.config.motion !== 0;
  // A queued still must finish if its selector moves it offscreen mid-prepare;
  // otherwise one clipped slot blocks every visible thumbnail until timeout.
  const active = () => (visible || props.portrait) && !document.hidden;
  const wake = () => {
    if (disposed) return;
    character.setActive(active());
    if (active() && (dirty || !ready || animate())) clients.add(client);
    else clients.delete(client);
    schedule();
  };
  const client = {
    visibility: wake,
    render(time) {
      try {
        const submitted = character.render(time);
        if (submitted) {
          if (
            !fit &&
            !character.preparationStats().pending &&
            !character.hasPendingUpdate()
          ) {
            measurement.width = canvas.width;
            measurement.height = canvas.height;
            measure.drawImage(surface, 0, 0, canvas.width, canvas.height);
            const { data, width, height } = measure.getImageData(
              0,
              0,
              canvas.width,
              canvas.height,
            );
            let minX = width,
              minY = height,
              maxX = -1,
              maxY = -1;
            for (let y = 0; y < height; y++)
              for (let x = 0; x < width; x++) {
                if (data[(y * width + x) * 4 + 3] > 24) {
                  minX = Math.min(minX, x);
                  maxX = Math.max(maxX, x);
                  minY = Math.min(minY, y);
                  maxY = Math.max(maxY, y);
                }
              }
            if (maxX >= minX) {
              const extent = Math.max(maxX - minX + 1, maxY - minY + 1) * 1.22;
              fit = [
                (minX + maxX) / 2 - extent / 2,
                (minY + maxY) / 2 - extent / 2,
                extent,
              ];
            }
          }
          // Retain the previous portrait while a changed shape is preparing.
          if (!fit) return;
          output.clearRect(0, 0, canvas.width, canvas.height);
          if (fit)
            output.drawImage(
              surface,
              fit[0],
              fit[1],
              fit[2],
              fit[2],
              0,
              0,
              canvas.width,
              canvas.height,
            );
          else output.drawImage(surface, 0, 0, canvas.width, canvas.height);
        }
        if (submitted && fit && transitionImage) {
          // Geometry preparation keeps the previous image; blend only after the
          // new original-engine surface has pixels. Reduced motion skips it.
          transitionStarted ??= time;
          const progress = animate()
            ? Math.min(1, (time - transitionStarted) / 0.18)
            : 1;
          if (progress < 1) {
            output.globalAlpha = 1 - progress;
            output.drawImage(
              transitionImage,
              0,
              0,
              canvas.width,
              canvas.height,
            );
            output.globalAlpha = 1;
          } else transitionImage = null;
        }
        const renderError = character.renderError();
        if (renderError || character.preparationStats().failed)
          throw new Error(
            renderError ||
              character.preparationError() ||
              'Character preparation failed',
          );
        if (
          submitted &&
          fit &&
          !character.preparationStats().pending &&
          !character.hasPendingUpdate()
        ) {
          dirty = false;
          if (!ready) {
            ready = true;
            callbacks.onReady?.();
          }
          callbacks.onPaint?.();
          if (activityMode && workDuration && !workTimer) {
            workTimer = setTimeout(() => {
              workTimer = undefined;
              workDuration = undefined;
              play(0);
              switchMode(false);
              dirty = true;
              wake();
            }, workDuration);
          }
          if (!animate()) clients.delete(client);
        }
      } catch (error) {
        clients.delete(client);
        callbacks.onError?.(error);
      }
    },
  };
  const resize = () => {
    const css = Math.max(1, Math.min(canvas.clientWidth, canvas.clientHeight));
    const pixels = Math.max(
      64,
      Math.min(512, Math.round(css * Math.min(devicePixelRatio || 1, 2))),
    );
    if (canvas.width !== pixels || canvas.height !== pixels) {
      canvas.width = pixels;
      canvas.height = pixels;
      fit = null;
    }
    character.resize(pixels, pixels);
    character.setDisplayScale(pixels / css);
    dirty = true;
    wake();
  };
  const switchMode = (next, resetAppearance = false) => {
    if (activityMode === next && !resetAppearance) return;
    const state = new Uint8Array(character.state());
    character.delete();
    surface.remove();
    surface = makeSurface();
    character = new module.Character(`#${id}`, 128, 128, { activities: next });
    activityMode = next;
    fit = null;
    sequence = 0n;
    episode = 0n;
    activity = 0;
    ready = false;
    dirty = true;
    character.setQuality(props.portrait ? 1 : 0);
    character.restore(state);
    // This recovered engine paints a transparent frame when reduced motion is
    // enabled before its first appearance. Freeze our clock after a painted
    // frame instead, preserving both initial visibility and reduced motion.
    character.setReducedMotion(false);

    if (next)
      character.applyActivity({
        command: 3,
        sequence: 0n,
        episodeId: 0n,
        episodeHighWater: 0n,
        activity: 0,
        outcome: 0,
        entry: 1,
      });
    resize();
  };
  const react = () => {
    if (!ready || !animate()) return;
    if (activityMode) return;
    lastReactionKind = 2;
    lastReaction = character.playReaction(lastReactionKind);
    // Authored signatures belong to named presets. Catalog edits and migrated
    // bodies use the same engine's Wave when that signature is unsupported.
    if (lastReaction === 2) {
      lastReactionKind = 1;
      lastReaction = character.playReaction(lastReactionKind);
    }
    dirty = true;
    wake();
  };
  let appearanceTimer, pendingFingerprint;
  const applyAppearance = (value) => {
    const recipe = value;
    const nextFingerprint = JSON.stringify(recipe);
    if (nextFingerprint !== fingerprint) {
      // Catalog selection owns the engine's part transitions. Restoring the
      // named preset on every selection needlessly resets the whole character.
      const removedOverride = Object.keys(appliedRecipe?.selections ?? {}).some(
        (key) => !recipe.selections?.[key],
      );
      if (
        !appliedRecipe ||
        recipe.preset !== appliedRecipe.preset ||
        removedOverride ||
        (appliedRecipe.bodyColor && !recipe.bodyColor)
      ) {
        const base = props.legacy
          ? encodeAppearance({
              version: 1,
              shape: 'circle',
              color: 'blue',
              eyes: 'oval',
              eyewear: 'none',
              accessories: [],
              accessoryColors: {},
              constrained: 0,
              depth: 0.5,
              model: null,
              rig: null,
              hereCharacter: null,
            })
          : module.presetAppearance(recipe.preset);
        if (character.restore(base))
          throw new Error('Invalid character appearance');
      }
      for (const key of Object.keys(category)) {
        const value = recipe.selections?.[key];
        if (!value) continue;
        if (key === 'accessory' && value === 'none') {
          for (const item of module.catalog(4))
            if (character.isSelected(4, item.id)) character.select(4, item.id);
          continue;
        }
        if (
          !character.isSelected(category[key], value) &&
          !character.select(category[key], value)
        )
          throw new Error(`Unsupported character selection: ${key}`);
      }
      const patch =
        props.legacy?.patch ??
        (recipe.bodyColor ? { bodyColor: recipe.bodyColor } : null);
      if (patch) {
        // One authored preset uses an unnamed color. Enter the engine's normal
        // editable palette before replacing that paint with an explicit RGB.
        if (
          patch.bodyColor &&
          !module.catalog(1).some((item) => character.isSelected(1, item.id))
        )
          character.select(1, 'yellow');
        // Explicit customization exits a named preset just like the engine's
        // own catalog editor; untouched presets retain their original bytes.
        const customized = customizeAppearance(
          module,
          new Uint8Array(character.state()),
          patch,
          { allowPresetDemotion: true },
        );
        if (character.restore(customized))
          throw new Error('Invalid customized appearance');
      }
      if (
        !appliedRecipe ||
        recipe.preset !== appliedRecipe.preset ||
        ['shape', 'accessory'].some(
          (key) => recipe.selections?.[key] !== appliedRecipe.selections?.[key],
        )
      )
        fit = null;
      // A stopped render loop would freeze the engine's appearance blend at
      // its first frame. Bind the edited state as a fresh appearance instead;
      // retain the visible canvas until the new scene has painted pixels.
      if (ready && !animate()) switchMode(activityMode, true);
      appliedRecipe = structuredClone(recipe);
      fingerprint = nextFingerprint;
      const available = {};
      const selected = {};
      for (const [key, index] of Object.entries(category)) {
        for (const item of module.catalog(index)) {
          available[`${key}:${item.id}`] = character.isAvailable(
            index,
            item.id,
          );
          if (character.isSelected(index, item.id)) selected[key] = item.id;
        }
      }
      available['accessory:none'] = true;
      selected.accessory ??= 'none';
      callbacks.onCapabilities?.({ key: fingerprint, available, selected });
      dirty = true;
    }
  };
  const update = (next) => {
    if (disposed) return;
    props = next;
    const recipe = props.legacy
      ? {
          preset: 'legacy',
          selections: {
            shape: props.legacy.shape ?? 'circle',
            eyes: props.legacy.eyes ?? 'oval',
            ...props.legacy.selections,
          },
          ...props.legacy.patch,
        }
      : props.config.character;
    const nextFingerprint = JSON.stringify(recipe);
    // Dragging the shared color picker may emit dozens of values per second.
    // Prepare only its latest value while retaining the existing painted frame.
    if (pendingFingerprint !== nextFingerprint) {
      clearTimeout(appearanceTimer);
      pendingFingerprint = nextFingerprint;
      if (
        appliedRecipe &&
        recipe.bodyColor &&
        recipe.bodyColor !== appliedRecipe.bodyColor
      ) {
        appearanceTimer = setTimeout(() => {
          if (disposed) return;
          try {
            applyAppearance(recipe);
            wake();
          } catch (error) {
            callbacks.onError?.(error);
          }
        }, 80);
      } else applyAppearance(recipe);
    }
    // The recovered engine needs its first appearance rendered with this off.
    // Our scheduler freezes the completed frame instead.
    character.setReducedMotion(false);
    if (
      hasWork &&
      previousWork !== props.workingKey &&
      props.workingKey !== undefined &&
      animate()
    ) {
      clearTimeout(workTimer);
      switchMode(true);
      play(1);
      workTimer = undefined;
      // Count visible activity time, not time spent preparing its scene.
      workDuration = 2200 * Math.max(1, Math.min(10, props.workingCycles || 1));
    }
    if (
      hasWork &&
      previousReaction !== props.reactionKey &&
      props.reactionKey !== undefined
    )
      react();
    previousReaction = props.reactionKey;
    previousWork = props.workingKey;
    hasWork = true;
    const points = {
      'top-left': [0, 0],
      top: [0.5, 0],
      'top-right': [1, 0],
      left: [0, 0.5],
      center: [0.5, 0.5],
      right: [1, 0.5],
      'bottom-left': [0, 1],
      bottom: [0.5, 1],
      'bottom-right': [1, 1],
    };
    const point = points[props.config.lookAt];
    if (activityMode) {
      if (point) character.setReadyGaze(...point, performance.now() / 1000);
      else character.clearReadyGaze(performance.now() / 1000);
    } else if (point)
      character.pointer(1, 0, ...point, performance.now() / 1000);
    dirty = true;
    wake();
  };
  function pointer(event) {
    if (!props.interactive || !animate()) return;
    const phase = {
      pointerdown: 0,
      pointermove: 1,
      pointerup: 2,
      pointercancel: 3,
    }[event.type];
    if (event.type === 'pointerdown') {
      if (event.button !== 0 || pointerId != null || !event.isPrimary) return;
      pointerStart = [event.clientX, event.clientY];
      pointerId = event.pointerId;
      canvas.setPointerCapture(pointerId);
    }
    if (pointerId != null && pointerId !== event.pointerId) return;
    if ((phase === 2 || phase === 3) && pointerId !== event.pointerId) return;
    const r = canvas.getBoundingClientRect();
    const localX = (event.clientX - r.left) / r.width,
      localY = (event.clientY - r.top) / r.height;
    const x = fit ? (fit[0] + localX * fit[2]) / canvas.width : localX;
    const y = fit ? (fit[1] + localY * fit[2]) / canvas.height : localY;
    if (activityMode && phase === 1)
      character.setReadyGaze(x, y, performance.now() / 1000);
    if (!activityMode)
      character.pointer(phase, event.pointerId, x, y, performance.now() / 1000);
    if (phase === 2 || phase === 3) {
      if (
        phase === 2 &&
        pointerStart &&
        Math.hypot(
          event.clientX - pointerStart[0],
          event.clientY - pointerStart[1],
        ) < 6
      )
        react();
      if (canvas.hasPointerCapture(event.pointerId))
        canvas.releasePointerCapture(event.pointerId);
      pointerId = undefined;
    }
    dirty = true;
    wake();
  }
  const cancel = () => {
    if (pointerId != null)
      character.pointer(3, pointerId, 0.5, 0.5, performance.now() / 1000);
    pointerId = undefined;
    pointerStart = undefined;
  };
  const leave = () => {
    if (pointerId == null) {
      if (activityMode) character.clearReadyGaze(performance.now() / 1000);
      else character.pointer(1, 0, 0.5, 0.5, performance.now() / 1000);
    }
  };
  canvas.addEventListener('lostpointercapture', cancel);
  canvas.addEventListener('pointerleave', leave);
  window.addEventListener('blur', cancel);
  const events = ['pointerdown', 'pointermove', 'pointerup', 'pointercancel'];
  for (const name of events) canvas.addEventListener(name, pointer);
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  const intersection = new IntersectionObserver((entries) => {
    visible = entries[0]?.isIntersecting !== false;
    wake();
  });
  intersection.observe(canvas);
  if (!instances.size)
    document.addEventListener('visibilitychange', visibility);
  instances.add(client);
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    clearTimeout(workTimer);
    clearTimeout(appearanceTimer);
    clients.delete(client);
    instances.delete(client);
    resizeObserver.disconnect();
    intersection.disconnect();
    for (const name of events) canvas.removeEventListener(name, pointer);
    canvas.removeEventListener('lostpointercapture', cancel);
    canvas.removeEventListener('pointerleave', leave);
    window.removeEventListener('blur', cancel);
    character.delete();
    surface.remove();
    lease?.release();
    if (!instances.size) {
      document.removeEventListener('visibilitychange', visibility);
      cancelAnimationFrame(frame);
      frame = 0;
    }
  };
  try {
    update(initial);
    resize();
  } catch (error) {
    dispose();
    throw error;
  }
  return {
    update,
    dispose,
    diagnostics: () => ({
      lastReaction,
      lastReactionKind,
      lastActivityResult,
      activityMode,
      ready,
      pending:
        dirty ||
        Boolean(character.preparationStats().pending) ||
        character.hasPendingUpdate(),
    }),
  };
}

// A geometry cache must never serve a different silhouette under the same
// appearance key. Keep the old painted image while switching contour modules.
async function createLegacyCharacter(canvas, initial, callbacks) {
  let controller,
    shapeKey,
    revision = 0,
    disposed = false,
    latest = initial;
  const update = async (next) => {
    if (disposed) return;
    latest = next;
    const key = JSON.stringify(next.legacy.points ?? null);
    if (shapeKey === key) {
      controller?.update(next);
      return;
    }
    const snapshot = controller?.diagnostics().ready
      ? document.createElement('canvas')
      : null;
    if (snapshot) {
      snapshot.width = canvas.width;
      snapshot.height = canvas.height;
      snapshot.getContext('2d').drawImage(canvas, 0, 0);
    }
    shapeKey = key;
    const generation = ++revision;
    const current = () => !disposed && generation === revision;
    const guardedCallbacks = Object.fromEntries(
      Object.entries(callbacks).map(([name, callback]) => [
        name,
        (...args) => {
          if (current()) callback?.(...args);
        },
      ]),
    );
    controller?.dispose();
    controller = undefined;
    try {
      const created = await createLiveCharacter(
        canvas,
        next,
        guardedCallbacks,
        current,
        snapshot,
      );
      if (!current()) {
        created.dispose();
        return;
      }
      controller = created;
      controller.update(latest);
    } catch (error) {
      if (!current()) return;
      shapeKey = undefined;
      throw error;
    }
  };
  await update(initial);
  return {
    update(next) {
      void update(next).catch((error) => {
        if (!disposed) callbacks.onError?.(error);
      });
    },
    dispose() {
      disposed = true;
      ++revision;
      controller?.dispose();
    },
    diagnostics: () => controller?.diagnostics(),
  };
}

// Thumbnail preparation is serialized: the editor does not keep a WebGL context
// for every shape/eye choice. Completed pixels survive after the engine is freed.
const portraits = new Map();
let portraitQueue = Promise.resolve();
function createPortrait(canvas, initial, callbacks) {
  let disposed = false,
    generation = 0,
    fingerprint = '',
    cancel;
  const update = (props) => {
    if (disposed) return;
    const pixels = Math.max(
      64,
      Math.min(
        512,
        Math.round(
          Math.min(canvas.clientWidth, canvas.clientHeight) *
            Math.min(devicePixelRatio || 1, 2),
        ),
      ),
    );
    const key = JSON.stringify([
      props.config.character,
      props.legacy,
      props.config.lookAt,
      pixels,
    ]);
    if (key === fingerprint) return;
    fingerprint = key;
    const revision = ++generation;
    cancel?.();
    const current = () =>
      !disposed && generation === revision && canvas.isConnected;
    const paintCached = () => {
      const cached = portraits.get(key);
      if (!cached) return false;
      canvas.width = canvas.height = pixels;
      canvas.getContext('2d').drawImage(cached.image, 0, 0, pixels, pixels);
      callbacks.onCapabilities?.(cached.capabilities);
      callbacks.onReady?.();
      return true;
    };
    if (paintCached()) return;
    portraitQueue = portraitQueue.then(async () => {
      if (!current() || paintCached()) return;
      let controller,
        capabilities,
        finished = false,
        timer;
      let complete;
      const completion = new Promise((resolve) => {
        complete = resolve;
      });
      const finish = () => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        controller?.dispose();
        complete();
      };
      cancel = finish;
      try {
        controller = await createLiveCharacter(
          canvas,
          { ...props, paused: true, interactive: false },
          {
            onCapabilities(value) {
              capabilities = value;
              if (current()) callbacks.onCapabilities?.(value);
            },
            onError(error) {
              if (current()) callbacks.onError?.(error);
              queueMicrotask(finish);
            },
            onPaint() {
              if (current() && !finished) {
                const image = document.createElement('canvas');
                image.width = canvas.width;
                image.height = canvas.height;
                image.getContext('2d').drawImage(canvas, 0, 0);
                portraits.set(key, { image, capabilities });
                if (portraits.size > 64)
                  portraits.delete(portraits.keys().next().value);
                callbacks.onReady?.();
              }
              queueMicrotask(finish);
            },
          },
        );
        if (finished || !current()) {
          controller.dispose();
          finish();
        } else
          timer = setTimeout(() => {
            if (current())
              callbacks.onError?.(
                new Error('Character preview preparation timed out'),
              );
            finish();
          }, 20000);
        await completion;
      } catch (error) {
        if (current()) callbacks.onError?.(error);
        finish();
      } finally {
        controller?.dispose();
        if (cancel === finish) cancel = undefined;
      }
    });
  };
  update(initial);
  return {
    update,
    dispose() {
      disposed = true;
      ++generation;
      cancel?.();
    },
  };
}

const registryKey = Symbol.for('bloom.character.runtimes');
(globalThis[registryKey] ??= new Map()).set(import.meta.url, { createAvatar });

/** Diagnostics are read on demand; no DOM/debug updates run on the animation clock. */
export function runtimeStats() {
  return {
    instances: instances.size,
    active: clients.size,
    scheduled: !!frame,
    cachedPortraits: portraits.size,
    legacy: legacyEngineStats(),
  };
}
