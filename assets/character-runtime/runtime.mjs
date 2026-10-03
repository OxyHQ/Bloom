// Optional renderer adapter. The generated engine and data alongside it remain unmodified.
import { customizeAppearance, encodeAppearance } from './appearance-codec.mjs';
import {
  acquireLegacyEngine,
  legacyEngineStats,
  getCharacterEngine,
  acquireCharacterPreparation,
} from './legacy-engine.mjs';
import { createManagedAvatar, managedAvatarStats } from './managed-avatar.mjs';
import {
  acquireSharedSurface,
  sharedSurfaceStats,
  renderSharedBatchDeferred,
  waitForSharedRender,
  sharedRenderPending,
} from './shared-surface.mjs';
import { characterPixels } from './resolution.mjs';
import { characterRecipe, authoredPartsFor } from './character-recipe.mjs';

let frame = 0;
let rendering = false;
let nextClient = 0;
let lastRenderMilliseconds = 0;
let lastRenderWaitMilliseconds = 0;
let renderCost = 8;
let attentionTurn = false;
const clients = new Set();
const category = { shape: 0, color: 1, eyes: 2, eyewear: 3, accessory: 4 };
function schedule() {
  if (!frame && !rendering && clients.size && !document.hidden)
    frame = requestAnimationFrame(tick);
}
async function tick(time) {
  frame = 0;
  if (document.hidden) return;
  rendering = true;
  try {
    const batch = [...clients];
    const started = performance.now();
    const presentations = [];
    // Await the GPU without blocking the page. Bound CPU work and batch size
    // separately: driver wait time must not collapse every batch to one draw.
    const batchLimit = Math.min(8, Math.max(1, Math.ceil(8 / renderCost)));
    let submittedAt = started,
      presentationCost = 0;
    const touched = [];
    // Preparation is globally serialized by the recovered engine. Its owner
    // must get a chance to commit and paint every frame; waiting behind every
    // resident avatar makes startup latency grow quadratically with the crowd.
    const preparing = batch.find((client) => client.preparing());
    // Give the most recent interaction a responsive cadence, but reserve
    // alternate turns for the round-robin crowd so no avatar is starved.
    const attended = batch
      .filter((client) => client.attention(time) > 0)
      .sort((a, b) => b.attention(time) - a.attention(time))[0];
    const preferred = preparing ?? (attentionTurn ? attended : undefined);
    attentionTurn = !attentionTurn;
    const ordered = preferred ? [preferred] : [];
    for (let i = 0; i < batch.length; i++) {
      const client = batch[(nextClient + i) % batch.length];
      if (client !== preferred) ordered.push(client);
    }
    try {
      await renderSharedBatchDeferred(
        () => {
          for (const client of ordered) {
            if (client !== preferred)
              nextClient = (batch.indexOf(client) + 1) % batch.length;
            // Rate-limit each character, not the whole document. Crowds can use
            // intervening browser frames without forcing every avatar down to 30/N.
            if (
              clients.has(client) &&
              (client === preparing ||
                time - (client.lastTick ?? -Infinity) >= 1000 / 30 - 1)
            ) {
              client.lastTick = time;
              touched.push(client);
              const present = client.render(time / 1000);
              if (present) presentations.push(present);
            }
            // One native render cannot be interrupted, but a crowded page must not
            // submit every remaining avatar after it has spent its frame allowance.
            if (
              presentations.length >= batchLimit ||
              performance.now() - started >= 8
            )
              break;
          }
          submittedAt = performance.now();
        },
        () => {
          const began = performance.now();
          for (const present of presentations) present();
          presentationCost = performance.now() - began;
        },
      );
    } catch (error) {
      // A context-level error cannot be attributed after a shared submission.
      // Discard every pending image and report it to every touched character.
      presentations.length = 0;
      for (const client of touched) {
        try {
          client.fail(error);
        } catch (callbackError) {
          queueMicrotask(() => {
            throw callbackError;
          });
        }
      }
    }
    lastRenderMilliseconds = submittedAt - started + presentationCost;
    lastRenderWaitMilliseconds = Math.max(
      0,
      performance.now() - started - lastRenderMilliseconds,
    );
    if (presentations.length) {
      const measured = lastRenderMilliseconds / presentations.length;
      // React immediately to a slower GPU; recover capacity gradually to avoid
      // alternating huge batches and long blocked browser frames.
      renderCost = Math.max(measured, renderCost * 0.9 + measured * 0.1, 0.1);
    }
  } finally {
    rendering = false;
    schedule();
  }
}
function visibility() {
  for (const client of instances) client.visibility();
  schedule();
}
const instances = new Set();

