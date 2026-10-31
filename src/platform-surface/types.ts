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
 * - `pointer`: a pointer (a mouse, a touchpad) drives the platform, though
 *   Bloom is not in a window of its own there (a desktop's shell, its top bar
 *   and dock): controls take a desktop's compact geometry and menus open as a
 *   desktop's (anchored dropdowns, submenus beside their row), as `window`
 *   gives an application.
 * - `appearance`: the platform has an appearance of its own for every
 *   application (`PlatformAppearance`): an accent colour, which seeds Bloom's
 *   palette, and whether transparency is reduced, which draws every blurred
 *   material opaque. Light or dark is not part of it: React Native's
 *   `Appearance` already carries that.
 */
export type SurfaceCapability = 'popup-surface' | 'window' | 'pointer' | 'menu-bar' | 'appearance';

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
  /**
   * A point in the anchor, in layout pixels from its top-left corner, that the
   * popup is placed against instead of the anchor's frame: a context menu opens
   * where the pointer was pressed. `side`, `align` and the offsets apply to it
   * as to a frame of no size. A platform that cannot place a popup at a point
   * never reports `popup-surface` to a context menu.
   */
  point?: { x: number; y: number };
  /**
   * A view beside the popup that the pointer goes on driving while the popup
   * is open: a menu bar, whose titles open their menus in turn as the pointer
   * crosses them, as a Mac's menu bar tracks the pointer with a menu open. The
   * platform delivers the pointer's movement over this view (and over nothing
   * else outside the popup) while the popup holds its input grab; a press there
   * still closes the popup as any press outside it does. A platform that
   * cannot ignores it, and the bar then switches menus by press only.
   */
  trackingRef?: RefObject<ComponentRef<typeof View> | null>;
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
  /**
   * The sizes the window can take: the platform never sizes it outside them
   * (a resize by its edges stops at them, and zoom fills the work area only
   * up to them). Replaces the last. Optional: a platform whose windows take
   * any size leaves it out, and Bloom then asks nothing.
   */
  setSizeLimits?(limits: PlatformWindowSizeLimits): void;
}

/**
 * The sizes a window can take, in layout pixels. A zero is no bound: no
 * minimum beyond the platform's own, no maximum.
 */
