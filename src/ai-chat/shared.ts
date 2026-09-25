import { useEffect, useMemo } from 'react';
import { Platform, type ViewStyle } from 'react-native';

import {
  BUTTON_SHADOW,
  resolveButtonRamps,
  type Ramp,
} from '../button/shared';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { borderRadius } from '../styles/tokens';
import {
  WEB_POSITION_STICKY,
  webViewportHeightMinus,
  type WebCssStyle,
} from '../styles/web-view-style';
import type { Theme } from '../theme/types';
import { useTheme } from '../theme/use-theme';

/** Shared semantic surfaces and foreground pairs; code colours belong to `code`. */
export interface AiChatPalette {
  isDark: boolean;
  full: string;
  primary: string;
  secondary: string;
  secondaryHover: string;
  tertiary: string;
  border: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  iconPrimary: string;
  iconSecondary: string;
  iconQuaternary: string;
  iconHover: string;
  ring: string;
  neutral: Ramp;
  /** Semantic success foreground for additions. */
  addition: string;
  /** Semantic error foreground for deletions. */
  deletion: string;
  /** Paired accent surface and foreground for the link chip. */
  linkChipBackground: string;
  linkChipText: string;
  shadowXs: string;
  shadowCard: string;
  shadowSidebar: string;
}

export function resolveAiChatPalette(theme: Theme): AiChatPalette {
  const { neutral: n } = resolveButtonRamps(theme);
  const c = theme.colors;
  const dark = theme.isDark;
  return {
    isDark: dark,
    full: c.background,
    primary: c.card,
    secondary: c.backgroundSecondary,
    secondaryHover: c.backgroundTertiary,
    tertiary: c.backgroundTertiary,
    border: c.borderLight,
    text: theme.colors.text,
    textSecondary: c.textSecondary,
    textTertiary: c.textTertiary,
    iconPrimary: c.text,
    iconSecondary: c.textSecondary,
    iconQuaternary: c.textTertiary,
    iconHover: c.text,
    ring: c.primary,
    neutral: n,
    addition: c.successSubtleForeground,
    deletion: c.errorSubtleForeground,
    linkChipBackground: c.primarySubtle,
    linkChipText: c.primarySubtleForeground,
    shadowXs: dark ? BUTTON_SHADOW.dark : BUTTON_SHADOW.light,
    shadowCard: dark ? '0 1px 1px 0 rgba(0, 0, 0, 0.14)' : '0 1px 1px 0 rgba(0, 0, 0, 0.05)',
    shadowSidebar: dark
      ? '0 1px 0 0 rgba(0, 0, 0, 0.1), 0 1px 12px 0 rgba(0, 0, 0, 0.16), 0 0 1px 0 rgba(0, 0, 0, 0.42)'
      : '0 1px 0 0 rgba(0, 0, 0, 0.0196), 0 1px 12px 0 rgba(0, 0, 0, 0.0588), 0 0 1px 0 rgba(0, 0, 0, 0.3216)',
  };
}

/** Canonical hover surface, shared across modes. */
export function primaryHoverOver(palette: AiChatPalette, _surface: string): string {
  return palette.secondaryHover;
}

export function useAiChatPalette(): AiChatPalette {
  const theme = useTheme();
  return useMemo(() => resolveAiChatPalette(theme), [theme]);
}

// ---------------------------------------------------------------------------
//  Geometry and timing
// ---------------------------------------------------------------------------

/** `rounded-3xl` — the chat container. */
export const CONTAINER_RADIUS = 24;
/** `rounded-2xl` — bubbles, the image frame, the code card. */
export const CARD_RADIUS = 16;
/** `rounded-2lg` — panel rows and tiles. */
export const ROW_RADIUS = 10;
/** `duration-150`. */
export const TRANSITION_MS = 150;
/** How long a copy confirmation stays. */
export const CONFIRM_MS = 1600;
/** `cubic-bezier(0.22, 1, 0.36, 1)` — the settle curve. */
export const EASE_OUT_QUINT = [0.22, 1, 0.36, 1] as const;

export const IS_WEB = Platform.OS === 'web';

/** The window is at least this wide when the panel (and the resize handle) show: `xl`. */
export const PANEL_BREAKPOINT = 1280;
/** The sidebar sits in flow from `lg`; below it becomes a push drawer. */
export const SIDEBAR_BREAKPOINT = 1024;

/** The shell's padding: the gutter around its columns, px. */
export const SHELL_GUTTER = 12;

