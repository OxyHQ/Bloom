import type { KeyframesValue } from './keyframes';
import type { Timing } from './timing';

/**
 * One playing of keyframes on a box: which frames, with what timing, and
 * whether the box keeps the last frame when they end (a removal does, until
 * its `Presence` drops it) or holds the first while a delay runs
 * (`backwards`), and whether it repeats forever (a loop).
 */
export interface Play {
  /** Each new playing takes a new id, so the same frames can play again. */
  readonly id: number;
  readonly keyframes: KeyframesValue;
  readonly timing: Timing;
  readonly fill: 'none' | 'forwards' | 'backwards';
  /** A loop: the frames play again and again until the playing changes (CSS's `infinite`). */
  readonly repeat?: boolean;
  /**
   * Web: the box holds a material host, so the frames' opacity fades the
   * material's own layers and the content on it, never the box (a faded
   * ancestor flattens the material: AGENTS.rules.md, Material).
   */
  readonly material: boolean;
  readonly onEnd: (() => void) | undefined;
}

/** A transform as both engines take it, in translate → rotate → scale order. */
export type Transform = readonly Record<string, number | string>[];
