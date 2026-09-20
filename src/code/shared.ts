import { useEffect, useMemo } from 'react';
import { Platform } from 'react-native';

import {
  ACCENT_TABLE,
  BUTTON_SHADOW,
  colorRamp,
  resolveButtonRamps,
} from '../button/shared';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { oklchToSrgb, srgbToOklch, srgbToRgbString, type Oklch } from '../theme/color-space';
import { parseRgba } from '../theme/color-utils';
import type { Theme } from '../theme/types';
import { useTheme } from '../theme/use-theme';
import type { CodeLinesSize, CodeTokenKind } from './types';

export const IS_WEB = Platform.OS === 'web';

/** `fontFamilies.mono` on web (the CSS variable), the registered face on native. */
export const MONO_FAMILY = IS_WEB ? 'var(--bloom-font-mono)' : 'JetBrains Mono';

/** Canonical card, text, support-chip and status roles; syntax hues retain their data recipe. */
export interface CodePalette {
  isDark: boolean;
  surface: string;
  border: string;
  plain: string;
  punctuation: string;
  string: string;
  keyword: string;
  className: string;
  constant: string;
  lineNumber: string;
  chipBackground: string;
  chipBorder: string;
  chipText: string;
  filename: string;
  addition: string;
  deletion: string;
  confirm: string;
  icon: string;
  iconHover: string;
  controlHover: string;
  ring: string;
  shadow: string;
  inline: string;
}

function toRgb({ l, c, h }: Oklch): string {
  let chroma = c;
  for (let i = 0; i < 24; i++) {
    const rgb = oklchToSrgb({ l, c: chroma, h });
    const back = srgbToOklch(rgb);
    if (Math.abs(back.l - l) < 0.01 && Math.abs(back.c - chroma) < 0.01) return srgbToRgbString(rgb);
    chroma *= 0.9;
  }
  return srgbToRgbString(oklchToSrgb({ l, c: chroma, h }));
}

/** Tailwind `emerald-500` → `lime-500`: the keyword hue keeps this offset from the class-name hue. */
const EMERALD_500: Oklch = { l: 0.696, c: 0.17, h: 162.48 };
const LIME_500: Oklch = { l: 0.768, c: 0.233, h: 130.85 };

function limeFrom(success: string): string {
  const rgba = parseRgba(success);
  if (!rgba) return success;
  const base = srgbToOklch(rgba);
  return toRgb({
    l: Math.min(0.99, Math.max(0.05, base.l + (LIME_500.l - EMERALD_500.l))),
    c: base.c * (LIME_500.c / EMERALD_500.c),
    h: (((base.h + (LIME_500.h - EMERALD_500.h)) % 360) + 360) % 360,
  });
}

export function resolveCodePalette(theme: Theme): CodePalette {
  const { accent } = resolveButtonRamps(theme);
  const success = colorRamp(theme.colors.success, ACCENT_TABLE);
  const dark = theme.isDark;
  const c = theme.colors;
  const page = c.card;
  return {
    isDark: dark,
    surface: page,
    border: c.borderLight,
    plain: c.textSecondary,
    punctuation: c.textTertiary,
    string: c.textSecondary,
    keyword: limeFrom(success[500]),
    className: success[500],
    constant: accent[500],
    lineNumber: c.textTertiary,
    chipBackground: c.secondarySubtle,
    chipBorder: c.borderLight,
    chipText: c.secondarySubtleForeground,
    filename: c.textSecondary,
    addition: c.successSubtleForeground,
    deletion: c.errorSubtleForeground,
    confirm: c.successSubtleForeground,
    icon: c.textSecondary,
    iconHover: c.text,
    controlHover: c.backgroundSecondary,
    ring: c.primary,
    shadow: dark ? BUTTON_SHADOW.dark : BUTTON_SHADOW.light,
    inline: theme.colors.text,
  };
}

export function useCodePalette(): CodePalette {
  const theme = useTheme();
  return useMemo(() => resolveCodePalette(theme), [theme]);
}

export function tokenColor(kind: CodeTokenKind, palette: CodePalette): string {
  switch (kind) {
    case 'keyword':
    case 'operator':
      return palette.keyword;
    case 'string':
    case 'attrValue':
    case 'comment':
      return palette.string;
    case 'punctuation':
      return palette.punctuation;
    case 'className':
      return palette.className;
    case 'constant':
      return palette.constant;
    default:
      return palette.plain;
  }
}

export const LINE_METRICS: Record<CodeLinesSize, { fontSize: number; lineHeight: number; number: number; gap: number }> = {
  sm: { fontSize: 11, lineHeight: 18, number: 12, gap: 12 },
  md: { fontSize: 13, lineHeight: 23, number: 20, gap: 13 },
};

/** `rounded-2xl` — the card. */
export const CARD_RADIUS = 16;
/** How long the copied check stays. */
export const CONFIRM_MS = 1600;

export function dataHook(name: string, value = ''): Record<string, unknown> {
  return IS_WEB ? { dataSet: { [name]: value } } : {};
}

const STYLE_ID = 'bloom-code-web-css';
export const CODE_WEB_CSS = `
[data-bloom-code-scroll] { scrollbar-width: thin; }
[data-bloom-code-copy] {
  outline: none;
  cursor: pointer;
  transition: background-color 150ms ease;
}
[data-bloom-code-copy]:focus-visible { box-shadow: 0 0 0 2px var(--bloom-code-ring); }
[data-bloom-code-number] { user-select: none; -webkit-user-select: none; }
@media (prefers-reduced-motion: reduce) {
  [data-bloom-code-copy] { transition: none; }
}
`;

export function useCodeWebCss(): void {
  useEffect(() => {
    if (IS_WEB) adoptStyleSheet(STYLE_ID, CODE_WEB_CSS);
  }, []);
}
