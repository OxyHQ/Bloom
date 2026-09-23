import React, {
  forwardRef,
  useCallback,
  useContext,
  useEffect,
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
  AiChatDocumentGutterContext,
  AiChatFloatingChromeContext,
  useAiChatShell,
  type AiChatChromeInsets,
  type AiChatFloatingChrome,
  type AiChatScrollMetrics,
} from './context';
import {
  CONTAINER_RADIUS,
  dataHook,
  DOCUMENT_LAYER,
  IS_WEB,
  SHELL_GUTTER,
  useAiChatPalette,
  useAiChatWebCss,
} from './shared';
import { WEB_POSITION_STICKY, webViewportHeightMinus } from '../styles/web-view-style';
import type { AiChatContainerProps, AiChatThreadHandle, AiChatThreadProps } from './types';

const DEFAULT_LABELS = {
  breadcrumb: 'Chat location',
  share: 'Share chat',
  more: 'More options',
};

/** The thread's own top padding: the gap between the header and the first turn. */
const THREAD_PAD_TOP = 16;
/** The footer's top padding: the gap between the last turn at rest and the composer. */
const FOOTER_GAP = 12;
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
 *   footer    absolute at the bottom, with no band of its own: the transcript
 *             passes behind the composer and stays in sight around it
 *
 * Both blocks are `pointerEvents="box-none"`, so the transcript under their
 * empty space still scrolls and takes clicks. The measured heights reach an
 * `AiChatThread` child through context (its content padding) and any other
 * child through `useAiChatChromeInsets()`.
 *
 * Under a shell with `scroll="document"` the chrome always floats, since the
 * document is what moves: the header and the footer are `sticky` in the flow,
 * pinned to the screen's top and bottom gutter, the `background` slot and the
 * card's frame are layers the size of the screen, and the card grows with the
 * conversation. At rest nothing overlaps, so the insets are zero.
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
  const documentScroll = useAiChatShell()?.documentScroll ?? false;
  const gutterColor = useContext(AiChatDocumentGutterContext);

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

  if (documentScroll) {
    return (
      <FloatingChrome
        documentScroll
        testID={testID}
        rootStyle={[
          {
            // Grows with the conversation, one screen at the least; nothing
            // clips it, so the header and composer inside can stick.
            minHeight: webViewportHeightMinus(SHELL_GUTTER * 2),
            minWidth: 0,
            flex: 1,
            flexDirection: 'column',
            borderRadius: CONTAINER_RADIUS,
            backgroundColor: surface ? palette.secondary : 'transparent',
          },
          style,
        ]}
        backgroundLayer={
          background ? (
            <View pointerEvents="none" style={[DOCUMENT_LAYER, { overflow: 'hidden' }]}>
              {background}
            </View>
          ) : null
        }
        header={header}
        crumbRow={crumbRow}
        footerBody={footerBody}
        fadeColor={surface ? palette.secondary : null}
        gutterColor={gutterColor}>
        {children}
      </FloatingChrome>
    );
  }

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
  /** The page scrolls the document: the chrome is sticky in the flow, not absolute. */
  documentScroll?: boolean;
  testID?: string;
  rootStyle: StyleProp<ViewStyle>;
  backgroundLayer: ReactNode;
  header: ReactNode;
  crumbRow: ReactNode;
  footerBody: ReactNode;
  /** The opaque surface the header's edge fades to, or `null` for no fade. */
  fadeColor: string | null;
  /** `documentScroll`: the gutter around the card, which its frame masks in. */
  gutterColor?: string | null;
  children: ReactNode;
}

const NO_INSETS: AiChatChromeInsets = { top: 0, bottom: 0 };

/**
 * `AiChatContainer floatingChrome` (and every container under a document-
 * scrolled shell): the same parts, the chrome floated over the transcript.
 * Everything it measures lives here, so the stacked path above carries none of
 * the state.
 *
 * The header's edge opacity is a shared value written from the thread's scroll
 * reports, so a scroll frame re-renders nothing; the boolean only mounts and
 * unmounts the scrim, and changes once per crossing. Same model as the
 * sidebar's `SidebarScrollArea`, whose scrim this reuses.
 */
