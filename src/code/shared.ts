import { useEffect, useMemo } from 'react';
import { Platform } from 'react-native';

import {
  ACCENT_TABLE,
  BUTTON_SHADOW,
  colorRamp,
  DANGER_TABLE,
  mixColor,
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

/**
 * What the code family paints from, on Bloom's ramps:
 *
 *   role                    light           dark
 *   card surface            card            neutral-925 (the page)
 *   card border / rules     neutral-200     neutral-800
 *   plain, names            neutral-500     neutral-500
 *   punctuation, numbers    neutral-400     neutral-600
 *   strings, comments       neutral-500     neutral-500
 *   keywords, operators     success-500 turned to lime (Tailwind's emerald → lime offset) (`#7ccf00`)
 *   class names, tags       success-500     success-500   (`#00bc7d`)
 *   constants, numbers      accent-500      accent-500    (`#2b7fff`)
 *   language chip           purple 50 / 100 / 500   purple-950 @50% / 800 / 400
 *   additions / deletions   success-700 / negative-600
 *   copied check            success-500
 *   inline code             text
 *
 * Purple has no theme role, so it keeps Tailwind's offset from `blue-500`,
 * measured from the theme's primary (Tailwind's own value on a blue preset).
 */
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

const BLUE_500: Oklch = { l: 0.623, c: 0.214, h: 259.815 };
const PURPLE: Record<50 | 100 | 400 | 500 | 800 | 950, Oklch> = {
  50: { l: 0.977, c: 0.014, h: 308.299 },
  100: { l: 0.946, c: 0.033, h: 307.174 },
  400: { l: 0.714, c: 0.203, h: 305.504 },
  500: { l: 0.627, c: 0.265, h: 303.9 },
  800: { l: 0.438, c: 0.218, h: 303.724 },
  950: { l: 0.291, c: 0.149, h: 302.717 },
};

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

function purple(theme: Theme, stop: keyof typeof PURPLE): string {
  const rgba = parseRgba(theme.colors.primary);
  const target = PURPLE[stop];
  if (!rgba) return toRgb(target);
  const base = srgbToOklch(rgba);
  const lightness = stop <= 100 ? target.l : base.l + (target.l - BLUE_500.l);
  return toRgb({
    l: Math.min(0.99, Math.max(0.05, lightness)),
    c: base.c * (target.c / BLUE_500.c),
    h: (((base.h + (target.h - BLUE_500.h)) % 360) + 360) % 360,
  });
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
  const { accent, neutral: n } = resolveButtonRamps(theme);
  const success = colorRamp(theme.colors.success, ACCENT_TABLE);
  const red = colorRamp(theme.colors.negative, DANGER_TABLE);
  const dark = theme.isDark;
  const page = dark ? mixColor(n[900], n[950], 0.4) : theme.colors.card;
  return {
    isDark: dark,
    surface: page,
    border: dark ? n[800] : n[200],
    plain: n[500],
    punctuation: dark ? n[600] : n[400],
    string: n[500],
    keyword: limeFrom(success[500]),
    className: success[500],
    constant: accent[500],
    lineNumber: dark ? n[600] : n[400],
    chipBackground: dark ? mixColor(page, purple(theme, 950), 0.5) : purple(theme, 50),
    chipBorder: dark ? purple(theme, 800) : purple(theme, 100),
    chipText: dark ? purple(theme, 400) : purple(theme, 500),
    filename: n[500],
    addition: success[700],
    deletion: red[600],
    confirm: success[500],
    icon: n[500],
    iconHover: dark ? '#ffffff' : '#000000',
    controlHover: dark ? mixColor(page, n[700], 0.6) : n[100],
    ring: accent[500],
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
