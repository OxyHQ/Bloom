import { useEffect, useMemo } from 'react';
import { Platform } from 'react-native';

import {
  colorRamp,
  DANGER_TABLE,
  mixColor,
  resolveButtonPalette,
  resolveButtonRamps,
  type ButtonPalette,
} from '../button/shared';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import type { Theme } from '../theme/types';
import { useTheme } from '../theme/use-theme';

/**
 * The palette and geometry every agent-chat part paints from — semantic
 * tokens resolved onto Bloom's ramps (`button/shared`):
 *
 *   Token                                 light            dark
 *   background-secondary-default          neutral-100      neutral-900     chat + rail cards
 *   background-secondary-hover            neutral-200      neutral-800     rail rows
 *   background-tertiary-default           neutral-200      neutral-800     row menu trigger hover
 *   background-primary-default            card             neutral-800     composer pill, bubbles, pills
 *   background-primary-hover  (on card)   neutral-100      neutral-700@60% over neutral-800
 *   background-primary-hover  (on chat)   neutral-100      neutral-700@60% over neutral-900
 *   ai-chat-composer-add-background       neutral-100      neutral-700
 *   ai-chat-composer-add-hover-background neutral-200      neutral-600
 *   text-primary                          text             text
 *   text-secondary                        neutral-500      neutral-500
 *   text-tertiary                         neutral-400      neutral-600
 *   text-error-primary                    red-500          red-400
 *   foreground-icon-primary               neutral-950      neutral-50
 *   foreground-icon-secondary             neutral-500      neutral-500
 *   foreground-icon-tertiary              neutral-400      neutral-600
 *   separator-border                      neutral-200      neutral-800
 *   border-focus-ring                     accent-500       accent-500
 *   shadow-card                           0 1 1 / .05      0 1 1 / .14
 *   shadow-xs                             0 1 2 / .05      0 1 2 / .18
 *   header frost                          white / 20%      black / 20%
 */
export interface AgentChatPalette {
  isDark: boolean;
  chatSurface: string;
  rowHover: string;
  tertiary: string;
  card: string;
  cardHover: string;
  chatHover: string;
  addBackground: string;
  addHover: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  textError: string;
  iconPrimary: string;
  iconSecondary: string;
  iconTertiary: string;
  separator: string;
  ring: string;
  accent500: string;
  shadowCard: string;
  shadowXs: string;
  frost: string;
  /** `bg-button-primary` — the send and export discs. */
  primary: ButtonPalette;
}

export function resolveAgentChatPalette(theme: Theme): AgentChatPalette {
  const { accent, neutral: n } = resolveButtonRamps(theme);
  const red = colorRamp(theme.colors.negative, DANGER_TABLE);
  const dark = theme.isDark;
  const card = dark ? n[800] : theme.colors.card;
  const chatSurface = dark ? n[900] : n[100];
  return {
    isDark: dark,
    chatSurface,
    rowHover: dark ? n[800] : n[200],
    tertiary: dark ? n[800] : n[200],
    card,
    cardHover: dark ? mixColor(card, n[700], 0.6) : n[100],
    chatHover: dark ? mixColor(chatSurface, n[700], 0.6) : n[100],
    addBackground: dark ? n[700] : n[100],
    addHover: dark ? n[600] : n[200],
    text: theme.colors.text,
    textSecondary: n[500],
    textTertiary: dark ? n[600] : n[400],
    textError: dark ? red[400] : red[500],
    iconPrimary: dark ? n[50] : n[950],
    iconSecondary: n[500],
    iconTertiary: dark ? n[600] : n[400],
    separator: dark ? n[800] : n[200],
    ring: accent[500],
    accent500: accent[500],
    shadowCard: dark ? '0 1px 1px 0 rgba(0, 0, 0, 0.14)' : '0 1px 1px 0 rgba(0, 0, 0, 0.05)',
    shadowXs: dark ? '0 1px 2px 0 rgba(0, 0, 0, 0.18)' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    frost: dark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)',
    primary: resolveButtonPalette('primary', theme),
  };
}

export function useAgentChatPalette(): AgentChatPalette {
  const theme = useTheme();
  return useMemo(() => resolveAgentChatPalette(theme), [theme]);
}

// ---------------------------------------------------------------------------
//  Geometry
// ---------------------------------------------------------------------------

/** `rounded-3xl` — chat card and history rail. */
export const CARD_RADIUS = 24;
/** `rounded-2lg` — rail rows. */
export const ROW_RADIUS = 10;
/** `max-w-3xl` — the message column and the composer. */
export const COLUMN_MAX_WIDTH = 768;
/** `w-[260px]` — the history rail. */
export const RAIL_WIDTH = 260;
/** `h-12` — the overlaid header. */
export const HEADER_HEIGHT = 48;
/** `h-[52px]` — the composer pill. */
export const COMPOSER_HEIGHT = 52;
/** `size-9` — composer discs. */
export const COMPOSER_CONTROL = 36;
/** `size-7` — header and message action buttons. */
export const ACTION_SIZE = 28;
/** `w-[190px] p-2` — the chat and row menus. */
export const SMALL_MENU_STYLE = { width: 190, minWidth: 190, padding: 8 } as const;
/** `w-[248px] p-2.5` — the account menu. */
export const ACCOUNT_MENU_STYLE = { width: 248, minWidth: 248, padding: 10, gap: 7 } as const;
/** `transition-colors` / `duration-150`. */
export const TRANSITION_MS = 150;
/** How long the ✓ stays after a copy or share. */
export const CONFIRM_MS = 1600;
/** Window width at which the rail shows (`xl`). */
export const HISTORY_BREAKPOINT = 1280;

