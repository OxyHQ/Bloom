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
 */
export type SurfaceCapability = 'popup-surface' | 'window';

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
}
