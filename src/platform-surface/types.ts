import type { ComponentRef, ComponentType, ReactNode, RefObject } from 'react';
import type { View } from 'react-native';
import type { FloatingAlign, FloatingSide } from '../floating/types';

/**
 * What a host platform can show outside an application's own layout.
 *
 * - `popup-surface`: an anchored panel in a surface of the platform's own (an
 *   OxyOS compositor popup), which may extend beyond the application window.
 * - `window`: the application runs in a desktop window that has controls
 *   (close, minimize, zoom) in its top leading corner, and can be moved,
 *   zoomed and minimized. Bloom keeps the controls' room and, where the
 *   platform asks it to, draws them (`@oxy.so/bloom/window`).
 * - `menu-bar`: the platform shows the active window's menus in a bar of its
 *   own (the top of the screen, as on a Mac). A `Menubar` then draws nothing in
 *   the window: it describes its menus to the platform (`PlatformMenuBar`) and
 *   runs the item the person chooses there.
 * - `appearance`: the platform has an appearance of its own for every
 *   application (`PlatformAppearance`): an accent colour, which seeds Bloom's
 *   palette, and whether transparency is reduced, which draws every blurred
 *   material opaque. Light or dark is not part of it: React Native's
 *   `Appearance` already carries that.
 */
export type SurfaceCapability = 'popup-surface' | 'window' | 'menu-bar' | 'appearance';

/** Why the platform closed a popup without the application asking. */
export type PopupDismissReason =
  /** A press outside the popup and its parents. */
  | 'outside-press'
  /** The platform refused the popup's input grab. */
  | 'denied'
  /** The parent went away, was hidden, the session locked, or similar. */
  | 'closed';

/**
 * Props of an adapter's `PopupSurface`. Placement uses Bloom's own vocabulary
 * (`FloatingPositionProps`); the platform turns it into its positioner and
 * keeps the panel on screen (flip on the side axis, slide on the other).
 */
export interface PopupSurfaceProps {
  /** The view the popup is anchored to (the trigger). */
  anchorRef: RefObject<ComponentRef<typeof View> | null>;
  side: FloatingSide;
  align: FloatingAlign;
  sideOffset: number;
  alignOffset: number;
  /** Accessible role of the popup's content. */
  role: 'menu' | 'listbox' | 'dialog';
  /** Accessible name. */
  label?: string;
  /** Called once when the platform closes the popup itself. */
  onDismiss: (reason: PopupDismissReason) => void;
  /**
   * Keys pressed while the popup has keyboard focus, as W3C `KeyboardEvent.key`
   * names (`ArrowDown`, `Enter`, `Escape`, … or the typed character). A platform
   * without a keyboard never calls it.
   */
  onKey?: (key: string) => void;
  testID?: string;
  /** The panel, sized by its own content. */
  children: ReactNode;
}

/**
 * Where a window's controls are, the same for every application on the
 * platform. Lengths are in layout pixels from the window's top and from its
 * LEADING edge: the left in a left-to-right locale, the right in a
 * right-to-left one.
 */
export interface PlatformWindowMetrics {
  /** The controls' group: three targets of equal size, evenly spaced across `width`. */
  readonly controls: {
    readonly start: number;
    readonly top: number;
    readonly width: number;
    readonly height: number;
  };
  /** The room the content keeps clear for them. */
  readonly room: { readonly top: number; readonly leading: number };
  /** The window's corner radius, for panels concentric with it. */
  readonly radius: number;
}

/** What the platform tells a window about itself. */
export interface PlatformWindowState {
  /** The active window: it, or one of its popups or dialogs, has the keyboard focus. */
  readonly active: boolean;
  /** Zoomed to fill the work area. */
  readonly maximized: boolean;
  /** Full screen: no controls and no room. */
  readonly fullscreen: boolean;
}

/**
 * The application's window, with the `window` capability. Its state is an
 * external store (`getState` + `subscribe`, as `useSyncExternalStore` reads
 * it); the actions are requests the platform carries out.
 */
export interface PlatformWindow {
  /**
   * Who draws the controls: `bloom` draws them inside the application, in the
   * platform's place (OxyOS); `platform` draws its own (a Mac's traffic
   * lights, a browser's over an installed web application) and Bloom only
   * keeps their room.
   */
  readonly controls: 'bloom' | 'platform';
  readonly metrics: PlatformWindowMetrics;
  getState(): PlatformWindowState;
  /** Calls `listener` whenever `getState()` changes; returns the unsubscribe. */
  subscribe(listener: () => void): () => void;
  /** The application's close request (the close control). */
  close(): void;
  minimize(): void;
  /** Maximize, or restore the frame the window had. */
  zoom(): void;
  /** Start an interactive move from the press being handled. */
  startMove(): void;
}

/**
 * One entry of a menu the platform shows (`PlatformMenuBar`). Plain data: the
 * platform draws it and reports a choice by `id`; it never runs anything.
 *
 * - `item`: a command. `label` is its text, `shortcut` its key chord in Bloom's
 *   spelling (`Mod+Shift+Z`, see `PlatformMenuBar`), `checked` its state when it
 *   is a check item or one item of a radio group (absent on a plain command).
 * - `submenu`: a nested menu, opened from a row labelled `label`.
 * - `separator`: a rule between groups of entries.
 *
 * `enabled` is false for an entry that cannot be chosen now, including every
 * entry under a disabled submenu or menu. A menu's group label (`MenubarLabel`)
 * is described as an item that is never enabled.
 */
