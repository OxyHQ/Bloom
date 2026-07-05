import type React from 'react';
import { forwardRef, useImperativeHandle, useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
    View,
    StyleSheet,
    Modal,
    Pressable,
    Dimensions,
    Platform,
    type ViewStyle,
    type StyleProp,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView, type GestureType } from 'react-native-gesture-handler';
import { Z_INDEX } from '../styles/z-index';
import Animated, {
    interpolate,
    runOnJS,
    type SharedValue,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/use-theme';

// Keyboard handling — only on native platforms. On web, keyboard events are
// handled by the browser. `react-native-keyboard-controller` is an OPTIONAL
// dependency: it is lazily `require`d below and everything no-ops when it is
// absent (or on web).
const noopKeyboardHandler = (_handlers: Record<string, (e: { height: number }) => void>, _deps: unknown[]) => {};
let useKeyboardHandler: (handlers: Record<string, (e: { height: number }) => void>, deps: unknown[]) => void = noopKeyboardHandler;

// react-native-keyboard-controller's <KeyboardProvider>. We re-establish it
// INSIDE the sheet's RN <Modal> (see the render below): a <Modal> mounts into
// its OWN native root, and neither the app-root GestureHandlerRootView nor the
// app-root KeyboardProvider's native KeyboardControllerView extend across that
// boundary. Without a provider inside the Modal, keyboard-controller consumers
// (this sheet's keyboard tracker, plus any TextInputs in `children`) read the
// default empty KeyboardContext — logging "Couldn't find real values for
// KeyboardContext ..." — and receive no keyboard insets. When the optional
// module is absent, or on web (no RN Modal native-window boundary, keyboard is
// the browser's concern), this resolves to a passthrough that just renders its
// children, so no provider is introduced where one isn't needed.
const PassthroughKeyboardProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
let KeyboardProvider: React.ComponentType<{ children: React.ReactNode }> = PassthroughKeyboardProvider;

if (Platform.OS !== 'web' && typeof require !== 'undefined') {
    try {
        const moduleName = 'react-native-keyboard-controller';
        const keyboardController = require(moduleName);
        useKeyboardHandler = keyboardController.useKeyboardHandler ?? noopKeyboardHandler;
        KeyboardProvider = keyboardController.KeyboardProvider ?? PassthroughKeyboardProvider;
    } catch {
        // react-native-keyboard-controller not available — keep the no-op
        // handler and passthrough provider.
    }
}

/**
 * Registers the sheet's keyboard-height tracker. It lives in its own tiny
 * component — rendered INSIDE the Modal, under the re-established
 * <KeyboardProvider> — so `useKeyboardHandler` reads the in-Modal
 * KeyboardContext whose native KeyboardControllerView actually receives the
 * Modal window's keyboard insets (the app-root provider does not cross the
 * Modal's native-window boundary). It writes the live keyboard height into the
 * shared value that drives the sheet's translate/height styles. Renders
 * nothing. No-ops when react-native-keyboard-controller isn't installed / on
 * web (`useKeyboardHandler` is the module-level no-op there).
 */
function SheetKeyboardSync({ keyboardHeight }: { keyboardHeight: SharedValue<number> }) {
    useKeyboardHandler({
        onMove: (e) => {
            'worklet';
            keyboardHeight.value = e.height;
        },
        onEnd: (e) => {
            'worklet';
            keyboardHeight.value = e.height;
        },
    }, []);
    return null;
}

/** Hook that returns current screen dimensions and updates on rotation/resize. */
function useScreenDimensions() {
    const [dimensions, setDimensions] = useState(() => Dimensions.get('window'));

    useEffect(() => {
        const subscription = Dimensions.addEventListener('change', ({ window }) => {
            setDimensions(window);
        });
        return () => subscription.remove();
    }, []);

    return dimensions;
}

const SPRING_CONFIG = {
    damping: 25,
    stiffness: 300,
    mass: 0.8,
};

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
    style?: StyleProp<ViewStyle>;
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
}

