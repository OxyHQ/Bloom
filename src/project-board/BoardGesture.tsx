import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
  type ComponentRef,
} from 'react';
import { Platform, type View, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { StyledPressable, StyledView } from '../styles/styled-primitives';
import { useMessages } from '../locale/messages';
import { PROJECT_BOARD_MESSAGES } from './messages';
import type { BoardDragHandleProps } from './types';

export interface BoardDragBinding {
  nativeID: string;
  enabled: boolean;
  allowReorder: boolean;
  onStart: (x: number, y: number) => void;
  onUpdate: (x: number, y: number) => void;
  onEnd: (success: boolean) => void;
  onAccessibleMove: (direction: 'up' | 'down' | 'next' | 'previous') => void;
  suppressOpen: () => boolean;
}
export const BoardDragContext = createContext<BoardDragBinding | null>(null);

/** One gesture recognizer for template cards and arbitrary consumer card handles. */
export function BoardGesture({
  children,
  binding,
  style,
  className,
}: {
  children: ReactNode;
  binding: BoardDragBinding;
  style?: StyleProp<ViewStyle>;
  className?: string;
}) {
  const callbacks = useRef(binding);
  callbacks.current = binding;
  const node = useRef<ComponentRef<typeof View>>(null);
  const blocked = useRef(false);
  const started = useRef(false);
  const start = useCallback((x: number, y: number) => {
    if (!blocked.current) {
      started.current = true;
      callbacks.current.onStart(x, y);
    }
  }, []);
  const update = useCallback((x: number, y: number) => {
    if (started.current) callbacks.current.onUpdate(x, y);
  }, []);
  const finish = useCallback((success: boolean) => {
    if (started.current) {
      started.current = false;
      callbacks.current.onEnd(success);
    }
  }, []);
  const shouldBlock = useCallback(() => blocked.current, []);
  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(binding.enabled)
        .activateAfterLongPress(Platform.OS === 'web' ? 0 : 180)
        .minDistance(5)
        .runOnJS(true)
        .onTouchesDown((_event, manager) => {
          if (shouldBlock()) manager.fail();
        })
        .onStart((event) => start(event.absoluteX, event.absoluteY))
        .onUpdate((event) => update(event.absoluteX, event.absoluteY))
        .onFinalize((_event, success) => finish(success)),
    [binding.enabled, shouldBlock, start, update, finish],
  );
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const element = node.current as unknown as HTMLElement | null;
    if (!element?.addEventListener) return;
    const down = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const selector =
        'button, input, textarea, select, a, [role="button"], [role="link"], [role="checkbox"], [role="combobox"], [role="switch"], [contenteditable="true"]';
      const interactive = target?.closest(selector);
      blocked.current =
        !!target?.closest('[data-bloom-board-no-drag]') ||
        !!(
          interactive &&
          interactive !== element.querySelector(selector) &&
          element.contains(interactive)
        );
    };
    const click = (event: MouseEvent) => {
      if (callbacks.current.suppressOpen()) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    element.addEventListener('pointerdown', down, true);
    element.addEventListener('click', click, true);
    return () => {
      element.removeEventListener('pointerdown', down, true);
      element.removeEventListener('click', click, true);
    };
  }, []);
  return (
    <StyledView ref={node} style={[{ minWidth: 0 }, style]} className={className}>
      <GestureDetector gesture={gesture} touchAction="none">
        <StyledView collapsable={false} style={{ minWidth: 0 }}>
          {children}
        </StyledView>
      </GestureDetector>
    </StyledView>
  );
}

export function BoardDragHandle({
  children,
  accessibilityLabel,
  style,
  className,
  testID,
  onPress,
}: BoardDragHandleProps) {
  const binding = useContext(BoardDragContext);
  const { messages: m } = useMessages(PROJECT_BOARD_MESSAGES);
  if (!binding?.enabled)
    return (
      <StyledView style={style} className={className} testID={testID}>
        {children}
      </StyledView>
    );
  return (
    <BoardGesture binding={binding} style={style} className={className}>
      <StyledPressable
        accessible
        nativeID={binding.nativeID}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={m.keyboardHint}
        accessibilityActions={[
          ...(binding.allowReorder
            ? [
                { name: 'moveUp', label: m.moveUp },
                { name: 'moveDown', label: m.moveDown },
              ]
            : []),
          { name: 'nextColumn', label: m.nextColumn },
          { name: 'previousColumn', label: m.previousColumn },
        ]}
        onAccessibilityAction={(event) => {
          const action = event.nativeEvent.actionName;
          if (
            action === 'moveUp' ||
            action === 'moveDown' ||
            action === 'nextColumn' ||
            action === 'previousColumn'
          )
            binding.onAccessibleMove(
              action === 'moveUp'
                ? 'up'
                : action === 'moveDown'
                  ? 'down'
                  : action === 'nextColumn'
                    ? 'next'
                    : 'previous',
            );
        }}
        onPress={(event) => {
          if (binding.suppressOpen()) {
            event.stopPropagation();
            return;
          }
          if (onPress) {
            event.stopPropagation();
            onPress();
          }
        }}
        testID={testID}
      >
        {children}
      </StyledPressable>
    </BoardGesture>
  );
}