export type PlatformMenuItem =
  | {
      readonly kind: 'item';
      readonly id: string;
      readonly label: string;
      readonly enabled: boolean;
      readonly shortcut?: string;
      /** Check items and radio items only. */
      readonly checked?: boolean;
    }
  | {
      readonly kind: 'submenu';
      readonly id: string;
      readonly label: string;
      readonly enabled: boolean;
      readonly items: readonly PlatformMenuItem[];
    }
  | { readonly kind: 'separator' };

/** One menu of the bar: `File`, `Edit`, … in the order the application declares them. */
export interface PlatformMenu {
  readonly id: string;
  readonly label: string;
  readonly items: readonly PlatformMenuItem[];
}

/**
 * The platform's menu bar, with the `menu-bar` capability: the bar at the top
 * of the screen that shows the active window's menus (OxyOS's shell, a Mac's
 * `NSMenu`).
 *
 * Ids are Bloom's own, stable for as long as the entry is mounted, and unique
 * in the window. A shortcut is a chord (`Mod+N`, `Mod+Shift+Z`): `+`-separated
 * modifiers out of `Mod` (the platform's command modifier: ⌘ on Apple
 * platforms, Ctrl elsewhere), `Ctrl`, `Alt`, `Shift` and `Meta`, in that
 * order, then one key (a character, upper case for a letter, or a W3C
 * `KeyboardEvent.key` name such as `Enter`, `ArrowUp`, `F5`; `Space` and
 * `Plus` for those two). The platform only SHOWS a shortcut: Bloom matches the
 * window's keys itself and runs the item, so the platform must never run an
 * item for a key of its own.
 */
export interface PlatformMenuBar {
  /** The window's menus now; replaces the last. An empty list: none. */
  setMenus(menus: readonly PlatformMenu[]): void;
  /**
   * An item the person chose in the platform's bar, by the id Bloom gave it.
   * Returns the unsubscribe. An id Bloom no longer has, or a disabled item's,
   * is ignored.
   */
  onActivate(listener: (id: string) => void): () => void;
}

/**
 * A key press as the platform reports it: W3C `KeyboardEvent`'s fields, the
 * shape React Native's own key events carry.
 */
export interface PlatformKeyEvent {
  /** `KeyboardEvent.key`: `n`, `N`, `Enter`, `ArrowDown`, … */
  readonly key: string;
  /** `KeyboardEvent.code`, the physical key (`KeyN`), when the platform knows it. */
  readonly code?: string;
  readonly altKey: boolean;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
  readonly shiftKey: boolean;
  /** Held down and repeating. */
  readonly repeat?: boolean;
  /** Part of an input method's composition. */
  readonly isComposing?: boolean;
}

/**
 * The window's key presses, for a platform whose keys do not reach Bloom
 * through a DOM `document` (a native host). Optional and not a capability: it
 * changes no presentation. Without it Bloom listens on the `document` where
 * there is one (the web) and hears no window-wide keys elsewhere.
 */
export interface PlatformKeyboard {
  /**
   * Calls `listener` with each key press in the window, BEFORE the focused
   * view receives it (as a Mac's menu bar sees key equivalents first). It
   * returns true when Bloom took the key (a menu's shortcut ran): the platform
   * then does not deliver it to the focused view. Returns the unsubscribe.
   */
  subscribe(listener: (event: PlatformKeyEvent) => boolean): () => void;
}

/** What the platform's appearance is now (`PlatformAppearance.getState`). */
export interface PlatformAppearanceState {
  /**
   * The person's accent, by the name of one of Bloom's colour presets
   * (`APP_COLOR_PRESETS`: `oxy`, `blue`, `purple`, `pink`, …), or null for
   * none. A name Bloom does not know is treated as none.
   */
  readonly accent: string | null;
  /** Draw every blurred material opaque, with no backdrop blur. */
  readonly reduceTransparency: boolean;
}

/**
 * The platform's appearance, with the `appearance` capability: what it asks
 * every application to look like beyond light or dark (which React Native's
 * `Appearance` and `useColorScheme` carry). An external store (`getState` +
 * `subscribe`, as `useSyncExternalStore` reads it): a change applies at once,
 * with no restart.
 */
export interface PlatformAppearance {
  getState(): PlatformAppearanceState;
  /** Calls `listener` whenever `getState()` changes; returns the unsubscribe. */
  subscribe(listener: () => void): () => void;
}

/**
 * A host platform's surfaces, registered with `BloomProvider platform={…}`.
 *
 * Bloom stays free of any platform's protocol: an adapter reports what it can
 * do and supplies the components that do it. A capability the adapter does
 * not report is never used, and the family keeps its default presentation (a
 * native menu stays a bottom sheet).
 */
export interface PlatformSurfaceAdapter {
  /** The platform's name, for diagnostics. */
  readonly platform: string;
  readonly capabilities: ReadonlySet<SurfaceCapability>;
  /**
   * Required with `popup-surface`. Renders its children in a popup of the
   * platform, in the SAME React tree: providers, theme, locale and state reach
   * the panel as they reach any child. Mounted while the popup is open.
   */
  readonly PopupSurface?: ComponentType<PopupSurfaceProps>;
  /** Required with `window`: the application's window. */
  readonly window?: PlatformWindow;
  /** Required with `menu-bar`: the platform's bar that shows this window's menus. */
  readonly menuBar?: PlatformMenuBar;
  /** Required with `appearance`: the accent and reduce transparency every application follows. */
  readonly appearance?: PlatformAppearance;
  /** The window's key presses, where they do not arrive through a DOM `document`. */
  readonly keyboard?: PlatformKeyboard;
}
