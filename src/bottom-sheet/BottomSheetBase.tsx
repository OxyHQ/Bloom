import type React from 'react';
import { forwardRef, useImperativeHandle, useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
    View,
    StyleSheet,
    Pressable,
    Dimensions,
    Platform,
    type LayoutChangeEvent,
    type ViewStyle,
    type StyleProp,
} from 'react-native';
import { Gesture, GestureDetector, type GestureType } from 'react-native-gesture-handler';
import { adoptStyleSheet, dropStyleSheet } from '../styles/adopt-style-sheet';
import type { WebCssStyle } from '../styles/web-view-style';
import { Z_INDEX } from '../styles/z-index';
import Animated, {
    type AnimatedStyle,
    interpolate,
    runOnJS,
    type SharedValue,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useDerivedValue,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Backdrop, BACKDROP_DIM_OPACITY } from '../overlay';
import { useTheme } from '../theme/use-theme';
import type { BottomSheetRef, BottomSheetProps, BottomSheetShellProps, BottomSheetBaseProps } from './types';

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

export const BottomSheetBase = forwardRef((props: BottomSheetBaseProps, ref: React.ForwardedRef<BottomSheetRef>) => {
    const {
        Shell,
        children,
        open,
        onDismiss,
        enablePanDownToClose = true,
        backgroundComponent,
        backdropComponent,
        style,
        enableHandlePanningGesture = true,
        onDismissAttempt,
        detached = false,
        showHandle = true,
        backdropOpacity = BACKDROP_DIM_OPACITY,
        scrollable = true,
        manualActivation = false,
        dynamicBackdrop = false,
        handleComponent,
        scrollY: externalScrollY,
        headerOverlay,
        onLayout,
    } = props;

    const insets = useSafeAreaInsets();
    const theme = useTheme();
    const { colors } = theme;
    const { height: screenHeight } = useScreenDimensions();
    // Seed from the controlled `open` prop so a sheet that should be open is
    // visible on its FIRST commit (no present()-in-effect race) — this is what
    // lets a responsive Dialog survive a resize placement swap without going blank.
    const [visible, setVisible] = useState(() => open ?? false);
    const [rendered, setRendered] = useState(() => open ?? false); // keep mounted for exit animation
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
    // Live keyboard height. Written by the native shell's keyboard tracker via
    // this shared value; on web it stays 0 (the browser owns keyboard layout).
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
    // Mirror `visible` so the unmount cleanup can tell "closing" (visible=false,
    // animating out) from "fully open" (visible=true) at teardown time.
    const visibleRef = useRef(visible);
    useEffect(() => {
        visibleRef.current = visible;
    }, [visible]);

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
    // still fire if the BS is yanked mid-animation by a parent re-render while a
    // close is IN PROGRESS. Without this, `Dialog`'s `handleDismiss` never runs
    // and queued callbacks (post-close handlers) are silently lost.
    //
    // Guarded on `!visibleRef.current`: only flush when a close was already
    // underway (visible=false → closing/animating out). A sheet yanked while
    // still FULLY OPEN (visible=true) is not closing — it is being swapped out by
    // a parent, e.g. a responsive `Dialog` crossing its breakpoint between the
    // bottom-sheet and centered-card branches. Firing onDismiss there would
    // wrongly dismiss the surface mid-swap (there are no pending close callbacks
    // to flush anyway), so the new branch can take over still-open. Refs are read
    // inside the cleanup, so the latest values are captured.
    useEffect(() => () => {
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }
        if (renderedRef.current && !hasClosedRef.current && !visibleRef.current) {
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

    // CRITICAL — the shared values each `useAnimatedStyle` READS (translateY,
    // opacity, screenHeightSV, keyboardHeight) MUST be listed in its dependency
    // array. On web WITHOUT the react-native-worklets babel plugin (the
    // production reality for the RN-Web apps: console, accounts, the SDK, etc.),
    // reanimated cannot auto-detect which shared values a worklet reads (there
    // is no injected `__closure`), so it drives the style mapper's re-runs off
    // the dependency array instead. With an empty/incomplete deps array the
    // mapper runs ONCE and freezes at the initial frame — the shared value keeps
    // animating underneath but the DOM never updates, so the sheet stays one
    // full viewport below the fold (translateY = screenHeight) and is invisible.
    // Native (with the plugin) auto-tracks and ignores the extra deps, so this
    // is safe on both platforms. Do NOT strip the shared values from these deps.
    //
    // `opacity.value` drives the fade in/out (0 -> 1). `backdropOpacity` is the
    // final dim level once fully visible. We multiply so the consumer-provided
    // dim opacity applies smoothly across the animation. When
    // `dynamicBackdrop` is enabled, the dim also fades proportionally with
    // drag distance (iOS Photos style).
    // A VALUE, not a style: `Backdrop` applies it to its blur and dim layers
    // itself. Handing it over as an animated style would put the opacity on the
    // layers' shared ancestor, which composites the group in isolation and
    // leaves `backdrop-filter` with nothing behind it to blur.
    const backdropProgress = useDerivedValue(() => {
        const dragFactor = dynamicBackdrop
            ? interpolate(
                translateY.value,
                [0, screenHeightSV.value * 0.4],
                [1, 0.3],
                'clamp',
            )
            : 1;
        return opacity.value * dragFactor;
    }, [dynamicBackdrop, opacity, translateY, screenHeightSV]);

    // Only the consumer-supplied `backdropComponent` needs the progress as a
    // style — it owns its own visuals, blur included, so the ancestor-opacity
    // hazard is its call to make.
    const customBackdropStyle = useAnimatedStyle(
        () => ({ opacity: backdropProgress.value }),
        [backdropProgress],
    );

    const sheetStyle = useAnimatedStyle(() => {
        const scale = interpolate(translateY.value, [0, screenHeightSV.value], [1, 0.95]);
        return {
            transform: [
                { translateY: translateY.value - keyboardHeight.value },
                { scale },
            ],
        };
    }, [translateY, screenHeightSV, keyboardHeight]);

    const sheetHeightStyle = useAnimatedStyle(() => ({
        maxHeight: screenHeightSV.value - keyboardHeight.value - insets.top - (detached ? insets.bottom + 16 : 0),
    }), [insets.top, insets.bottom, detached, screenHeightSV, keyboardHeight]);

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
    }, [insets.bottom, detached, keyboardHeight]);

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
            // Mirror into the host's collapse offset (a Dialog nav header) when
            // provided. Listed in deps so the RN-Web (no worklets plugin) handler
            // re-binds if the shared value identity changes.
            if (externalScrollY) externalScrollY.value = event.contentOffset.y;
        },
    }, [externalScrollY]);

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

    // Publish the sheet's keyboard shared value to the shell so the native
    // shell can drive it from inside its own <KeyboardProvider>. Kept stable
    // (shared values are stable refs) so the shell never re-mounts for this.
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

    // `scrollbar-width` / `scrollbar-color` are web-only CSS RN does not model.
    const webScrollbarStyle: WebCssStyle | undefined =
        Platform.OS === 'web'
            ? {
                  scrollbarWidth: 'thin',
                  scrollbarColor: `${colors.border} transparent`,
              }
            : undefined;

    // Inner content: scrollable wraps in Animated.ScrollView, non-scrollable
    // renders children directly. In legacy mode the scrollview is also
    // wrapped in the `nativeGesture` detector for scroll/pan coordination.
    const scrollViewNode = (
        <Animated.ScrollView
            ref={scrollViewRef}
            style={[styles.scrollView, webScrollbarStyle]}
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
        <Shell visible={rendered} onRequestClose={dismiss} keyboardHeight={keyboardHeight}>
            <View style={StyleSheet.absoluteFill}>
                {backdropComponent ? (
                    <Animated.View style={[StyleSheet.absoluteFill, customBackdropStyle]}>
                        {backdropComponent({ onPress: handleBackdropPress })}
                    </Animated.View>
                ) : (
                    // The ONE Bloom backdrop (blur + dim + press-to-dismiss).
                    // `backdropStyle` drives the fade; the dim level rides on
                    // `backdropOpacity`, so the shared component's own dim is
                    // switched off here to keep a single source of dimming.
                    <Backdrop
                        onPress={handleBackdropPress}
                        // `progress` is the FADE (0 → 1, folding the drag);
                        // how dark the backdrop gets is `backdropOpacity`,
                        // which defaults to the library-wide dim so a sheet
                        // matches every other surface. It goes through
                        // `progress` rather than an animated style because an
                        // opacity on the root would sit above the blur layer
                        // and neutralise it.
                        dimOpacity={backdropOpacity}
                        progress={backdropProgress}
                        style={styles.backdrop}
                    />
                )}

                <GestureDetector gesture={panGesture}>
                    <Animated.View
                        onLayout={onLayout}
                        style={[dynamicStyles.sheet, sheetMarginStyle, sheetStyle, sheetHeightStyle, style]}
                    >
                        {backgroundComponent?.({ style: styles.background })}

                        {handleSlot}

                        {bodyContent}

                        {/* Sticky nav-header overlay (Dialog nav-header mode): floats
                            above the scroll body, clipped to the sheet's rounded top. */}
                        {headerOverlay}
                    </Animated.View>
                </GestureDetector>
            </View>
        </Shell>
    );
});

