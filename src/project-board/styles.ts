import type { TextStyle } from 'react-native';
import { IS_WEB } from '../styles/platform';
import { createTokenStyles, useColorTokens } from '../theme/color-tokens';

/**
 * A type utility's line: its px on native; on the web its ratio to the size
 * (`--text-*--line-height`), so a text at another size keeps the proportion.
 */
const line = (lineHeight: number, fontSize: number) =>
  IS_WEB ? (String(lineHeight / fontSize) as unknown as number) : lineHeight;

/**
 * The board's type ramp: `text-body-medium`, `text-body-2-medium`,
 * `text-headline-medium`, `text-title-2-medium`, `text-body-regular`.
 */
export const TYPE = {
  body: { fontSize: 14, lineHeight: line(20, 14), fontWeight: 500 },
  caption: { fontSize: 13, lineHeight: line(18, 13), fontWeight: 500 },
  headline: { fontSize: 16, lineHeight: line(22, 16), fontWeight: 500 },
  title: { fontSize: 20, lineHeight: line(26, 20), fontWeight: 500 },
  bodyRegular: { fontSize: 14, lineHeight: line(20, 14), fontWeight: 400 },
} as const satisfies Record<string, TextStyle>;

/**
 * `text-body-medium` on Bloom's `Text` kept Text's own 13px: Text read that
 * utility as a colour and let its default size win, so only the line height and
 * weight came from the class (a class with a token Text could not read, such as
 * `wrap-anywhere`, took the full 14px).
 */
const BODY_ON_TEXT = { lineHeight: TYPE.body.lineHeight, fontWeight: TYPE.body.fontWeight };

/** The ramp in the board's two text colours (`text-text-primary`, `-secondary`/`-tertiary`). */
export const useBoardText = createTokenStyles((t) => ({
  body: { ...BODY_ON_TEXT, color: t.foreground },
  bodyMuted: { ...BODY_ON_TEXT, color: t.mutedForeground },
  caption: { ...TYPE.caption, color: t.foreground },
  captionMuted: { ...TYPE.caption, color: t.mutedForeground },
  headline: { ...TYPE.headline, color: t.foreground },
  title: { ...TYPE.title, color: t.foreground },
  bodyRegularMuted: { ...TYPE.bodyRegular, color: t.mutedForeground },
  /** An icon's `currentColor` (`text-foreground-icon-secondary`/`-tertiary`). */
  icon: { color: t.mutedForeground },
  iconPrimary: { color: t.foreground },
  /** A hairline in `border` (the comment thread's connector). */
  connector: { backgroundColor: t.border },
}));

/** Text wrapping the web drew from classes and native never did. */
const web = (style: Record<string, string>) => (IS_WEB ? (style as TextStyle) : undefined);
/** `whitespace-nowrap`. */
export const NOWRAP = web({ whiteSpace: 'nowrap' });
/** `truncate` past its `overflow: hidden`. */
export const ELLIPSIS = web({ textOverflow: 'ellipsis', whiteSpace: 'nowrap' });
/** `whitespace-pre-wrap wrap-anywhere`. */
export const PRE_WRAP_ANYWHERE = web({ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' });
/** `wrap-anywhere`. */
export const WRAP_ANYWHERE = web({ overflowWrap: 'anywhere' });

/** Tailwind's box-shadow stack as it computes: inset, inset ring, ring offset, ring, shadow. */
export const TAILWIND_SHADOW = (ring: string, shadow: string) =>
  `0 0 #0000, 0 0 #0000, 0 0 #0000, ${ring}, ${shadow}`;

/** The card's `shadow-[0_1px_1px_rgb(0_0_0/0.05)]` on native. */
export const CARD_SHADOW = { offsetX: 0, offsetY: 1, blurRadius: 1, color: '#0000000d' };

/**
 * The fill to pass with an icon's colour. On the web a Bloom icon's colour
 * class reached its `<svg>` as CSS and the icon kept its default fill, the
 * theme's primary; native resolved the class into the icon's style colour,
 * which the icon fills with.
 */
export function useIconFill(): string | undefined {
  const tokens = useColorTokens();
  return IS_WEB ? tokens.primary : undefined;
}
