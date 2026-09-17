import React, { memo, useCallback, useRef, useState } from 'react';
import { useWindowDimensions, View, type LayoutChangeEvent } from 'react-native';

import { AiChatResizeHandle } from '../ai-chat/AiChatShell';
import { useControllableState } from '../hooks/use-controllable-state';
import {
  CHAT_LIST_PANE_WIDTH,
  CHAT_INFO_PANE_WIDTH,
  CHAT_SCREEN_LABELS,
  CHAT_SPLIT_BREAKPOINT,
  clamp,
  dataHook,
  useChatScreenPaint,
} from './shared';
import type { ChatPane, ChatSplitLayoutProps } from './types';

/**
 * The desktop frame: conversation list, conversation, and optionally an info
 * pane — collapsing to ONE pane when there is not room for two.
 *
 * THE COMPACT LAYOUT RENDERS ONE PANE, it does not hide two. A hidden pane is
 * still mounted, still subscribed, still measuring, and on web still in the tab
 * order; on a phone that is three screens' worth of work to show one. So `pane`
 * SELECTS, and `list` / `info` are simply not built while the conversation is
 * showing.
 *
 * Asking for `info` with no `info` node falls back to the conversation rather
 * than rendering an empty screen: the caller has told you which pane it wants,
 * and the only honest answer when that pane does not exist is the one that
 * always does.
 *
 * The grip is `ai-chat`'s `AiChatResizeHandle` — the same pointer-capture drag,
 * arrow-key nudging and hover grip the AI shell uses, rather than a second
 * implementation of the same 90 lines. It reports a DELTA, so the width is
 * rebased on every drag start and the pane cannot drift.
 *
 * Compact is MEASURED from the layout, not from the window: this frame is
 * regularly mounted inside something narrower than the screen (a story, a
 * split-view host). The first render has no measurement, so it is seeded from
 * the window — which is right for the full-screen case and corrected on the next
 * frame for every other one.
 */
function ChatSplitLayoutComponent({
  list,
  children,
  info,
  pane = 'conversation',
  listWidth,
  onListWidthChange,
  defaultListWidth = CHAT_LIST_PANE_WIDTH,
  minWidth = 280,
  maxWidth = 480,
  infoWidth = CHAT_INFO_PANE_WIDTH,
  resizable = true,
  resizeLabel = CHAT_SCREEN_LABELS.resizeList,
  breakpoint = CHAT_SPLIT_BREAKPOINT,
  compact: compactProp,
  style,
  testID,
}: ChatSplitLayoutProps) {
  const paint = useChatScreenPaint();
  const { width: windowWidth } = useWindowDimensions();
  const [measured, setMeasured] = useState<number | null>(null);
  const compact = compactProp ?? (measured ?? windowWidth) < breakpoint;

  const [width, setWidth] = useControllableState<number>({
    value: listWidth,
    defaultValue: defaultListWidth,
    onChange: onListWidthChange,
  });
  const widthAtDragStart = useRef(width);

  const onResizeStart = useCallback(() => {
    widthAtDragStart.current = width;
  }, [width]);
  const onResize = useCallback(
    (dx: number) => setWidth(clamp(widthAtDragStart.current + dx, minWidth, maxWidth)),
    [maxWidth, minWidth, setWidth],
  );
  // The grip's arrow keys report a delta in the same direction the AI shell's
  // panel reads it (positive = the pane to the LEFT gives up width), so the sign
  // is flipped here: this handle sits on the list's right edge.
  const onNudge = useCallback(
    (dx: number) => setWidth(clamp(width - dx, minWidth, maxWidth)),
    [maxWidth, minWidth, setWidth, width],
  );

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setMeasured(event.nativeEvent.layout.width);
  }, []);

  if (compact) {
    const resolved: ChatPane = pane === 'info' && !info ? 'conversation' : pane;
    return (
      <View
        testID={testID}
        onLayout={onLayout}
        {...dataHook('chatPane', resolved)}
        style={[{ flexGrow: 1, flexShrink: 1, minWidth: 0, backgroundColor: paint.page }, style]}
      >
        {resolved === 'list' ? list : null}
        {resolved === 'conversation' ? children : null}
        {resolved === 'info' ? info : null}
      </View>
    );
  }

  return (
    <View
      testID={testID}
      onLayout={onLayout}
      {...dataHook('chatPane', 'split')}
      style={[
        {
          flexGrow: 1,
          flexShrink: 1,
          minWidth: 0,
          flexDirection: 'row',
          backgroundColor: paint.page,
        },
        style,
      ]}
    >
      <View
        testID={testID ? `${testID}-list` : undefined}
        style={{
          position: 'relative',
          width,
          flexShrink: 0,
          minWidth: 0,
          borderRightWidth: 1,
          borderRightColor: paint.border,
        }}
      >
        {list}
        {resizable ? (
          <AiChatResizeHandle
            label={resizeLabel}
            onResizeStart={onResizeStart}
            onResize={onResize}
            onNudge={onNudge}
            testID={testID ? `${testID}-grip` : undefined}
          />
        ) : null}
      </View>
      <View
        testID={testID ? `${testID}-conversation` : undefined}
        style={{ flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0 }}
      >
        {children}
      </View>
      {info ? (
        <View
          testID={testID ? `${testID}-info` : undefined}
          style={{ width: infoWidth, flexShrink: 0, minWidth: 0 }}
        >
          {info}
        </View>
      ) : null}
    </View>
  );
}

export const ChatSplitLayout = memo(ChatSplitLayoutComponent);
ChatSplitLayout.displayName = 'ChatSplitLayout';
