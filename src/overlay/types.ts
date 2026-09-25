import { type ReactNode } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import { type SharedValue } from 'react-native-reanimated';

export interface OverlayRootProps {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  /**
   * NativeWind / DOM class for the surface's outermost node.
   *
   * A real prop, forwarded to a `styled()` view. Callers used to smuggle it in
   * as `{...({ className } as Record<string, string>)}`, which type-checks
   * against nothing — `OverlayRoot` never destructured it, so `Dialog`'s
   * `containerClassName` reached this component and was dropped on the floor.
   */
  className?: string;
  /**
   * Opt OUT of the open-order stack and pin to a fixed depth. Only the toast
   * layer does this — a notification has to stay visible over whatever is open,
   * including a surface opened after it. Everything else must leave this unset
   * so it stacks by open order; a hand-picked number here is precisely the bug
   * `./stack.ts` exists to remove.
   */
  zIndex?: number;
  /**
   * Android hardware back while this surface is open. A portaled surface is not
   * an RN `Modal`, so nothing else consumes the press: without this the app's
   * own back handling runs and, at the root of a stack, finishes the activity —
   * the surface "closes" by closing the whole app. Called and consumed while the
   * root is mounted; later-opened surfaces register later, and `BackHandler`
   * runs the newest listener first, so the top surface closes first. A blocking
   * surface still passes a handler (a no-op) so the press is swallowed rather
   * than falling through to the screen underneath.
   */
  onRequestClose?: () => void;
  /**
   * The surface is modal: a screen reader must not wander into the app behind
   * it. Two effects:
   *
   *  - Native: sets `accessibilityViewIsModal` on this root, which is the app
   *    content's sibling at the portal outlet (iOS confines VoiceOver to it).
   *  - Every platform: registers the surface as an open modal while mounted
   *    (`./modal-registry.ts`), so the app's `OverlayInertBoundary` hides the
   *    content behind it — the only way to confine TalkBack on Android, and
   *    what makes the content `inert` on web.
   *
   * Dialogs, sheets, the settings modal and the media viewer set it; anchored
   * surfaces (menus, popovers, tooltips), toasts and the shell drawers do not.
   */
  modal?: boolean;
}

export interface OverlayInertBoundaryProps {
  /** The app's own content — everything EXCEPT the `PortalOutlet`. */
  children?: ReactNode;
  /**
   * Native only (web renders no box). Defaults to `flex: 1`; override when the
   * boundary's parent is not a column that the content should fill.
   */
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface BackdropProps {
  /** Dismiss handler. Omit (or pass `disabled`) for a backdrop that only dims. */
  onPress?: () => void;
  /**
   * Fade driver, 0 (hidden) → 1 (fully shown). The backdrop applies it to its
   * OWN layers — see the note on `style` for why the caller must not animate
   * opacity from the outside.
   */
  progress?: SharedValue<number>;
  /** `true` keeps the dim but makes it inert — a blocking dialog, a busy state. */
  disabled?: boolean;
  /** Blur radius behind the dim. `0` renders the dim alone. */
  blurIntensity?: number;
  /** Blur tint. Backdrops dim the app, so `dark` is the default on every theme. */
  blurTint?: 'light' | 'dark' | 'default';
  /** Dim colour over the blur. */
  dimColor?: string;
  /** Dim opacity, 0–1. */
  dimOpacity?: number;
  /**
   * Geometry for the press target: insets, layout. NOT a z-index — where this
   * surface sits relative to others is `OverlayRoot`'s call (see `./stack.ts`),
   * and within the surface the panel is simply rendered after this. NOT opacity
   * either —
   * `backdrop-filter` samples nothing under an ancestor with `opacity < 1`
   * (the group composites in isolation), so a fade applied here silently kills
   * the blur. An `opacity` found in this style is redirected onto the layers;
   * animate the fade through `progress` instead.
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Extra style for the blur + dim LAYERS, for fades a shared value can't
   * express — the web dialog's CSS keyframes, for instance.
   */
  layerStyle?: StyleProp<ViewStyle>;
  /** Rendered ON TOP of the dim, as a sibling of the press target (Dialog's panel does this). */
  children?: ReactNode;
  accessibilityLabel?: string;
  testID?: string;
}
