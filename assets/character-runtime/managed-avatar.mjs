import { renderBudget } from './render-budget.mjs';
import { characterPixels } from './resolution.mjs';

const snapshots = new Map();
const waiting = new Map();
// Presentation lifetime is independent of the rendering lease. Offscreen and
// paused avatars retain real engine pixels until they need rendering again.
export function createManagedAvatar(canvas, initial, callbacks, factory) {
  let props = initial,
    controller,
    disposed = false,
    ready = false;
  let visible = false,
    hovered = false,
    urgentUntil = 0,
    timer;
  let pendingWork = false,
    pendingReaction = false,
    starting = false;
  let capabilities,
    lastDiagnostics = {},
    cacheKey = '',
    cachedKey = '';
  const still = () =>
    props.portrait ||
    props.paused ||
    props.reduced ||
    props.config.motion === 0;
  const fingerprint = () =>
    JSON.stringify([
      props.config.character,
      props.legacy,
      props.config.lookAt,
      characterPixels(canvas),
    ]);
  const priority = () =>
    pendingWork || pendingReaction || performance.now() < urgentUntil
      ? 3
      : hovered
        ? 2
        : props.interactive
          ? 1
          : 0;
  const refresh = () =>
    lease.update({
      visible: (visible || props.portrait) && !document.hidden,
      still: still(),
      priority: still() ? 0 : priority(),
      interactive: !!props.interactive,
      needsPaint: !ready,
    });
  function promote(duration = 5000) {
    if (still()) return;
    urgentUntil = performance.now() + duration;
    clearTimeout(timer);
    timer = setTimeout(refresh, duration + 1);
    refresh();
  }
  function commands() {
    const state = controller?.diagnostics?.();
    if (disposed || still() || !ready || !state?.ready || state.pending) return;
    if (pendingWork)
      promote(
        2500 * Math.max(1, Math.min(10, props.workingCycles || 1)) + 1000,
      );
    else if (pendingReaction) promote();
    if (pendingWork) {
      pendingWork = false;
      controller.work?.();
    }
    if (pendingReaction) {
      pendingReaction = false;
      controller.react?.();
    }
  }
  const lease = renderBudget.register({
    async start() {
      starting = true;
      try {
        const created = await factory(canvas, props, {
          onCapabilities(value) {
            if (disposed) return;
            capabilities = value;
            callbacks.onCapabilities?.(value);
          },
          onError(error) {
            if (!disposed) lease.fail(error);
          },
          onReady() {
            if (!disposed) queueMicrotask(commands);
          },
          onPaint(settled = true) {
            if (disposed || !settled) return;
            if (!ready) {
              ready = true;
              lease.painted();
              callbacks.onReady?.();
            }
            if (cachedKey !== cacheKey) {
              const image = document.createElement('canvas');
              image.width = canvas.width;
              image.height = canvas.height;
              image.getContext('2d').drawImage(canvas, 0, 0);
              snapshots.delete(cacheKey);
              snapshots.set(cacheKey, { image, capabilities });
              if (snapshots.size > 64)
                snapshots.delete(snapshots.keys().next().value);
              cachedKey = cacheKey;
              for (const receive of waiting.get(cacheKey) ?? []) receive();
            }
            callbacks.onPaint?.();
            // Scope replacements and in-place edits may settle without another
            // onReady event. Deliver retained commands only after their paint.
            if (pendingWork || pendingReaction) queueMicrotask(commands);
          },
        });
        controller = created;
        if (!disposed) callbacks.onPreparationStart?.();
        created.update(props, true);
        return created;
      } finally {
        starting = false;
      }
    },
    suspend(value) {
      lastDiagnostics = value.diagnostics?.() ?? lastDiagnostics;
      value.dispose();
      if (controller === value) controller = undefined;
    },
    error(error) {
      if (!disposed) callbacks.onError?.(error);
    },
  });
  function paintSnapshot() {
    if (disposed || ready || controller || starting) return;
    const saved = snapshots.get(cacheKey);
    if (!saved) return;
    canvas.width = saved.image.width;
    canvas.height = saved.image.height;
    canvas.getContext('2d').drawImage(saved.image, 0, 0);
    ready = true;
    cachedKey = cacheKey;
    capabilities = saved.capabilities;
    callbacks.onCapabilities?.(capabilities);
    callbacks.onReady?.();
    callbacks.onPaint?.();
    refresh();
  }
  function unwatch() {
    const watchers = waiting.get(cacheKey);
    watchers?.delete(paintSnapshot);
    if (watchers?.size === 0) waiting.delete(cacheKey);
  }
  function appearance() {
    const next = fingerprint();
    if (next === cacheKey) return;
    unwatch();
    cacheKey = next;
    ready = false;
    if (!waiting.has(cacheKey)) waiting.set(cacheKey, new Set());
    waiting.get(cacheKey).add(paintSnapshot);
    paintSnapshot();
  }
  const update = (next) => {
    if (disposed) return;
    const work =
      next.workingKey !== undefined && next.workingKey !== props.workingKey;
    const reaction =
      next.reactionKey !== undefined && next.reactionKey !== props.reactionKey;
    props = next;
    if (still()) {
      pendingWork = false;
      pendingReaction = false;
    }
    appearance();
    const state = controller?.diagnostics?.();
    const queueCommands = !ready || !state?.ready || !!state.pending;
    if (!still() && (work || reaction)) {
      if (queueCommands) {
        pendingWork ||= work;
        pendingReaction ||= reaction;
      }
      promote(
        work
          ? 2500 * Math.max(1, Math.min(10, props.workingCycles || 1)) + 5000
          : 5000,
      );
    }
    controller?.update(props, queueCommands);
    refresh();
  };
  const enter = () => {
    if (props.interactive) {
      hovered = true;
      refresh();
    }
  };
  const leave = () => {
    hovered = false;
    refresh();
  };
  const down = (event) => {
    if (!props.interactive || event.button !== 0 || !event.isPrimary || still())
      return;
    // Cold surfaces cannot receive the original pointer-down yet. Replay one
    // original reaction once ready; warm surfaces receive their normal events.
    if (!controller || !controller.diagnostics?.()?.ready)
      pendingReaction = true;
    promote();
  };
  canvas.addEventListener('pointerenter', enter);
  canvas.addEventListener('pointerleave', leave);
  canvas.addEventListener('pointerdown', down, true);
  const intersection = new IntersectionObserver((entries) => {
    visible = entries[0]?.isIntersecting === true;
    refresh();
  });
  intersection.observe(canvas);
  const resize = new ResizeObserver(() => {
    appearance();
    refresh();
  });
  resize.observe(canvas);
  document.addEventListener('visibilitychange', refresh);
  appearance();
  refresh();
  return {
    update,
    diagnostics: () => ({
      ...lastDiagnostics,
      ...controller?.diagnostics?.(),
      ready,
      pending: !ready || !!controller?.diagnostics?.()?.pending,
      suspended: !controller,
    }),
    dispose() {
      if (disposed) return;
      disposed = true;
      clearTimeout(timer);
      unwatch();
      intersection.disconnect();
      resize.disconnect();
      canvas.removeEventListener('pointerenter', enter);
      canvas.removeEventListener('pointerleave', leave);
      canvas.removeEventListener('pointerdown', down, true);
      document.removeEventListener('visibilitychange', refresh);
      lease.dispose();
    },
  };
}
export const managedAvatarStats = () => ({
  ...renderBudget.stats(),
  snapshots: snapshots.size,
});
