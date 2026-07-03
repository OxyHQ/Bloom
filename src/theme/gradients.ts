import type { ThemeGradients } from './types';

/**
 * Brand-neutral named linear-gradient palettes shared across the design system —
 * decorative avatar rings, hero surfaces, empty-state art, and similar accents.
 *
 * Each entry lists ordered `[offset, color]` stops where `offset` is a `0–1`
 * position along the gradient axis. These are intentionally theme-agnostic (the
 * same values are exposed in light and dark mode) and not tied to any single
 * app's brand, so components can reference them by a stable, descriptive name.
 */
export const THEME_GRADIENTS: ThemeGradients = {
  sky: {
    values: [
      [0, '#0A7AFF'],
      [1, '#59B9FF'],
    ],
  },
  midnight: {
    values: [
      [0, '#022C5E'],
      [1, '#4079BC'],
    ],
  },
  sunrise: {
    values: [
      [0, '#4E90AE'],
      [0.4, '#AEA3AB'],
      [0.8, '#E6A98F'],
      [1, '#F3A84C'],
    ],
  },
  sunset: {
    values: [
      [0, '#6772AF'],
      [0.6, '#B88BB6'],
      [1, '#FFA6AC'],
    ],
  },
  summer: {
    values: [
      [0, '#FF6A56'],
      [0.3, '#FF9156'],
      [1, '#FFDD87'],
    ],
  },
  nordic: {
    values: [
      [0, '#083367'],
      [1, '#9EE8C1'],
    ],
  },
  bonfire: {
    values: [
      [0, '#203E4E'],
      [0.4, '#755B62'],
      [0.8, '#CD7765'],
      [1, '#EF956E'],
    ],
  },
};
