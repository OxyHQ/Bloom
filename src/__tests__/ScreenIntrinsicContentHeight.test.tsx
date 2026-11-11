/** @jest-environment jsdom */
import React from 'react';
import { act, renderHook } from '@testing-library/react-native';
import { makeMutable } from 'react-native-reanimated';
import { ScreenViewportContext, type ScreenContextValue } from '../screen/context';
import { useScreenViewportBinding } from '../screen/use-screen-viewport';
import { useIntrinsicContentHeight } from '../screen/use-intrinsic-content-height';

function metrics() {
  return {
    scrollY: makeMutable(0),
    contentHeight: makeMutable(800),
    viewportHeight: makeMutable(800),
    intrinsicContentHeight: makeMutable(-1),
  };
}
function owner(shared = metrics()) {
  const screen = {
    active: true,
    scrollY: shared.scrollY,
    collapseProgress: makeMutable(0),
    collapseTarget: makeMutable(0),
    activeScrollerId: makeMutable(null),
    topInset: 0,
    bottomInset: 0,
  } as ScreenContextValue;
  const hook = renderHook<ReturnType<typeof useScreenViewportBinding>, { active: boolean }>(
    ({ active }) =>
      useScreenViewportBinding({ ...screen, active }, true, false, 0, { active, metrics: shared }),
    { initialProps: { active: true } },
  );
  return { ...hook, shared };
}

it('distinguishes short natural content from the filled viewport and aggregates independent sources', () => {
  const tree = owner();
  const report = tree.result.current.value.setIntrinsicContentHeight!;
  const first = {},
    second = {};
  act(() => report(first, 117));
  expect(tree.shared.intrinsicContentHeight.value).toBe(117);
  expect(tree.shared.contentHeight.value).toBe(800);
  act(() => report(second, 1800));
  expect(tree.shared.intrinsicContentHeight.value).toBe(1800);
  act(() => report(second, null));
  expect(tree.shared.intrinsicContentHeight.value).toBe(117);
  act(() => report(first, -1));
  expect(tree.shared.intrinsicContentHeight.value).toBe(-1);
});

it('does not leak a retained Screen measurement or clear the next route owner', () => {
  const shared = metrics();
  const previous = owner(shared);
  const previousReport = previous.result.current.value.setIntrinsicContentHeight!;
  act(() => previousReport({}, 300));
  const next = owner(shared);
  act(() => next.result.current.value.setIntrinsicContentHeight!({}, 120));
  previous.unmount();
  expect(shared.intrinsicContentHeight.value).toBe(120);
  next.rerender({ active: false });
  expect(shared.intrinsicContentHeight.value).toBe(-1);
  act(() => next.result.current.value.setIntrinsicContentHeight!({}, 900));
  expect(shared.intrinsicContentHeight.value).toBe(-1);
  next.rerender({ active: true });
  expect(shared.intrinsicContentHeight.value).toBe(-1);
});

it('keeps different panel owners independent', () => {
  const first = owner(),
    second = owner();
  act(() => first.result.current.value.setIntrinsicContentHeight!({}, 120));
  act(() => second.result.current.value.setIntrinsicContentHeight!({}, 2400));
  first.unmount();
  expect(first.shared.intrinsicContentHeight.value).toBe(-1);
  expect(second.shared.intrinsicContentHeight.value).toBe(2400);
});

it('includes prefixes and ancestor bottom padding, rejects flex fill, and cleans a source on unmount', () => {
  const tree = owner();
  const root = document.createElement('div'),
    wrapper = document.createElement('div'),
    node = document.createElement('div');
  root.style.paddingBottom = '24px';
  wrapper.style.paddingBottom = '8px';
  root.append(wrapper);
  wrapper.append(node);
  document.body.append(root);
  jest.spyOn(root, 'getBoundingClientRect').mockReturnValue({ top: 100 } as DOMRect);
  jest.spyOn(node, 'getBoundingClientRect').mockReturnValue({ top: 156 } as DOMRect);
  jest.spyOn(node, 'getClientRects').mockReturnValue([{}] as unknown as DOMRectList);
  (tree.result.current.contentRef as React.MutableRefObject<unknown>).current = root;
  const source = renderHook(() => useIntrinsicContentHeight(), {
    wrapper: ({ children }) => (
      <ScreenViewportContext.Provider value={tree.result.current.value}>
        {children}
      </ScreenViewportContext.Provider>
    ),
  });
  act(() => source.result.current!(61, node));
  expect(tree.shared.intrinsicContentHeight.value).toBe(149);
  node.style.flexGrow = '1';
  act(() => source.result.current!(800, node));
  expect(tree.shared.intrinsicContentHeight.value).toBe(-1);
  node.style.flexGrow = '0';
  act(() => source.result.current!(1200, node));
  expect(tree.shared.intrinsicContentHeight.value).toBe(1288);
  source.unmount();
  expect(tree.shared.intrinsicContentHeight.value).toBe(-1);
  root.remove();
});
