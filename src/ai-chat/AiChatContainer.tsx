import React, { forwardRef, useCallback, useImperativeHandle, useMemo, useRef } from 'react';
import {
  ScrollView,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { AgentThinking } from '../agent-thinking';
import { Breadcrumb, BreadcrumbItem } from '../breadcrumb';
import { RiFolderLine } from '../icons/remix/RiFolderLine';
import { RiMoreFill } from '../icons/remix/RiMoreFill';
import { RiShare2Line } from '../icons/remix/RiShare2Line';
import { GlyphAction } from './AiChatControls';
import { CONTAINER_RADIUS, dataHook, IS_WEB, useAiChatPalette, useAiChatWebCss } from './shared';
import type { AiChatContainerProps, AiChatThreadHandle, AiChatThreadProps } from './types';

const DEFAULT_LABELS = {
  breadcrumb: 'Chat location',
  share: 'Share chat',
  more: 'More options',
};

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
 */
export function AiChatContainer({
  project,
  title,
  projectIcon = RiFolderLine,
  onProjectPress,
  onShare,
  onMore,
  header,
  children,
  composer,
  working = false,
  workingLabel,
  background,
  surface = true,
  labels,
  style,
  testID,
}: AiChatContainerProps) {
  useAiChatWebCss();
  const palette = useAiChatPalette();
  const l = useMemo(() => ({ ...DEFAULT_LABELS, ...labels }), [labels]);
  return (
    <View
      testID={testID}
      style={[
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
      ]}>
      {background ? (
        <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          {background}
        </View>
      ) : null}
      {header}
      <View
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
        <View style={{ minWidth: 0, flex: 1 }}>
          <Breadcrumb accessibilityLabel={l.breadcrumb}>
            {project === undefined ? null : (
              <BreadcrumbItem icon={projectIcon} onPress={onProjectPress}>
                {project}
              </BreadcrumbItem>
            )}
            <BreadcrumbItem current>{title}</BreadcrumbItem>
          </Breadcrumb>
        </View>
        <View style={{ flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <GlyphAction icon={RiShare2Line} label={l.share} onPress={onShare} palette={palette} />
          <GlyphAction icon={RiMoreFill} label={l.more} onPress={onMore} palette={palette} />
        </View>
      </View>

      {children}

      <View style={{ width: '100%', flexDirection: 'column', gap: 10, paddingLeft: 10, paddingRight: 10, paddingTop: 12, paddingBottom: 10 }}>
        {working ? <AgentThinking variant="infinity" label={workingLabel} style={{ paddingLeft: 6, paddingRight: 6 }} /> : null}
        {composer}
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
  const scrollRef = useRef<ScrollView>(null);
  const lastHeight = useRef(0);
  const offset = useRef(0);
  const viewport = useRef(0);
  /** An `onStartReached` is out and its page has not landed yet. */
  const pageOut = useRef(false);
  /** The reader has left the top zone, so the next approach may fire again. */
  const startArmed = useRef(true);

  useImperativeHandle(
    ref,
    (): AiChatThreadHandle => ({
      scrollToEnd: (options) => scrollRef.current?.scrollToEnd({ animated: options?.animated ?? true }),
      scrollToOffset: ({ offset: y, animated = false }) => scrollRef.current?.scrollTo({ y, animated }),
      getScrollView: () => scrollRef.current,
    }),
    [],
  );

  const listening = !!onScroll || !!onStartReached || followThreshold !== undefined || maintainStartPosition;

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, layoutMeasurement } = event.nativeEvent;
      offset.current = contentOffset.y;
      viewport.current = layoutMeasurement.height;
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
    [onScroll, onStartReached, onStartReachedThreshold],
  );

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    viewport.current = event.nativeEvent.layout.height;
  }, []);

  const onContentSizeChange = useCallback(
    (_width: number, height: number) => {
      const previous = lastHeight.current;
      const grew = height > previous + 0.5;
      const first = previous === 0;
      lastHeight.current = height;
      if (!grew || first) return;

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
        paddingTop: 16,
      }}>
      {children}
    </ScrollView>
  );
});
