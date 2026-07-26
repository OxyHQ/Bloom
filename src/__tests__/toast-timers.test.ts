import { ToastTimerRegistry } from '../toast/toast-timers';
import { ENTERING_ANIMATION_DURATION } from '../toast/constants';

describe('ToastTimerRegistry', () => {
  let timers: ToastTimerRegistry;

  beforeEach(() => {
    jest.useFakeTimers();
    timers = new ToastTimerRegistry();
  });

  afterEach(() => {
    timers.clearAll();
    jest.useRealTimers();
  });

  it('fires after the enter animation plus the duration', () => {
    const onComplete = jest.fn();
    timers.start({ id: 1, duration: 4000, onComplete });

    jest.advanceTimersByTime(ENTERING_ANIMATION_DURATION + 3999);
    expect(onComplete).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('never starts a timer for a non-finite duration', () => {
    const onComplete = jest.fn();
    timers.start({ id: 'infinite', duration: Infinity, onComplete });
    timers.start({ id: 'nan', duration: Number.NaN, onComplete });

    jest.advanceTimersByTime(1_000_000);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('clear stops a pending timer', () => {
    const onComplete = jest.fn();
    timers.start({ id: 1, duration: 1000, onComplete });
    timers.clear(1);

    jest.advanceTimersByTime(1_000_000);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('clearAll stops every pending timer', () => {
    const first = jest.fn();
    const second = jest.fn();
    timers.start({ id: 'a', duration: 1000, onComplete: first });
    timers.start({ id: 'b', duration: 1000, onComplete: second });

    timers.clearAll();
    jest.advanceTimersByTime(1_000_000);

    expect(first).not.toHaveBeenCalled();
    expect(second).not.toHaveBeenCalled();
  });

  it('restarting an id replaces the previous timer instead of stacking one', () => {
    const onComplete = jest.fn();
    timers.start({ id: 1, duration: 1000, onComplete });
    jest.advanceTimersByTime(500);
    timers.start({ id: 1, duration: 1000, onComplete });

    jest.advanceTimersByTime(1_000_000);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('pause banks the remaining time and resume runs only that remainder', () => {
    const onComplete = jest.fn();
    timers.start({ id: 1, duration: 4000, onComplete });

    jest.advanceTimersByTime(1000);
    timers.pause(1);

    // Paused timers must survive an arbitrarily long background stint.
    jest.advanceTimersByTime(1_000_000);
    expect(onComplete).not.toHaveBeenCalled();

    timers.resume(1);
    jest.advanceTimersByTime(2999);
    expect(onComplete).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('gives a resumed toast at least one second, however little was left', () => {
    const onComplete = jest.fn();
    timers.start({ id: 1, duration: 4000, onComplete });

    jest.advanceTimersByTime(3900);
    timers.pause(1);
    timers.resume(1);

    jest.advanceTimersByTime(999);
    expect(onComplete).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('pausing twice does not double-subtract the elapsed time', () => {
    const onComplete = jest.fn();
    timers.start({ id: 1, duration: 4000, onComplete });

    jest.advanceTimersByTime(1000);
    timers.pause(1);
    jest.advanceTimersByTime(1000);
    timers.pause(1);

    timers.resume(1);
    jest.advanceTimersByTime(2999);
    expect(onComplete).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('resume is a no-op for an unknown or running timer', () => {
    const onComplete = jest.fn();
    timers.start({ id: 1, duration: 4000, onComplete });

    timers.resume('unknown');
    // Still running (not paused) — resume must not restart the clock.
    timers.resume(1);

    jest.advanceTimersByTime(ENTERING_ANIMATION_DURATION + 4000);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('pauseAll / resumeAll cover every registered timer', () => {
    const first = jest.fn();
    const second = jest.fn();
    timers.start({ id: 'a', duration: 4000, onComplete: first });
    timers.start({ id: 'b', duration: 6000, onComplete: second });

    jest.advanceTimersByTime(1000);
    timers.pauseAll();
    jest.advanceTimersByTime(1_000_000);
    expect(first).not.toHaveBeenCalled();
    expect(second).not.toHaveBeenCalled();

    timers.resumeAll();
    jest.advanceTimersByTime(3000);
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).not.toHaveBeenCalled();

    jest.advanceTimersByTime(2000);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('drops the record once a timer has fired, so resume cannot revive it', () => {
    const onComplete = jest.fn();
    timers.start({ id: 1, duration: 1000, onComplete });
    jest.advanceTimersByTime(ENTERING_ANIMATION_DURATION + 1000);
    expect(onComplete).toHaveBeenCalledTimes(1);

    timers.pause(1);
    timers.resume(1);
    jest.advanceTimersByTime(1_000_000);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