function FloatingChrome({
  documentScroll = false,
  testID,
  rootStyle,
  backgroundLayer,
  header,
  crumbRow,
  footerBody,
  fadeColor,
  gutterColor = null,
  children,
}: FloatingChromeProps) {
  const [insets, setInsets] = useState<AiChatChromeInsets>(NO_INSETS);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const topFade = useSharedValue(0);

  const onHeaderLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const top = Math.round(event.nativeEvent.layout.height);
      setHeaderHeight(top);
      // In the flow the header covers nothing at rest: no inset to publish.
      if (!documentScroll) setInsets((previous) => (previous.top === top ? previous : { ...previous, top }));
    },
    [documentScroll],
  );
  const onFooterLayout = useCallback(
    (event: LayoutChangeEvent) => {
      if (documentScroll) return;
      const bottom = Math.round(event.nativeEvent.layout.height);
      setInsets((previous) => (previous.bottom === bottom ? previous : { ...previous, bottom }));
    },
    [documentScroll],
  );

  const reportScroll = useCallback(
    ({ offset, viewport, content }: AiChatScrollMetrics) => {
      const range = Math.max(0, content - viewport);
      const y = Math.max(0, Math.min(offset, range));
      const overflow = viewport > 0 && range > EDGE_THRESHOLD;
      // The first turn rests THREAD_PAD_TOP below the header, so the overlap
      // starts at the first px scrolled and the ramp spans the gap it closes.
      topFade.value = overflow ? Math.min(1, y / THREAD_PAD_TOP) : 0;
      const next = overflow && y > EDGE_THRESHOLD;
      setScrolled((previous) => (previous === next ? previous : next));
    },
    [topFade],
  );

  const chrome = useMemo<AiChatFloatingChrome>(() => ({ insets, reportScroll }), [insets, reportScroll]);

  // SVG never receives alpha inside stopColor; it travels on the containing view.
  const parsed = fadeColor ? parseRgba(fadeColor) : null;
  const solid = parsed ? `rgb(${parsed.r}, ${parsed.g}, ${parsed.b})` : fadeColor;
  const alpha = parsed?.a ?? 1;
  const topStyle = useAnimatedStyle(() => ({ opacity: topFade.value * alpha }), [topFade, alpha]);
  const prefix = testID ?? 'ai-chat';

  // Absolute over a card of fixed height; sticky in the flow of a card that
  // grows with the document, pinned to the screen's gutter.
  const headerPosition: ViewStyle = documentScroll
    ? { position: WEB_POSITION_STICKY, top: SHELL_GUTTER, zIndex: 2 }
    : { position: 'absolute', top: 0, left: 0, right: 0 };
  const footerPosition: ViewStyle = documentScroll
    ? { position: WEB_POSITION_STICKY, bottom: SHELL_GUTTER, zIndex: 2 }
    : { position: 'absolute', left: 0, right: 0, bottom: 0 };

  const top = (
    <View testID={`${prefix}-chrome-top`} pointerEvents="box-none" onLayout={onHeaderLayout} style={headerPosition}>
      {solid && scrolled && headerHeight > 0 ? (
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
              height: Math.round(headerHeight * (1 + SCRIM_TAIL_RATIO)),
              // The card's own corners, since nothing clips a document card.
              borderTopLeftRadius: CONTAINER_RADIUS,
              borderTopRightRadius: CONTAINER_RADIUS,
              overflow: 'hidden',
            },
            topStyle,
          ]}>
          <EdgeScrim color={solid} />
        </Animated.View>
      ) : null}
      {header}
      {crumbRow}
    </View>
  );

  const bottom = (
    <View testID={`${prefix}-chrome-bottom`} pointerEvents="box-none" onLayout={onFooterLayout} style={footerPosition}>
      <View
        pointerEvents="box-none"
        style={{ width: '100%', flexDirection: 'column', gap: 10, paddingLeft: 10, paddingRight: 10, paddingTop: FOOTER_GAP, paddingBottom: 10 }}>
        {footerBody}
      </View>
    </View>
  );

  const thread = <AiChatFloatingChromeContext.Provider value={chrome}>{children}</AiChatFloatingChromeContext.Provider>;

  if (documentScroll) {
    return (
      <View testID={testID} style={rootStyle}>
        {backgroundLayer}
        {gutterColor ? (
          // The card's frame, pinned to the screen: a ring of the gutter's
          // colour painted over whatever of the conversation scrolls past the
          // card's visible edge, so the card keeps its rounded corners and its
          // gutter at the top and the bottom of the screen. Clipped to the
          // gutter sideways (the family sheet), so it never reaches the columns
          // beside the card.
          <View
            testID={`${prefix}-frame`}
            pointerEvents="none"
            {...HIDDEN_FROM_A11Y}
            {...dataHook('bloomAiChatFrame')}
            style={[DOCUMENT_LAYER, { zIndex: 1, boxShadow: `0 0 0 ${SHELL_GUTTER}px ${gutterColor}` }]}
          />
        ) : null}
        {top}
        {thread}
        {bottom}
      </View>
    );
  }

  return (
    <View testID={testID} style={[rootStyle, { position: 'relative' }]}>
      {backgroundLayer}
      {thread}
      {top}
      {bottom}
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
export const AiChatThread = forwardRef<AiChatThreadHandle, AiChatThreadProps>(function AiChatThread(props, ref) {
  const documentScroll = useAiChatShell()?.documentScroll ?? false;
  return documentScroll ? <DocumentThread ref={ref} {...props} /> : <ScrollThread ref={ref} {...props} />;
});

/** The thread inside a card of fixed height: a `ScrollView` of its own. */
const ScrollThread = forwardRef<AiChatThreadHandle, AiChatThreadProps>(function ScrollThread(
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

/** The window's scroll position and extent, px. */
function readWindow() {
  const page = document.scrollingElement ?? document.documentElement;
  return { y: window.scrollY, viewport: window.innerHeight, end: page.scrollHeight };
}

function scrollWindowTo(top: number, animated: boolean) {
  window.scrollTo({ top, behavior: animated ? 'smooth' : 'auto' });
}

/**
 * The thread under a document-scrolled shell (web): no scroller of its own —
 * the turns grow the page and the window scrolls them. Same props, same handle,
 * same behaviour: it follows the newest turn, fires `onStartReached` near the
 * top, holds the reader still while a page lands above, and reports its
 * position to the container.
 *
 * Offsets keep the thread's own frame: `0` is the thread's top, so a row's
 * `onLayout` y is still a `scrollToOffset` target, and `contentSize` runs to the
 * END OF THE PAGE, so `contentSize − offset − viewport` is still the distance
 * left to scroll. The browser's scroll anchoring is off inside the thread (the
 * family sheet): it would move the page for growth the thread already accounts
 * for, and only in some browsers.
 */
const DocumentThread = forwardRef<AiChatThreadHandle, AiChatThreadProps>(function DocumentThread(
  {
    children,
    autoFollow = true,
    followAnimated = true,
    followThreshold,
    onStartReached,
    onStartReachedThreshold = 300,
    maintainStartPosition = false,
    onScroll,
    style,
    testID,
  },
  ref,
) {
  const chrome = useContext(AiChatFloatingChromeContext);
  const nodeRef = useRef<View>(null);
  const lastHeight = useRef(0);
  /** An `onStartReached` is out and its page has not landed yet. */
  const pageOut = useRef(false);
  /** The reader has left the top zone, so the next approach may fire again. */
  const startArmed = useRef(true);

  /** The thread's top, px from the top of the page. */
  const threadTop = useCallback(() => {
    const node = nodeRef.current as unknown as HTMLElement | null;
    return node ? node.getBoundingClientRect().top + window.scrollY : 0;
  }, []);

  useImperativeHandle(
    ref,
    (): AiChatThreadHandle => ({
      scrollToEnd: (options) => scrollWindowTo(readWindow().end, options?.animated ?? true),
      scrollToOffset: ({ offset: y, animated = false }) => scrollWindowTo(threadTop() + y, animated),
      getScrollView: () => null,
    }),
    [threadTop],
  );

  // The latest handlers, read by one window listener that is never rebound.
  const handlers = useRef({ chrome, onScroll, onStartReached, onStartReachedThreshold });
  useIsomorphicLayoutEffect(() => {
    handlers.current = { chrome, onScroll, onStartReached, onStartReachedThreshold };
  });

  const report = useCallback(() => {
    const { chrome: frame, onScroll: listener, onStartReached: startReached, onStartReachedThreshold: zone } = handlers.current;
    const { y, viewport, end } = readWindow();
    frame?.reportScroll({ offset: y, viewport, content: end });
    const top = threadTop();
    const offset = y - top;
    if (startReached) {
      if (offset <= zone) {
        if (startArmed.current) {
          startArmed.current = false;
          pageOut.current = true;
          startReached();
        }
      } else {
        startArmed.current = true;
      }
    }
    listener?.({
      nativeEvent: {
        contentOffset: { x: 0, y: offset },
        layoutMeasurement: { width: window.innerWidth, height: viewport },
        contentSize: { width: window.innerWidth, height: end - top },
        contentInset: { top: 0, left: 0, bottom: 0, right: 0 },
        zoomScale: 1,
      },
    } as NativeSyntheticEvent<NativeScrollEvent>);
  }, [threadTop]);

  useEffect(() => {
    let frame = 0;
    const onWindowChange = () => {
      if (frame !== 0) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        report();
      });
    };
    window.addEventListener('scroll', onWindowChange, { passive: true });
    window.addEventListener('resize', onWindowChange);
    report();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onWindowChange);
      window.removeEventListener('resize', onWindowChange);
    };
  }, [report]);

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const height = event.nativeEvent.layout.height;
      const previous = lastHeight.current;
      lastHeight.current = height;
      report();
      // The page is shared with whatever was on it before — another route
      // left it scrolled wherever it was — so a following thread opens at its
      // newest turn rather than at that offset.
      if (previous === 0) {
        if (autoFollow) scrollWindowTo(readWindow().end, false);
        return;
      }
      if (height <= previous + 0.5) return;
      const growth = height - previous;

      // A page landing above the reader: keep the turn they are on where it is.
      if (maintainStartPosition && pageOut.current) {
        pageOut.current = false;
        window.scrollBy({ top: growth, behavior: 'auto' });
        return;
      }
      pageOut.current = false;

      if (!autoFollow) return;
      if (followThreshold !== undefined) {
        // Measured against the page BEFORE the growth: was the reader near the
        // end when this arrived?
        const { y, viewport, end } = readWindow();
        if (end - growth - y - viewport > followThreshold) return;
      }
      scrollWindowTo(readWindow().end, followAnimated);
    },
    [autoFollow, followAnimated, followThreshold, maintainStartPosition, report],
  );

  return (
    <View
      ref={nodeRef}
      testID={testID}
      {...dataHook('bloomAiChatThread')}
      onLayout={onLayout}
      style={[
        {
          // Fills the card between the header and the composer, and anchors a
          // short exchange just above the composer, as the scroller does.
          width: '100%',
          flexGrow: 1,
          flexDirection: 'column',
          justifyContent: 'flex-end',
          gap: 12,
          paddingLeft: 16,
          paddingRight: 16,
          paddingTop: THREAD_PAD_TOP,
        },
        style,
      ]}>
      {children}
    </View>
  );
});