/**
 * `scroll="document"`: a column pinned to the viewport while the document
 * scrolls under it — the sidebar and the panel. One screen tall less the
 * gutter above and below, so it closes where the page does; `flex-start` so
 * the row's stretch does not make it as tall as the page, which would leave the
 * sticky box nowhere to move.
 */
export const DOCUMENT_RAIL: WebCssStyle = {
  position: WEB_POSITION_STICKY,
  top: SHELL_GUTTER,
  height: webViewportHeightMinus(SHELL_GUTTER * 2),
  alignSelf: 'flex-start',
  flexShrink: 0,
};

/**
 * `scroll="document"`: the card is a `ContentPanel`, and this is its radius.
 */
export const DOCUMENT_CARD_RADIUS = borderRadius._3xl;

/**
 * `scroll="document"`: a layer the size of the visible card that takes no room
 * in the flow — pinned like the rail, then pulled back out of the layout by an
 * equal negative margin, so what follows it starts where it does. The card's
 * `background` slot is drawn on it: the card grows with the conversation, the
 * layer stays the size of the screen — the same geometry as the panel's own
 * sticky frame.
 */
export const DOCUMENT_LAYER: WebCssStyle = {
  position: WEB_POSITION_STICKY,
  top: SHELL_GUTTER,
  height: webViewportHeightMinus(SHELL_GUTTER * 2),
  marginBottom: `calc(-100dvh + ${SHELL_GUTTER * 2}px)` as ViewStyle['marginBottom'],
  borderRadius: DOCUMENT_CARD_RADIUS,
};

// ---------------------------------------------------------------------------
//  Web
// ---------------------------------------------------------------------------

/**
 * A `dataSet` attribute on web — the hook the family sheet hangs transitions,
 * focus rings, hover reveals and keyframes off (react-native-web renders no
 * class) — and nothing on native.
 */
export function dataHook(name: string, value = ''): Record<string, unknown> {
  return IS_WEB ? { dataSet: { [name]: value } } : {};
}

const STYLE_ID = 'bloom-ai-chat-web-css';

/**
 * Pseudo-class behaviour and keyframes inline styles cannot express:
 *
 * - controls: `:focus-visible` ring (2px accent-500), colour/opacity transitions;
 * - thin and hidden scrollbars (`[scrollbar-width:thin|none]`);
 * - the gallery tile's hover scrim and 3% image lift (`group-hover`);
 * - the split-flap countdown's two leaves (`flap-fall` / `flap-rise`);
 * - the generated image's feathered radial reveal, a registered `--bloom-ai-reveal`
 *   percentage transitioning 0% → 132% over 1550ms;
 * - the resize grip's hover reveal, and a user turn's actions (pointer only);
 * - the composer field's placeholder colour;
 * - a document-scrolled thread out of the browser's scroll anchoring.
 */
