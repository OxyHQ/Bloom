import { StyledPressable } from '../styles/styled-primitives';
import { useCallback, useMemo, useRef } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS, type SharedValue } from 'react-native-reanimated';
import { interactiveWebCss, useInteractiveWebCss } from '../styles/interactive-web-css';
import { useRingOffsetStyle } from '../styles/surface-levels';
import { Platform, View } from 'react-native';
import { RiDraggable } from '../icons/remix/RiDraggable';
import { useTheme } from '../theme/use-theme';
import { useMessages } from '../locale/messages';
import { APP_SHELL_MESSAGES } from './messages';
import type { WebCssStyle } from '../styles/web-view-style';

const HANDLE_CSS = interactiveWebCss({
  selector: '[data-bloom-panel-reorder]',
  varPrefix: 'bloom-panel-reorder',
  reset: 'none',
  transition: 'none',
  base: 'cursor: grab; touch-action: none; user-select: none;',
  extraRules: '[data-bloom-panel-reordering] [data-bloom-panel-reorder] { cursor: grabbing; }',
});

export function PanelReorderHandle({
  id,
  label,
  onMove,
  onStart,
  onUpdate,
  onFinish,
  pointer,
  testID,
}: {
  id: string;
  label: string;
  onMove: (delta: number) => void;
  onStart: (id: string, x: number, y: number) => void;
  onUpdate: (x: number, y: number) => void;
  onFinish: (success: boolean, x: number, y: number) => void;
  pointer: SharedValue<{ x: number; y: number }>;
  testID?: string;
}) {
  const { colors } = useTheme();
  const ringOffset = useRingOffsetStyle();
  useInteractiveWebCss('bloom-panel-reorder', HANDLE_CSS);
  const { messages } = useMessages(APP_SHELL_MESSAGES);
  const callbacks = useRef({ id, onStart, onUpdate, onFinish });
  callbacks.current = { id, onStart, onUpdate, onFinish };
  const start = useCallback(
    (x: number, y: number) => callbacks.current.onStart(callbacks.current.id, x, y),
    [],
  );
  const update = useCallback((x: number, y: number) => callbacks.current.onUpdate(x, y), []);
  const finish = useCallback(
    (success: boolean, x: number, y: number) => callbacks.current.onFinish(success, x, y),
    [],
  );
  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(Platform.OS === 'web')
        .minDistance(5)
        .onStart((event) => {
          pointer.value = { x: event.absoluteX, y: event.absoluteY };
          runOnJS(start)(
            event.absoluteX - event.translationX,
            event.absoluteY - event.translationY,
          );
          if (Platform.OS === 'web') runOnJS(update)(event.absoluteX, event.absoluteY);
        })
        .onUpdate((event) => {
          pointer.value = { x: event.absoluteX, y: event.absoluteY };
          if (Platform.OS === 'web') runOnJS(update)(event.absoluteX, event.absoluteY);
        })
        .onFinalize((event, success) => {
          runOnJS(finish)(success, event.absoluteX, event.absoluteY);
        }),
    [start, update, finish, pointer],
  );
  return (
    <GestureDetector gesture={gesture} touchAction="none">
      <View collapsable={false}>
        <StyledPressable
          role="button"
          className="w-7 h-8 items-center justify-center rounded-md"
          accessibilityLabel={messages.reorderPanel(label)}
          accessibilityHint={messages.reorderHint}
          accessibilityActions={[
            { name: 'decrement', label: messages.movePanelBefore },
            { name: 'increment', label: messages.movePanelAfter },
          ]}
          onAccessibilityAction={(event) =>
            onMove(event.nativeEvent.actionName === 'decrement' ? -1 : 1)
          }
          {...{ dataSet: { bloomPanelReorder: id } }}
          testID={testID}
          hitSlop={4}
          style={
            {
              '--bloom-panel-reorder-ring': colors.primary,
              ...ringOffset,
            } as WebCssStyle
          }
        >
          <RiDraggable width={18} height={18} fill={colors.textSecondary} />
        </StyledPressable>
      </View>
    </GestureDetector>
  );
}
