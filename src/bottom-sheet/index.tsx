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
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
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

// Optional dependency — keyboard handling is skipped if not installed
let useKeyboardHandler: ((handlers: Record<string, (e: { height: number }) => void>, deps: unknown[]) => void) | undefined;
try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    useKeyboardHandler = require('react-native-keyboard-controller').useKeyboardHandler;
} catch {
    // react-native-keyboard-controller not available
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
    style?: StyleProp<ViewStyle>;
    enableHandlePanningGesture?: boolean;
    onDismissAttempt?: () => boolean;
    detached?: boolean; // If true, shows with margins and rounded corners. If false, full width with rounded top only.
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
    } = props;

    const insets = useSafeAreaInsets();
    const { colors } = useTheme();
    const [visible, setVisible] = useState(false);
    const [rendered, setRendered] = useState(false); // keep mounted for exit animation
    const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hasClosedRef = useRef(false);
    const scrollViewRef = useRef<Animated.ScrollView>(null);

    const translateY = useSharedValue(SCREEN_HEIGHT);
    const opacity = useSharedValue(0);
    const scrollOffsetY = useSharedValue(0);
    const isScrollAtTop = useSharedValue(true);
    const allowPanClose = useSharedValue(true);
    const keyboardHeight = useSharedValue(0);
    const context = useSharedValue({ y: 0 });

    if (useKeyboardHandler) {
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
    }

    // Dismiss callbacks
    const safeClose = () => {
        if (onDismissAttempt?.()) {
            onDismiss?.();
        } else if (!onDismissAttempt) {
            onDismiss?.();
        }
    };

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
            translateY.value = withSpring(SCREEN_HEIGHT, { ...SPRING_CONFIG, stiffness: 250 });

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

    // Clear pending timeout on unmount
    useEffect(() => () => {
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }
    }, []);

    // Apply web scrollbar styles when colors change
    useEffect(() => {
        if (Platform.OS === 'web') {
            createWebScrollbarStyle(colors.border);
        }
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

    const panGesture = Gesture.Pan()
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
            const closeThreshold = Math.max(140, SCREEN_HEIGHT * 0.25);
            const fastSwipeThreshold = 900;
            const shouldClose =
                velocity > fastSwipeThreshold ||
                (distance > closeThreshold && velocity > -300);

            if (shouldClose) {
                translateY.value = withSpring(SCREEN_HEIGHT, {
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
        });

    const backdropStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    const sheetStyle = useAnimatedStyle(() => {
        const scale = interpolate(translateY.value, [0, SCREEN_HEIGHT], [1, 0.95]);
        return {
            transform: [
                { translateY: translateY.value - keyboardHeight.value },
                { scale },
            ],
        };
    });

    const sheetHeightStyle = useAnimatedStyle(() => ({
        maxHeight: SCREEN_HEIGHT - keyboardHeight.value - insets.top - (detached ? insets.bottom + 16 : 0),
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
        const isDark = colors.background === '#000000';
        return StyleSheet.create({
            handle: {
                ...styles.handle,
                backgroundColor: isDark ? '#444' : '#C7C7CC',
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
    }, [colors.background, detached, insets.bottom]);

    if (!rendered) return null;

    return (
        <Modal visible={rendered} transparent animationType="none" statusBarTranslucent onRequestClose={dismiss}>
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
                    <Animated.View style={[dynamicStyles.sheet, sheetMarginStyle, sheetStyle, sheetHeightStyle]}>
                        {backgroundComponent?.({ style: styles.background })}

                        <View style={dynamicStyles.handle} />

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
        </Modal>
    );
});

BottomSheet.displayName = 'BottomSheet';

const styles = StyleSheet.create({
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

    const styleId = 'bottom-sheet-scrollbar-style';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;

    if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
    }

    // Use theme border color for scrollbar
    const scrollbarColor = borderColor;
    const scrollbarHoverColor = borderColor === '#E5E5EA' ? '#C7C7CC' : '#555';

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

export default BottomSheet;
export { BottomSheet };
