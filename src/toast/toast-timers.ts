/**
 * Derived from sonner-native v0.26.4 — src/toast-store.ts:78-154
 * (MIT © Gunnar Torfi Steinarsson). See the top-level NOTICE.
 *
 * Upstream keeps auto-close timers inside the store's React state even though no
 * renderer ever reads them. Extracting them keeps the store's snapshot free of
 * mutable side-channel data and makes the timing rules testable on their own.
 */
import { ENTERING_ANIMATION_DURATION } from './constants';

type ToastTimer = {
  timeout: ReturnType<typeof setTimeout>;
  startTime: number;
  remainingTime: number;
  isPaused: boolean;
  onComplete: () => void;
};

/**
 * A toast resumed after the app came back to the foreground always gets at least
 * this long on screen — whatever was left of its duration when it was paused is
 * usually too short to read on re-entry.
 */
const MIN_RESUMED_DURATION = 1000;

export class ToastTimerRegistry {
  private timers = new Map<string | number, ToastTimer>();

  /**
   * Non-finite durations (`Infinity`, `NaN`) mean "never auto-close" — starting a
   * timer for them would either be pointless or fire immediately.
   */
  start = ({
    id,
    duration,
    onComplete,
  }: {
    id: string | number;
    duration: number;
    onComplete: () => void;
  }) => {
    if (!Number.isFinite(duration)) {
      return;
    }

    this.clear(id);

    // The toast is not fully on screen until the enter animation lands, so the
    // readable duration starts there.
    const timeout = setTimeout(() => {
      this.timers.delete(id);
      onComplete();
    }, ENTERING_ANIMATION_DURATION + duration);

    this.timers.set(id, {
      timeout,
      startTime: Date.now(),
      remainingTime: duration,
      isPaused: false,
      onComplete,
    });
  };

  clear = (id: string | number) => {
    const timer = this.timers.get(id);
    if (!timer) {
      return;
    }
    clearTimeout(timer.timeout);
    this.timers.delete(id);
  };

  clearAll = () => {
    for (const timer of this.timers.values()) {
      clearTimeout(timer.timeout);
    }
    this.timers.clear();
  };

  /**
   * Banks the time left. The enter animation's head start is intentionally not
   * subtracted, so a paused toast keeps up to `ENTERING_ANIMATION_DURATION` of
   * slack — the same as upstream.
   */
  pause = (id: string | number) => {
    const timer = this.timers.get(id);
    if (!timer || timer.isPaused) {
      return;
    }
    clearTimeout(timer.timeout);
    timer.remainingTime = timer.remainingTime - (Date.now() - timer.startTime);
    timer.isPaused = true;
  };

  resume = (id: string | number) => {
    const timer = this.timers.get(id);
    if (!timer || !timer.isPaused) {
      return;
    }

    const { onComplete } = timer;
    timer.isPaused = false;
    timer.startTime = Date.now();
    timer.timeout = setTimeout(
      () => {
        this.timers.delete(id);
        onComplete();
      },
      Math.max(timer.remainingTime, MIN_RESUMED_DURATION),
    );
  };

  pauseAll = () => {
    for (const id of [...this.timers.keys()]) {
      this.pause(id);
    }
  };

  resumeAll = () => {
    for (const id of [...this.timers.keys()]) {
      this.resume(id);
    }
  };
}
