import { useDirectionProps } from '../hooks/use-is-rtl';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  PanResponder,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type PointerEvent,
} from 'react-native';

import { useCommonMessages } from '../locale/common-messages';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { BUTTON_SHADOW } from '../button/shared';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import {
  PILL_DRAG_OPACITY,
  PILL_HOVER_OPACITY,
  RESIZE_HANDLE,
  RESIZE_HANDLE_CSS,
} from './resize-handle-css';
import type { ResizeHandleProps } from './types';
import { IS_WEB } from '../styles/platform';
import { dataHook } from '../styles/data-hook';

/**
 * The resize grip (`DragHandle`): a 20px strip straddling a panel's end edge
 * (10px past it). Hovering it reveals a 15×25 grip — radius 4, 1px
 * border-button-default, background-primary, shadow-xs, three 1×13
 * icon-quaternary lines 2 apart — that follows the pointer along the edge
 * (kept 13px inside it) and stays up while dragging (150ms fade). Holding and
 * dragging reports the horizontal distance from where the drag started.
 *
 * The `pill` variant is a split's divider: a 4×36 bar, radius 2, centred on
 * the separator in the foreground colour, at 32% under the pointer or focus
 * and 55% while dragging, on a strip `thickness` deep (11: a 7px gap and 2px
 * of each pane). Same gestures, keys and semantics.
 */
const GRIP_BOX = {
  position: 'absolute',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 2,
  borderRadius: 4,
  borderStyle: 'solid',
  borderWidth: 1,
} as const;

const HANDLE_STYLES = StyleSheet.create({
  placed: { position: 'absolute', zIndex: 10, alignItems: 'center' },
  placedPill: { position: 'absolute', zIndex: 10, alignItems: 'center', justifyContent: 'center' },
  edgeBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -10,
    height: 20,
    zIndex: 10,
    alignItems: 'center',
  },
  edgeEnd: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    insetInlineEnd: -10,
    width: 20,
    zIndex: 10,
    alignItems: 'center',
  },
  gripRow: { ...GRIP_BOX, width: 25, height: 15, marginLeft: -12.5, flexDirection: 'column' },
  gripColumn: { ...GRIP_BOX, width: 15, height: 25, marginTop: -12.5, flexDirection: 'row' },
  lineAcross: { width: 13, height: 1 },
  lineDown: { width: 1, height: 13 },
});

