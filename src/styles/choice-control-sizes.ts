import type { TypeScaleVariant } from '../typography';

/**
 * The rungs a checkbox and a radio share, so a form that mixes the two lines up: the box (or
 * dot) and the type of the label and the description under it. Each keeps its own gaps.
 */
export const CHOICE_CONTROL_SIZES = {
  xs: { mark: 12, label: 'caption-1-medium', description: 'caption-1-regular' },
  sm: { mark: 14, label: 'body-2-medium', description: 'body-2-regular' },
  md: { mark: 16, label: 'body-medium', description: 'body-regular' },
  lg: { mark: 20, label: 'headline-medium', description: 'body-regular' },
} as const satisfies Record<
  'xs' | 'sm' | 'md' | 'lg',
  { mark: number; label: TypeScaleVariant; description: TypeScaleVariant }
>;