export const AI_CHAT_WEB_CSS = `
@property --bloom-ai-reveal {
  syntax: '<percentage>';
  inherits: false;
  initial-value: 0%;
}
[data-bloom-ai-chat-control] {
  outline: none;
  cursor: pointer;
  transition: background-color ${TRANSITION_MS}ms ease, color ${TRANSITION_MS}ms ease, opacity ${TRANSITION_MS}ms ease;
}
[data-bloom-ai-chat-control]:focus-visible {
  box-shadow: 0 0 0 2px var(--bloom-ai-chat-ring);
}
[data-bloom-ai-chat-control="inset"]:focus-visible {
  box-shadow: inset 0 0 0 2px var(--bloom-ai-chat-ring);
}
[data-bloom-ai-chat-control="bare"]:focus-visible {
  box-shadow: none;
}
[data-bloom-ai-chat-zoom] { outline: none; }
[data-bloom-ai-chat-zoom="in"] { cursor: zoom-in; }
[data-bloom-ai-chat-zoom="out"] { cursor: zoom-out; }
[data-bloom-ai-chat-zoom]:focus-visible { box-shadow: inset 0 0 0 2px var(--bloom-ai-chat-ring); }
[data-bloom-ai-chat-thread] { overflow-anchor: none; }
[data-bloom-ai-chat-scroll="thin"] { scrollbar-width: thin; }
[data-bloom-ai-chat-scroll="none"] { scrollbar-width: none; }
[data-bloom-ai-chat-scroll="none"]::-webkit-scrollbar { display: none; }
[data-bloom-ai-chat-tile] [data-bloom-ai-chat-scrim] {
  opacity: 0;
  transition: opacity 200ms cubic-bezier(0, 0, 0.2, 1);
}
[data-bloom-ai-chat-tile]:hover [data-bloom-ai-chat-scrim] { opacity: 1; }
[data-bloom-ai-chat-tile-image] {
  transition: transform 300ms cubic-bezier(0, 0, 0.2, 1);
}
[data-bloom-ai-chat-tile="lift"]:hover [data-bloom-ai-chat-tile-image] { transform: scale(1.03); }
@keyframes bloom-ai-flap-fall {
  from { transform: rotateX(0deg); filter: brightness(1); }
  to { transform: rotateX(-90deg); filter: brightness(0.86); }
}
@keyframes bloom-ai-flap-rise {
  0% { transform: rotateX(90deg); filter: brightness(0.86); }
  70% { transform: rotateX(-9deg); }
  86% { transform: rotateX(4deg); }
  100% { transform: rotateX(0deg); filter: brightness(1); }
}
[data-bloom-ai-chat-flap-card] { perspective: 70px; }
[data-bloom-ai-chat-fade] { transition: opacity 300ms cubic-bezier(0.4, 0, 0.2, 1); }
[data-bloom-ai-chat-flap="fall"] {
  transform-origin: bottom center;
  backface-visibility: hidden;
  animation: bloom-ai-flap-fall 150ms cubic-bezier(0.55, 0, 0.9, 0.35) forwards;
}
[data-bloom-ai-chat-flap="rise"] {
  transform-origin: top center;
  backface-visibility: hidden;
  animation: bloom-ai-flap-rise 230ms cubic-bezier(0.25, 0.7, 0.35, 1) 150ms both;
}
[data-bloom-ai-chat-reveal] {
  --bloom-ai-reveal: 0%;
  opacity: 0;
  filter: blur(10px);
  -webkit-mask-image: radial-gradient(circle at 50% 50%, #000 calc(var(--bloom-ai-reveal) - 26%), transparent var(--bloom-ai-reveal));
  mask-image: radial-gradient(circle at 50% 50%, #000 calc(var(--bloom-ai-reveal) - 26%), transparent var(--bloom-ai-reveal));
  transition: --bloom-ai-reveal 1550ms cubic-bezier(0.4, 0, 0.2, 1), opacity 1550ms cubic-bezier(0.4, 0, 0.2, 1), filter 1550ms cubic-bezier(0.4, 0, 0.2, 1);
}
[data-bloom-ai-chat-reveal="shown"] {
  --bloom-ai-reveal: 132%;
  opacity: 1;
  filter: blur(0px);
}
[data-bloom-ai-chat-grip] [data-bloom-ai-chat-grip-pill] {
  opacity: 0;
  transition: opacity ${TRANSITION_MS}ms ease;
}
[data-bloom-ai-chat-grip]:hover [data-bloom-ai-chat-grip-pill],
[data-bloom-ai-chat-grip-pill="dragging"] { opacity: 1; }
[data-bloom-ai-chat-grip] { cursor: col-resize; touch-action: none; outline: none; }
[data-bloom-ai-chat-dragging="on"] { cursor: col-resize; user-select: none; }
@media (hover: hover) {
  [data-bloom-ai-chat-turn] [data-bloom-ai-chat-turn-actions] {
    opacity: 0;
    transition: opacity ${TRANSITION_MS}ms ease;
  }
  [data-bloom-ai-chat-turn]:hover [data-bloom-ai-chat-turn-actions],
  [data-bloom-ai-chat-turn]:focus-within [data-bloom-ai-chat-turn-actions] { opacity: 1; }
}
[data-bloom-ai-chat-chip] {
  display: inline-flex;
  max-width: calc(100% - 4px);
  box-sizing: border-box;
  align-items: center;
  justify-content: center;
  gap: 2px;
  vertical-align: middle;
}
[data-bloom-ai-chat-chip] > svg { flex-shrink: 0; }
[data-bloom-ai-chat-chip] > [dir] { min-width: 0; overflow-wrap: anywhere; }
@media (prefers-reduced-motion: reduce) {
  [data-bloom-ai-chat-control],
  [data-bloom-ai-chat-tile] [data-bloom-ai-chat-scrim],
  [data-bloom-ai-chat-tile-image],
  [data-bloom-ai-chat-grip] [data-bloom-ai-chat-grip-pill],
  [data-bloom-ai-chat-turn] [data-bloom-ai-chat-turn-actions] { transition: none; }
  [data-bloom-ai-chat-flap] { animation-duration: 1ms; animation-delay: 0ms; }
}
`;

/** Adopt the family sheet once (web; a no-op on native). */
export function useAiChatWebCss(): void {
  useEffect(() => {
    if (IS_WEB) adoptStyleSheet(STYLE_ID, AI_CHAT_WEB_CSS);
  }, []);
}