export function ResizeHandle({
  orientation = 'vertical',
  variant = 'grip',
  thickness: thicknessProp,
  onResizeStart,
  onResize,
  onResizeEnd,
  label: labelProp,
  onNudge,
  style,
  testID,
}: ResizeHandleProps) {
  useEffect(() => {
    if (IS_WEB) adoptStyleSheet('bloom-resize-handle', RESIZE_HANDLE_CSS);
  }, []);
  const direction = useDirectionProps();
  const horizontal = orientation === 'horizontal';
  const { colors, isDark } = useTheme();
  const common = useCommonMessages();
  const label = labelProp ?? common.resizePanels;
  const [gripY, setGripY] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);
  const pill = variant === 'pill';
  const thickness =
    thicknessProp !== undefined && Number.isFinite(thicknessProp) && thicknessProp > 0
      ? thicknessProp
      : pill
        ? RESIZE_HANDLE.pill.thickness
        : RESIZE_HANDLE.grip.thickness;
  const height = useRef(0);
  const startX = useRef(0);
  const pointer = useRef<number | null>(null);
  const bounds = useRef({ left: 0, top: 0, width: 0, height: 0 });
  const targetRef = useRef<HTMLElement | null>(null);
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
          track(horizontal ? event.nativeEvent.locationX : event.nativeEvent.locationY);
          setDragging(true);
          callbacks.current.onResizeStart?.();
        },
        onPanResponderMove: (_event, gesture) =>
          callbacks.current.onResize(horizontal ? gesture.dy : gesture.dx),
        onPanResponderRelease: () => {
          setDragging(false);
          callbacks.current.onResizeEnd?.();
        },
        onPanResponderTerminate: () => {
          setDragging(false);
          callbacks.current.onResizeEnd?.();
        },
      }),
    [horizontal],
  );

  const finish = () => {
    if (pointer.current === null) return;
    const id = pointer.current;
    pointer.current = null;
    const target = targetRef.current;
    target?.removeAttribute('data-bloom-resize-handle-dragging');
    if (target?.hasPointerCapture(id)) target.releasePointerCapture(id);
    callbacks.current.onResizeEnd?.();
  };
  useEffect(() => () => finish(), [horizontal]);

  const measure = (target: HTMLElement) => {
    bounds.current = target.getBoundingClientRect();
  };
  const trackWeb = (event: PointerEvent) => {
    const { left, top, width, height } = bounds.current;
    const extent = horizontal ? width : height;
    const position = horizontal
      ? event.nativeEvent.clientX - left
      : event.nativeEvent.clientY - top;
    if (extent > 0)
      targetRef.current?.style.setProperty(
        '--bloom-grip-position',
        `${Math.max(13, Math.min(extent - 13, position))}px`,
      );
  };
  const web = IS_WEB
    ? {
        onPointerEnter: (event: PointerEvent) => {
          const target = event.currentTarget as unknown as HTMLElement;
          targetRef.current = target;
          measure(target);
          trackWeb(event);
        },
        onPointerDown: (event: PointerEvent) => {
          if (
            pointer.current !== null ||
            (event.nativeEvent.button !== undefined && event.nativeEvent.button !== 0)
          )
            return;
          event.preventDefault();
          const target = event.currentTarget as unknown as HTMLElement;
          targetRef.current = target;
          pointer.current = event.nativeEvent.pointerId;
          startX.current = horizontal ? event.nativeEvent.clientY : event.nativeEvent.clientX;
          measure(target);
          trackWeb(event);
          target.setAttribute('data-bloom-resize-handle-dragging', 'on');
          target.setPointerCapture(event.nativeEvent.pointerId);
          callbacks.current.onResizeStart?.();
        },
        onPointerMove: (event: PointerEvent) => {
          if (pointer.current !== null && pointer.current !== event.nativeEvent.pointerId) return;
          trackWeb(event);
          if (pointer.current !== null)
            callbacks.current.onResize(
              (horizontal ? event.nativeEvent.clientY : event.nativeEvent.clientX) - startX.current,
            );
        },
        onPointerUp: (event: PointerEvent) => {
          if (event.nativeEvent.pointerId !== pointer.current) return;
          // Preserve the final coordinate, including movement coalesced into pointerup.
          callbacks.current.onResize(
            (horizontal ? event.nativeEvent.clientY : event.nativeEvent.clientX) - startX.current,
          );
          finish();
        },
        onPointerCancel: (event: PointerEvent) => {
          if (event.nativeEvent.pointerId === pointer.current) finish();
        },
        onLostPointerCapture: finish,
        onKeyDown: (event: { nativeEvent: { key: string }; preventDefault?: () => void }) => {
          const key = event.nativeEvent.key;
          const delta =
            key === (horizontal ? 'ArrowUp' : 'ArrowLeft')
              ? -16
              : key === (horizontal ? 'ArrowDown' : 'ArrowRight')
                ? 16
                : 0;
          if (delta && onNudge) {
            event.preventDefault?.();
            onNudge(delta);
          }
        },
        tabIndex: onNudge ? (0 as const) : undefined,
      }
    : pill
      ? {
          ...responder.panHandlers,
          onPointerEnter: () => setHovered(true),
          onPointerLeave: () => setHovered(false),
          // react-native-macos reports hover as mouse enter and leave.
          ...({
            onMouseEnter: () => setHovered(true),
            onMouseLeave: () => setHovered(false),
          } as object),
        }
      : responder.panHandlers;

  const grip: WebCssStyle = {
    ...(IS_WEB
      ? horizontal
        ? { left: 'var(--bloom-grip-position, 50%)' }
        : { top: 'var(--bloom-grip-position, 50%)' }
      : horizontal
        ? { left: gripY ?? '50%' }
        : { top: gripY ?? '50%' }),
    borderColor: colors.borderLight,
    backgroundColor: colors.card,
    boxShadow: isDark ? BUTTON_SHADOW.dark : BUTTON_SHADOW.light,
    ...(IS_WEB ? null : { opacity: dragging ? 1 : 0 }),
  };

  // The grip at its own depth keeps its classes; any other strip is placed
  // here, centred on the separator (logical, so it follows the end edge in RTL).
  const placed = pill || thickness !== RESIZE_HANDLE.grip.thickness;
  const strip: WebCssStyle | null = !placed
    ? null
    : horizontal
      ? { left: 0, right: 0, height: thickness, bottom: -thickness / 2 }
      : { top: 0, bottom: 0, width: thickness, insetInlineEnd: -thickness / 2 };

  return (
    <View
      {...direction}
      {...(IS_WEB
        ? { dataSet: { bloomResizeHandle: '', bloomResizeHandleVariant: variant } }
        : null)}
      {...web}
      role="separator"
      aria-orientation={orientation}
      accessibilityLabel={label}
      testID={testID}
      onLayout={(event: LayoutChangeEvent) => {
        height.current = horizontal
          ? event.nativeEvent.layout.width
          : event.nativeEvent.layout.height;
      }}
      style={[
        placed
          ? pill
            ? HANDLE_STYLES.placedPill
            : HANDLE_STYLES.placed
          : horizontal
            ? HANDLE_STYLES.edgeBottom
            : HANDLE_STYLES.edgeEnd,
        strip,
        style,
      ]}
    >
      {pill ? (
        <View
          {...dataHook('bloomResizeHandlePill', dragging ? 'dragging' : '')}
          pointerEvents="none"
          style={{
            width: horizontal ? RESIZE_HANDLE.pill.length : RESIZE_HANDLE.pill.depth,
            height: horizontal ? RESIZE_HANDLE.pill.depth : RESIZE_HANDLE.pill.length,
            borderRadius: RESIZE_HANDLE.pill.depth / 2,
            backgroundColor: colors.text,
            ...(IS_WEB
              ? null
              : { opacity: dragging ? PILL_DRAG_OPACITY : hovered ? PILL_HOVER_OPACITY : 0 }),
          }}
        />
      ) : (
        <View
          {...dataHook('bloomResizeHandlePill', dragging ? 'dragging' : '')}
          pointerEvents="none"
          style={[horizontal ? HANDLE_STYLES.gripRow : HANDLE_STYLES.gripColumn, grip]}
        >
          {[0, 1, 2].map((line) => (
            <View
              key={line}
              style={[
                horizontal ? HANDLE_STYLES.lineAcross : HANDLE_STYLES.lineDown,
                { backgroundColor: colors.textTertiary },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}
