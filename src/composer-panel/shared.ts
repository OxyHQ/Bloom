/**
 * What every file of the `composer-panel` family paints from: semantic
 * tokens resolved onto Bloom's ramps, the geometry both forks share, the default
 * data (permission modes, effort stops, add-menu rows) and the web stylesheet.
 *
 * Shared with `ai-chat` (`AddMenu`, `EffortSlider`, `EFFORT_LEVELS`).
 */
import type { ComponentType } from 'react';

import { BUTTON_SHADOW } from '../button/shared';
import { MENU_SHADOW } from '../floating/menu-palette';
import type { Props as IconProps } from '../icons/shared';
import { RiAttachment2 } from '../icons/remix/RiAttachment2';
import { RiCodeBlock } from '../icons/remix/RiCodeBlock';
import { RiFileExcel2Line } from '../icons/remix/RiFileExcel2Line';
import { RiFileTextLine } from '../icons/remix/RiFileTextLine';
import { RiFocus3Line } from '../icons/remix/RiFocus3Line';
import { RiGitMergeLine } from '../icons/remix/RiGitMergeLine';
import { RiListCheck3 } from '../icons/remix/RiListCheck3';
import { RiRouteLine } from '../icons/remix/RiRouteLine';
import { RiShieldCheckLine } from '../icons/remix/RiShieldCheckLine';
import { RiSlideshow3Line } from '../icons/remix/RiSlideshow3Line';
import { RiSpeedUpFill } from '../icons/remix/RiSpeedUpFill';
import { RiVideoLine } from '../icons/remix/RiVideoLine';
import type { Theme } from '../theme/types';
import { COMPOSER_PANEL_MESSAGES, type ComposerPanelMessages } from './messages';
import type {
  ComposerPanelAddMenuGroup,
  ComposerPanelAttachmentKind,
  ComposerPanelPermissionOption,
} from './types';

export type ComposerIcon = ComponentType<IconProps>;

// ---------------------------------------------------------------------------
//  Palette
// ---------------------------------------------------------------------------

export interface ComposerPalette {
  /** `background-primary-default` — the card, the panels, the mic button. */
  surface: string;
  /** `background-primary-hover` — row highlight, trigger hover. */
  hover: string;
  /** `background-secondary-default` — the effort track. */
  secondary: string;
  /** `background-tertiary-default` / `-hover` — effort chip, rail selection, fill. */
  tertiary: string;
  tertiaryHover: string;
  /** `border-button-default` — panel hairlines, the mic border. */
  border: string;
  /** `border-checkbox-default` — the effort thumb. */
  thumbBorder: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  iconPrimary: string;
  iconSecondary: string;
  iconTertiary: string;
  /** `composer-panel-tab-background`. */
  tab: string;
  /** `composer-panel-tile-border`. */
  tileBorder: string;
  /** `composer-panel-rail-background`. */
  rail: string;
  /** Context ring: `neutral-300` track, `neutral-500` arc — literal ramp stops, not modes. */
  ringTrack: string;
  ringArc: string;
  /** `accent-400` (upload ring) and `accent-500` (percentage, caret). */
  accent400: string;
  accent500: string;
  /** `border-focus-ring`. */
  focusRing: string;
  /** A failed tile: the error subtle surface and its paired foreground. */
  errorSurface: string;
  errorText: string;
  /** `shadow-xs`, `shadow-dropdown` and the card's raw Figma shadow. */
  shadowXs: string;
  shadowDropdown: string;
  shadowCard: string;
  /** The model picker's softer raw Figma shadow. */
  shadowPicker: string;
  /** Provider marks: black at 30% as exported, inverted in dark. */
  logo: string;
}

/** Re-exported from `theme/color-utils`, which owns it (it was copied here). */
export { withAlpha } from '../theme/color-utils';

/** Canonical surfaces and foregrounds follow the preset's authored role pairs. */
export function resolveComposerPalette(theme: Theme): ComposerPalette {
  const c = theme.colors;
  const dark = theme.isDark;
  return {
    surface: c.card,
    hover: c.backgroundSecondary,
    secondary: c.backgroundSecondary,
    tertiary: c.backgroundTertiary,
    tertiaryHover: c.backgroundSecondary,
    border: c.borderLight,
    thumbBorder: c.border,
    text: c.text,
    textSecondary: c.textSecondary,
    textTertiary: c.textTertiary,
    iconPrimary: c.text,
    iconSecondary: c.textSecondary,
    iconTertiary: c.textTertiary,
    tab: c.backgroundTertiary,
    tileBorder: c.borderLight,
    rail: c.backgroundSecondary,
    ringTrack: c.borderLight,
    ringArc: c.textSecondary,
    accent400: c.primary,
    accent500: c.primarySubtleForeground,
    focusRing: c.primary,
    errorSurface: c.errorSubtle,
    errorText: c.errorSubtleForeground,
    shadowXs: dark ? BUTTON_SHADOW.dark : BUTTON_SHADOW.light,
    shadowDropdown: dark ? MENU_SHADOW.dark : MENU_SHADOW.light,
    shadowCard: '0 1px 0.5px 0 rgba(0, 0, 0, 0.02), 0 4px 2px 0 rgba(0, 0, 0, 0.02)',
    shadowPicker: '0 1px 2px 0 rgba(0, 0, 0, 0.04), 0 4px 8px 0 rgba(0, 0, 0, 0.02)',
    logo: dark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
  };
}

