import type React from 'react';
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
  type ComponentRef,
} from 'react';
import {
  type ScrollView,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, { useComposedEventHandler } from 'react-native-reanimated';
import { StyledView } from '../styles/styled-primitives';
import { useScreen } from './context';
import { END_SENTINEL_STYLE, useDocumentEndReached } from './use-document-end-reached';
import { DEFAULT_END_REACHED_THRESHOLD, useEndReached } from './use-end-reached';
import { useScreenScroll } from './use-screen-scroll';
import { useScreenWindowScroll } from './use-screen-window-scroll';
import type { ScreenScrollViewProps } from './types';
import type { RefComponent } from '../styles/native-refs';

type InnerProps = ScreenScrollViewProps & {
  forwardedRef: React.ForwardedRef<ComponentRef<typeof ScrollView>>;
};

/**
 * The screen's scroller. Inside a web `Screen documentScroll` the WINDOW is the
 * scroller, so this renders its content in document flow instead of nesting a
 * second scroll container (which would hold the document at one viewport and
 * clip everything below it). Everywhere else it is an animated `ScrollView`.
 */
export const ScreenScrollView: RefComponent<
  ScreenScrollViewProps,
  ComponentRef<typeof ScrollView>
> = forwardRef<ComponentRef<typeof ScrollView>, ScreenScrollViewProps>(
  function ScreenScrollView(props, ref) {
    // Chosen by the nearest Screen; switching modes remounts, so each branch
    // keeps its own hook order.
    return useScreen().documentScroll ? (
      <DocumentScreenScrollView {...props} forwardedRef={ref} />
    ) : (
      <ContainedScreenScrollView {...props} forwardedRef={ref} />
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
  onContentSizeChange,
  children,
  style,
  ...props
}: InnerProps) {
  const end = useEndReached(onEndReached, onEndReachedThreshold);
  const withEnd = useComposedEventHandler([handler ?? null, end.handler]);
  const scroll = useScreenScroll({
    active,
    handler: end.handler ? withEnd : handler,
    restoration,
  });
  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      end.onLayout(event);
      onLayout?.(event);
    },
    [end.onLayout, onLayout],
  );
  const handleContentSizeChange = useCallback(
    (width: number, height: number) => {
      end.onContentSizeChange(width, height);
      onContentSizeChange?.(width, height);
    },
    [end.onContentSizeChange, onContentSizeChange],
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
  return (
    <Animated.ScrollView
      {...props}
      ref={forwardedRef}
      style={[style, restoration?.restorePending ? { opacity: 0 } : null]}
      onScroll={scroll.onScroll}
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
    </Animated.ScrollView>
  );
}

type ScrollViewRef = ComponentRef<typeof ScrollView>;

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
  active,
  handler: _handler,
  restoration,
  contentContainerStyle,
  contentContainerClassName,
  onEndReached,
  onEndReachedThreshold = DEFAULT_END_REACHED_THRESHOLD,
  onLayout,
  onContentSizeChange,
  children,
  style,
  ...props
}: InnerProps) {
  useScreenWindowScroll({ active, restoration });
  const contentRef = useRef<ComponentRef<typeof View>>(null);
  useImperativeHandle(forwardedRef, () => {
    const handle: DocumentScrollHandle = {
      scrollTo: (y, _x, animated) => {
        const options = typeof y === 'object' ? y : { y, animated };
        scrollWindow(options?.y ?? 0, options?.animated);
      },
      scrollToEnd: (options) =>
        scrollWindow(documentScroller()?.scrollHeight ?? 0, options?.animated),
      flashScrollIndicators: () => undefined,
      // The document's own scroller, which `useScrollRestoration` recognises
      // as the window — so a call site written for native restores here too.
      getScrollableNode: () => documentScroller(),
      getInnerViewNode: () => contentRef.current,
    };
    // Callers type this ref as a `ScrollView`; the window answers the part of
    // it a page drives. Through `unknown` because the node getters return the
    // web DOM nodes react-native-web's ScrollView returns, not RN's declared tag.
    return handle as unknown as ScrollViewRef;
  }, []);
  const [contentHeight, setContentHeight] = useState(0);
  const tracksEnd = onEndReached != null;
  const endRef = useDocumentEndReached({
    onEndReached,
    threshold: onEndReachedThreshold,
    enabled: true,
    rearmKey: contentHeight,
  });
  const handleContentLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { width, height } = event.nativeEvent.layout;
      if (tracksEnd) setContentHeight(height);
      onContentSizeChange?.(width, height);
    },
    [tracksEnd, onContentSizeChange],
  );
  return (
    <View
      {...props}
      onLayout={onLayout}
      style={[{ flexGrow: 1 }, style, restoration?.restorePending ? { opacity: 0 } : null]}
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
