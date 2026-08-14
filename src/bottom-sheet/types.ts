import type React from 'react';
import { View, Platform, type LayoutChangeEvent, type ViewStyle, type StyleProp } from 'react-native';
import Animated, { type AnimatedStyle, type SharedValue } from 'react-native-reanimated';

export interface BottomSheetRef {
    present: () => void;
    dismiss: () => void;
    close: () => void;
    expand: () => void;
    collapse: () => void;
    scrollTo: (y: number, animated?: boolean) => void;
}

export interface BottomSheetProps {
    children: React.ReactNode;
    /**
     * Controlled open state. When provided, the sheet mounts already-open if
     * `true` (seeding its internal visible/rendered state) instead of relying on
     * an imperative `present()` after mount. This is what makes a responsive
     * `Dialog` survive a placement swap (centered card ↔ bottom sheet on resize):
     * the freshly-mounted sheet is visible on its first commit, with no
     * present()-in-effect race that would otherwise leave it blank. Omit for the
     * purely imperative `present()`/`dismiss()` API.
     */
    open?: boolean;
    onDismiss?: () => void;
    enablePanDownToClose?: boolean;
    backgroundComponent?: (props: { style?: StyleProp<ViewStyle> }) => React.ReactElement | null;
    backdropComponent?: (props: { style?: StyleProp<ViewStyle>; onPress?: () => void }) => React.ReactElement | null;
    /**
     * Style applied to the sheet container (the outer Animated.View positioned at
     * the bottom of the screen). Use this to override `maxWidth`, `height`,
     * background color, border radius, etc. Composed AFTER the internal sheet
     * styles so it can override them.
     */
    style?: StyleProp<AnimatedStyle<ViewStyle>>;
    enableHandlePanningGesture?: boolean;
    onDismissAttempt?: () => boolean;
    detached?: boolean; // If true, shows with margins and rounded corners. If false, full width with rounded top only.
    /**
     * Whether to render the built-in (non-interactive) drag handle bar at the top
     * of the sheet. Defaults to `true`. Set to `false` when the consumer renders
     * its own handle (e.g. an interactive close affordance) inside `children`.
     */
    showHandle?: boolean;
    /**
     * Opacity of the dimming backdrop behind the sheet (0–1). Defaults to `0.5`.
     * Set to a higher value (e.g. `0.7`) when the sheet is presented over another
     * bottom sheet (Dialog cases) so the underlying handle/content does not
     * bleed through.
     */
    backdropOpacity?: number;
    /**
     * When `true` (default), children are wrapped in an internal scrollable
     * container — convenient for vertical content that can overflow.
     *
     * Set to `false` when the screen owns its own scrolling primitive
     * (e.g. a `FlatList`, `SectionList`, or any other VirtualizedList).
     * Nesting a VirtualizedList inside the internal ScrollView would break
     * windowing/keyboard handling and trigger a React Native warning. In
     * non-scrollable mode the screen receives the full available height
     * (minus the drag handle) and must manage its own overflow.
     */
    scrollable?: boolean;
    /**
     * When `true`, the body pan uses RNGH's `manualActivation` and only
     * activates when (a) the inner ScrollView is at the top AND (b) the user
     * has moved their finger downward by > 8dp. This is the @gorhom/bottom-sheet
     * coordination model — recommended for sheets containing scrollable content
     * on Android (avoids stealing vertical events from the inner scroller).
     *
     * When `false` (default), the body pan is always active and gates on the
     * scroll offset at `onStart` time. This is the legacy behavior, preserved
     * for backwards compatibility with current bloom consumers.
     *
     * Enabling this also splits the drag handle into its own dedicated,
     * unconditional pan so users can always grab the handle to drag — even
     * when the inner ScrollView is mid-scroll.
     */
    manualActivation?: boolean;
    /**
     * When `true`, the backdrop dims proportionally with drag distance — the
     * overlay fades from full opacity (sheet at rest) to 30% as the sheet is
     * pulled down 40% of the screen height. iOS Photos style. The base
     * `backdropOpacity` still controls the resting dim level.
     *
     * Defaults to `false` (constant opacity during drag).
     */
    dynamicBackdrop?: boolean;
    /**
     * Custom handle slot. When provided, replaces the default drag handle
     * (the 36×5 pill). The rendered handle is wrapped in the dedicated handle
     * gesture detector (when `manualActivation` is `true`) so it remains
     * unconditionally draggable. `showHandle={false}` still suppresses any
     * handle rendering — `handleComponent` is only consulted when
     * `showHandle` is `true`.
     */
    handleComponent?: () => React.ReactNode;
    /**
     * External shared value the internal scroll handler mirrors the content
     * offset into (in addition to its own gesture-gating offset). Lets a host —
     * e.g. a Dialog nav-header — drive a collapse from the sheet's OWN scroller
     * without owning the ScrollView. Optional; the standalone sheet ignores it.
     */
    scrollY?: SharedValue<number>;
    /**
     * Overlay slot rendered absolutely at the TOP of the sheet card, painted
     * above the scrolling body (clipped to the sheet's rounded top). Used by the
     * Dialog to float its sticky nav header over the sheet's scroll content.
     */
    headerOverlay?: React.ReactNode;
    /**
     * Layout callback for the SHEET CARD — the same box `style` targets. Lets a
     * host observe the card's rendered size (the Dialog measures it to morph the
     * sheet between two content frames). Fires on every size change, including
     * while a host animates the card's height.
     */
    onLayout?: (event: LayoutChangeEvent) => void;
}

/**
 * Props consumed by a platform Shell — the outermost wrapper that hosts the
 * sheet body in a full-screen overlay. Native wraps it in RN's `<Modal>` +
 * `<KeyboardProvider>` + `<GestureHandlerRootView>`; web wraps it in bloom's
 * stable DOM `<Portal>` + a fixed `<GestureHandlerRootView>`. Splitting the
 * shell is what lets web avoid RN-Web's `<Modal>`/`ModalPortal`, whose host
 * node is orphaned under React 19 concurrent/StrictMode so the sheet mounts
 * but never paints.
 */
export interface BottomSheetShellProps {
    /** True while the sheet is mounted (open or animating closed). */
    visible: boolean;
    /** Hardware/back-button dismissal request (native `<Modal onRequestClose>`). */
    onRequestClose: () => void;
    /**
     * Live keyboard height, driven by the native shell's keyboard tracker. Web
     * shells ignore it (the browser owns keyboard layout) and it stays `0`.
     */
    keyboardHeight: SharedValue<number>;
    children: React.ReactNode;
}

/**
 * Platform-agnostic bottom-sheet core: all gesture, animation, scroll, and
 * dismissal logic lives here so native and web share ONE implementation. The
 * only thing that differs per platform is the `Shell` (see
 * `BottomSheetShellProps`) — injected by `index.tsx` (native) and
 * `index.web.tsx` (web). This module imports nothing platform-specific
 * (no RN `<Modal>`, no `react-native-keyboard-controller`) so it is safe to
 * bundle on web.
 */
export interface BottomSheetBaseProps extends BottomSheetProps {
    Shell: React.ComponentType<BottomSheetShellProps>;
}
