// `ScreenScrollView`'s own scroller (native, and web outside document mode):
// `onEndReached` from the scroll handler and from layout, with FlatList's
// once-per-content-length semantics, and `contentContainerClassName` keeping
// the chrome footprint without overriding the class's padding.
import type React from 'react';
import { View } from 'react-native';
import * as Reanimated from 'react-native-reanimated';
import { fireEvent, render } from '@testing-library/react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Screen, ScreenScrollView } from '../screen';
import {
  DEFAULT_END_REACHED_THRESHOLD,
  END_REACHED_ARMED,
  stepEndReached,
} from '../screen/use-end-reached';
import { resolvedStyle } from './support/rendered-style';

function wrap(children: React.ReactNode) {
  return <BloomThemeProvider fonts={false}>{children}</BloomThemeProvider>;
}

describe('stepEndReached', () => {
  const viewport = 800;
  it('fires within threshold viewports of the end, once per content length', () => {
    const near = { offset: 3000, viewport, content: 4000 };
    const first = stepEndReached(END_REACHED_ARMED, near, 0.5);
    expect(first).toEqual({ fire: true, sentFor: 4000 });
    expect(stepEndReached(first.sentFor, { ...near, offset: 3100 }, 0.5).fire).toBe(false);
    // Content grew but the end is still in range: a new length asks again.
    expect(stepEndReached(first.sentFor, { ...near, content: 4100 }, 0.5)).toEqual({
      fire: true,
      sentFor: 4100,
    });
  });
  it('re-arms when scrolled back out of range', () => {
    const away = stepEndReached(4000, { offset: 0, viewport, content: 4000 }, 0.5);
    expect(away).toEqual({ fire: false, sentFor: END_REACHED_ARMED });
    expect(stepEndReached(away.sentFor, { offset: 3000, viewport, content: 4000 }, 0.5).fire).toBe(
      true,
    );
  });
  it('measures the threshold in viewports, as FlatList', () => {
    // 1000px from the end: inside 2 viewports of 800, outside 1.
    const metrics = { offset: 2200, viewport, content: 4000 };
    expect(stepEndReached(END_REACHED_ARMED, metrics, 1).fire).toBe(false);
    expect(stepEndReached(END_REACHED_ARMED, metrics, DEFAULT_END_REACHED_THRESHOLD).fire).toBe(
      true,
    );
  });
  it('never fires for unmeasured or empty content', () => {
    expect(stepEndReached(END_REACHED_ARMED, { offset: 0, viewport, content: 0 }, 2).fire).toBe(
      false,
    );
    expect(
      stepEndReached(END_REACHED_ARMED, { offset: 0, viewport: 0, content: 900 }, 2).fire,
    ).toBe(false);
  });
});

describe('ScreenScrollView onEndReached', () => {
  afterEach(() => jest.restoreAllMocks());

  it('asks for the next page when the first one does not fill the viewport', () => {
    const onEndReached = jest.fn();
    const onLayout = jest.fn();
    const onContentSizeChange = jest.fn();
    const tree = render(
      wrap(
        <Screen>
          <ScreenScrollView
            testID="scroll"
            onEndReached={onEndReached}
            onLayout={onLayout}
            onContentSizeChange={onContentSizeChange}
          />
        </Screen>,
      ),
    );
    const scroll = tree.getByTestId('scroll');
    fireEvent(scroll, 'layout', { nativeEvent: { layout: { height: 800 } } });
    expect(onEndReached).not.toHaveBeenCalled();
    fireEvent(scroll, 'contentSizeChange', 400, 600);
    expect(onEndReached).toHaveBeenCalledTimes(1);
    // The caller's own handlers still run.
    expect(onLayout).toHaveBeenCalledTimes(1);
    expect(onContentSizeChange).toHaveBeenCalledWith(400, 600);
    // Re-measuring the same length is not a new approach.
    fireEvent(scroll, 'layout', { nativeEvent: { layout: { height: 800 } } });
    expect(onEndReached).toHaveBeenCalledTimes(1);
  });

  it('fires from the scroll handler once per approach', () => {
    // Run the worklet bodies on JS so the scroll events reach them.
    jest
      .spyOn(Reanimated, 'useAnimatedScrollHandler')
      .mockImplementation(
        ((handlers: { onScroll?: (event: unknown) => void }) => (event: unknown) =>
          handlers.onScroll?.(event)) as unknown as typeof Reanimated.useAnimatedScrollHandler,
      );
    const onEndReached = jest.fn();
    const tree = render(
      wrap(
        <Screen>
          <ScreenScrollView
            testID="scroll"
            onEndReached={onEndReached}
            onEndReachedThreshold={0.5}
          />
        </Screen>,
      ),
    );
    const at = (offset: number, content = 4000) =>
      fireEvent.scroll(tree.getByTestId('scroll'), {
        contentOffset: { x: 0, y: offset },
        layoutMeasurement: { width: 400, height: 800 },
        contentSize: { width: 400, height: content },
      });
    at(1000);
    expect(onEndReached).not.toHaveBeenCalled();
    at(2900);
    at(3100);
    expect(onEndReached).toHaveBeenCalledTimes(1);
    at(1000);
    at(3000);
    expect(onEndReached).toHaveBeenCalledTimes(2);
  });

  it('attaches no extra scroll work without a handler', () => {
    const spy = jest.spyOn(Reanimated, 'useComposedEventHandler');
    render(
      wrap(
        <Screen>
          <ScreenScrollView testID="scroll" />
        </Screen>,
      ),
    );
    // The screen binding composes its own handler with the caller's — and with
    // no `onEndReached` that is still null, not an end-reached worklet.
    const binding = spy.mock.calls.filter(([handlers]) => handlers[0] != null);
    expect(binding.length).toBeGreaterThan(0);
    for (const [handlers] of binding) expect(handlers[1]).toBeNull();
  });
});

describe('ScreenScrollView contentContainerClassName', () => {
  it('pads the scroll content with the chrome and lays the class out inside it', () => {
    const tree = render(
      wrap(
        <Screen header={<View />} headerHeight={70}>
          <ScreenScrollView
            testID="scroll"
            contentContainerClassName="gap-4 p-4"
            contentContainerStyle={{ alignItems: 'center' }}
          >
            <View testID="row" />
          </ScreenScrollView>
        </Screen>,
      ),
    );
    const outer = resolvedStyle(tree.getByTestId('scroll').props.contentContainerStyle);
    expect(outer).toMatchObject({ paddingTop: 70, flexGrow: 1 });
    expect(outer.alignItems).toBeUndefined();
    let inner = tree.getByTestId('row').parent!;
    while (typeof inner.type !== 'string') inner = inner.parent!;
    expect(resolvedStyle(inner.props.style)).toMatchObject({ alignItems: 'center' });
    expect(resolvedStyle(inner.props.style).paddingTop).toBeUndefined();
  });
});