export interface PlatformWindowSizeLimits {
  readonly minWidth: number;
  readonly minHeight: number;
  readonly maxWidth: number;
  readonly maxHeight: number;
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
  /**
   * Increase contrast: reduce transparency, and edge every surface with a
   * hairline that holds 3:1 against its body. Optional; absent is false.
   */
  readonly increaseContrast?: boolean;
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
 * One of the person's places (`PlatformFiles.places`): their home, a standard
 * folder in it, or a volume mounted for them (a USB stick, a card).
 */
export interface PlatformPlace {
  readonly kind:
    | 'home'
    | 'desktop'
    | 'documents'
    | 'downloads'
    | 'pictures'
    | 'music'
    | 'videos'
    | 'volume';
  /** The name the platform gives it: the folder's own, a volume's label. */
  readonly name: string;
  /** The folder's `file://` URI, as `expo-file-system`'s `Directory` takes it. */
  readonly uri: string;
}

/** An item in the Trash (`PlatformFiles.trashed`). */
export interface PlatformTrashedItem {
  /** Its `file://` URI in the Trash: what `restore` and `erase` take. */
  readonly uri: string;
  /** Its name where it was. */
  readonly name: string;
  readonly isDirectory: boolean;
  /** Where it was, as a `file://` URI; null when the Trash no longer says. */
  readonly originalUri: string | null;
  /** When it was put in the Trash, in milliseconds since the epoch; null when the Trash does not say. */
  readonly deletedAt: number | null;
  /** Its size in bytes; null for a folder. */
  readonly size: number | null;
  /** When its content last changed, in milliseconds since the epoch. */
  readonly lastModified: number | null;
}

/**
 * Why the platform did not do something to an item:
 *
 * - `not-found`: nothing is there;
 * - `exists`: an item with that name is already where it would go (an item is
 *   never put back over another);
 * - `refused`: the platform does not let an application change it (the home
 *   itself, a volume's root, anything outside the person's files);
 * - `denied`: the file system did not allow it;
 * - `io`: anything else the file system answered.
 */
export type PlatformFileError = 'not-found' | 'exists' | 'refused' | 'denied' | 'io';

/**
 * What came of one item of a request about several: `result` is where the
 * item is now (its URI in the Trash after `trash`, where it was put back after
 * `restore`, its old URI in the Trash after `erase`).
 */
export type PlatformFileOutcome =
  | { readonly uri: string; readonly ok: true; readonly result: string }
  | { readonly uri: string; readonly ok: false; readonly error: PlatformFileError };

/**
 * What the platform asks of an application it started to choose files for
 * another (an open or save panel shown as a sheet of that application's
 * window): `PlatformFileChooser.request`.
 */
export interface PlatformFileChooserRequest {
  /** `open`: existing items are chosen; `save`: the one file to write. */
  readonly mode: 'open' | 'save';
  /** Several items may be chosen (`open`). */
  readonly multiple: boolean;
  /** Folders are chosen, not files (`open`). */
  readonly directory: boolean;
  /**
   * What may be chosen: media types (`image/png`, `image/*`) and extensions
   * (`.png`). Empty: anything.
   */
  readonly types: readonly string[];
  /** The panel's title, when the asker gave one. */
  readonly title: string | null;
  /** The name a `save` panel starts with, when the asker gave one. */
  readonly suggestedName: string | null;
  /** Where to start, as a `file://` URI, when the asker said. */
  readonly folder: string | null;
  /** Who asks: the application whose window the panel is a sheet of, when the platform knows it. */
  readonly application: { readonly id: string; readonly name: string } | null;
}

/**
 * The request the platform started this application to answer, as the
 * person's file chooser (`PlatformFiles.chooser`). The application shows its
 * open or save panel for `request` and answers exactly once.
 */
export interface PlatformFileChooser {
  readonly request: PlatformFileChooserRequest;
  /**
   * The person chose: `file://` URIs (for `save`, the one file to write, its
   * replacing already confirmed by the panel). The platform cites the latest
   * press the application received, then closes the panel.
   */
  choose(uris: readonly string[]): void;
  /** The person cancelled. The platform closes the panel. */
  cancel(): void;
}

/**
 * The person's files beyond what `expo-file-system` reaches, for a platform
 * that has them: their places (a desktop's home, standard folders and
 * volumes) and the Trash every file manager on it shares. Optional and not a
 * capability (it changes no presentation). Without it an application has the
 * folders `expo-file-system` gives it (`Paths.document`) and deletes as that
 * API does, for good.
 *
 * Every URI is `file://`, as `expo-file-system` takes and gives them: an
 * application reads and changes what a place holds through that API, and
 * watches it with `Directory.watch`.
 */
export interface PlatformFiles {
  /** The person's places now: their home, the standard folders in it that exist, the volumes. */
  places(): Promise<readonly PlatformPlace[]>;
  /** Calls `listener` when the places change (a volume mounted or gone); returns the unsubscribe. */
  watchPlaces(listener: () => void): () => void;
  /** Puts items in the Trash; each outcome's `result` is the item's URI there. */
  trash(uris: readonly string[]): Promise<readonly PlatformFileOutcome[]>;
  /** What the Trash holds. */
  trashed(): Promise<readonly PlatformTrashedItem[]>;
  /** Calls `listener` when what the Trash holds changes; returns the unsubscribe. */
  watchTrash(listener: () => void): () => void;
  /** Puts items in the Trash back where they were, never over an item there now. */
  restore(uris: readonly string[]): Promise<readonly PlatformFileOutcome[]>;
  /** Deletes items in the Trash for good. */
  erase(uris: readonly string[]): Promise<readonly PlatformFileOutcome[]>;
  /** Deletes everything in the Trash for good. */
  emptyTrash(): Promise<void>;
  /**
   * Present only in an application the platform started as the person's file
   * chooser (a file manager in its picker mode): the request it answers.
   */
  readonly chooser?: PlatformFileChooser;
}

/**
 * A host platform's surfaces, registered with `BloomProvider platform={…}`
 * (or `PlatformSurfaceProvider`) by the runtime that runs the application. A
 * `BloomProvider` with no `platform` of its own keeps the one around it, so an
 * application's own provider never hides its runtime's adapter.
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
  /** The person's places and the Trash, where the platform has them. */
  readonly files?: PlatformFiles;
}
