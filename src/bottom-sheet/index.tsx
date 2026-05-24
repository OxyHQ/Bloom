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
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
    interpolate,
    runOnJS,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/use-theme';

// Keyboard handler — only on native platforms. On web, keyboard events are handled by the browser.
const noopKeyboardHandler = (_handlers: Record<string, (e: { height: number }) => void>, _deps: unknown[]) => {};
let useKeyboardHandler: (handlers: Record<string, (e: { height: number }) => void>, deps: unknown[]) => void = noopKeyboardHandler;
if (Platform.OS !== 'web' && typeof require !== 'undefined') {
    try {
        const moduleName = 'react-native-keyboard-controller';
        useKeyboardHandler = require(moduleName).useKeyboardHandler;
    } catch {
        // react-native-keyboard-controller not available
    }
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
    const context = useSharedValue({ y: 0 });

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

    const finishClose = useCallback(() => {
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
            opacity.value = withTiming(1, { duration: 250 });
            translateY.value = withSpring(0, SPRING_CONFIG);
        } else if (rendered) {
            opacity.value = withTiming(0, { duration: 250 }, (finished) => {
                if (finished) {
                    runOnJS(finishClose)();
                }
            });
            translateY.value = withSpring(screenHeight, { ...SPRING_CONFIG, stiffness: 250 });

            // Fallback timer to ensure close completes (especially on web)
            if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
            }
            closeTimeoutRef.current = setTimeout(() => {
                finishClose();
                closeTimeoutRef.current = null;
            }, 300);
        }
    }, [visible, rendered, finishClose]);

    // On unmount: ensure pending close callbacks (e.g. consumer's `onDismiss`)
    // still fire if the BS is yanked mid-animation by a parent re-render.
    // Without this, `Dialog.Outer.handleDismiss` never runs and queued
    // callbacks like `Prompt.Action`'s post-close handler are silently lost.
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

    // Memoized pan gesture — recreating a Gesture.Pan() on every render causes
    // gesture detach/reattach during animations and breaks React Compiler memoization.
    const panGesture = useMemo(
        () =>
            Gesture.Pan()
                .enabled(enablePanDownToClose)
                .simultaneousWithExternalGesture(nativeGesture)
                .onStart(() => {
                    'worklet';
                    context.value = { y: translateY.value };
                    allowPanClose.value = scrollOffsetY.value <= 8;
                })
                .onUpdate((event) => {
                    'worklet';
                    if (!allowPanClose.value) {
                        return;
                    }
                    const newTranslateY = context.value.y + event.translationY;
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
                        translateY.value = withSpring(screenHeightSV.value, {
                            ...SPRING_CONFIG,
                            velocity: velocity,
                        });
                        opacity.value = withTiming(0, { duration: 250 }, (finished) => {
                            if (finished) {
                                runOnJS(finishClose)();
                            }
                        });
                    } else {
                        translateY.value = withSpring(0, {
                            ...SPRING_CONFIG,
                            velocity: velocity,
                        });
                    }
                }),
        // Shared values are stable refs; enablePanDownToClose and detached are the only
        // JS-side values that change the gesture's behavior.
        // finishClose is stable (useCallback with stable deps).
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [enablePanDownToClose, detached, nativeGesture, finishClose],
    );

    const backdropStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    const sheetStyle = useAnimatedStyle(() => {
        const scale = interpolate(translateY.value, [0, screenHeightSV.value], [1, 0.95]);
        return {
            transform: [
                { translateY: translateY.value - keyboardHeight.value },
                { scale },
            ],
        };
    });

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
    });

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

    return (
        <Modal visible={rendered} transparent animationType="none" statusBarTranslucent onRequestClose={dismiss}>
            {/* RN's Modal renders into its own native window. The app-root
                GestureHandlerRootView does NOT extend into it, so pan gestures
                silently no-op without this wrapper. */}
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

                            {showHandle && <View style={dynamicStyles.handle} />}

                            <GestureDetector gesture={nativeGesture}>
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
                            </GestureDetector>
                        </Animated.View>
                    </GestureDetector>
                </View>
            </GestureHandlerRootView>
        </Modal>
    );
});

BottomSheet.displayName = 'BottomSheet';

const styles = StyleSheet.create({
    rootView: {
        flex: 1,
    },
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    handle: {
        position: 'absolute',
        top: 10,
        left: '50%',
        marginLeft: -18,
        width: 36,
        height: 5,
        borderRadius: 3,
        zIndex: 100,
    },
    background: {
        ...StyleSheet.absoluteFillObject,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
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
