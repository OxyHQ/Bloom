import { ENTERING_ANIMATION_DURATION, toastDefaults } from '../toast/constants';
import { toastStore } from '../toast/toast-store';

/**
 * The store is deliberately free of React Native / Reanimated imports, so this
 * suite needs no platform mocks — see the header of `toast/toast-store.ts`.
 */
const flushMicrotasks = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

describe('toastStore', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    toastStore.setConfig({});
  });

  afterEach(() => {
    // The expansion hold is registered by whoever owns hovering, so a test that
    // installs one must not leak it into the next.
    toastStore.setExpansionHold(null);
    toastStore.dismissToast(undefined);
    // Drains the hide-overlay timeout so the next test starts from a clean state.
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('enqueue', () => {
    it('appends toasts in call order and hands back incrementing ids', () => {
      const first = toastStore.addToast({ title: 'first' });
      const second = toastStore.addToast({ title: 'second' });

      expect([first, second]).toEqual([1, 2]);
      expect(toastStore.getSnapshot().toasts.map((t) => t.title)).toEqual([
        'first',
        'second',
      ]);
    });

    it('returns the caller-supplied id instead of a counter value', () => {
      expect(toastStore.addToast({ title: 'x', id: 'my-id' })).toBe('my-id');
      // A supplied id must not burn a counter value.
      expect(toastStore.addToast({ title: 'y' })).toBe(1);
    });

    it('falls back to the counter for an empty-string id', () => {
      expect(toastStore.addToast({ title: 'x', id: '' })).toBe(1);
    });

    it('applies the configured duration, then the default', () => {
      toastStore.setConfig({ duration: 9000 });
      toastStore.addToast({ title: 'configured' });
      expect(toastStore.getSnapshot().toasts[0]?.duration).toBe(9000);

      toastStore.addToast({ title: 'explicit', duration: 100 });
      expect(toastStore.getSnapshot().toasts[1]?.duration).toBe(100);

      toastStore.setConfig({});
      toastStore.addToast({ title: 'default' });
      expect(toastStore.getSnapshot().toasts[2]?.duration).toBe(
        toastDefaults.duration,
      );
    });

    it('leaves the variant absent unless one was asked for', () => {
      toastStore.addToast({ title: 'plain' });
      expect(toastStore.getSnapshot().toasts[0]?.variant).toBeUndefined();

      toastStore.addToast({ title: 'loud', variant: 'error' });
      expect(toastStore.getSnapshot().toasts[1]?.variant).toBe('error');
    });

    it('creates one ref per toast', () => {
      const id = toastStore.addToast({ title: 'x' });
      expect(toastStore.getToastRef(id)).toBeDefined();
      expect(toastStore.getToastRef('nope')).toBeUndefined();
    });

    it('auto-closes after the enter animation plus the duration', () => {
      const onAutoClose = jest.fn();
      toastStore.addToast({ title: 'x', duration: 1000, onAutoClose });

      jest.advanceTimersByTime(ENTERING_ANIMATION_DURATION + 999);
      expect(toastStore.getSnapshot().toasts).toHaveLength(1);

      jest.advanceTimersByTime(1);
      expect(toastStore.getSnapshot().toasts).toHaveLength(0);
      expect(onAutoClose).toHaveBeenCalledWith(1);
    });
  });

  describe('visibleToasts cap', () => {
    it('drops the oldest toast once the cap is exceeded', () => {
      toastStore.setConfig({ visibleToasts: 2 });
      toastStore.addToast({ title: 'a' });
      toastStore.addToast({ title: 'b' });
      toastStore.addToast({ title: 'c' });

      const state = toastStore.getSnapshot();
      expect(state.toasts.map((t) => t.title)).toEqual(['b', 'c']);
      expect([...state.toastsById.keys()]).toEqual([2, 3]);
      expect(state.toastRefs[1]).toBeUndefined();
    });

    it('defaults the cap to toastDefaults.visibleToasts', () => {
      for (let i = 0; i < toastDefaults.visibleToasts + 2; i++) {
        toastStore.addToast({ title: `t${i}` });
      }
      expect(toastStore.getSnapshot().toasts).toHaveLength(
        toastDefaults.visibleToasts,
      );
    });

    it('stops the evicted toast auto-closing a survivor', () => {
      toastStore.setConfig({ visibleToasts: 1 });
      const onAutoClose = jest.fn();
      toastStore.addToast({ title: 'a', duration: 1000, onAutoClose });
      toastStore.addToast({ title: 'b', duration: 50_000 });

      jest.advanceTimersByTime(ENTERING_ANIMATION_DURATION + 1000);
      expect(onAutoClose).not.toHaveBeenCalled();
      expect(toastStore.getSnapshot().toasts.map((t) => t.title)).toEqual(['b']);
    });

    it('replaces toastHeights when eviction discards a measured height', () => {
      toastStore.setConfig({ visibleToasts: 1 });
      const id = toastStore.addToast({ title: 'a' });
      toastStore.setToastHeight(id, 70);
      const heights = toastStore.getSnapshot().toastHeights;

      toastStore.addToast({ title: 'b' });

      const state = toastStore.getSnapshot();
      expect(state.toastHeights[id]).toBeUndefined();
      expect(state.toastHeights).not.toBe(heights);
    });
  });

  describe('update by id', () => {
    it('updates in place instead of appending', () => {
      toastStore.addToast({ title: 'first' });
      toastStore.addToast({ title: 'pending', id: 'job' });
      toastStore.addToast({ title: 'last' });

      toastStore.addToast({ title: 'done', id: 'job', variant: 'success' });

      const state = toastStore.getSnapshot();
      expect(state.toasts.map((t) => t.title)).toEqual([
        'first',
        'done',
        'last',
      ]);
      expect(state.toastsById.get('job')?.variant).toBe('success');
    });

    it('keeps the same ref across an update', () => {
      const id = toastStore.addToast({ title: 'a', id: 'stable' });
      const ref = toastStore.getToastRef(id);
      toastStore.addToast({ title: 'b', id: 'stable' });
      expect(toastStore.getToastRef(id)).toBe(ref);
    });

    it('restarts the auto-close timer with the updated duration', () => {
      toastStore.addToast({ title: 'a', id: 'job', duration: 1000 });
      jest.advanceTimersByTime(1000);

      toastStore.addToast({ title: 'b', id: 'job', duration: 5000 });

      jest.advanceTimersByTime(ENTERING_ANIMATION_DURATION + 4999);
      expect(toastStore.getSnapshot().toasts).toHaveLength(1);
      jest.advanceTimersByTime(1);
      expect(toastStore.getSnapshot().toasts).toHaveLength(0);
    });

    it("wiggles on every update when autoWiggleOnUpdate is 'always'", () => {
      toastStore.setConfig({ autoWiggleOnUpdate: 'always' });
      const id = toastStore.addToast({ title: 'same', id: 'job' });
      const wiggle = jest.fn();
      const ref = toastStore.getToastRef(id);
      if (ref) ref.current = { wiggle };

      toastStore.addToast({ title: 'same', id: 'job' });
      expect(wiggle).toHaveBeenCalledTimes(1);
    });

    it("wiggles only on a visible change when autoWiggleOnUpdate is 'toast-change'", () => {
      toastStore.setConfig({ autoWiggleOnUpdate: 'toast-change' });
      const id = toastStore.addToast({ title: 'same', id: 'job' });
      const wiggle = jest.fn();
      const ref = toastStore.getToastRef(id);
      if (ref) ref.current = { wiggle };

      toastStore.addToast({ title: 'same', id: 'job' });
      expect(wiggle).not.toHaveBeenCalled();

      toastStore.addToast({ title: 'changed', id: 'job' });
      expect(wiggle).toHaveBeenCalledTimes(1);
    });

    it("never wiggles when autoWiggleOnUpdate is left at 'never'", () => {
      const id = toastStore.addToast({ title: 'a', id: 'job' });
      const wiggle = jest.fn();
      const ref = toastStore.getToastRef(id);
      if (ref) ref.current = { wiggle };

      toastStore.addToast({ title: 'b', id: 'job' });
      expect(wiggle).not.toHaveBeenCalled();
    });
  });

  describe('dismiss', () => {
    it('removes one toast by id and reports the id back', () => {
      const kept = toastStore.addToast({ title: 'keep' });
      const dropped = toastStore.addToast({ title: 'drop' });

      expect(toastStore.dismissToast(dropped)).toBe(dropped);

      const state = toastStore.getSnapshot();
      expect(state.toasts.map((t) => t.id)).toEqual([kept]);
      expect(state.toastsById.has(dropped)).toBe(false);
      expect(state.toastRefs[dropped]).toBeUndefined();
    });

    it('calls onDismiss for a user dismissal and onAutoClose otherwise', () => {
      const onDismiss = jest.fn();
      const onAutoClose = jest.fn();
      const id = toastStore.addToast({ title: 'a', onDismiss, onAutoClose });

      toastStore.dismissToast(id, 'onDismiss');
      expect(onDismiss).toHaveBeenCalledWith(id);
      expect(onAutoClose).not.toHaveBeenCalled();
    });

    it('cancels the auto-close timer of a dismissed toast', () => {
      const onAutoClose = jest.fn();
      const id = toastStore.addToast({ title: 'a', duration: 1000, onAutoClose });
      toastStore.dismissToast(id, 'onDismiss');

      jest.advanceTimersByTime(1_000_000);
      expect(onAutoClose).not.toHaveBeenCalled();
    });

    it('clears everything and resets the counter on dismiss-all', () => {
      const onDismiss = jest.fn();
      toastStore.addToast({ title: 'a', onDismiss });
      toastStore.addToast({ title: 'b', onDismiss });

      expect(toastStore.dismissToast(undefined, 'onDismiss')).toBeUndefined();

      const state = toastStore.getSnapshot();
      expect(state.toasts).toHaveLength(0);
      expect(state.toastsById.size).toBe(0);
      expect(state.toastsCounter).toBe(1);
      expect(state.toastRefs).toEqual({});
      expect(state.toastHeights).toEqual({});
      expect(state.isExpanded).toBe(false);
      expect(onDismiss).toHaveBeenCalledTimes(2);
    });

    it('stops pending auto-closes on dismiss-all', () => {
      const onAutoClose = jest.fn();
      toastStore.addToast({ title: 'a', duration: 1000, onAutoClose });
      toastStore.dismissToast(undefined, 'onDismiss');

      jest.advanceTimersByTime(1_000_000);
      expect(onAutoClose).not.toHaveBeenCalled();
    });

    it('dismissing an unknown id leaves the queue untouched', () => {
      toastStore.addToast({ title: 'a' });
      expect(toastStore.dismissToast('ghost')).toBe('ghost');
      expect(toastStore.getSnapshot().toasts).toHaveLength(1);
    });
  });

  describe('shouldShowOverlay', () => {
    it('turns on with the first toast and off only after the exit animation', () => {
      expect(toastStore.getSnapshot().shouldShowOverlay).toBe(false);

      const id = toastStore.addToast({ title: 'a' });
      expect(toastStore.getSnapshot().shouldShowOverlay).toBe(true);

      toastStore.dismissToast(id, 'onDismiss');
      // Still on — the row is mid-exit.
      expect(toastStore.getSnapshot().shouldShowOverlay).toBe(true);

      jest.advanceTimersByTime(ENTERING_ANIMATION_DURATION - 1);
      expect(toastStore.getSnapshot().shouldShowOverlay).toBe(true);

      jest.advanceTimersByTime(1);
      expect(toastStore.getSnapshot().shouldShowOverlay).toBe(false);
    });

    it('stays on while other toasts remain', () => {
      const first = toastStore.addToast({ title: 'a' });
      toastStore.addToast({ title: 'b' });

      toastStore.dismissToast(first, 'onDismiss');
      jest.advanceTimersByTime(ENTERING_ANIMATION_DURATION * 2);

      expect(toastStore.getSnapshot().shouldShowOverlay).toBe(true);
    });

    it('cancels a scheduled hide when a new toast arrives first', () => {
      const id = toastStore.addToast({ title: 'a' });
      toastStore.dismissToast(id, 'onDismiss');

      toastStore.addToast({ title: 'b' });
      jest.advanceTimersByTime(ENTERING_ANIMATION_DURATION * 2);

      expect(toastStore.getSnapshot().shouldShowOverlay).toBe(true);
    });
  });

  /**
   * Row offsets are recomputed in React from `toastHeights` (see
   * `use-toast-position.ts`), so a mutation MUST produce a new object or the
   * recompute never happens and the stack overlaps itself. This replaces the
   * hand-rolled `toastHeightsVersion` counter upstream needs for its worklet.
   */
  describe('toastHeights identity', () => {
    it('replaces the object on every height mutation', () => {
      const id = toastStore.addToast({ title: 'a' });
      const initial = toastStore.getSnapshot().toastHeights;

      toastStore.setToastHeight(id, 70);
      const afterFirst = toastStore.getSnapshot().toastHeights;
      expect(afterFirst).not.toBe(initial);
      expect(afterFirst[id]).toBe(70);

      toastStore.setToastHeight(id, 84);
      const afterSecond = toastStore.getSnapshot().toastHeights;
      expect(afterSecond).not.toBe(afterFirst);
      expect(afterSecond[id]).toBe(84);
    });

    it('never mutates a previously handed-out object', () => {
      const id = toastStore.addToast({ title: 'a' });
      toastStore.setToastHeight(id, 70);
      const snapshot = toastStore.getSnapshot().toastHeights;

      const second = toastStore.addToast({ title: 'b' });
      toastStore.setToastHeight(second, 40);

      // The object a previous render captured must still read as it did then.
      expect(snapshot[second]).toBeUndefined();
      expect(Object.keys(snapshot)).toEqual([String(id)]);
    });

    it('keeps the same object when the height is unchanged', () => {
      const id = toastStore.addToast({ title: 'a' });
      toastStore.setToastHeight(id, 70);
      const heights = toastStore.getSnapshot().toastHeights;

      toastStore.setToastHeight(id, 70);
      expect(toastStore.getSnapshot().toastHeights).toBe(heights);
    });

    it('replaces the object when a dismissal drops a height', () => {
      const id = toastStore.addToast({ title: 'a' });
      toastStore.setToastHeight(id, 70);
      const heights = toastStore.getSnapshot().toastHeights;

      toastStore.dismissToast(id, 'onDismiss');
      expect(toastStore.getSnapshot().toastHeights).not.toBe(heights);
      expect(toastStore.getSnapshot().toastHeights[id]).toBeUndefined();
    });

    it('replaces the object on dismiss-all', () => {
      const id = toastStore.addToast({ title: 'a' });
      toastStore.setToastHeight(id, 70);
      const heights = toastStore.getSnapshot().toastHeights;

      toastStore.dismissToast(undefined, 'onDismiss');
      expect(toastStore.getSnapshot().toastHeights).not.toBe(heights);
      expect(toastStore.getSnapshot().toastHeights).toEqual({});
    });
  });

  describe('promise lifecycle', () => {
    it('starts pending, then swaps in the resolved title', async () => {
      const id = toastStore.addToast({
        title: 'Saving…',
        variant: 'loading',
        promiseOptions: {
          promise: Promise.resolve('Saved'),
          loading: 'Saving…',
          error: 'Failed',
        },
      });

      expect(toastStore.getSnapshot().toasts[0]).toMatchObject({
        title: 'Saving…',
        variant: 'loading',
      });

      await flushMicrotasks();

      const settled = toastStore.getSnapshot().toastsById.get(id);
      expect(settled).toMatchObject({ title: 'Saved', variant: 'success' });
      expect(settled?.promiseOptions).toBeUndefined();
      expect(toastStore.getSnapshot().toasts).toHaveLength(1);
    });

    it('swaps in the rejected title from an error formatter', async () => {
      const id = toastStore.addToast({
        title: 'Saving…',
        variant: 'loading',
        promiseOptions: {
          promise: Promise.reject(new Error('offline')),
          loading: 'Saving…',
          error: (error: unknown) =>
            `Failed: ${error instanceof Error ? error.message : 'unknown'}`,
        },
      });

      await flushMicrotasks();

      expect(toastStore.getSnapshot().toastsById.get(id)).toMatchObject({
        title: 'Failed: offline',
        variant: 'error',
      });
    });

    it('accepts a plain string as the rejected title', async () => {
      const id = toastStore.addToast({
        title: 'Saving…',
        variant: 'loading',
        promiseOptions: {
          promise: Promise.reject(new Error('offline')),
          loading: 'Saving…',
          error: 'Could not save',
        },
      });

      await flushMicrotasks();

      expect(toastStore.getSnapshot().toastsById.get(id)?.title).toBe(
        'Could not save',
      );
    });

    it('does not auto-close while the promise is pending', () => {
      let resolvePromise: ((value: string) => void) | undefined;
      toastStore.addToast({
        title: 'Saving…',
        duration: 1000,
        promiseOptions: {
          promise: new Promise<string>((resolve) => {
            resolvePromise = resolve;
          }),
          loading: 'Saving…',
          error: 'Failed',
        },
      });

      jest.advanceTimersByTime(1_000_000);
      expect(toastStore.getSnapshot().toasts).toHaveLength(1);
      resolvePromise?.('Saved');
    });

    it('auto-closes once the promise has settled', async () => {
      toastStore.addToast({
        title: 'Saving…',
        duration: 1000,
        promiseOptions: {
          promise: Promise.resolve('Saved'),
          loading: 'Saving…',
          error: 'Failed',
        },
      });

      await flushMicrotasks();
      jest.advanceTimersByTime(ENTERING_ANIMATION_DURATION + 1000);

      expect(toastStore.getSnapshot().toasts).toHaveLength(0);
    });

    it('drops the result of a promise whose toast was already dismissed', async () => {
      const id = toastStore.addToast({
        title: 'Saving…',
        promiseOptions: {
          promise: Promise.resolve('Saved'),
          loading: 'Saving…',
          error: 'Failed',
        },
      });

      toastStore.dismissToast(id, 'onDismiss');
      await flushMicrotasks();

      expect(toastStore.getSnapshot().toasts).toHaveLength(0);
    });

    it('applies the per-phase styles', async () => {
      const loadingStyles = { title: { fontSize: 10 } };
      const successStyles = { title: { fontSize: 20 } };
      const id = toastStore.addToast({
        title: 'Saving…',
        styles: loadingStyles,
        promiseOptions: {
          promise: Promise.resolve('Saved'),
          loading: 'Saving…',
          error: 'Failed',
          styles: { loading: loadingStyles, success: successStyles },
        },
      });

      expect(toastStore.getSnapshot().toastsById.get(id)?.styles).toBe(
        loadingStyles,
      );

      await flushMicrotasks();
      expect(toastStore.getSnapshot().toastsById.get(id)?.styles).toBe(
        successStyles,
      );
    });
  });

  describe('wiggle', () => {
    it('calls the row ref and restarts the auto-close timer', () => {
      const id = toastStore.addToast({ title: 'a', duration: 1000 });
      const wiggle = jest.fn();
      const ref = toastStore.getToastRef(id);
      if (ref) ref.current = { wiggle };

      jest.advanceTimersByTime(1000);
      toastStore.wiggleToast(id);
      expect(wiggle).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(ENTERING_ANIMATION_DURATION + 999);
      expect(toastStore.getSnapshot().toasts).toHaveLength(1);
      jest.advanceTimersByTime(1);
      expect(toastStore.getSnapshot().toasts).toHaveLength(0);
    });

    it('ignores an unknown id', () => {
      expect(() => toastStore.wiggleToast('ghost')).not.toThrow();
    });

    it('never starts a timer for a toast that should stay up forever', () => {
      const id = toastStore.addToast({ title: 'a', duration: Infinity });
      toastStore.wiggleToast(id);

      jest.advanceTimersByTime(1_000_000);
      expect(toastStore.getSnapshot().toasts).toHaveLength(1);
    });
  });

  describe('expand / collapse', () => {
    it('pauses timers while expanded and resumes them on collapse', () => {
      toastStore.addToast({ title: 'a', duration: 1000 });

      toastStore.expand();
      expect(toastStore.getSnapshot().isExpanded).toBe(true);
      jest.advanceTimersByTime(1_000_000);
      expect(toastStore.getSnapshot().toasts).toHaveLength(1);

      toastStore.collapse();
      expect(toastStore.getSnapshot().isExpanded).toBe(false);
      jest.advanceTimersByTime(1000);
      expect(toastStore.getSnapshot().toasts).toHaveLength(0);
    });

    it('ignores a re-expand inside the collapse cooldown', () => {
      toastStore.addToast({ title: 'a' });
      toastStore.expand();
      toastStore.collapse();

      toastStore.toggleExpand();
      expect(toastStore.getSnapshot().isExpanded).toBe(false);

      jest.advanceTimersByTime(100);
      toastStore.toggleExpand();
      expect(toastStore.getSnapshot().isExpanded).toBe(true);
    });

    /**
     * The auto-collapse rule. A lone row renders identically expanded or collapsed
     * (`toast-position-utils.test.ts`: "a single row is unmoved by expansion"), while
     * `isExpanded` keeps every timer paused — so collapsing at one row is invisible
     * and is the only thing that stops that last toast hanging on screen forever.
     * The exception is a stack something is HOLDING open, which on web is a pointer
     * resting on it.
     */
    it('auto-collapses once only one toast is left', () => {
      const first = toastStore.addToast({ title: 'a' });
      toastStore.addToast({ title: 'b' });
      toastStore.expand();

      toastStore.dismissToast(first, 'onDismiss');
      expect(toastStore.getSnapshot().isExpanded).toBe(false);
    });

    it('resumes the surviving toast on that auto-collapse, so it cannot hang', () => {
      const first = toastStore.addToast({ title: 'a', duration: 1000 });
      toastStore.addToast({ title: 'b', duration: 1000 });
      toastStore.expand();

      toastStore.dismissToast(first, 'onDismiss');
      jest.advanceTimersByTime(ENTERING_ANIMATION_DURATION + 1000);

      expect(toastStore.getSnapshot().toasts).toHaveLength(0);
    });

    it('stays expanded while more than one toast is left', () => {
      const first = toastStore.addToast({ title: 'a' });
      toastStore.addToast({ title: 'b' });
      toastStore.addToast({ title: 'c' });
      toastStore.expand();

      toastStore.dismissToast(first, 'onDismiss');
      expect(toastStore.getSnapshot().isExpanded).toBe(true);
    });

    it('does not auto-collapse a stack something is holding open', () => {
      toastStore.setExpansionHold(() => true);
      const first = toastStore.addToast({ title: 'a', duration: 1000 });
      toastStore.addToast({ title: 'b', duration: 1000 });
      toastStore.expand();

      toastStore.dismissToast(first, 'onDismiss');

      expect(toastStore.getSnapshot().isExpanded).toBe(true);
      // Still paused: resuming here is what would let a hovered toast expire under
      // the cursor.
      jest.advanceTimersByTime(1_000_000);
      expect(toastStore.getSnapshot().toasts).toHaveLength(1);
    });

    it('resets an EMPTY stack even while held', () => {
      // Nothing can hold open a stack that no longer exists, and once the rows
      // unmount no `pointerleave` ever arrives to release the hold — so this must
      // not depend on it.
      toastStore.setExpansionHold(() => true);
      const only = toastStore.addToast({ title: 'a' });
      toastStore.expand();

      toastStore.dismissToast(only, 'onDismiss');

      expect(toastStore.getSnapshot().toasts).toHaveLength(0);
      expect(toastStore.getSnapshot().isExpanded).toBe(false);
    });

    it('stops consulting a hold once it is cleared', () => {
      toastStore.setExpansionHold(() => true);
      toastStore.setExpansionHold(null);
      const first = toastStore.addToast({ title: 'a' });
      toastStore.addToast({ title: 'b' });
      toastStore.expand();

      toastStore.dismissToast(first, 'onDismiss');
      expect(toastStore.getSnapshot().isExpanded).toBe(false);
    });
  });

  describe('subscription', () => {
    it('keeps the snapshot referentially stable while nothing changes', () => {
      const snapshot = toastStore.getSnapshot();
      expect(toastStore.getSnapshot()).toBe(snapshot);

      const id = toastStore.addToast({ title: 'a' });
      const afterAdd = toastStore.getSnapshot();
      expect(afterAdd).not.toBe(snapshot);
      expect(toastStore.getSnapshot()).toBe(afterAdd);

      // A no-op height write must not invalidate the snapshot.
      toastStore.setToastHeight(id, 70);
      const afterHeight = toastStore.getSnapshot();
      toastStore.setToastHeight(id, 70);
      expect(toastStore.getSnapshot()).toBe(afterHeight);
    });

    it('notifies subscribers on mutation and stops after unsubscribe', () => {
      const listener = jest.fn();
      const unsubscribe = toastStore.subscribe(listener);

      const id = toastStore.addToast({ title: 'a' });
      expect(listener).toHaveBeenCalledTimes(1);

      toastStore.setToastHeight(id, 70);
      expect(listener).toHaveBeenCalledTimes(2);

      // Unchanged height — no notification.
      toastStore.setToastHeight(id, 70);
      expect(listener).toHaveBeenCalledTimes(2);

      unsubscribe();
      toastStore.addToast({ title: 'b' });
      expect(listener).toHaveBeenCalledTimes(2);
    });
  });
});
