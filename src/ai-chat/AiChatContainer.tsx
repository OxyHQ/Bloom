import React, { useCallback, useMemo, useRef } from 'react';
import { ScrollView, View } from 'react-native';

import { AgentThinking } from '../agent-thinking';
import { Breadcrumb, BreadcrumbItem } from '../breadcrumb';
import { RiFolderLine } from '../icons/remix/RiFolderLine';
import { RiMoreFill } from '../icons/remix/RiMoreFill';
import { RiShare2Line } from '../icons/remix/RiShare2Line';
import { GlyphAction } from './AiChatControls';
import { CONTAINER_RADIUS, dataHook, IS_WEB, useAiChatPalette, useAiChatWebCss } from './shared';
import type { AiChatContainerProps, AiChatThreadProps } from './types';

const DEFAULT_LABELS = {
  breadcrumb: 'Chat location',
  share: 'Share chat',
  more: 'More options',
};

/**
 * The AI chat's centre column: the centre column of the AI chat template.
 *
 *   section   fills its parent, radius 24, background-secondary, clipped
 *   header    px 16 / pt 16, gap 8: the project › chat breadcrumb (flex 1) and
 *             the 16px share / more glyphs, 8 apart
 *   thread    the `children` — usually an `AiChatThread`
 *   footer    px 10 / pt 12 / pb 10, gap 10: `AgentThinking` (infinity, px 6)
 *             while `working`, then the `composer`
 *
 * `header` renders above all of it: the shell's `AiChatMobileHeader`.
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
          backgroundColor: palette.secondary,
        },
        style,
      ]}>
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
            <BreadcrumbItem icon={projectIcon} onPress={onProjectPress}>
              {project}
            </BreadcrumbItem>
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
 * pt 16, turns 12 apart, a thin scrollbar. It follows the newest turn with a
 * smooth scroll whenever the content grows.
 */
export function AiChatThread({ children, style, testID }: AiChatThreadProps) {
  const scrollRef = useRef<ScrollView>(null);
  const lastHeight = useRef(0);
  const onContentSizeChange = useCallback((_width: number, height: number) => {
    const grew = height > lastHeight.current + 0.5;
    const first = lastHeight.current === 0;
    lastHeight.current = height;
    if (grew && !first) scrollRef.current?.scrollToEnd({ animated: true });
  }, []);
  return (
    <ScrollView
      ref={scrollRef}
      testID={testID}
      {...dataHook('bloomAiChatScroll', 'thin')}
      onContentSizeChange={onContentSizeChange}
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
}
