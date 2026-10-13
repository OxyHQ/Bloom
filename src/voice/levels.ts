import type { AudioLevels } from './types';

/** Whether `levels` is a plain array rather than a shared value. */
export function isLevelsArray(levels: AudioLevels): levels is readonly number[] {
  return Array.isArray(levels);
}

/**
 * `levels` resampled to `count` bars, each clamped to `0`–`1`. Every bar takes
 * the loudest level of its slice, so shrinking a spectrum never drops a peak; a
 * short array stretches, each level covering several bars. Empty input is
 * silence. A worklet: the frame clock calls it on the UI thread.
 */
export function resampleLevels(levels: readonly number[], count: number): number[] {
  'worklet';
  const out = new Array<number>(count);
  const length = levels.length;
  for (let bar = 0; bar < count; bar++) {
    let peak = 0;
    if (length > 0) {
      const from = Math.floor((bar * length) / count);
      const to = Math.max(from + 1, Math.ceil(((bar + 1) * length) / count));
      for (let i = from; i < to; i++) {
        const level = levels[i];
        if (level !== undefined && level > peak) peak = level;
      }
    }
    out[bar] = Math.min(1, peak);
  }
  return out;
}
