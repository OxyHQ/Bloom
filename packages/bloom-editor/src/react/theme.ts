/**
 * The editor's look, passed in by the app (from its design system) so the
 * editor depends on no theme provider.
 */
export interface BlockColor {
  /** Text colour for the "color" mark and block colour. */
  text: string;
  /** Background for the "background" mark and block background. */
  background: string;
}

export interface EditorTheme {
  text: string;
  textMuted: string;
  background: string;
  border: string;
  /** Accent for focus, links, checked boxes. */
  accent: string;
  accentText: string;
  /** Background behind selected blocks and the drop indicator. */
  selection: string;
  codeBackground: string;
  /** Named colours (`gray`, `brown`, `orange`, …) for marks and blocks. */
  colors: Readonly<Record<string, BlockColor>>;
  fontFamily?: string;
  monoFontFamily?: string;
}

/** Notion's ten colours. */
export const BLOCK_COLOR_NAMES = [
  'default',
  'gray',
  'brown',
  'orange',
  'yellow',
  'green',
  'blue',
  'purple',
  'pink',
  'red',
] as const;

const LIGHT_COLORS: Record<string, BlockColor> = {
  gray: { text: 'rgb(120, 119, 116)', background: 'rgb(241, 241, 239)' },
  brown: { text: 'rgb(159, 107, 83)', background: 'rgb(244, 238, 238)' },
  orange: { text: 'rgb(217, 115, 13)', background: 'rgb(251, 236, 221)' },
  yellow: { text: 'rgb(203, 145, 47)', background: 'rgb(251, 243, 219)' },
  green: { text: 'rgb(68, 131, 97)', background: 'rgb(237, 243, 236)' },
  blue: { text: 'rgb(51, 126, 169)', background: 'rgb(231, 243, 248)' },
  purple: { text: 'rgb(144, 101, 176)', background: 'rgb(244, 240, 247)' },
  pink: { text: 'rgb(193, 76, 138)', background: 'rgb(249, 238, 243)' },
  red: { text: 'rgb(212, 76, 71)', background: 'rgb(253, 235, 236)' },
};

const DARK_COLORS: Record<string, BlockColor> = {
  gray: { text: 'rgb(155, 155, 155)', background: 'rgb(47, 47, 47)' },
  brown: { text: 'rgb(186, 133, 111)', background: 'rgb(74, 50, 40)' },
  orange: { text: 'rgb(199, 125, 72)', background: 'rgb(92, 59, 35)' },
  yellow: { text: 'rgb(202, 152, 73)', background: 'rgb(86, 67, 40)' },
  green: { text: 'rgb(82, 158, 114)', background: 'rgb(36, 61, 48)' },
  blue: { text: 'rgb(94, 135, 201)', background: 'rgb(20, 58, 78)' },
  purple: { text: 'rgb(157, 104, 211)', background: 'rgb(60, 45, 73)' },
  pink: { text: 'rgb(209, 87, 150)', background: 'rgb(78, 44, 60)' },
  red: { text: 'rgb(223, 84, 82)', background: 'rgb(82, 46, 42)' },
};

/** The named colours for a light or dark surface. */
export function blockColors(scheme: 'light' | 'dark'): Record<string, BlockColor> {
  return scheme === 'dark' ? DARK_COLORS : LIGHT_COLORS;
}

export const DEFAULT_THEME: EditorTheme = {
  text: 'rgb(55, 53, 47)',
  textMuted: 'rgb(155, 154, 151)',
  background: 'rgb(255, 255, 255)',
  border: 'rgb(233, 233, 231)',
  accent: 'rgb(35, 131, 226)',
  accentText: 'rgb(255, 255, 255)',
  selection: 'rgba(35, 131, 226, 0.14)',
  codeBackground: 'rgb(247, 246, 243)',
  colors: LIGHT_COLORS,
};
