import { useMemo } from 'react';

import { withAlpha } from './color-utils';
import type { Theme } from './types';
import { useTheme } from './use-theme';

/**
 * The four levels of label ink, as a desktop's chrome draws its text: the
 * theme's own ink (`colors.text`) at four alphas, so each level reads the same
 * on every surface it lands on, because it is composited over that surface
 * rather than chosen against one.
 *
 * | Level        | Alpha | For                                                   |
 * |--------------|-------|-------------------------------------------------------|
 * | `label`      | 1     | what a person reads first: titles, rows, values       |
 * | `secondary`  | 0.65  | what qualifies it: a subtitle, a shortcut, a caption  |
 * | `tertiary`   | 0.42  | what can be passed over: a placeholder, a disabled row |
 * | `quaternary` | 0.18  | not text: a separator, a hairline, a quiet fill       |
 *
 * `secondary` holds 4.5:1 against the page and every surface rung in both
 * modes (`label-colors.test.ts`), so it carries body text. `tertiary` is not
 * for anything a person has to read to act: it is where a disabled row and a
 * placeholder sit, below the text beside them. `quaternary` is never text.
 *
 * `colors.textTertiary` stays the quiet TEXT colour every family already uses
 * (one AA-legible role, `build-theme.ts`); these are the label levels a
 * desktop's chrome is drawn in, and `tertiary` is the level below it.
 */
export interface LabelColors {
  label: string;
  secondary: string;
  tertiary: string;
  quaternary: string;
}

/** The alpha of each level, the one place they are set. */
export const LABEL_ALPHA = {
  label: 1,
  secondary: 0.65,
  tertiary: 0.42,
  quaternary: 0.18,
} as const;

export function resolveLabelColors(theme: Pick<Theme, 'colors'>): LabelColors {
  const ink = theme.colors.text;
  return {
    label: ink,
    secondary: withAlpha(ink, LABEL_ALPHA.secondary),
    tertiary: withAlpha(ink, LABEL_ALPHA.tertiary),
    quaternary: withAlpha(ink, LABEL_ALPHA.quaternary),
  };
}

/** {@link resolveLabelColors} for the current theme. */
export function useLabelColors(): LabelColors {
  const theme = useTheme();
  return useMemo(() => resolveLabelColors(theme), [theme]);
}
