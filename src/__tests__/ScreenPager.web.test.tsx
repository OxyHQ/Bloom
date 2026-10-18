/** @jest-environment jsdom */
import React, { act, createRef } from 'react';
import { createRoot } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { ScreenPager } from '../screen/ScreenPager';
import type { ScreenPagerHandle } from '../screen/types';
import { ScreenViewportContext, type ScreenViewportValue } from '../screen/context';
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as typeof ResizeObserver;
});

it('pages through the existing column owner and never scrolls the document', () => {
  const container = document.createElement('div');
  const owner = document.createElement('div');
  document.body.append(owner);
  owner.append(container);
  const root = createRoot(container);
  const scrollTo = jest.fn();
  const viewport: ScreenViewportValue = {
    kind: 'element',
    active: true,
    scrollRef: { current: owner },
    scrollTo,
    metrics: {
      scrollY: { value: 0 },
      contentHeight: { value: 1500 },
      viewportHeight: { value: 500 },
    } as ScreenViewportValue['metrics'],
  };
  const ref = createRef<ScreenPagerHandle>();
  owner.scrollTop = 250;
  owner.getBoundingClientRect = () => ({ top: 80 }) as DOMRect;
  act(() =>
    root.render(
      <ScreenViewportContext.Provider value={viewport}>
        <ScreenPager
          ref={ref}
          data={['first', 'second', 'third']}
          keyExtractor={(x) => x}
          renderItem={({ item }) => <span>{item}</span>}
        />
      </ScreenViewportContext.Provider>,
    ),
  );
  const pages = container.querySelectorAll<HTMLElement>('[data-bloom-screen-page]');
  pages[1]!.getBoundingClientRect = () => ({ top: 330, height: 500 }) as DOMRect;
  act(() => ref.current!.scrollToIndex(1, { animated: false }));
  expect(scrollTo).toHaveBeenCalledWith({ y: 500, animated: false });
  expect(container.querySelectorAll('[data-bloom-screen-pager]')).toHaveLength(1);
  expect(
    [...container.querySelectorAll<HTMLElement>('*')].some((node) =>
      ['auto', 'scroll'].includes(node.style.overflowY),
    ),
  ).toBe(false);
  act(() => root.unmount());
  owner.remove();
});
