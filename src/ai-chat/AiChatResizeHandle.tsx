/**
 * The divider grip between two resizable panes. Its own module because three
 * families draw it — `AiChatShell`, `AppShell`'s `split` variant and
 * `ChatSplitLayout` — and the two that are not the AI chat must not link the
 * chat shell (Metro does not tree-shake): importing it from `AiChatShell` put
 * that module, its reanimated drawers and the whole ai-chat message catalog in
 * every app that renders an `AppShell`.
 */
import React, { useMemo, useRef, useState } from 'react';
import { PanResponder, View, type LayoutChangeEvent, type PointerEvent } from 'react-native';

import { useCommonMessages } from '../locale/common-messages';
import type { WebCssStyle } from '../styles/web-view-style';
import { dataHook, IS_WEB, useAiChatPalette, useAiChatWebCss } from './shared';
import type { AiChatResizeHandleProps } from './types';

/**
 * The resize grip (`DragHandle`): a 20px strip straddling the chat's right edge
 * (10px past it). Hovering it reveals a 15×25 grip — radius 4, 1px
 * border-button-default, background-primary, shadow-xs, three 1×13
 * icon-quaternary lines 2 apart — that follows the pointer along the edge
 * (kept 13px inside it) and stays up while dragging (150ms fade). Holding and
 * dragging reports the horizontal distance from where the drag started.
 */
export function AiChatResizeHandle({
  onResizeStart,
  onResize,
  onResizeEnd,
  label: labelProp,
  onNudge,
  style,
  testID,
}: AiChatResizeHandleProps) {
  useAiChatWebCss();
  const palette = useAiChatPalette();
  const common = useCommonMessages();
  const label = labelProp ?? common.resizePanels;
  const [gripY, setGripY] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const height = useRef(0);
  const startX = useRef(0);
  const callbacks = useRef({ onResizeStart, onResize, onResizeEnd });
  callbacks.current = { onResizeStart, onResize, onResizeEnd };

  const track = (localY: number) => {
    const h = height.current;
    if (h > 0) setGripY(Math.min(h - 13, Math.max(13, localY)));
  };

  // Native: a pan responder (web uses pointer capture below).
  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          track(event.nativeEvent.locationY);
          setDragging(true);
          callbacks.current.onResizeStart?.();
        },
        onPanResponderMove: (_event, gesture) => callbacks.current.onResize(gesture.dx),
        onPanResponderRelease: () => {
          setDragging(false);
          callbacks.current.onResizeEnd?.();
        },
        onPanResponderTerminate: () => {
          setDragging(false);
          callbacks.current.onResizeEnd?.();
        },
      }),
    [],
  );

  type DomTarget = {
    getBoundingClientRect: () => { top: number };
    setPointerCapture: (id: number) => void;
    hasPointerCapture: (id: number) => boolean;
  };
  const web = IS_WEB
    ? {
        onPointerDown: (event: PointerEvent) => {
          event.preventDefault();
          startX.current = event.nativeEvent.clientX;
          setDragging(true);
          callbacks.current.onResizeStart?.();
          (event.currentTarget as unknown as DomTarget).setPointerCapture(event.nativeEvent.pointerId);
        },
        onPointerMove: (event: PointerEvent) => {
          const target = event.currentTarget as unknown as DomTarget;
          track(event.nativeEvent.clientY - target.getBoundingClientRect().top);
          if (target.hasPointerCapture(event.nativeEvent.pointerId)) {
            callbacks.current.onResize(event.nativeEvent.clientX - startX.current);
          }
        },
        onPointerUp: () => {
          setDragging(false);
          callbacks.current.onResizeEnd?.();
        },
        onPointerCancel: () => {
          setDragging(false);
          callbacks.current.onResizeEnd?.();
        },
        onKeyDown: (event: { nativeEvent: { key: string } }) => {
          if (event.nativeEvent.key === 'ArrowLeft') onNudge?.(-16);
          if (event.nativeEvent.key === 'ArrowRight') onNudge?.(16);
        },
        tabIndex: onNudge ? (0 as const) : undefined,
      }
    : responder.panHandlers;

  const grip: WebCssStyle = {
    position: 'absolute',
    ...(gripY === null ? { top: '50%' } : { top: gripY }),
    width: 15,
    height: 25,
    marginTop: -12.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.primary,
    boxShadow: palette.shadowXs,
    ...(IS_WEB ? null : { opacity: dragging ? 1 : 0 }),
  };

  return (
    <View
      {...dataHook('bloomAiChatGrip')}
      {...web}
      role="separator"
      aria-orientation="vertical"
      accessibilityLabel={label}
      testID={testID}
      onLayout={(event: LayoutChangeEvent) => {
        height.current = event.nativeEvent.layout.height;
      }}
      style={[
        { position: 'absolute', top: 0, bottom: 0, right: -10, zIndex: 10, width: 20, alignItems: 'center' },
        style,
      ]}>
      <View {...dataHook('bloomAiChatGripPill', dragging ? 'dragging' : '')} pointerEvents="none" style={grip}>
        {[0, 1, 2].map((line) => (
          <View key={line} style={{ width: 1, height: 13, backgroundColor: palette.iconQuaternary }} />
        ))}
      </View>
    </View>
  );
}