/** Rows in a `DropdownItem className="px-2 py-1.5"`: 32 tall. */
export const DENSE_ROW_CLASS = 'py-1.5';

// ---------------------------------------------------------------------------
//  Formatting
// ---------------------------------------------------------------------------

/** "just now", "3 minutes ago", "2 hours ago". */
export function formatAgo(at: number, now = Date.now()): string {
  const seconds = Math.max(0, Math.round((now - at) / 1000));
  if (seconds < 45) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

/** Compact ages for a narrow badge: `now`, `34m`, `5h`, `18h`, `3d`. */
export function relativeTime(at: number, now = Date.now()): string {
  const seconds = Math.max(0, Math.round((now - at) / 1000));
  if (seconds < 60) return 'now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

/** `"openai/gpt-5-nano"` → `"gpt-5-nano"`. */
export function shortModel(model: string): string {
  const slash = model.lastIndexOf('/');
  return slash === -1 ? model : model.slice(slash + 1);
}

// ---------------------------------------------------------------------------
//  Web
// ---------------------------------------------------------------------------

export const IS_WEB = Platform.OS === 'web';

/**
 * A `dataSet` attribute on web — the hook the family sheet hangs transitions,
 * focus rings and the hover reveals off (react-native-web renders no class) —
 * and nothing on native.
 */
export function dataHook(name: string, value = ''): Record<string, unknown> {
  return IS_WEB ? { dataSet: { [name]: value } } : {};
}

const STYLE_ID = 'bloom-agent-chat-web-css';

const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';

/**
 * Pseudo-class behaviour inline styles cannot express:
 *
 * - controls: `:focus-visible` ring (2px accent-500), colour transitions, cursor;
 * - the assistant action row: hidden until the message is hovered or a control
 *   inside it has focus (`group-hover/message` + `focus-within`);
 * - rail rows: hover fill, and the age badge stepping aside for the menu
 *   trigger on hover or keyboard focus (`group-hover/row`,
 *   `group-has-[:focus-visible]/slot`);
 * - the rail list's hidden scrollbar (`[scrollbar-width:none]`);
 * - the header's border/frost transition.
 */
export const AGENT_CHAT_WEB_CSS = `
[data-bloom-agent-chat-control] {
  outline: none;
  cursor: pointer;
  transition: background-color ${TRANSITION_MS}ms ease, color ${TRANSITION_MS}ms ease, opacity ${TRANSITION_MS}ms ease;
}
[data-bloom-agent-chat-control][aria-disabled="true"] { cursor: not-allowed; }
[data-bloom-agent-chat-control]:focus-visible {
  box-shadow: 0 0 0 2px var(--bloom-agent-chat-ring);
}
[data-bloom-agent-chat-actions] {
  opacity: 0;
  transition: opacity ${TRANSITION_MS}ms ${EASE};
}
[data-bloom-agent-chat-message]:hover [data-bloom-agent-chat-actions="shown"],
[data-bloom-agent-chat-actions="shown"]:focus-within {
  opacity: 1;
}
[data-bloom-agent-chat-actions="hidden"] { pointer-events: none; }
[data-bloom-agent-chat-thread] {
  transition: background-color ${TRANSITION_MS}ms ${EASE};
}
[data-bloom-agent-chat-thread]:hover {
  background-color: var(--bloom-agent-chat-row-hover);
}
[data-bloom-agent-chat-age],
[data-bloom-agent-chat-row-menu] {
  transition: opacity ${TRANSITION_MS}ms ${EASE};
}
[data-bloom-agent-chat-age] { opacity: 1; }
[data-bloom-agent-chat-row-menu] { opacity: 0; }
[data-bloom-agent-chat-thread]:hover [data-bloom-agent-chat-age],
[data-bloom-agent-chat-slot]:has(:focus-visible) [data-bloom-agent-chat-age] {
  opacity: 0;
}
[data-bloom-agent-chat-thread]:hover [data-bloom-agent-chat-row-menu],
[data-bloom-agent-chat-slot]:has(:focus-visible) [data-bloom-agent-chat-row-menu] {
  opacity: 1;
}
[data-bloom-agent-chat-scroll-hidden] { scrollbar-width: none; }
[data-bloom-agent-chat-scroll-hidden]::-webkit-scrollbar { display: none; }
[data-bloom-agent-chat-header] {
  transition: background-color ${TRANSITION_MS}ms ${EASE}, border-color ${TRANSITION_MS}ms ${EASE};
}
[data-bloom-agent-chat-field]::placeholder { color: var(--bloom-agent-chat-placeholder); }
[data-bloom-agent-chat-field]:focus { outline: none; }
@media (prefers-reduced-motion: reduce) {
  [data-bloom-agent-chat-control],
  [data-bloom-agent-chat-actions],
  [data-bloom-agent-chat-thread],
  [data-bloom-agent-chat-age],
  [data-bloom-agent-chat-row-menu],
  [data-bloom-agent-chat-header] { transition: none; }
}
`;

/** Adopt the family sheet once (web; a no-op on native). */
export function useAgentChatWebCss(): void {
  useEffect(() => {
    if (IS_WEB) adoptStyleSheet(STYLE_ID, AGENT_CHAT_WEB_CSS);
  }, []);
}
