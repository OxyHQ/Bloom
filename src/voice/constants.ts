import type { VoiceSize } from './types';

/** Bars drawn when `bars` is not given. */
export const DEFAULT_WAVE_BARS = 24;

/** A bar's thickness, the gap between bars and the height at full level, per size. */
export const WAVE_METRICS: Record<VoiceSize, { bar: number; gap: number; height: number }> = {
  sm: { bar: 3, gap: 2, height: 24 },
  md: { bar: 4, gap: 3, height: 40 },
  lg: { bar: 6, gap: 4, height: 72 },
};

/** Time constant of the ease toward the next level. Short enough to feel live, long enough to read as a wave. */
export const WAVE_SMOOTHING_MS = 90;

/** The overlay's fade in and out. */
export const VOICE_OVERLAY_FADE_MS = 200;
