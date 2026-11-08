import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentRef,
  type ComponentType,
} from 'react';
import { Dimensions, Platform, View, type LayoutChangeEvent } from 'react-native';
import { useScreen } from '../screen/context';
import type { ScreenProps } from '../screen/types';
import { useTopEdgeInset } from '../layout/top-edge';
import { useBottomEdgeInset } from '../layout/bottom-edge';
import { pointerEventsStyle } from '../styles/pointer-events';
import { useKeyboardMetrics } from '../hooks/use-keyboard-metrics';
import { CanvasContext, createCanvasStore } from './context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCssSafeAreaInsets } from '../hooks/use-css-safe-area-insets';
import { observeCanvasHost, visibleCanvasWindow } from './observe-host';
import { canvasSafeArea, canvasVisibleRect } from './geometry';
import type { CanvasProps, CanvasRect } from './types';

export function createCanvas(Screen: ComponentType<ScreenProps>) {
  function CanvasBody({ children, testID }: Pick<CanvasProps, 'children' | 'testID'>) {
    const screen = useScreen();
    const [store] = useState(() => createCanvasStore(screen.active));
    const node = useRef<ComponentRef<typeof View>>(null);
    const measured = useRef({ width: 0, height: 0 });
    const top = useTopEdgeInset(),
      bottom = useBottomEdgeInset();
    const safe = useCssSafeAreaInsets(useSafeAreaInsets());
    const keyboard = useKeyboardMetrics({ enabled: screen.active });
    const measure = useCallback(() => {
      const publish = (x: number, y: number, width: number, height: number) => {
        let visible: CanvasRect | undefined;
        if (Platform.OS === 'web') {
          const host = node.current as unknown as HTMLElement | null;
          if (host) visible = visibleCanvasWindow(host);
        } else if (keyboard.visible && keyboard.top !== null) {
          visible = { x, y: 0, width, height: keyboard.top };
        }
        const room =
          Platform.OS === 'web'
            ? { width: window.innerWidth, height: window.innerHeight }
            : Dimensions.get('window');
        store.frame(
          { x: 0, y: 0, width, height },
          canvasVisibleRect(width, height, x, y, visible),
          canvasSafeArea(
            { x, y, width, height },
            room,
            keyboard.visible ? { ...safe, bottom: 0 } : safe,
          ),
        );
      };
      if (Platform.OS === 'web') {
        const host = node.current as unknown as HTMLElement | null;
        if (host) {
          const rect = host.getBoundingClientRect();
          publish(rect.x, rect.y, rect.width, rect.height);
        }
      } else
        node.current?.measureInWindow((x, y, width, height) =>
          publish(x, y, width || measured.current.width, height || measured.current.height),
        );
    }, [keyboard.visible, keyboard.top, store, safe]);
    const onLayout = (event: LayoutChangeEvent) => {
      measured.current = event.nativeEvent.layout;
      measure();
    };
    useLayoutEffect(() => {
      store.edges(top, bottom, screen.active);
    }, [store, top, bottom, screen.active]);
    useLayoutEffect(measure, [measure]);
    useEffect(() => {
      if (Platform.OS !== 'web') return;
      const host = node.current as unknown as HTMLElement | null;
      if (host) return observeCanvasHost(host, measure);
    }, [measure]);
    return (
      <CanvasContext.Provider value={store}>
        <View
          ref={node}
          testID={testID ? `${testID}-viewport` : undefined}
          collapsable={false}
          accessibilityElementsHidden={!screen.active}
          {...(Platform.OS === 'web' && !screen.active ? { inert: true } : {})}
          onLayout={onLayout}
          style={[
            { flex: 1, minWidth: 0, minHeight: 0, overflow: 'hidden' },
            pointerEventsStyle(screen.active ? 'auto' : 'none'),
          ]}
          aria-hidden={!screen.active}
          importantForAccessibility={screen.active ? 'auto' : 'no-hide-descendants'}
        >
          {children}
        </View>
      </CanvasContext.Provider>
    );
  }
  return function Canvas({ children, ...props }: CanvasProps) {
    return (
      <Screen {...props} scroll="none" documentScroll={false}>
        <CanvasBody testID={props.testID}>{children}</CanvasBody>
      </Screen>
    );
  };
}
