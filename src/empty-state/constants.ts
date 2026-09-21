import type { TypeScaleVariant } from '../typography/scale';
import type { EmptyStateVariant } from './types';

export interface EmptyStateGeometry {
  /** The bare glyph's box. */
  glyph: number;
  /** `IconCircle`'s rung. `lg` is 52, `xl` is 64. */
  circle: 'lg' | 'xl';
  /** Above and below the block. */
  paddingVertical: number;
  /** Between the mark, the text block, the children, the actions and the footer. */
  gap: number;
  /** Between the title and the description. */
  textGap: number;
  /** How wide the centred text is allowed to run before it wraps. */
  maxWidth: number;
  title: TypeScaleVariant;
  description: TypeScaleVariant;
}

/**
 * The two rungs, written out rather than scaled from one another.
 *
 * `maxWidth` is the number worth defending: the five hand-rolled empties this
 * family replaces used 280, 260, 360, 340 and none, and a line of explanation
 * that runs the full width of a 1440 page is the reason they each picked one.
 * 360 is roughly 60 characters at `body-regular`, which is where a centred
 * paragraph stops needing a second fixation per line; the panel rung is
 * narrower because the panel is.
 */
export const EMPTY_STATE_GEOMETRY: Record<EmptyStateVariant, EmptyStateGeometry> = {
  comfortable: {
    glyph: 32,
    circle: 'xl',
    paddingVertical: 48,
    gap: 16,
    textGap: 6,
    maxWidth: 360,
    title: 'headline-semibold',
    description: 'body-regular',
  },
  compact: {
    glyph: 24,
    circle: 'lg',
    paddingVertical: 24,
    gap: 12,
    textGap: 4,
    maxWidth: 280,
    title: 'body-medium',
    description: 'body-2-regular',
  },
};

/** Between the two actions, in both directions — they wrap on a narrow block. */
export const EMPTY_STATE_ACTION_GAP = 8;