const BottomSheet = forwardRef((props: BottomSheetProps, ref: React.ForwardedRef<BottomSheetRef>) => {
    const {
        children,
        onDismiss,
        enablePanDownToClose = true,
        backgroundComponent,
        backdropComponent,
        style,
        enableHandlePanningGesture = true,
        onDismissAttempt,
        detached = false,
        showHandle = true,
        backdropOpacity = 0.5,
        scrollable = true,
        manualActivation = false,
        dynamicBackdrop = false,
        handleComponent,
    } = props;

    const insets = useSafeAreaInsets();
    const theme = useTheme();
    const { colors } = theme;
    const { height: screenHeight } = useScreenDimensions();
    const [visible, setVisible] = useState(false);
    const [rendered, setRendered] = useState(false); // keep mounted for exit animation
    const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hasClosedRef = useRef(false);
    const scrollViewRef = useRef<Animated.ScrollView>(null);
    /**
     * Monotonically increasing counter that identifies "the current close
     * attempt". Bumped every time the sheet re-opens (`present()`), so any
     * in-flight `withTiming` completion callback or fallback timer from a
     * PREVIOUS close cycle becomes a no-op. Without this guard, a stale
     * `runOnJS(finishClose)` from an aborted close would fire `onDismiss`
     * and unmount the sheet immediately after the user opens it again,
     * causing "tap to open does nothing" reports in production.
     */
    const closeGenerationRef = useRef(0);

    const screenHeightSV = useSharedValue(screenHeight);
    // Keep shared value in sync when screen dimensions change (rotation/resize)
    useEffect(() => {
        screenHeightSV.value = screenHeight;
    }, [screenHeight, screenHeightSV]);

    const translateY = useSharedValue(screenHeight);
    const opacity = useSharedValue(0);
    const scrollOffsetY = useSharedValue(0);
    const isScrollAtTop = useSharedValue(true);
    const allowPanClose = useSharedValue(true);
    const keyboardHeight = useSharedValue(0);
    // Stores the sheet's `translateY` captured at the moment a pan gesture
    // begins, so `onUpdate` can offset from the starting position. This MUST
    // be a primitive shared value, not an object-valued one. Under
    // react-native-worklets 0.8.x (Reanimated 4), assigning a fresh object
    // literal to an object-valued shared value's `.value` inside a worklet
    // freezes the object (`freezeObjectInDev`) and routes the mutation through
    // the serializer's listener machinery — which then tries to call the
    // non-worklet `removeListener` synchronously on the UI thread and crashes
    // ("Tried to synchronously call a non-worklet function `removeListener`").
    // A scalar shared value sidesteps all object serialization.
    const contextY = useSharedValue(0);
    // Mirror of `closeGenerationRef` for worklet access. Bumped from the JS
    // thread in lockstep with the ref so gesture worklets always see the
    // current generation when they snapshot it on `onEnd`.
    const closeGeneration = useSharedValue(0);
    // Used by `manualActivation` body pan to track the touch's initial Y so
    // it can compute downward distance for the activation decision.
    const touchStartY = useSharedValue(0);

    // Refs used to mark the handle pan and the body pan as mutually
    // simultaneous (manualActivation mode only). Without this RNGH treats them
    // as racing gestures and a touch that begins in the handle area could be
    // claimed by whichever recognizer activates first — leading to
    // inconsistent drag start.
    const bodyPanRef = useRef<GestureType | undefined>(undefined);
    const handlePanRef = useRef<GestureType | undefined>(undefined);

    // The sheet's keyboard-height tracker is registered by <SheetKeyboardSync>,
    // rendered INSIDE the Modal under the re-established <KeyboardProvider> (see
    // the render tree below). It must NOT be called here in the component body:
    // this body runs OUTSIDE the Modal, where the keyboard-controller provider
    // that actually receives the Modal window's insets is not reachable.

    // Dismiss callbacks
    const safeClose = useCallback(() => {
        if (onDismissAttempt?.()) {
            onDismiss?.();
        } else if (!onDismissAttempt) {
            onDismiss?.();
        }
    }, [onDismissAttempt, onDismiss]);

    // Mirror `safeClose` and `rendered` into refs so the unmount cleanup can
    // fire the latest dismiss callback when needed, without re-binding the
    // cleanup effect on every render.
    const safeCloseRef = useRef(safeClose);
    useEffect(() => {
        safeCloseRef.current = safeClose;
    }, [safeClose]);
    const renderedRef = useRef(rendered);
    useEffect(() => {
        renderedRef.current = rendered;
    }, [rendered]);

    /**
     * Commit a close. Two guards prevent stale callbacks from firing:
     *   1. `hasClosedRef` — protects against the fallback timer AND the
     *      animation callback both racing to call us within a single close
     *      cycle.
     *   2. `generation` — protects against a callback from a PREVIOUS close
     *      cycle firing AFTER the user reopened. If the live generation has
     *      advanced past the one captured when the close started, this
     *      callback is from a cycle that the user has implicitly cancelled
     *      by reopening — silently drop it.
     */
    const finishClose = useCallback((generation: number) => {
        if (closeGenerationRef.current !== generation) return;
        if (hasClosedRef.current) return;
        hasClosedRef.current = true;
        safeClose();
        setRendered(false);
    }, [safeClose]);

    useEffect(() => {
        if (visible) {
            if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
                closeTimeoutRef.current = null;
            }
            hasClosedRef.current = false;
            // Bump generation: any pending close-completion callback from a
            // prior cycle (animation or fallback timer) will now no-op when
            // it eventually fires, because its captured generation is stale.
            closeGenerationRef.current += 1;
            closeGeneration.value = closeGenerationRef.current;
            opacity.value = withTiming(1, { duration: 250 });
            translateY.value = withSpring(0, SPRING_CONFIG);
        } else if (rendered) {
            // Capture the generation for THIS close cycle so the animation
            // callback (running on the UI thread, scheduled back to JS) and
            // the fallback timer agree on which cycle they belong to.
            const generation = closeGenerationRef.current;
            opacity.value = withTiming(0, { duration: 250 }, (finished) => {
                if (finished) {
                    runOnJS(finishClose)(generation);
                }
            });
            translateY.value = withSpring(screenHeight, { ...SPRING_CONFIG, stiffness: 250 });

            // Fallback timer to ensure close completes (especially on web
            // where reanimated callbacks occasionally drop on tab blur).
            if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
            }
            closeTimeoutRef.current = setTimeout(() => {
                finishClose(generation);
                closeTimeoutRef.current = null;
            }, 300);
        }
    }, [visible, rendered, finishClose, screenHeight, closeGeneration, opacity, translateY]);

    // On unmount: ensure pending close callbacks (e.g. consumer's `onDismiss`)
    // still fire if the BS is yanked mid-animation by a parent re-render.
    // Without this, `Dialog`'s `handleDismiss` never runs and queued
    // callbacks (post-close handlers) are silently lost.
    // Only fires when the sheet was actually rendered (open or closing) to
    // avoid spuriously calling onDismiss on bare unmount of a never-opened
    // sheet. Refs are read inside the cleanup, so latest values are captured.
    useEffect(() => () => {
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }
        if (renderedRef.current && !hasClosedRef.current) {
            hasClosedRef.current = true;
            safeCloseRef.current();
        }
    }, []);

    // Apply web scrollbar styles when colors change; clean up on unmount
    useEffect(() => {
        if (Platform.OS === 'web') {
            createWebScrollbarStyle(colors.border);
        }
        return () => {
            removeWebScrollbarStyle();
        };
    }, [colors.border]);

    const present = useCallback(() => {
        setRendered(true);
        setVisible(true);
    }, []);
    const dismiss = useCallback(() => {
        setVisible(false);
    }, []);

    const scrollTo = useCallback((y: number, animated = true) => {
        scrollViewRef.current?.scrollTo({ y, animated });
    }, []);

    useImperativeHandle(ref, () => ({
        present,
        dismiss,
        close: dismiss,
        expand: present,
        collapse: dismiss,
        scrollTo,
    }), [present, dismiss, scrollTo]);

    const nativeGesture = useMemo(() => Gesture.Native(), []);

    // Body pan — two strategies, switched by `manualActivation`.
    //
    // (1) Legacy mode (`manualActivation: false`, the bloom 0.3.x default):
    //     Pan is always active. We snapshot the scroll offset at `onStart`
    //     and gate movement on `scrollOffsetY <= 8` during the gesture.
    //     This is what current bloom consumers expect.
    //
    // (2) gorhom-style mode (`manualActivation: true`):
    //     Pan uses `manualActivation(true)` and only flips to active when
    //     the inner ScrollView is at the top AND the user has moved their
    //     finger downward > 8dp. In every other case it fails, so the
    //     ScrollView keeps full ownership of the touch. This is the only
    //     RNGH 2.x pattern that does not steal vertical events from the
    //     inner scroller on Android. Required for FileManagement /
    //     PhotoPicker style sheets.
    const panGesture = useMemo(() => {
        if (manualActivation) {
            return Gesture.Pan()
                .enabled(enablePanDownToClose)
                .withRef(bodyPanRef)
                .manualActivation(true)
                .simultaneousWithExternalGesture(scrollViewRef, handlePanRef)
                .onTouchesDown((e) => {
                    'worklet';
                    const t = e.changedTouches[0];
                    if (t) touchStartY.value = t.absoluteY;
                    contextY.value = translateY.value;
                })
                .onTouchesMove((e, state) => {
                    'worklet';
                    const t = e.changedTouches[0];
                    if (!t) return;
                    const dy = t.absoluteY - touchStartY.value;
                    const atTop = scrollOffsetY.value <= 4;
                    // Activate only when (at scroll top) AND (finger has moved
                    // downward by > 8dp). Any other motion: fail so the
                    // ScrollView claims the gesture.
                    if (atTop && dy > 8) {
                        state.activate();
                    } else if (dy < -4 || !atTop) {
                        state.fail();
                    }
                })
                .onUpdate((event) => {
                    'worklet';
                    if (event.translationY < 0) return;
                    const newTranslateY = contextY.value + event.translationY;
                    if (newTranslateY >= 0) {
                        translateY.value = newTranslateY;
                    }
                })
                .onEnd((event) => {
                    'worklet';
                    const velocity = event.velocityY;
                    const distance = translateY.value;
                    const closeThreshold = Math.max(140, screenHeightSV.value * 0.25);
                    const fastSwipeThreshold = 900;
                    const shouldClose =
                        velocity > fastSwipeThreshold ||
                        (distance > closeThreshold && velocity > -300);

                    if (shouldClose) {
                        // Snapshot the generation on the UI thread at the
                        // moment the close gesture commits. The completion
                        // callback only fires `finishClose` if no reopen
                        // bumped the generation in between.
                        const generation = closeGeneration.value;
                        translateY.value = withSpring(screenHeightSV.value, { ...SPRING_CONFIG, velocity });
                        opacity.value = withTiming(0, { duration: 250 }, (finished) => {
                            if (finished) runOnJS(finishClose)(generation);
                        });
                    } else {
                        translateY.value = withSpring(0, { ...SPRING_CONFIG, velocity });
                    }
                });
        }

        // Legacy always-active pan (bloom 0.3.x behaviour).
        return Gesture.Pan()
            .enabled(enablePanDownToClose)
            .simultaneousWithExternalGesture(nativeGesture)
            .onStart(() => {
                'worklet';
                contextY.value = translateY.value;
                allowPanClose.value = scrollOffsetY.value <= 8;
            })
            .onUpdate((event) => {
                'worklet';
                if (!allowPanClose.value) {
                    return;
                }
                const newTranslateY = contextY.value + event.translationY;
                // If user is scrolling down while content isn't at (or near) the top, let ScrollView handle it
                const atTopOrNearTop = scrollOffsetY.value <= 8; // slightly larger tolerance for smoother handoff
                if (event.translationY > 0 && !atTopOrNearTop) {
                    return;
                }
                if (newTranslateY >= 0) {
                    translateY.value = newTranslateY;
                } else if (detached) {
                    // Only allow overdrag (pulling up beyond top) when detached
                    translateY.value = newTranslateY * 0.3;
                } else {
                    // In normal mode, prevent overdrag - clamp to 0
                    translateY.value = 0;
                }
            })
            .onEnd((event) => {
                'worklet';
                if (!allowPanClose.value) {
                    return;
                }
                const velocity = event.velocityY;
                const distance = translateY.value;
                // Require a deeper pull to close (more like native bottom sheets)
                const closeThreshold = Math.max(140, screenHeightSV.value * 0.25);
                const fastSwipeThreshold = 900;
                const shouldClose =
                    velocity > fastSwipeThreshold ||
                    (distance > closeThreshold && velocity > -300);

                if (shouldClose) {
                    const generation = closeGeneration.value;
                    translateY.value = withSpring(screenHeightSV.value, {
                        ...SPRING_CONFIG,
                        velocity: velocity,
                    });
                    opacity.value = withTiming(0, { duration: 250 }, (finished) => {
                        if (finished) {
                            runOnJS(finishClose)(generation);
                        }
                    });
                } else {
                    translateY.value = withSpring(0, {
                        ...SPRING_CONFIG,
                        velocity: velocity,
                    });
                }
            });
        // Shared values are stable refs; the listed deps are the only JS-side
        // values that change the gesture's behavior. `finishClose` is stable
        // (useCallback with stable deps).
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enablePanDownToClose, detached, manualActivation, nativeGesture, finishClose]);

    // Dedicated handle pan — only built in `manualActivation` mode. Always
    // active so users can drag the handle even while content is mid-scroll.
    // In legacy mode the body pan already wraps the whole sheet (handle
    // included), so no separate gesture is needed.
    const handlePanGesture = useMemo(() => {
        if (!manualActivation) return undefined;
        return Gesture.Pan()
            .enabled(enablePanDownToClose && enableHandlePanningGesture)
            .withRef(handlePanRef)
            .simultaneousWithExternalGesture(bodyPanRef)
            .activeOffsetY([-8, 8])
            .onStart(() => {
                'worklet';
                contextY.value = translateY.value;
            })
            .onUpdate((event) => {
                'worklet';
                const newTranslateY = contextY.value + event.translationY;
                if (newTranslateY >= 0) {
                    translateY.value = newTranslateY;
                } else if (detached) {
                    translateY.value = newTranslateY * 0.3;
                } else {
                    translateY.value = 0;
                }
            })
            .onEnd((event) => {
                'worklet';
                const velocity = event.velocityY;
                const distance = translateY.value;
                const closeThreshold = Math.max(140, screenHeightSV.value * 0.25);
                const fastSwipeThreshold = 900;
                const shouldClose =
                    velocity > fastSwipeThreshold ||
                    (distance > closeThreshold && velocity > -300);

                if (shouldClose) {
                    const generation = closeGeneration.value;
                    translateY.value = withSpring(screenHeightSV.value, { ...SPRING_CONFIG, velocity });
                    opacity.value = withTiming(0, { duration: 250 }, (finished) => {
                        if (finished) runOnJS(finishClose)(generation);
                    });
                } else {
                    translateY.value = withSpring(0, { ...SPRING_CONFIG, velocity });
                }
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [manualActivation, enablePanDownToClose, enableHandlePanningGesture, detached, finishClose]);

    // `opacity.value` drives the fade in/out (0 -> 1). `backdropOpacity` is the
    // final dim level once fully visible. We multiply so the consumer-provided
    // dim opacity applies smoothly across the animation. When
    // `dynamicBackdrop` is enabled, the dim also fades proportionally with
    // drag distance (iOS Photos style).
    const backdropStyle = useAnimatedStyle(() => {
        const dragFactor = dynamicBackdrop
            ? interpolate(
                translateY.value,
                [0, screenHeightSV.value * 0.4],
                [1, 0.3],
                'clamp',
            )
            : 1;
        return {
            opacity: opacity.value * backdropOpacity * dragFactor,
        };
    }, [backdropOpacity, dynamicBackdrop]);

    const sheetStyle = useAnimatedStyle(() => {
        const scale = interpolate(translateY.value, [0, screenHeightSV.value], [1, 0.95]);
        return {
            transform: [
                { translateY: translateY.value - keyboardHeight.value },
                { scale },
            ],
        };
    }, []);

    const sheetHeightStyle = useAnimatedStyle(() => ({
        maxHeight: screenHeightSV.value - keyboardHeight.value - insets.top - (detached ? insets.bottom + 16 : 0),
    }), [insets.top, insets.bottom, detached]);

    const sheetMarginStyle = useAnimatedStyle(() => {
        // Only add margin when detached, otherwise extend behind safe area
        if (detached) {
            return {
                marginBottom: keyboardHeight.value > 0 ? 16 : insets.bottom + 16,
            };
        }
        return {
            marginBottom: 0,
        };
    }, [insets.bottom, detached]);

    const handleBackdropPress = useCallback(() => {
        // Always animate close on backdrop press
        if (onDismissAttempt && !onDismissAttempt()) {
            return;
        }
        dismiss();
    }, [onDismissAttempt, dismiss]);

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollOffsetY.value = event.contentOffset.y;
            isScrollAtTop.value = event.contentOffset.y <= 0;
        },
    }, []);

    const dynamicStyles = useMemo(() => {
        return StyleSheet.create({
            handle: {
                ...styles.handle,
                backgroundColor: theme.isDark ? '#444' : '#C7C7CC',
            },
            sheet: {
                ...styles.sheet,
                backgroundColor: colors.background,
                ...(detached ? styles.sheetDetached : styles.sheetNormal),
            },
            scrollContent: {
                ...styles.scrollContent,
                // In normal mode, don't add padding here - screens handle their own padding
                // The sheet extends behind safe area, and screens add padding as needed
            },
        });
    }, [colors.background, theme.isDark, detached]);

    if (!rendered) return null;

    // Default handle render — used when `handleComponent` is not provided.
    const renderDefaultHandle = () => <View style={dynamicStyles.handle} />;
    const handleNode = showHandle ? (handleComponent ? handleComponent() : renderDefaultHandle()) : null;

    // In `manualActivation` mode the handle gets its own gesture detector
    // sitting in a dedicated absolutely-positioned hit area at the top of the
    // sheet. In legacy mode the handle is rendered inline as a decorative
    // overlay (the body pan covers the entire sheet, handle included).
    const handleSlot = handleNode && manualActivation && handlePanGesture ? (
        <GestureDetector gesture={handlePanGesture}>
            <View style={styles.handleHitArea} accessible accessibilityRole="adjustable">
                {handleNode}
            </View>
        </GestureDetector>
    ) : handleNode;

    // Inner content: scrollable wraps in Animated.ScrollView, non-scrollable
    // renders children directly. In legacy mode the scrollview is also
    // wrapped in the `nativeGesture` detector for scroll/pan coordination.
    const scrollViewNode = (
        <Animated.ScrollView
            ref={scrollViewRef}
            style={[
                styles.scrollView,
                Platform.OS === 'web' && ({
                    scrollbarWidth: 'thin',
                    scrollbarColor: `${colors.border} transparent`,
                } as ViewStyle),
            ]}
            contentContainerStyle={dynamicStyles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            {...(Platform.OS === 'web' ? { className: 'bottom-sheet-scrollview' } : undefined)}
            onLayout={() => {
                if (Platform.OS === 'web') {
                    createWebScrollbarStyle(colors.border);
                }
            }}
        >
            {children}
        </Animated.ScrollView>
    );

    const bodyContent = scrollable
        ? (manualActivation
            // In manualActivation mode the scroll view is referenced by the
            // pan's simultaneous list directly; no wrapping native gesture.
            ? scrollViewNode
            // Legacy mode: native gesture wraps the scroll view to coordinate
            // with the always-active body pan.
            : <GestureDetector gesture={nativeGesture}>{scrollViewNode}</GestureDetector>)
        : <View style={styles.nonScrollableContent}>{children}</View>;

    return (
        <Modal visible={rendered} transparent animationType="none" statusBarTranslucent onRequestClose={dismiss}>
            {/* RN's <Modal> mounts into its OWN native root, so the app-root
                react-native-keyboard-controller <KeyboardProvider> does not
                reach this subtree. Re-establish a provider here so the sheet's
                own keyboard tracker (<SheetKeyboardSync>) AND any TextInputs in
                `children` find a real KeyboardContext + receive the Modal
                window's keyboard insets. Resolves to a passthrough on web / when
                the optional module isn't installed (see resolution above). */}
            <KeyboardProvider>
                <SheetKeyboardSync keyboardHeight={keyboardHeight} />
                {/* RN's Modal renders into its own native window. The app-root
                    GestureHandlerRootView does NOT extend into it, so pan
                    gestures silently no-op without this wrapper. */}
                <GestureHandlerRootView style={styles.rootView}>
                    <View style={StyleSheet.absoluteFill}>
                        <Animated.View style={[styles.backdrop, backdropStyle]}>
                            {backdropComponent ? (
                                backdropComponent({ onPress: handleBackdropPress })
                            ) : (
                                <Pressable style={styles.backdropTouchable} onPress={handleBackdropPress}>
                                    <View style={StyleSheet.absoluteFill} />
                                </Pressable>
                            )}
                        </Animated.View>

                        <GestureDetector gesture={panGesture}>
                            <Animated.View style={[dynamicStyles.sheet, sheetMarginStyle, sheetStyle, sheetHeightStyle, style]}>
                                {backgroundComponent?.({ style: styles.background })}

                                {handleSlot}

                                {bodyContent}
                            </Animated.View>
                        </GestureDetector>
                    </View>
                </GestureHandlerRootView>
            </KeyboardProvider>
        </Modal>
    );
});

