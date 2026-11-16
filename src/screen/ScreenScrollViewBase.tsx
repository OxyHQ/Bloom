import { acquireScrollLock } from '../layout/scroll-lock';
import type React from 'react';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ComponentRef,
} from 'react';
import {
  type ScrollView,
  Platform,
  StyleSheet,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedScrollHandler,
  useComposedEventHandler,
} from 'react-native-reanimated';
import type { ScrollBarProps } from '../layout/types';
import { StyledView } from '../styles/styled-primitives';
import { useScreen } from './context';
import { useScreenViewport } from './context';
import { useIntrinsicContentHeight } from './use-intrinsic-content-height';
import { END_SENTINEL_STYLE, useDocumentEndReached } from './use-document-end-reached';
import { DEFAULT_END_REACHED_THRESHOLD, useEndReached } from './use-end-reached';
import { useScreenScroll } from './use-screen-scroll';
import { useScreenWindowScroll } from './use-screen-window-scroll';
import type { ScreenScrollViewProps } from './types';
import type { RefComponent } from '../styles/native-refs';
import type { ScreenKeyboardComponents } from './keyboard-components';
import { useKeyboardMetrics } from '../hooks/use-keyboard-metrics';

export function createScreenScrollView(
  ScrollBar: React.ComponentType<ScrollBarProps>,
  getKeyboardComponents: (() => ScreenKeyboardComponents) | null,
) {
  type InnerProps = ScreenScrollViewProps & {
    forwardedRef: React.ForwardedRef<ComponentRef<typeof ScrollView>>;
  };

  /**
   * The screen's scroller. Inside a web `Screen documentScroll` the WINDOW is the
   * scroller, so this renders its content in document flow instead of nesting a
   * second scroll container (which would hold the document at one viewport and
   * clip everything below it). Everywhere else it is an animated `ScrollView`.
   */
  const ScreenScrollView: RefComponent<
    ScreenScrollViewProps,
    ComponentRef<typeof ScrollView>
  > = forwardRef<ComponentRef<typeof ScrollView>, ScreenScrollViewProps>(
    function ScreenScrollView(props, ref) {
      // Chosen by the nearest Screen; switching modes remounts, so each branch
      // keeps its own hook order.
      const screen = useScreen();
      const viewport = useScreenViewport();
      const active = screen.active && props.active !== false && viewport?.active !== false;
      return viewport?.kind === 'element' ||
        viewport?.kind === 'document' ||
        screen.documentScroll ? (
        <DocumentScreenScrollView {...props} active={active} forwardedRef={ref} />
      ) : (
        <ContainedScreenScrollView {...props} active={active} forwardedRef={ref} />
      );
    },
  );

  function paddingEdge(
    style: Readonly<ViewStyle> | null | undefined,
    edge: 'paddingTop' | 'paddingBottom',
  ) {
    return Number(style?.[edge] ?? style?.paddingVertical ?? style?.padding ?? 0);
  }

  function ContainedScreenScrollView({
    forwardedRef,
    active,
    handler,
    restoration,
    contentContainerStyle,
    contentContainerClassName,
    onEndReached,
    onEndReachedThreshold = DEFAULT_END_REACHED_THRESHOLD,
    onLayout,
    onScroll,
    onContentSizeChange,
    children,
    style,
    ...props
  }: InnerProps) {
    const viewport = useScreenViewport();
    const publishIntrinsic = useIntrinsicContentHeight();
    const screen = useScreen();
    const activeRef = useRef(active !== false);
    activeRef.current = active !== false;
    const localRef = useRef<ScrollViewRef | null>(null);
    const end = useEndReached(active ? onEndReached : undefined, onEndReachedThreshold);
    const withEnd = useComposedEventHandler([handler ?? null, end.handler]);
    const scroll = useScreenScroll({
      active,
      handler: end.handler ? withEnd : handler,
      restoration,
      scrollToOffset: (offset) => localRef.current?.scrollTo({ y: offset, animated: true }),
    });
    const observeScroll = useCallback(
      (event: NativeScrollEvent) => {
        if (!activeRef.current) return;
        onScroll?.({ nativeEvent: event } as NativeSyntheticEvent<NativeScrollEvent>);
      },
      [onScroll],
    );
    const observer = useAnimatedScrollHandler(
      {
        onScroll: (event) => {
          if (active && onScroll) runOnJS(observeScroll)(event);
        },
      },
      [active, onScroll, observeScroll],
    );
    const onNativeScroll = useComposedEventHandler([scroll.onScroll, onScroll ? observer : null]);
    const handleLayout = useCallback(
      (event: LayoutChangeEvent) => {
        if (!active) return;
        end.onLayout(event);
        if (viewport) viewport.metrics.viewportHeight.value = event.nativeEvent.layout.height;
        onLayout?.(event);
      },
      [active, end.onLayout, onLayout, viewport],
    );
    const handleContentSizeChange = useCallback(
      (width: number, height: number) => {
        if (!active) return;
        end.onContentSizeChange(width, height);
        if (viewport) viewport.metrics.contentHeight.value = height;
        // A growing ScrollView content container reports at least its viewport,
        // not its natural content extent. Keep that case explicitly unknown.
        if (publishIntrinsic) {
          const flat = StyleSheet.flatten(contentContainerStyle);
          publishIntrinsic(
            contentContainerClassName != null || flat?.flexGrow || flat?.flex || flat?.minHeight
              ? -1
              : height,
          );
        }
        onContentSizeChange?.(width, height);
      },
      [
        active,
        end.onContentSizeChange,
        onContentSizeChange,
        viewport,
        publishIntrinsic,
        contentContainerStyle,
        contentContainerClassName,
      ],
    );
    // A class's padding cannot be read back to add the chrome footprint to it, and
    // an inline padding would override it — so with a class the footprint pads
    // the scroll content and the class lays out an inner container.
    const classed = contentContainerClassName != null;
    const contentStyle = classed ? undefined : StyleSheet.flatten(contentContainerStyle);
    const insetStyle: StyleProp<ViewStyle> = classed
      ? {
          flexGrow: 1,
          paddingTop: scroll.contentInsets.top,
          paddingBottom: scroll.contentInsets.bottom,
        }
      : [
          contentContainerStyle,
          {
            paddingTop: scroll.contentInsets.top + paddingEdge(contentStyle, 'paddingTop'),
            paddingBottom: scroll.contentInsets.bottom + paddingEdge(contentStyle, 'paddingBottom'),
          },
        ];
    const ScrollContainer =
      screen.keyboardFollow && getKeyboardComponents
        ? KeyboardFollowScrollView
        : Animated.ScrollView;
    const content = (
      <ScrollContainer
        // A control inside the page takes its tap while the keyboard is open
        // (`layout/ScrollViewport.tsx` has the measured case); a caller wins.
        keyboardShouldPersistTaps="handled"
        {...props}
        {...(screen.keyboardFollow
          ? {
              enabled: active !== false,
              bottomOffset: screen.keyboardFooterHeight ?? 0,
              extraKeyboardSpace: screen.keyboardFooterHeight ?? 0,
            }
          : {})}
        ref={(node) => {
          localRef.current = node;
          if (viewport?.kind === 'native' && viewport.scrollRef)
            (viewport.scrollRef as React.MutableRefObject<unknown>).current = node;
          if (typeof forwardedRef === 'function') forwardedRef(node);
          else if (forwardedRef) forwardedRef.current = node;
        }}
        style={[
          Platform.OS === 'web' ? { flexGrow: 1, flexShrink: 1, minHeight: 0 } : style,
          screen.contentSized ? { flexBasis: 'auto' } : undefined,
          restoration?.restorePending ? { opacity: 0 } : null,
        ]}
        onScroll={onNativeScroll}
        onLayout={handleLayout}
        onContentSizeChange={handleContentSizeChange}
        scrollEventThrottle={16}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        contentContainerStyle={insetStyle}
      >
        {classed ? (
          <StyledView className={contentContainerClassName} style={contentContainerStyle}>
            {children}
          </StyledView>
        ) : (
          children
        )}
      </ScrollContainer>
    );
    return Platform.OS === 'web' ? (
      <View style={[{ flexGrow: 1, flexShrink: 1, minHeight: 0, minWidth: 0 }, style]}>
        {content}
        <ScrollBar target={localRef} horizontal={Boolean(props.horizontal)} />
      </View>
    ) : (
      content
    );
  }

  type ScrollViewRef = ComponentRef<typeof ScrollView>;

  type KeyboardScrollProps = React.ComponentProps<
    ScreenKeyboardComponents['KeyboardAwareScrollView']
  >;

  // The controller reveals an input relative to the WINDOW. A Screen can end
  // above that window edge (system bars, a framed dialog, or another panel).
  // Translate only that measured distance; footer height remains its own slot.
  const KeyboardFollowScrollView = forwardRef<ScrollViewRef, KeyboardScrollProps>(
    function KeyboardFollowScrollView(
      {
        enabled = true,
        bottomOffset = 0,
        extraKeyboardSpace = 0,
        onLayout,
        onTouchStart,
        ...props
      },
      forwardedRef,
    ) {
      const integration = getKeyboardComponents?.();
      if (!integration) throw new Error('Native keyboard integration is required for follow');
      const useControllerDimensions = integration.useWindowDimensions ?? useWindowDimensions;
      const { height: windowHeight } = useControllerDimensions();
      const keyboard = useKeyboardMetrics({ enabled });
      const target = useRef<ScrollViewRef | null>(null);
      const measureRevision = useRef(0);
      const [bottomDistance, setBottomDistance] = useState(0);
      const measureViewport = useCallback(() => {
        const node = target.current;
        if (!enabled || !node) return;
        const revision = ++measureRevision.current;
        const native = node.getNativeScrollRef?.() ?? node;
        native?.measureInWindow?.((_x: number, y: number, _width: number, height: number) => {
          if (target.current !== node || measureRevision.current !== revision || height <= 0)
            return;
          const distance = Math.max(0, windowHeight - y - height);
          if (Number.isFinite(distance)) setBottomDistance(distance);
        });
      }, [enabled, windowHeight]);
      // biome-ignore lint/correctness/useExhaustiveDependencies: Keyboard changes require a fresh native window measurement.
      useEffect(() => {
        measureViewport();
        return () => {
          measureRevision.current++;
        };
      }, [measureViewport, keyboard.visible, keyboard.height]);
      // The controller already reveals on IME changes and bottomOffset updates.
      // A second imperative reveal races its native focus/scroll measurements.
      const setRef = useCallback(
        (node: ScrollViewRef | null) => {
          target.current = node;
          if (typeof forwardedRef === 'function') forwardedRef(node);
          else if (forwardedRef) forwardedRef.current = node;
        },
        [forwardedRef],
      );
      const KeyboardAwareScrollView = integration.KeyboardAwareScrollView;
      return (
        <KeyboardAwareScrollView
          {...props}
          ref={setRef}
          enabled={enabled}
          bottomOffset={bottomOffset + bottomDistance}
          extraKeyboardSpace={extraKeyboardSpace + bottomDistance}
          onLayout={(event) => {
            measureViewport();
            onLayout?.(event);
          }}
          onTouchStart={(event) => {
            measureViewport();
            onTouchStart?.(event);
          }}
        />
      );
    },
  );

  /**
   * `ScrollView`'s imperative surface, answered by the window. The two node
   * getters return what react-native-web's own `ScrollView` returns on web — DOM
   * nodes — where React Native's types declare a native tag (`number`).
   */
  type DocumentScrollHandle = Pick<
    ScrollViewRef,
    'scrollTo' | 'scrollToEnd' | 'flashScrollIndicators'
  > & {
    getScrollableNode: () => Element | null;
    getInnerViewNode: () => ComponentRef<typeof View> | null;
  };

  function scrollWindow(top: number, animated: boolean | undefined) {
    if (typeof window === 'undefined') return;
    window.scrollTo({ top, behavior: animated === false ? 'auto' : 'smooth' });
  }

  function documentScroller(): Element | null {
    return typeof document === 'undefined'
      ? null
      : (document.scrollingElement ?? document.documentElement);
  }

  function DocumentScreenScrollView({
    forwardedRef,
    scrollEnabled = true,
    active,
    handler: _handler,
    restoration,
    contentContainerStyle,
    contentContainerClassName,
    onEndReached,
    onEndReachedThreshold = DEFAULT_END_REACHED_THRESHOLD,
    onLayout,
    onScroll,
    onContentSizeChange,
    children,
    style,
    ...props
  }: InnerProps) {
    const screen = useScreen();
    const viewport = useScreenViewport();
    const publishIntrinsic = useIntrinsicContentHeight();
    const activeRef = useRef(active !== false);
    activeRef.current = active !== false;
    useEffect(() => {
      if (scrollEnabled || active === false || viewport?.active === false) return;
      const element =
        viewport?.kind === 'element'
          ? (viewport.scrollRef?.current as HTMLElement | null)
          : (documentScroller() as HTMLElement | null);
      if (element) return acquireScrollLock(element);
    }, [scrollEnabled, active, viewport]);

    useEffect(() => {
      if (!onScroll || active === false || viewport?.active === false) return;
      const element =
        viewport?.kind === 'element'
          ? (viewport.scrollRef?.current as HTMLElement | null)
          : (documentScroller() as HTMLElement | null);
      if (!element) return;
      const target = viewport?.kind === 'element' ? element : window;
      const observe = () =>
        onScroll({
          nativeEvent: {
            contentOffset: { x: element.scrollLeft, y: element.scrollTop },
            contentSize: { width: element.scrollWidth, height: element.scrollHeight },
            layoutMeasurement: { width: element.clientWidth, height: element.clientHeight },
            contentInset: { top: 0, right: 0, bottom: 0, left: 0 },
            zoomScale: 1,
          },
        } as NativeSyntheticEvent<NativeScrollEvent>);
      target.addEventListener('scroll', observe, { passive: true });
      return () => target.removeEventListener('scroll', observe);
    }, [onScroll, active, viewport]);
    useScreenWindowScroll({
      active: !viewport && active !== false,
      restoration: viewport ? undefined : restoration,
    });
    useEffect(() => {
      if (!active || !onLayout || !viewport) return;
      const element =
        viewport.kind === 'element'
          ? (viewport.scrollRef?.current as HTMLElement | null)
          : (documentScroller() as HTMLElement | null);
      if (!element) return;
      let previousWidth = -1,
        previousHeight = -1;
      let disposed = false;
      const measure = () => {
        if (disposed) return;
        const width = element.clientWidth;
        const height =
          viewport.kind === 'document'
            ? viewport.metrics.viewportHeight.value || element.clientHeight
            : element.clientHeight;
        if (width === previousWidth && height === previousHeight) return;
        previousWidth = width;
        previousHeight = height;
        onLayout({ nativeEvent: { layout: { x: 0, y: 0, width, height } } } as LayoutChangeEvent);
      };
      // Screen publishes reserved chrome in its own effect before this initial observation.
      queueMicrotask(() => {
        if (!disposed) measure();
      });
      const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
      observer?.observe(element);
      window.addEventListener('resize', measure);
      return () => {
        disposed = true;
        observer?.disconnect();
        window.removeEventListener('resize', measure);
      };
    }, [active, onLayout, viewport]);
    const contentRef = useRef<ComponentRef<typeof View>>(null);
    useImperativeHandle(forwardedRef, () => {
      const handle: DocumentScrollHandle = {
        scrollTo: (y, _x, animated) => {
          if (!activeRef.current) return;
          const options = typeof y === 'object' ? y : { y, animated };
          if (viewport) viewport.scrollTo({ y: options?.y ?? 0, animated: options?.animated });
          else scrollWindow(options?.y ?? 0, options?.animated);
        },
        scrollToEnd: (options) => {
          if (!activeRef.current) return;
          if (viewport)
            viewport.scrollTo({
              y: viewport.metrics.contentHeight.value,
              animated: options?.animated,
            });
          else scrollWindow(documentScroller()?.scrollHeight ?? 0, options?.animated);
        },
        flashScrollIndicators: () => undefined,
        // The document's own scroller, which `useScrollRestoration` recognises
        // as the window — so a call site written for native restores here too.
        getScrollableNode: () =>
          (viewport?.scrollRef?.current as Element | null) ?? documentScroller(),
        getInnerViewNode: () => contentRef.current,
      };
      // Callers type this ref as a `ScrollView`; the window answers the part of
      // it a page drives. Through `unknown` because the node getters return the
      // web DOM nodes react-native-web's ScrollView returns, not RN's declared tag.
      return handle as unknown as ScrollViewRef;
    }, [active, viewport]);
    const [contentHeight, setContentHeight] = useState(0);
    const tracksEnd = onEndReached != null;
    const endRef = useDocumentEndReached({
      onEndReached,
      threshold: onEndReachedThreshold,
      enabled: active !== false && (viewport?.active ?? true),
      rootRef: viewport?.scrollRef ?? undefined,
      rearmKey: contentHeight,
    });
    const handleContentLayout = useCallback(
      (event: LayoutChangeEvent) => {
        if (!active) return;
        const { width, height } = event.nativeEvent.layout;
        publishIntrinsic?.(height, contentRef.current as unknown as HTMLElement | null);
        if (tracksEnd) setContentHeight(height);
        onContentSizeChange?.(width, height);
      },
      [active, tracksEnd, onContentSizeChange, publishIntrinsic],
    );
    return (
      <View
        {...props}
        onLayout={!viewport && active ? onLayout : undefined}
        style={[
          { flexGrow: 1 },
          style,
          screen.contentSized ? { flexBasis: 'auto' } : undefined,
          restoration?.restorePending ? { opacity: 0 } : null,
        ]}
      >
        <StyledView
          ref={contentRef}
          className={contentContainerClassName}
          style={contentContainerStyle}
          onLayout={handleContentLayout}
        >
          {children}
          {tracksEnd ? (
            <View ref={endRef} pointerEvents="none" aria-hidden style={END_SENTINEL_STYLE} />
          ) : null}
        </StyledView>
      </View>
    );
  }

  return ScreenScrollView;
}