BottomSheetBase.displayName = 'BottomSheetBase';

const styles = StyleSheet.create({
    backdrop: {
        // Geometry only: the colour and the dim level belong to `Backdrop`.
        flex: 1,
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
        // A `scrollable={false}` sheet hands its own scrolling to a child
        // VirtualizedList, which needs a BOUNDED height to scroll. The sheet is
        // clamped by `maxHeight`, but on web a flex child defaults to
        // `min-height: auto` and grows to its content instead of shrinking into
        // that clamp — so the list overflows and is clipped (no scroll). Yoga
        // already defaults min to 0 on native; making it explicit here fixes the
        // web output so the bounded height propagates down to the list.
        minHeight: 0,
    },
});

// Create web scrollbar styles dynamically based on theme
const createWebScrollbarStyle = (borderColor: string) => {
    if (Platform.OS !== 'web') return;

    // Derive a slightly darker scrollbar hover color from the border color
    const scrollbarColor = borderColor;
    const scrollbarHoverColor = borderColor.startsWith('hsl')
        ? borderColor.replace(/\)$/, ' / 0.7)')  // add alpha for hover
        : '#888';

    adoptStyleSheet(
        SCROLLBAR_STYLE_ID,
        `
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
    `,
    );
};

const SCROLLBAR_STYLE_ID = 'bottom-sheet-scrollbar-style';

/** Detach the scrollbar rules on unmount. */
const removeWebScrollbarStyle = () => {
    if (Platform.OS !== 'web') return;
    dropStyleSheet(SCROLLBAR_STYLE_ID);
};
