import React, { useEffect } from 'react';
import { I18nManager, Text, View } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import { CanvasPanel } from '../canvas/CanvasPanel';
import { CanvasContext, createCanvasStore } from '../canvas/context';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { BottomEdgeProvider, useBottomEdgeInset, useClaimBottomEdge } from '../layout/bottom-edge';

it('retains panel content across bottom/side placement and releases inactive claims', () => {
  const store = createCanvasStore();
  store.frame({ x: 0, y: 0, width: 390, height: 844 }, { x: 0, y: 0, width: 390, height: 844 });
  const mounted = jest.fn(),
    unmounted = jest.fn();
  function Content() {
    useEffect(() => {
      mounted();
      return unmounted;
    }, []);
    useClaimBottomEdge(31);
    return <Text testID="content">Persistent content</Text>;
  }
  function Reader() {
    return <Text testID="bottom">{useBottomEdgeInset()}</Text>;
  }
  function Subject({ active = true }: { active?: boolean }) {
    return (
      <BloomThemeProvider>
        <BottomEdgeProvider>
          <CanvasContext.Provider value={store}>
            <Reader />
            <CanvasPanel
              active={active}
              side={{ from: 880, width: 384 }}
              snap="half"
              onSnapChange={() => {}}
              accessibilityLabel="Places"
              header={<View />}
              testID="panel"
            >
              <Content />
            </CanvasPanel>
          </CanvasContext.Provider>
        </BottomEdgeProvider>
      </BloomThemeProvider>
    );
  }
  const view = render(<Subject />);
  const content = view.getByTestId('content');
  expect(view.getByTestId('bottom').props.children).toBeCloseTo(379.8);
  act(() =>
    store.frame({ x: 0, y: 0, width: 1440, height: 900 }, { x: 0, y: 0, width: 1440, height: 900 }),
  );
  expect(view.getByTestId('content')).toBe(content);
  expect(store.read().occupied.left).toBe(400);
  expect(view.getByTestId('bottom').props.children).toBe(0);
  view.rerender(<Subject active={false} />);
  expect(store.read().occupied.left).toBe(0);
  expect(view.getByTestId('panel', { includeHiddenElements: true }).props['aria-hidden']).toBe(
    true,
  );
  view.rerender(<Subject />);
  act(() =>
    store.frame({ x: 0, y: 0, width: 390, height: 844 }, { x: 0, y: 0, width: 390, height: 844 }),
  );
  expect(view.getByTestId('content')).toBe(content);
  expect(mounted).toHaveBeenCalledTimes(1);
  expect(unmounted).not.toHaveBeenCalled();
});

it('publishes measured peek and full rather than a guessed or capped half footprint', () => {
  const store = createCanvasStore();
  store.frame({ x: 0, y: 0, width: 390, height: 844 }, { x: 0, y: 0, width: 390, height: 844 });
  function Reader() {
    return <Text testID="bottom">{useBottomEdgeInset()}</Text>;
  }
  function Subject({ snap, active = true }: { snap: 'peek' | 'full'; active?: boolean }) {
    return (
      <BloomThemeProvider>
        <BottomEdgeProvider>
          <CanvasContext.Provider value={store}>
            <Reader />
            <CanvasPanel
              snap={snap}
              active={active}
              onSnapChange={() => {}}
              header={<Text>Header</Text>}
              accessibilityLabel="Places"
            >
              <Text>Body</Text>
            </CanvasPanel>
          </CanvasContext.Provider>
        </BottomEdgeProvider>
      </BloomThemeProvider>
    );
  }
  const view = render(<Subject snap="peek" />);
  fireEvent(view.getByText('Header').parent!, 'layout', {
    nativeEvent: { layout: { width: 390, height: 100, x: 0, y: 0 } },
  });
  expect(view.getByTestId('bottom').props.children).toBe(144);
  const measuredHeader = view.getByText('Header').parent!;
  view.rerender(<Subject snap="peek" active={false} />);
  fireEvent(measuredHeader, 'layout', {
    nativeEvent: { layout: { width: 0, height: 0, x: 0, y: 0 } },
  });
  view.rerender(<Subject snap="peek" />);
  expect(view.getByTestId('bottom').props.children).toBe(144);

  view.rerender(<Subject snap="full" />);
  expect(view.getByTestId('bottom').props.children).toBe(828);
});

it.each([false, true])('reports side claims from bounds, including both clips (RTL=%s)', (rtl) => {
  const previous = I18nManager.isRTL;
  I18nManager.isRTL = rtl;
  try {
    const store = createCanvasStore();
    store.frame({ x: 0, y: 0, width: 1000, height: 800 }, { x: 80, y: 0, width: 800, height: 800 });
    const view = render(
      <BloomThemeProvider>
        <CanvasContext.Provider value={store}>
          <CanvasPanel
            side={{ from: 600, width: 384 }}
            snap="half"
            onSnapChange={() => {}}
            accessibilityLabel="Places"
          >
            <Text>Body</Text>
          </CanvasPanel>
        </CanvasContext.Provider>
      </BloomThemeProvider>,
    );
    expect(store.read().occupied).toMatchObject(
      rtl ? { left: 0, right: 520 } : { left: 480, right: 0 },
    );
    // The adapter combines clip, claim and safe area by MAX, never a second addition.
    expect(Math.max(store.read().occupied[rtl ? 'right' : 'left'], rtl ? 120 : 80, 0)).toBe(
      rtl ? 520 : 480,
    );
    view.unmount();
  } finally {
    I18nManager.isRTL = previous;
  }
});

it('reconciles a rejected proposal to the controlled snap and accepts a later prop', () => {
  const animation = jest.spyOn(require('react-native-reanimated'), 'withSpring');
  const store = createCanvasStore();
  store.frame({ x: 0, y: 0, width: 390, height: 844 }, { x: 0, y: 0, width: 390, height: 844 });
  const change = jest.fn();
  function Subject({ snap }: { snap: 'peek' | 'half' }) {
    return (
      <BloomThemeProvider>
        <CanvasContext.Provider value={store}>
          <CanvasPanel
            snap={snap}
            onSnapChange={change}
            accessibilityLabel="Places"
            testID="controlled"
          >
            <Text>Body</Text>
          </CanvasPanel>
        </CanvasContext.Provider>
      </BloomThemeProvider>
    );
  }
  const view = render(<Subject snap="peek" />);
  animation.mockClear();
  fireEvent.press(view.getByTestId('controlled-handle'));
  expect(change).toHaveBeenLastCalledWith('half');
  expect(animation).toHaveBeenLastCalledWith(784, expect.any(Object));
  // Later acceptance is a prop update, not an internal optimistic state.
  view.rerender(<Subject snap="half" />);
  expect(animation).toHaveBeenLastCalledWith(448.2, expect.any(Object));
  animation.mockRestore();
});
