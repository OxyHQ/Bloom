/** @jest-environment jsdom */
import { act, useRef, type ComponentRef } from 'react';
import type { View } from 'react-native';
import { Platform } from 'react-native';
import { createRoot } from 'react-dom/client';
import { PanelOrderBoundary } from '../app-shell/PanelOrderBoundary';
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Harness({ ids }: { ids: string[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  return (
    <PanelOrderBoundary
      ids={ids}
      rootRef={rootRef as unknown as React.RefObject<ComponentRef<typeof View> | null>}
    >
      <div ref={rootRef}>
        {ids.map((id) => (
          <section key={id} data-panel={id}>
            <div data-scroll={id} />
          </section>
        ))}
      </div>
    </PanelOrderBoundary>
  );
}
it('preserves moved descendant scrollers before paint for an externally controlled order', () => {
  const previous = Platform.OS;
  Platform.OS = 'web';
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  try {
    act(() => root.render(<Harness ids={['a', 'b', 'c']} />));
    const scroller = container.querySelector<HTMLElement>('[data-scroll="b"]');
    if (!scroller) throw new Error('Missing scroller');
    scroller.scrollTop = 220;
    scroller.scrollLeft = 25;
    const original = Node.prototype.appendChild;
    const append = jest.spyOn(Node.prototype, 'appendChild').mockImplementation(function <
      T extends Node,
    >(this: Node, node: T): T {
      // Chromium clears nested scroll state while a focused keyed subtree is
      // detached. Model that browser side effect, not a React remount.
      if (node instanceof Element)
        for (const child of node.querySelectorAll('*')) {
          child.scrollTop = 0;
          child.scrollLeft = 0;
        }
      return original.call(this, node) as T;
    });
    act(() => root.render(<Harness ids={['a', 'c', 'b']} />));
    append.mockRestore();
    expect(container.querySelector('[data-scroll="b"]')).toBe(scroller);
    expect(scroller.scrollTop).toBe(220);
    expect(scroller.scrollLeft).toBe(25);
    expect(
      [...container.querySelectorAll('[data-panel]')].map((node) =>
        node.getAttribute('data-panel'),
      ),
    ).toEqual(['a', 'c', 'b']);
  } finally {
    act(() => root.unmount());
    container.remove();
    Platform.OS = previous;
    jest.restoreAllMocks();
  }
});