/** Original engine and shared animation clock; scoped geometry identities stay distinct. */
export async function createAvatar(canvas, initial, callbacks = {}) {
  if (!initial.config.character && !initial.legacy)
    throw new Error('A recovered character recipe is required');
  if (initial.portrait) return createPortrait(canvas, initial, callbacks);
  return createManagedAvatar(canvas, initial, callbacks, createCharacter);
}
function createCharacter(canvas, initial, callbacks) {
  return createScopedCharacter(canvas, initial, callbacks);
}

async function createLiveCharacter(
  canvas,
  initial,
  callbacks = {},
  isCurrent = () => true,
  previousImage = null,
) {
  const authoredParts = authoredPartsFor(initial);
  const lease = initial.legacy?.points
    ? await acquireLegacyEngine(initial.legacy.points, authoredParts)
    : null;
  const module = lease?.module ?? (await getCharacterEngine(authoredParts));
  let releasePreparation = await acquireCharacterPreparation();
  await waitForSharedRender();
  if (!isCurrent() || !canvas.isConnected) {
    releasePreparation();
    lease?.release();
    return { update() {}, dispose() {}, diagnostics: () => ({ ready: false }) };
  }
  const output = canvas.getContext('2d');
  if (!output) {
    releasePreparation();
    lease?.release();
    throw new Error('Character output canvas is unavailable');
  }
  let surfaceLease;
  try {
    surfaceLease = acquireSharedSurface(canvas.parentElement);
  } catch (error) {
    releasePreparation();
    lease?.release();
    throw error;
  }
  const supportsActivities = !initial.portrait;
  let character;
  try {
    character = surfaceLease.create(module, 128, 128, {
      activities: supportsActivities,
    });
  } catch (error) {
    releasePreparation();
    surfaceLease.release();
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
    workRequest = 0,
    stoppingWork = false,
    queuedReaction = false,
    workDuration,
    lastActivityResult,
    previousWork,
    hasWork = false;
  let pointerId, pointerStart, previousReaction;
  let lastReaction = null,
    lastReactionKind = null;
  let attentionStarted = 0,
    attentionUntil = 0;
  const attend = (duration) => {
    attentionStarted = performance.now();
    attentionUntil = attentionStarted + duration;
  };
  // hasPendingUpdate also includes reactions whose clock is suspended while
  // Work owns the character. Geometry completion must use preparation revisions,
  // otherwise that old reaction holds the global preparation lease forever.
  const scenePrepared = () => {
    const state = character.preparationStats();
    return (
      !state.pending &&
      !state.failed &&
      state.generation === state.committedGeneration
    );
  };
  let acquiringPreparation = false;
  const preparationQueue = [];
  function finishPreparation(force = false) {
    if (!force && (acquiringPreparation || preparationQueue.length)) return;
    const release = releasePreparation;
    releasePreparation = undefined;
    release?.();
  }
  function prepare(operation) {
    if (disposed) return;
    if (releasePreparation && !sharedRenderPending()) {
      operation();
      return;
    }
    preparationQueue.push(operation);
    if (acquiringPreparation) return;
    acquiringPreparation = true;
    const admission = releasePreparation
      ? Promise.resolve(releasePreparation)
      : acquireCharacterPreparation();
    void admission.then(async (release) => {
      await waitForSharedRender();
      acquiringPreparation = false;
      if (disposed) {
        preparationQueue.length = 0;
        release();
        return;
      }
      releasePreparation = release;
      try {
        for (const next of preparationQueue.splice(0)) next();
        if (scenePrepared()) finishPreparation();
        wake();
      } catch (error) {
        finishPreparation();
        callbacks.onError?.(error);
      }
    });
  }

  character.setQuality(1); // Resize selects mesh detail using CSS size, independent of DPR.
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
  let wakeQueued = false;
  const wake = () => {
    if (disposed) return;
    if (sharedRenderPending()) {
      if (!wakeQueued) {
        wakeQueued = true;
        void waitForSharedRender().then(() => {
          wakeQueued = false;
          wake();
        });
      }
      return;
    }
    character.setActive(active());
    if (active() && (dirty || !ready || animate())) clients.add(client);
    else clients.delete(client);
    schedule();
  };
  const client = {
    preparing: () => Boolean(releasePreparation),
    attention: (time) => (time < attentionUntil ? attentionStarted : 0),
    visibility: wake,
    fail(error) {
      clients.delete(client);
      finishPreparation(true);
      callbacks.onError?.(error);
    },
    render(time) {
      try {
        const submitted = surfaceLease.render(
          () => character.render(time),
          scenePrepared,
        );
        const renderError = character.renderError();
        if (renderError || character.preparationStats().failed)
          throw new Error(
            renderError ||
              character.preparationError() ||
              'Character preparation failed',
          );
        // Return to pointer/reaction control only after the authored Work outro
        // clears its phase and episode; render skips do not indicate completion.
        if (stoppingWork && module.controllerState(character).settled) {
          stoppingWork = false;
          switchMode(false);
        }
        if (queuedReaction && !activityMode) attemptReaction();
        if (!submitted) return;
        const revision = surfaceLease.revision;
        return () => {
          if (disposed || revision !== surfaceLease.revision) return;
          try {
            if (submitted) {
              if (!fit && scenePrepared()) {
                measurement.width = canvas.width;
                measurement.height = canvas.height;
                surfaceLease.copy(
                  measure,
                  0,
                  0,
                  canvas.width,
                  canvas.height,
                  0,
                  0,
                  canvas.width,
                  canvas.height,
                );
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
                  const extent =
                    Math.max(maxX - minX + 1, maxY - minY + 1) * 1.22;
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
                surfaceLease.copy(
                  output,
                  fit[0],
                  fit[1],
                  fit[2],
                  fit[2],
                  0,
                  0,
                  canvas.width,
                  canvas.height,
                );
              else surfaceLease.copy(output);
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
            if (
              submitted &&
              fit &&
              scenePrepared() &&
              fingerprint === pendingFingerprint
            ) {
              dirty = false;
              finishPreparation();
              if (!ready) {
                ready = true;
                callbacks.onReady?.();
              }
              callbacks.onPaint?.(!transitionImage);
              if (activityMode && workDuration && !workTimer) {
                const request = workRequest;
                workTimer = setTimeout(() => {
                  if (request !== workRequest) return;
                  workTimer = undefined;
                  workDuration = undefined;
                  prepare(() => {
                    if (request !== workRequest) return;
                    play(0);
                    stoppingWork = true;
                  });
                  dirty = true;
                  wake();
                }, workDuration);
              }
              if (!animate()) clients.delete(client);
            }
          } catch (error) {
            clients.delete(client);
            finishPreparation();
            callbacks.onError?.(error);
          }
        };
      } catch (error) {
        clients.delete(client);
        finishPreparation();
        callbacks.onError?.(error);
      }
    },
  };
  let currentQuality, currentScale;
  const resize = () => {
    const cssSize = Math.max(
      1,
      Math.min(canvas.clientWidth, canvas.clientHeight),
    );
    const backingSize = characterPixels(canvas);
    if (
      canvas.width === backingSize &&
      canvas.height === backingSize &&
      currentQuality === (props.portrait || cssSize <= 128 ? 1 : 2) &&
      currentScale === backingSize / cssSize
    )
      return;
    prepare(() => {
      const css = Math.max(
        1,
        Math.min(canvas.clientWidth, canvas.clientHeight),
      );
      const pixels = characterPixels(canvas);
      if (canvas.width !== pixels || canvas.height !== pixels) {
        canvas.width = pixels;
        canvas.height = pixels;
        fit = null;
      }
      const quality = props.portrait || css <= 128 ? 1 : 2;
      if (currentQuality !== quality) {
        character.setQuality(quality);
        currentQuality = quality;
      }
      character.resize(pixels, pixels);
      if (currentScale !== pixels / css) {
        character.setDisplayScale(pixels / css);
        currentScale = pixels / css;
      }
      dirty = true;
      wake();
    });
  };
  const bindController = (next = false) => {
    if (!supportsActivities) return;
    const result = character.applyActivity({
      command: 3,
      sequence: 0n,
      episodeId: 0n,
      episodeHighWater: 0n,
      activity: 0,
      outcome: 0,
      entry: 1,
    });
    if (result !== 0)
      throw new Error(`Character activity initialization failed: ${result}`);
    module.controllerMode(character, next);
  };
  const switchMode = (next, resetAppearance = false) => {
    if (resetAppearance) {
      // Only a frozen appearance edit needs a new native scene: the original
      // appearance blend otherwise stops on its first frame. React/Work never
      // enter this branch and keep their character, preparation, clock and fit.
      const state = new Uint8Array(character.state());
      character.delete();
      character = surfaceLease.create(module, 128, 128, {
        activities: supportsActivities,
      });
      currentQuality = currentScale = undefined;
      sequence = episode = 0n;
      activity = 0;
      character.setQuality(1);
      character.restore(state);
      character.setReducedMotion(false);
      bindController(next);
      resize();
    } else {
      if (activityMode === next) return;
      surfaceLease.beginTransition(180);
      module.controllerMode(character, next);
    }
    activityMode = next;
    dirty = true;
  };
  const attemptReaction = () => {
    lastReactionKind = 2;
    lastReaction = character.playReaction(lastReactionKind);
    // Named presets retain their signature; edited bodies use the original Wave.
    if (lastReaction === 2) {
      lastReactionKind = 1;
      lastReaction = character.playReaction(lastReactionKind);
    }
    // An interrupted signature resumes its clock on the next reactive render.
    // Keep one latest request queued until that signature releases the controller.
    queuedReaction = lastReaction === 1;
  };
  const react = () => {
    const request = ++workRequest;
    clearTimeout(workTimer);
    workTimer = workDuration = undefined;
    const apply = () => {
      if (disposed || request !== workRequest || !ready || !animate()) return;
      attend(3000);
      queuedReaction = true;
      if (activityMode) {
        play(0);
        stoppingWork = true;
      } else attemptReaction();
      dirty = true;
      wake();
    };
    if (sharedRenderPending()) void waitForSharedRender().then(apply);
    else apply();
  };
  const work = () => {
    // Invalidate an already queued Stop as soon as a new request arrives,
    // including requests made while the previous GPU batch is still in flight.
    const request = ++workRequest;
    clearTimeout(workTimer);
    workTimer = workDuration = undefined;
    prepare(() => {
      if (request !== workRequest || !animate() || !supportsActivities) return;
      queuedReaction = false;
      stoppingWork = false;
      switchMode(true);
      play(1);
      workDuration = 2200 * Math.max(1, Math.min(10, props.workingCycles || 1));
      attend(workDuration + 1000);
    });
  };
  let appearanceTimer, pendingFingerprint, lastCapabilities;
  const reportCapabilities = (available, selected) => {
    lastCapabilities = {
      key: JSON.stringify(
        props.legacy ? characterRecipe(props) : props.config.character,
      ),
      available,
      selected,
    };
    callbacks.onCapabilities?.(lastCapabilities);
  };
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
        const base =
          props.legacy || recipe.preset === 'clippo'
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
        const selected = authoredParts[key] ?? recipe.selections?.[key];
        // Virtual choices replace copied prepared meshes in the worker. The
        // original engine still selects its own valid backing geometry.
        const value =
          key === 'shape' && selected === 'clippo'
            ? 'circle'
            : key === 'eyes' && (selected === 'todd' || selected === 'clippo')
              ? ['oval', 'round_inset', 'dots'].find((id) =>
                  character.isAvailable(category.eyes, id),
                )
              : key === 'accessory' && selected === 'felipe_beret'
                ? character.isAvailable(category.accessory, 'beret')
                  ? 'beret'
                  : 'none'
                : selected;
        if (!value) {
          if (key === 'eyes' && (selected === 'todd' || selected === 'clippo'))
            throw new Error(
              `No compatible fitting reference for ${selected} eyes`,
            );
          continue;
        }
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
      available['shape:clippo'] = true;
      available['eyes:clippo'] = true;
      available['eyes:todd'] = true;
      if (authoredParts.shape) selected.shape = authoredParts.shape;
      available['accessory:felipe_beret'] = true;
      if (
        authoredParts.eyes ||
        (recipe.preset === 'lime_frog' && !recipe.selections?.eyes)
      )
        selected.eyes = authoredParts.eyes ?? 'todd';
      if (
        authoredParts.accessory ||
        (recipe.preset === 'blue_beret' && !recipe.selections?.accessory)
      )
        selected.accessory = 'felipe_beret';
      available['accessory:none'] = true;
      selected.accessory ??= 'none';
      reportCapabilities(available, selected);
      dirty = true;
    }
  };
  let deferredUpdate;
  const update = (next, silent = false) => {
    if (disposed) return;
    if (sharedRenderPending()) {
      const queued = Boolean(deferredUpdate);
      deferredUpdate = [next, silent];
      if (!queued)
        void waitForSharedRender().then(() => {
          const value = deferredUpdate;
          deferredUpdate = undefined;
          if (value && !disposed) update(...value);
        });
      return;
    }
    props = next;
    const recipe = characterRecipe(props);
    const nextFingerprint = JSON.stringify(recipe);
    // Explicitly choosing a preset's default changes its saved recipe, but not
    // its prepared appearance. Re-key the actual capabilities without rebuilding.
    const rawKey = JSON.stringify(
      props.legacy ? recipe : props.config.character,
    );
    if (
      nextFingerprint === fingerprint &&
      lastCapabilities &&
      lastCapabilities.key !== rawKey
    )
      reportCapabilities(lastCapabilities.available, lastCapabilities.selected);
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
            prepare(() => {
              if (pendingFingerprint === nextFingerprint)
                applyAppearance(recipe);
            });
            wake();
          } catch (error) {
            callbacks.onError?.(error);
          }
        }, 80);
      } else
        prepare(() => {
          if (pendingFingerprint === nextFingerprint) applyAppearance(recipe);
        });
    }
    // The recovered engine needs its first appearance rendered with this off.
    // Our scheduler freezes the completed frame instead.
    character.setReducedMotion(false);
    if (
      hasWork &&
      !silent &&
      previousWork !== props.workingKey &&
      props.workingKey !== undefined &&
      animate()
    ) {
      work();
    }
    if (
      hasWork &&
      !silent &&
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
  function input(operation) {
    const apply = () => {
      if (disposed) return;
      try {
        operation();
      } catch (error) {
        client.fail(error);
      }
    };
    if (sharedRenderPending()) void waitForSharedRender().then(apply);
    else apply();
  }
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
      attend(3000);
      pointerStart = [event.clientX, event.clientY];
      pointerId = event.pointerId;
      // Capture while the physical pointer is still down. GPU completion may
      // arrive after pointerup, when setPointerCapture would throw instead.
      canvas.setPointerCapture(pointerId);
    }
    if (pointerId != null && pointerId !== event.pointerId) return;
    if ((phase === 2 || phase === 3) && pointerId !== event.pointerId) return;
    const r = canvas.getBoundingClientRect();
    const localX = (event.clientX - r.left) / r.width,
      localY = (event.clientY - r.top) / r.height;
    const x = fit ? (fit[0] + localX * fit[2]) / canvas.width : localX;
    const y = fit ? (fit[1] + localY * fit[2]) / canvas.height : localY;
    const id = event.pointerId,
      at = performance.now() / 1000;
    const tap =
      phase === 2 &&
      pointerStart &&
      Math.hypot(
        event.clientX - pointerStart[0],
        event.clientY - pointerStart[1],
      ) < 6;
    input(() => {
      if (activityMode && phase === 1) character.setReadyGaze(x, y, at);
      if (!activityMode) character.pointer(phase, id, x, y, at);
      if (tap) react();
      dirty = true;
      wake();
    });
    if (phase === 2 || phase === 3) {
      if (canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
      pointerId = undefined;
      pointerStart = undefined;
    }
  }
  const cancel = () => {
    const id = pointerId;
    pointerId = undefined;
    pointerStart = undefined;
    if (id != null)
      input(() => character.pointer(3, id, 0.5, 0.5, performance.now() / 1000));
  };
  const leave = () => {
    if (pointerId == null)
      input(() => {
        if (activityMode) character.clearReadyGaze(performance.now() / 1000);
        else character.pointer(1, 0, 0.5, 0.5, performance.now() / 1000);
      });
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
    const release = () => {
      character.delete();
      finishPreparation(true);
      surfaceLease.release();
      lease?.release();
    };
    if (sharedRenderPending()) void waitForSharedRender().then(release);
    else release();
    if (!instances.size) {
      document.removeEventListener('visibilitychange', visibility);
      cancelAnimationFrame(frame);
      frame = 0;
    }
  };
  try {
    update(initial);
    resize();
    bindController();
  } catch (error) {
    dispose();
    throw error;
  }
  return {
    update,
    dispose,
    react,
    work,
    diagnostics: () => ({
      lastReaction,
      lastReactionKind,
      lastActivityResult,
      activityMode,
      stoppingWork,
      queuedReaction,
      ready,
      pending:
        dirty ||
        acquiringPreparation ||
        preparationQueue.length > 0 ||
        !scenePrepared(),
    }),
  };
}

