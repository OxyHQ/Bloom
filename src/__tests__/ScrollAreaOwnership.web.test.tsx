/** @jest-environment jsdom */
import { act, createRef } from 'react';
import { createRoot } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { ScrollArea } from '../layout/ScrollArea.web';
import { ScrollBar } from '../layout/ScrollBar.web';
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

it('uses one native owner and forwards its ref while sizing the area, with custom indicators by default', () => {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  const ref = createRef<any>();
  act(() =>
    root.render(
      <ScrollArea ref={ref} testID="area" style={{ height: 300 }} className="grow">
        <div>Content</div>
      </ScrollArea>,
    ),
  );
  const owner = ref.current.getScrollableNode();
  expect(host.querySelectorAll('[data-bloom-scroll-area]')).toHaveLength(1);
  expect(owner.hasAttribute('data-bloom-scroll-area')).toBe(true);
  expect(host.querySelector('[data-testid="area"]')?.contains(owner)).toBe(true);
  expect(host.querySelector('[data-testid="area"]')).not.toBe(owner);
  act(() => root.unmount());
  host.remove();
});

it('attaches to DOM and virtualized-list owners without creating another scroll container', () => {
  const host = document.createElement('div');
  document.body.append(host);
  const owner = document.createElement('div');
  host.append(owner);
  const root = createRoot(host.appendChild(document.createElement('div')));
  const target = { current: { getNativeScrollRef: () => owner } };
  act(() => root.render(<ScrollBar target={target} />));
  expect(owner.hasAttribute('data-bloom-scroll-area')).toBe(true);
  expect(host.querySelectorAll('[data-bloom-scroll-area]')).toHaveLength(1);
  act(() => root.render(<ScrollBar target={{ current: owner }} />));
  expect(owner.hasAttribute('data-bloom-scroll-area')).toBe(true);
  act(() => root.unmount());
  expect(owner.hasAttribute('data-bloom-scroll-area')).toBe(false);
  host.remove();
});
