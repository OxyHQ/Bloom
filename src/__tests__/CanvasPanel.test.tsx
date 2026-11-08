import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
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
  function Subject({ snap }: { snap: 'peek' | 'full' }) {
    return (
      <BloomThemeProvider>
        <BottomEdgeProvider>
          <CanvasContext.Provider value={store}>
            <Reader />
            <CanvasPanel
              snap={snap}
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
  view.rerender(<Subject snap="full" />);
  expect(view.getByTestId('bottom').props.children).toBe(828);
});