// A geometry cache must never serve a different silhouette under the same
// appearance key. Keep the old painted image while replacing the scoped character.
async function createScopedCharacter(canvas, initial, callbacks) {
  let controller,
    shapeKey,
    revision = 0,
    disposed = false,
    latest = initial;
  const update = async (next, silent = false) => {
    if (disposed) return;
    latest = next;
    const key = JSON.stringify([
      next.legacy?.points ?? null,
      authoredPartsFor(next),
    ]);
    if (shapeKey === key) {
      controller?.update(next, silent);
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
      controller.update(latest, true);
    } catch (error) {
      if (!current()) return;
      shapeKey = undefined;
      throw error;
    }
  };
  await update(initial);
  return {
    update(next, silent = false) {
      void update(next, silent).catch((error) => {
        if (!disposed) callbacks.onError?.(error);
      });
    },
    dispose() {
      disposed = true;
      ++revision;
      controller?.dispose();
    },
    react: () => controller?.react(),
    work: () => controller?.work(),
    diagnostics: () =>
      controller?.diagnostics() ?? { ready: false, pending: !disposed },
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
    const pixels = characterPixels(canvas);
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
        controller = await createManagedAvatar(
          canvas,
          { ...props, paused: true, interactive: false },
          {
            onPreparationStart() {
              if (finished || !current()) return;
              // Waiting for another avatar's preparation is not engine work.
              // Start the deadline only after this controller is constructed.
              timer = setTimeout(() => {
                if (current())
                  callbacks.onError?.(
                    new Error('Character preview preparation timed out'),
                  );
                finish();
              }, 20000);
            },
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
          createCharacter,
        );
        if (finished || !current()) {
          controller.dispose();
          finish();
        }
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
    renderMilliseconds: lastRenderMilliseconds,
    renderWaitMilliseconds: lastRenderWaitMilliseconds,
    budget: managedAvatarStats(),
    surface: sharedSurfaceStats(),
    instances: instances.size,
    active: clients.size,
    scheduled: !!frame || rendering,
    cachedPortraits: portraits.size,
    legacy: legacyEngineStats(),
  };
}
