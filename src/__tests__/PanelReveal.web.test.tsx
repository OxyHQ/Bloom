/** @jest-environment jsdom */
import { act, useRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { usePanelReveal } from '../app-shell/use-panel-reveal';
import type { PanelRevealRequest } from '../app-shell';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const panels = [{ id: 'first' }, { id: 'last' }];
function Harness({
  request,
  enabled = true,
  visible = true,
  reducedMotion = false,
}: {
  request?: PanelRevealRequest;
  enabled?: boolean;
  visible?: boolean;
  reducedMotion?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  usePanelReveal({
    rootRef,
    request,
    enabled,
    scope: 'test',
    panels,
    tracks: panels.map((panel) => ({ id: panel.id, width: 390, gap: 8, visible })),
    reducedMotion,
  });
  return (
    <div ref={rootRef}>
      {panels.map((panel, index) => (
        <div key={panel.id} data-bloom-panel-owner="test" data-bloom-panel-index={index} />
      ))}
    </div>
  );
}
let root: Root;
let host: HTMLDivElement;
let scroll: jest.Mock;
beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  scroll = jest.fn();
  Element.prototype.scrollIntoView = scroll;
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  delete (Element.prototype as Partial<Element>).scrollIntoView;
});
it('does not reveal panels during passive hydration, rerenders, or deck mode entry', () => {
  act(() => root.render(<Harness enabled={false} />));
  act(() => root.render(<Harness />));
  act(() => root.render(<Harness />));
  expect(scroll).not.toHaveBeenCalled();
});
it('reveals an explicit request once, preserving user scrolling through rerenders and reentry', () => {
  const request = { id: 'last', requestKey: 1 };
  act(() => root.render(<Harness request={request} />));
  expect(scroll).toHaveBeenCalledTimes(1);
  expect(scroll.mock.contexts[0]).toBe(host.querySelector('[data-bloom-panel-index="1"]'));
  expect(scroll).toHaveBeenCalledWith({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  act(() => root.render(<Harness request={{ ...request }} />));
  act(() => root.render(<Harness request={request} enabled={false} />));
  act(() => root.render(<Harness request={request} />));
  expect(scroll).toHaveBeenCalledTimes(1);
  act(() => root.render(<Harness request={{ ...request, requestKey: 2 }} />));
  expect(scroll).toHaveBeenCalledTimes(2);
});
it('waits until the requested panel is eligible in a horizontal document deck', () => {
  const request = { id: 'last', requestKey: 'add' };
  act(() => root.render(<Harness request={request} enabled={false} />));
  act(() => root.render(<Harness request={request} visible={false} />));
  expect(scroll).not.toHaveBeenCalled();
  act(() => root.render(<Harness request={request} />));
  expect(scroll).toHaveBeenCalledTimes(1);
});
it('respects reduced motion and distinguishes requests for different panels with the same key', () => {
  act(() => root.render(<Harness reducedMotion request={{ id: 'last', requestKey: 1 }} />));
  expect(scroll).toHaveBeenLastCalledWith({
    block: 'nearest',
    inline: 'nearest',
    behavior: 'instant',
  });
  act(() => root.render(<Harness request={{ id: 'first', requestKey: 1 }} />));
  expect(scroll).toHaveBeenCalledTimes(2);
  expect(scroll.mock.contexts[1]).toBe(host.querySelector('[data-bloom-panel-index="0"]'));
});
