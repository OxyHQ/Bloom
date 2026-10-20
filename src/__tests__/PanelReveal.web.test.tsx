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
let animations: Map<Element, Animation[]>;
beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  scroll = jest.fn();
  Element.prototype.scrollIntoView = scroll;
  animations = new Map();
  Element.prototype.getAnimations = function () {
    return animations.get(this) ?? [];
  };
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  delete (Element.prototype as Partial<Element>).scrollIntoView;
  delete (Element.prototype as Partial<Element>).getAnimations;
});

function transition(node: Element, property: string) {
  let finish: () => void = () => {};
  const animation = {
    transitionProperty: property,
    playState: 'running',
    pending: false,
    finished: new Promise<void>((resolve) => {
      finish = resolve;
    }),
  };
  animations.set(node, [...(animations.get(node) ?? []), animation as unknown as Animation]);
  return () => {
    animation.playState = 'finished';
    finish();
  };
}
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

it('reveals the final panel box after its insertion and neighboring geometry settle', async () => {
  act(() => root.render(<Harness />));
  const first = host.querySelector('[data-bloom-panel-index="0"]');
  const last = host.querySelector('[data-bloom-panel-index="1"]');
  if (!first || !last) throw new Error('Missing panel hosts');
  const finishWidth = transition(last, 'width');
  const finishNeighbor = transition(first, 'flex-basis');
  let width = 0;
  scroll.mockImplementation(() => expect(width).toBe(390));
  const request = { id: 'last', requestKey: 'insert' };
  act(() => root.render(<Harness request={request} />));
  expect(scroll).not.toHaveBeenCalled();
  await act(async () => finishWidth());
  expect(scroll).not.toHaveBeenCalled();
  width = 390;
  await act(async () => finishNeighbor());
  expect(scroll).toHaveBeenCalledTimes(1);
  act(() => root.render(<Harness request={{ ...request }} />));
  expect(scroll).toHaveBeenCalledTimes(1);
});

it('cancels an obsolete request while waiting for layout completion', async () => {
  act(() => root.render(<Harness />));
  const last = host.querySelector('[data-bloom-panel-index="1"]');
  if (!last) throw new Error('Missing panel host');
  const finish = transition(last, 'width');
  act(() => root.render(<Harness request={{ id: 'last', requestKey: 1 }} />));
  act(() => root.render(<Harness request={{ id: 'first', requestKey: 2 }} />));
  await act(async () => finish());
  expect(scroll).toHaveBeenCalledTimes(1);
  expect(scroll.mock.contexts[0]).toBe(host.querySelector('[data-bloom-panel-index="0"]'));
});

it('does not scroll after the waiting layout unmounts', async () => {
  act(() => root.render(<Harness />));
  const last = host.querySelector('[data-bloom-panel-index="1"]');
  if (!last) throw new Error('Missing panel host');
  const finish = transition(last, 'width');
  act(() => root.render(<Harness request={{ id: 'last', requestKey: 1 }} />));
  act(() => root.render(null));
  await act(async () => finish());
  expect(scroll).not.toHaveBeenCalled();
});

it('ignores content transitions and scroll-driven animations', () => {
  act(() => root.render(<Harness />));
  const last = host.querySelector('[data-bloom-panel-index="1"]');
  if (!last) throw new Error('Missing panel host');
  const child = document.createElement('div');
  last.appendChild(child);
  transition(child, 'width');
  animations.set(last, [{ playState: 'running' } as Animation]);
  act(() => root.render(<Harness request={{ id: 'last', requestKey: 1 }} />));
  expect(scroll).toHaveBeenCalledTimes(1);
});
