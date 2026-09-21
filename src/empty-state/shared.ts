/**
 * What an empty state paints, read RELATIVE to the surface it was dropped on
 * (`styles/surface-levels.ts`) rather than from a ramp stop — the same block
 * goes on a page, inside a card and inside a popover, and a glyph picked by eye
 * disappears on one of the three.
 *
 * Pure, so `EmptyState.test.tsx` can walk presets and modes without rendering.
 */
import { surfaceTextOn, type SurfaceTextPaint } from '../styles/surface-levels';
import type { Theme } from '../theme/types';

export type EmptyStatePaint = SurfaceTextPaint;

export function resolveEmptyStatePaint(theme: Theme, surface: string): EmptyStatePaint {
  return surfaceTextOn(theme, surface);
}

/** The announced name: the title, then the explanation, as one utterance. */
export function joinEmptyStateName(
  parts: ReadonlyArray<string | null | undefined>,
): string | undefined {
  const joined = parts
    .filter((part): part is string => typeof part === 'string' && part !== '')
    .join('. ');
  return joined === '' ? undefined : joined;
}
