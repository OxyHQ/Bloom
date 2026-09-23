import React, {
  forwardRef,
  useCallback,
  useContext,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { AgentThinking } from '../agent-thinking';
import { Breadcrumb, BreadcrumbItem } from '../breadcrumb';
import { RiFolderLine } from '../icons/remix/RiFolderLine';
import { RiMoreFill } from '../icons/remix/RiMoreFill';
import { RiShare2Line } from '../icons/remix/RiShare2Line';
import { EdgeScrim, SCRIM_TAIL_RATIO } from '../page-header/EdgeScrim';
import { parseRgba } from '../theme/color-utils';
import { useIsomorphicLayoutEffect } from '../theme/use-isomorphic-layout-effect';
import { GlyphAction } from './AiChatControls';
import {
  AiChatFloatingChromeContext,
  type AiChatChromeInsets,
  type AiChatFloatingChrome,
  type AiChatScrollMetrics,
} from './context';
import { CONTAINER_RADIUS, dataHook, IS_WEB, useAiChatPalette, useAiChatWebCss } from './shared';
import type { AiChatContainerProps, AiChatThreadHandle, AiChatThreadProps } from './types';

const DEFAULT_LABELS = {
  breadcrumb: 'Chat location',
  share: 'Share chat',
  more: 'More options',
};

/** The thread's own top padding: the gap between the header and the first turn. */
const THREAD_PAD_TOP = 16;
/**
 * `floatingChrome`: the footer's fade strip, px — the footer's top padding, so
 * the last turn at rest ends where the fade begins, and the distance over which
 * the bottom fade ramps in as the transcript slides under it.
 */
const FOOTER_FADE = 24;
/** Below this many px of overlap an edge counts as clear (sub-pixel scroll noise). */
const EDGE_THRESHOLD = 1;

const HIDDEN_FROM_A11Y = {
  'aria-hidden': true,
  accessibilityElementsHidden: true,
  importantForAccessibility: 'no-hide-descendants',
} as const;

/**
 * The AI chat's centre column: the centre column of the AI chat template.
 *
 *   section   fills its parent, radius 24, background-secondary, clipped
 *   layer     the `background` slot, filling the section above its own paint
 *             and below everything else, clipped to the same radius;
 *             `surface={false}` drops that paint
 *   header    px 16 / pt 16, gap 8: the project › chat breadcrumb (flex 1) and
 *             the 16px share / more glyphs, 8 apart
 *   thread    the `children` — usually an `AiChatThread`
 *   footer    px 10 / pt 12 / pb 10, gap 10: `AgentThinking` (infinity, px 6)
 *             while `working`, then the `composer`
 *
 * `header` renders above all of it: the shell's `AiChatMobileHeader`.
 *
 * `project` is optional: without one the breadcrumb is the chat's own crumb
 * alone, since a chat that belongs to nothing must not have to invent a folder.
 *
 * `floatingChrome` changes the geometry, not the parts:
 *
 *   thread    the `children` fill the whole card, under everything below
 *   header    the `header` slot + breadcrumb row, absolute at the top, no band;
 *             an edge scrim of the surface (opaque at the top, gone
 *             `SCRIM_TAIL_RATIO` below the block) fades in over the first 16px
 *             of transcript scrolled under it
 *   footer    absolute at the bottom, pt 24 instead of 12: the 24px strip is a
 *             scrim ramp and the rest is solid surface, faded in over the first
 *             24px of transcript below the fold
 *
 * Both blocks are `pointerEvents="box-none"`, so the transcript under their
 * empty space still scrolls and takes clicks. The measured heights reach an
 * `AiChatThread` child through context (its content padding) and any other
 * child through `useAiChatChromeInsets()`.
 */
export function AiChatContainer({
  project,
  title,
  projectIcon = RiFolderLine,
  onProjectPress,
  onShare,
  onMore,
  actions,
  header,
  children,
  composer,
  working = false,
  workingLabel,
  background,
  surface = true,
  floatingChrome = false,
  labels,
  style,
  testID,
}: AiChatContainerProps) {
  useAiChatWebCss();
  const palette = useAiChatPalette();
  const l = useMemo(() => ({ ...DEFAULT_LABELS, ...labels }), [labels]);

  const hasCrumbRow = title != null || project != null || onShare || onMore || actions != null;
  const crumbRow = hasCrumbRow ? (
    <View
      pointerEvents="box-none"
      style={{
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: 16,
      }}>
      <View pointerEvents="box-none" style={{ minWidth: 0, flex: 1 }}>
        {title != null || project != null ? <Breadcrumb accessibilityLabel={l.breadcrumb}>
          {project === undefined ? null : (
            <BreadcrumbItem icon={projectIcon} onPress={onProjectPress}>
              {project}
            </BreadcrumbItem>
          )}
          {title == null ? null : <BreadcrumbItem current>{title}</BreadcrumbItem>}
        </Breadcrumb> : null}
      </View>
      <View style={{ flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {actions ?? <>
        {onShare ? <GlyphAction icon={RiShare2Line} label={l.share} onPress={onShare} palette={palette} /> : null}
        {onMore ? <GlyphAction icon={RiMoreFill} label={l.more} onPress={onMore} palette={palette} /> : null}
        </>}
      </View>
    </View>
  ) : null;

  const footerBody = (
    <>
      {working ? <AgentThinking variant="infinity" label={workingLabel} style={{ paddingLeft: 6, paddingRight: 6 }} /> : null}
      {composer}
    </>
  );

  const backgroundLayer = background ? (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      {background}
    </View>
  ) : null;

  const rootStyle: StyleProp<ViewStyle> = [
    {
      height: '100%',
      minWidth: 0,
      flex: 1,
      flexDirection: 'column',
      overflow: 'hidden',
      borderRadius: CONTAINER_RADIUS,
      backgroundColor: surface ? palette.secondary : 'transparent',
    },
    style,
  ];

  if (floatingChrome) {
    return (
      <FloatingChrome
        testID={testID}
        rootStyle={rootStyle}
        backgroundLayer={backgroundLayer}
        header={header}
        crumbRow={crumbRow}
        footerBody={footerBody}
        fadeColor={surface ? palette.secondary : null}>
        {children}
      </FloatingChrome>
    );
  }

  return (
    <View testID={testID} style={rootStyle}>
      {backgroundLayer}
      {header}
      {crumbRow}

      {children}

      <View style={{ width: '100%', flexDirection: 'column', gap: 10, paddingLeft: 10, paddingRight: 10, paddingTop: 12, paddingBottom: 10 }}>
        {footerBody}
      </View>
    </View>
  );
}

interface FloatingChromeProps {
  testID?: string;
  rootStyle: StyleProp<ViewStyle>;
  backgroundLayer: ReactNode;
  header: ReactNode;
  crumbRow: ReactNode;
  footerBody: ReactNode;
  /** The opaque surface the edges fade to, or `null` for no fades. */
  fadeColor: string | null;
  children: ReactNode;
}

/**
 * `AiChatContainer floatingChrome`: the same parts, the chrome floated over the
 * transcript. Everything it measures lives here, so the stacked path above
 * carries none of the state.
 *
 * The edge opacities are shared values written from the thread's scroll
 * reports, so a scroll frame re-renders nothing; the booleans only mount and
 * unmount the scrims, and change once per crossing. Same model as the
 * sidebar's `SidebarScrollArea`, whose scrim this reuses.
 */
function FloatingChrome({
  testID,
  rootStyle,
  backgroundLayer,
  header,
  crumbRow,
  footerBody,
  fadeColor,
  children,
}: FloatingChromeProps) {
  const [insets, setInsets] = useState<AiChatChromeInsets>({ top: 0, bottom: 0 });
  const [edges, setEdges] = useState({ top: false, bottom: false });
  const topFade = useSharedValue(0);
  const bottomFade = useSharedValue(0);

  const onHeaderLayout = useCallback((event: LayoutChangeEvent) => {
    const top = Math.round(event.nativeEvent.layout.height);
    setInsets((previous) => (previous.top === top ? previous : { ...previous, top }));
  }, []);
  const onFooterLayout = useCallback((event: LayoutChangeEvent) => {
    const bottom = Math.round(event.nativeEvent.layout.height);
    setInsets((previous) => (previous.bottom === bottom ? previous : { ...previous, bottom }));
  }, []);

  const reportScroll = useCallback(
    ({ offset, viewport, content }: AiChatScrollMetrics) => {
      const range = Math.max(0, content - viewport);
      const y = Math.max(0, Math.min(offset, range));
      const overflow = viewport > 0 && range > EDGE_THRESHOLD;
      // The first turn rests THREAD_PAD_TOP below the header and the last one
      // right on the footer's fade strip, so the overlap starts at the first px
      // scrolled and each ramp spans the gap it is closing.
      const top = overflow && y > EDGE_THRESHOLD;
      const bottom = overflow && range - y > EDGE_THRESHOLD;
      topFade.value = overflow ? Math.min(1, y / THREAD_PAD_TOP) : 0;
      bottomFade.value = overflow ? Math.min(1, (range - y) / FOOTER_FADE) : 0;
      setEdges((previous) =>
        previous.top === top && previous.bottom === bottom ? previous : { top, bottom },
      );
    },
    [topFade, bottomFade],
  );

  const chrome = useMemo<AiChatFloatingChrome>(() => ({ insets, reportScroll }), [insets, reportScroll]);

  // SVG never receives alpha inside stopColor; it travels on the containing view.
  const parsed = fadeColor ? parseRgba(fadeColor) : null;
  const solid = parsed ? `rgb(${parsed.r}, ${parsed.g}, ${parsed.b})` : fadeColor;
  const alpha = parsed?.a ?? 1;
  const topStyle = useAnimatedStyle(() => ({ opacity: topFade.value * alpha }), [topFade, alpha]);
  const bottomStyle = useAnimatedStyle(() => ({ opacity: bottomFade.value * alpha }), [bottomFade, alpha]);
  const prefix = testID ?? 'ai-chat';

  return (
    <View testID={testID} style={[rootStyle, { position: 'relative' }]}>
      {backgroundLayer}
      <AiChatFloatingChromeContext.Provider value={chrome}>{children}</AiChatFloatingChromeContext.Provider>

      <View
        testID={`${prefix}-chrome-top`}
        pointerEvents="box-none"
        onLayout={onHeaderLayout}
        style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
        {solid && edges.top && insets.top > 0 ? (
          <Animated.View
            testID={`${prefix}-fade-top`}
            pointerEvents="none"
            {...HIDDEN_FROM_A11Y}
            style={[
              {
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                // Past the block's own bottom: a ramp that ends where the layout
                // does is a line across the transcript again.
                height: Math.round(insets.top * (1 + SCRIM_TAIL_RATIO)),
              },
              topStyle,
            ]}>
            <EdgeScrim color={solid} />
          </Animated.View>
        ) : null}
        {header}
        {crumbRow}
      </View>

      <View
        testID={`${prefix}-chrome-bottom`}
        pointerEvents="box-none"
        onLayout={onFooterLayout}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
        {solid && edges.bottom ? (
          <Animated.View
            testID={`${prefix}-fade-bottom`}
            pointerEvents="none"
            {...HIDDEN_FROM_A11Y}
            style={[StyleSheet.absoluteFill, { flexDirection: 'column' }, bottomStyle]}>
            <View style={{ height: FOOTER_FADE, transform: [{ rotate: '180deg' }] }}>
              <EdgeScrim color={solid} />
            </View>
            <View style={{ flex: 1, backgroundColor: solid }} />
          </Animated.View>
        ) : null}
        <View
          pointerEvents="box-none"
          style={{ width: '100%', flexDirection: 'column', gap: 10, paddingLeft: 10, paddingRight: 10, paddingTop: FOOTER_FADE, paddingBottom: 10 }}>
          {footerBody}
        </View>
      </View>
    </View>
  );
}

/**
 * The thread: the scrolling conversation, anchored to the bottom
 * so a short exchange sits just above the composer and grows upward — px 16 /
 * pt 16, turns 12 apart, a thin scrollbar.
 *
 * It follows the newest turn with a smooth scroll whenever the content grows.
 * That is the default and nothing else changes it; the timeline props are the
 * ones a host with history needs and are each off unless asked for:
 *
 *   autoFollow / followAnimated / followThreshold   whether, how, and from how
 *     close to the bottom the follow happens
 *   onStartReached                                  a chat pages UPWARD; this
 *     fires near the TOP, once per approach, re-arming when the reader leaves
 *   maintainStartPosition                           the growth that answers an
 *     `onStartReached` is added to the offset, so a page landing above the
 *     reader does not move the turn they are reading
 *   ref (`AiChatThreadHandle`)                      scrollToEnd /
 *     scrollToOffset / the ScrollView, for a cursor jump or a restore
 *
 * There is no virtualization and no `scrollToIndex`: a host jumping to a turn
 * measures its row (`onLayout`) and calls `scrollToOffset`.
 *
 * Inside `AiChatContainer floatingChrome` the thread still fills its parent —
 * the whole card — and pads its CONTENT by the chrome the container measured:
 * pt = header block + 16, pb = footer block. At rest the first and last turns
 * sit exactly where the stacked layout puts them relative to the chrome; in
 * motion they pass under it. It also reports its position so the container
 * knows when to fade each edge. Anywhere else nothing of this exists.
 */
export const AiChatThread = forwardRef<AiChatThreadHandle, AiChatThreadProps>(function AiChatThread(
  {
    children,
    autoFollow = true,
    followAnimated = true,
    followThreshold,
    onStartReached,
    onStartReachedThreshold = 300,
    maintainStartPosition = false,
    onScroll,
    scrollEventThrottle = 16,
    style,
    testID,
  },
  ref,
) {
  const chrome = useContext(AiChatFloatingChromeContext);
  const scrollRef = useRef<ScrollView>(null);
  const lastHeight = useRef(0);
  /**
   * The latest content height from ANY source, for the chrome report only.
   * `lastHeight` must change solely in `onContentSizeChange`: a scroll event
   * carrying the new size first would otherwise hide the growth from the follow.
   */
  const contentHeight = useRef(0);
  const offset = useRef(0);
  const viewport = useRef(0);
  /** An `onStartReached` is out and its page has not landed yet. */
  const pageOut = useRef(false);
  /** The reader has left the top zone, so the next approach may fire again. */
  const startArmed = useRef(true);

  // The chrome's padding changing is not a new turn: it is recorded here,
  // before the resize it causes, so `onContentSizeChange` can tell the two apart.
  const insetTop = chrome?.insets.top ?? 0;
  const insetBottom = chrome?.insets.bottom ?? 0;
  const appliedInsets = useRef({ top: insetTop, bottom: insetBottom });
  const insetShift = useRef({ top: 0, bottom: 0 });
  useIsomorphicLayoutEffect(() => {
    const applied = appliedInsets.current;
    insetShift.current = {
      top: insetShift.current.top + insetTop - applied.top,
      bottom: insetShift.current.bottom + insetBottom - applied.bottom,
    };
    appliedInsets.current = { top: insetTop, bottom: insetBottom };
  }, [insetTop, insetBottom]);

  useImperativeHandle(
    ref,
    (): AiChatThreadHandle => ({
      scrollToEnd: (options) => scrollRef.current?.scrollToEnd({ animated: options?.animated ?? true }),
      scrollToOffset: ({ offset: y, animated = false }) => scrollRef.current?.scrollTo({ y, animated }),
      getScrollView: () => scrollRef.current,
    }),
    [],
  );

  const listening =
    !!chrome || !!onScroll || !!onStartReached || followThreshold !== undefined || maintainStartPosition;

  const report = useCallback(() => {
    chrome?.reportScroll({ offset: offset.current, viewport: viewport.current, content: contentHeight.current });
  }, [chrome]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
      offset.current = contentOffset.y;
      viewport.current = layoutMeasurement.height;
      if (contentSize?.height) contentHeight.current = contentSize.height;
      report();
      if (onStartReached) {
        if (contentOffset.y <= onStartReachedThreshold) {
          if (startArmed.current) {
            startArmed.current = false;
            pageOut.current = true;
            onStartReached();
          }
        } else {
          startArmed.current = true;
        }
      }
      onScroll?.(event);
    },
    [onScroll, onStartReached, onStartReachedThreshold, report],
  );

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      viewport.current = event.nativeEvent.layout.height;
      report();
    },
    [report],
  );

  const onContentSizeChange = useCallback(
    (_width: number, height: number) => {
      const previous = lastHeight.current;
      const grew = height > previous + 0.5;
      const first = previous === 0;
      lastHeight.current = height;
      contentHeight.current = height;
      const shift = insetShift.current;
      insetShift.current = { top: 0, bottom: 0 };
      report();
      if (first) return;

      // Exactly the chrome's padding changed (a composer growing, the header
      // measuring in): hold the reader still instead of following. At the end
      // they stay at the end, unanimated; mid-thread, a top shift is absorbed
      // into the offset so the turn they are on does not move.
      const chromeShift = shift.top + shift.bottom;
      if (chromeShift !== 0 && Math.abs(height - previous - chromeShift) < 1) {
        const fromBottom = previous - offset.current - viewport.current;
        if (fromBottom <= EDGE_THRESHOLD) {
          scrollRef.current?.scrollToEnd({ animated: false });
        } else if (offset.current > 0 && shift.top !== 0) {
          scrollRef.current?.scrollTo({ y: offset.current + shift.top, animated: false });
        }
        return;
      }
      if (!grew) return;

      // A page landing above the reader: keep the turn they are on where it is.
      if (maintainStartPosition && pageOut.current) {
        pageOut.current = false;
        scrollRef.current?.scrollTo({ y: offset.current + (height - previous), animated: false });
        return;
      }
      pageOut.current = false;

      if (!autoFollow) return;
      if (followThreshold !== undefined) {
        // Measured against the height BEFORE the growth: was the reader near
        // the bottom when this arrived?
        const fromBottom = previous - offset.current - viewport.current;
        if (fromBottom > followThreshold) return;
      }
      scrollRef.current?.scrollToEnd({ animated: followAnimated });
    },
    [autoFollow, followAnimated, followThreshold, maintainStartPosition],
  );

  return (
    <ScrollView
      ref={scrollRef}
      testID={testID}
      {...dataHook('bloomAiChatScroll', 'thin')}
      onContentSizeChange={onContentSizeChange}
      onLayout={onLayout}
      onScroll={listening ? handleScroll : undefined}
      scrollEventThrottle={listening ? scrollEventThrottle : undefined}
      style={[{ minHeight: 0, width: '100%', flex: 1 }, style]}
      contentContainerStyle={{
        // react-native-web gives every view `min-height: 0`, so a growing
        // container would stay the viewport's height and overflow instead of
        // scrolling; a percentage floor keeps it bottom-anchored AND scrollable.
        ...(IS_WEB ? { minHeight: '100%', flexShrink: 0 } : { flexGrow: 1 }),
        flexDirection: 'column',
        justifyContent: 'flex-end',
        gap: 12,
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: THREAD_PAD_TOP + (chrome ? chrome.insets.top : 0),
        ...(chrome ? { paddingBottom: chrome.insets.bottom } : null),
      }}
      scrollIndicatorInsets={chrome ? { top: chrome.insets.top, bottom: chrome.insets.bottom } : undefined}>
      {children}
    </ScrollView>
  );
});