// ---------------------------------------------------------------------------
//  Geometry
// ---------------------------------------------------------------------------

/** `rounded-3xl p-2.5` card. */
export const CARD_RADIUS = 24;
export const CARD_PADDING = 10;
/** Status tab: `mx-7 h-[34px] rounded-t-2xl px-2 py-1`. */
export const TAB_INSET = 28;
export const TAB_HEIGHT = 34;
export const TAB_RADIUS = 16;
/** The prompt grows one 20px line at a time up to `max-h-[200px]`. */
export const PROMPT_LINE = 20;
export const PROMPT_MAX_HEIGHT = 200;
/** 36px round controls: add, mic, send. */
export const CONTROL_SIZE = 36;
/** Attachment tile. */
export const TILE = 56;
export const TILE_RADIUS = 12;

/** Panels. */
export const PERMISSION_PANEL_WIDTH = 323;
export const ADD_PANEL_WIDTH = 361;
export const PICKER_WIDTH = 341;
export const PICKER_HEIGHT = 282;
export const EFFORT_WIDTH = 266;

/** The popover motion (150ms `ease-out`) and state transitions (150ms `ease`). */
export const TRANSITION_MS = 150;
/** `cubic-bezier(0.22, 1, 0.36, 1)` — the attachment tiles' and strip's curve. */
export const EASE_OUT_QUINT = [0.22, 1, 0.36, 1] as const;

/** Rounded-rect progress path from top-centre, clockwise (`ringPath`). */
export function ringPath(width: number, height: number, inset: number, radius: number): string {
  const x0 = inset;
  const y0 = inset;
  const x1 = width - inset;
  const y1 = height - inset;
  const arc = (endX: number, endY: number) => `A ${radius} ${radius} 0 0 1 ${endX} ${endY}`;
  return [
    `M ${width / 2} ${y0}`,
    `H ${x1 - radius}`,
    arc(x1, y0 + radius),
    `V ${y1 - radius}`,
    arc(x1 - radius, y1),
    `H ${x0 + radius}`,
    arc(x0, y1 - radius),
    `V ${y0 + radius}`,
    arc(x0 + radius, y0),
    'Z',
  ].join(' ');
}

/** Centred on the tile's 1px border: 2px stroke at inset 1, radius 11. */
export const TILE_RING = ringPath(TILE, TILE, 1, 11);

/** Total length of {@link TILE_RING}, for native dash arithmetic (no `pathLength` there). */
export const TILE_RING_LENGTH = 2 * (TILE - 2 - 22) * 2 + 2 * Math.PI * 11;

// ---------------------------------------------------------------------------
//  Default data
// ---------------------------------------------------------------------------

/** The four permission modes, in `messages`' language. Auto is the default. */
export function composerPermissions(
  messages: ComposerPanelMessages,
): readonly ComposerPanelPermissionOption[] {
  const modes = messages.permissionModes;
  return [
    { id: 'auto', ...modes.auto, icon: RiSpeedUpFill },
    { id: 'manual', ...modes.manual, icon: RiGitMergeLine, flip: true },
    { id: 'plan', ...modes.plan, icon: RiRouteLine, flip: true },
    { id: 'bypass', ...modes.bypass, icon: RiShieldCheckLine },
  ];
}

/** The four permission modes in English — what a component draws is its locale's (`composerPermissions`). */
export const COMPOSER_PANEL_PERMISSIONS: readonly ComposerPanelPermissionOption[] =
  composerPermissions(COMPOSER_PANEL_MESSAGES.en);

/**
 * Six effort stops between "Faster" and "Smarter"; index 1 is the design's
 * resting stop. English — a component's default is its locale's `effortLevels`.
 */
export const MODEL_PICKER_EFFORT_LEVELS: readonly string[] =
  COMPOSER_PANEL_MESSAGES.en.effortLevels;
export const DEFAULT_EFFORT = 1;

