import type { ComponentRef, ComponentType, ReactNode, RefObject } from 'react';
import type { View } from 'react-native';
import type { FloatingAlign, FloatingSide } from '../floating/types';

/**
 * What a host platform can show outside an application's own layout.
 *
 * - `popup-surface`: an anchored panel in a surface of the platform's own (an
 *   OxyOS compositor popup), which may extend beyond the application window.
 */
export type SurfaceCapability = 'popup-surface';

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
}