BottomSheet.displayName = 'BottomSheet';

const styles = StyleSheet.create({
    rootView: {
        flex: 1,
    },
    backdrop: {
        // Color is solid black; the dim level is driven by `backdropOpacity` via
        // the animated `opacity` style on the wrapping <Animated.View>.
        flex: 1,
        backgroundColor: '#000',
    },
    backdropTouchable: {
        flex: 1,
    },
    sheet: {
        position: 'absolute',
        bottom: 0,
        overflow: 'hidden',
        maxWidth: 800,
        alignSelf: 'center',
        marginHorizontal: 'auto',
    },
    sheetDetached: {
        left: 16,
        right: 16,
        borderRadius: 24,
    },
    sheetNormal: {
        left: 0,
        right: 0,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    /** Legacy (non-manualActivation) handle: decorative overlay only. */
    handle: {
        position: 'absolute',
        top: 10,
        left: '50%',
        marginLeft: -18,
        width: 36,
        height: 5,
        borderRadius: 3,
        zIndex: Z_INDEX.sheetHandle,
    },
    /**
     * Hit area for the drag handle in `manualActivation` mode. Absolutely
     * positioned at the top of the sheet so the area visually "floats" above
     * the content — content scrolls up underneath it (no layout offset)
     * while the thumb can still grab the full-width 28dp strip to drag.
     */
    handleHitArea: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 28,
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: 6,
        zIndex: Z_INDEX.sheetHandle,
    },
    background: {
        ...StyleSheet.absoluteFill,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    nonScrollableContent: {
        flex: 1,
    },
});

// Create web scrollbar styles dynamically based on theme
const createWebScrollbarStyle = (borderColor: string) => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    let styleElement = document.getElementById(SCROLLBAR_STYLE_ID) as HTMLStyleElement | null;

    if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = SCROLLBAR_STYLE_ID;
        document.head.appendChild(styleElement);
    }

    // Derive a slightly darker scrollbar hover color from the border color
    const scrollbarColor = borderColor;
    const scrollbarHoverColor = borderColor.startsWith('hsl')
        ? borderColor.replace(/\)$/, ' / 0.7)')  // add alpha for hover
        : '#888';

    styleElement.textContent = `
        .bottom-sheet-scrollview::-webkit-scrollbar {
            width: 6px;
        }
        .bottom-sheet-scrollview::-webkit-scrollbar-track {
            background: transparent;
            border-radius: 10px;
        }
        .bottom-sheet-scrollview::-webkit-scrollbar-thumb {
            background: ${scrollbarColor};
            border-radius: 10px;
        }
        .bottom-sheet-scrollview::-webkit-scrollbar-thumb:hover {
            background: ${scrollbarHoverColor};
        }
    `;
};

const SCROLLBAR_STYLE_ID = 'bottom-sheet-scrollbar-style';

/** Remove the injected scrollbar <style> tag on unmount. */
const removeWebScrollbarStyle = () => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    document.getElementById(SCROLLBAR_STYLE_ID)?.remove();
};

export default BottomSheet;
export { BottomSheet };