/**
 * The add menu, in `messages`' language: an "Add" group of 20px icon rows and
 * a "Plugins" group of 24px illustrated rows. Raster-like plugin illustrations
 * with filters that react-native-svg cannot draw are out of scope, so the
 * defaults use the matching Remix file glyphs at the same 24px box; pass
 * `image` for your own artwork.
 */
export function composerAddMenu(
  messages: ComposerPanelMessages,
): readonly ComposerPanelAddMenuGroup[] {
  const m = messages.addMenuRows;
  return [
    {
      label: m.add,
      rows: [
        { id: 'files', icon: RiAttachment2, label: m.files },
        { id: 'goal', icon: RiFocus3Line, label: m.goal, description: m.goalDescription },
        { id: 'plan', icon: RiListCheck3, label: m.plan, description: m.planDescription },
      ],
    },
    {
      label: m.plugins,
      rows: [
        {
          id: 'documents',
          icon: RiFileTextLine,
          iconSize: 24,
          label: m.documents,
          description: m.documentsDescription,
        },
        {
          id: 'spreadsheets',
          icon: RiFileExcel2Line,
          iconSize: 24,
          label: m.spreadsheets,
          description: m.spreadsheetsDescription,
        },
        {
          id: 'presentations',
          icon: RiSlideshow3Line,
          iconSize: 24,
          label: m.presentations,
          description: m.presentationsDescription,
        },
        {
          id: 'code',
          icon: RiCodeBlock,
          iconSize: 24,
          label: m.code,
          description: m.codeDescription,
        },
      ],
    },
  ];
}

/** The add menu in English — what a component draws is its locale's (`composerAddMenu`). */
export const COMPOSER_PANEL_ADD_MENU: readonly ComposerPanelAddMenuGroup[] = composerAddMenu(
  COMPOSER_PANEL_MESSAGES.en,
);

/** The glyph a non-image attachment tile draws when it carries no `icon`. */
export const ATTACHMENT_KIND_ICONS: Record<
  Exclude<ComposerPanelAttachmentKind, 'image'>,
  ComposerIcon
> = {
  document: RiFileTextLine,
  spreadsheet: RiFileExcel2Line,
  presentation: RiSlideshow3Line,
  code: RiCodeBlock,
  video: RiVideoLine,
};

// ---------------------------------------------------------------------------
//  Web stylesheet: transitions, focus rings, hidden scrollbars. Hover paint is
//  state-driven (so it also paints on native); only what inline style cannot say
//  lives here. Every hook is a `dataSet` attribute — a class never reaches the
//  DOM through react-native-web.
// ---------------------------------------------------------------------------

export const COMPOSER_STYLE_ID = 'bloom-composer-panel-web-css';

export const COMPOSER_WEB_CSS = `
[data-bloom-composer-control] {
  outline: none;
  transition: background-color ${TRANSITION_MS}ms ease, opacity ${TRANSITION_MS}ms ease, color ${TRANSITION_MS}ms ease;
}
[data-bloom-composer-control]:focus-visible {
  outline: 2px solid var(--bloom-composer-ring);
  outline-offset: 0;
}
[data-bloom-composer-control="link"] {
  text-underline-offset: 3px;
}
[data-bloom-composer-control="offset"]:focus-visible,
[data-bloom-composer-control="link"]:focus-visible {
  outline-offset: 2px;
}
[data-bloom-composer-control="inset"]:focus-visible {
  outline-offset: -2px;
}
[data-bloom-composer-row] {
  outline: none;
  transition: background-color ${TRANSITION_MS}ms cubic-bezier(0.4, 0, 0.2, 1);
}
[data-bloom-composer-tile-ring] path {
  transition: stroke-dasharray 200ms linear;
}
[data-bloom-composer-fill] {
  transition: width ${TRANSITION_MS}ms cubic-bezier(0, 0, 0.2, 1);
}
[data-bloom-composer-tick] {
  transition: opacity 300ms cubic-bezier(0, 0, 0.2, 1);
}
[data-bloom-composer-thumb] {
  outline: none;
  cursor: grab;
}
[data-bloom-composer-thumb]:focus-visible {
  outline: 2px solid var(--bloom-composer-ring);
}
[data-bloom-composer-scroll] {
  scrollbar-width: none;
}
[data-bloom-composer-scroll]::-webkit-scrollbar {
  display: none;
}
[data-bloom-composer-input] {
  outline: none;
  resize: none;
}
[data-bloom-composer-pill] [data-bloom-composer-control] {
  transition: background-color 480ms ease, border-color 480ms ease, box-shadow 480ms ease, opacity 200ms ease;
}
@media (prefers-reduced-motion: reduce) {
  [data-bloom-composer-pill] [data-bloom-composer-control] { transition: none; }
}
@keyframes bloom-composer-mic-bars {
  0%, 100% { transform: scaleY(0.4); }
  50% { transform: scaleY(1); }
}
`;
