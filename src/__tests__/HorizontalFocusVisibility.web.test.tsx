/** @jest-environment jsdom */
import { act, createRef, type ComponentRef } from 'react';
import type { ScrollView } from 'react-native';
import { createRoot } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { ScrollArea as WebScrollArea } from '../layout/ScrollArea.web';
import { ScrollArea as NeutralScrollArea } from '../layout/ScrollArea';
import { revealHorizontalFocus } from '../layout/horizontal-focus-visibility';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const rect = (left: number, width: number) => ({
  left,
  right: left + width,
  width,
  top: 0,
  bottom: 40,
  height: 40,
  x: left,
  y: 0,
  toJSON() {},
});
function viewport(node: HTMLElement, left = 20, width = 100) {
  node.getBoundingClientRect = () => rect(left, width);
  Object.defineProperties(node, {
    clientWidth: { configurable: true, value: width },
    offsetWidth: { configurable: true, value: width },
    clientLeft: { configurable: true, value: 0 },
  });
  node.scrollTo = jest.fn();
}

it('uses the DOM intrinsic instead of RNW’s shadowed imperative method', () => {
  const descriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollTo');
  const intrinsic = jest.fn();
  Object.defineProperty(Element.prototype, 'scrollTo', {
    configurable: true,
    writable: true,
    value: intrinsic,
  });
  try {
    const owner = document.createElement('div');
    const target = owner.appendChild(document.createElement('button'));
    viewport(owner);
    owner.scrollTop = 37;
    target.getBoundingClientRect = () => rect(100, 40);
    revealHorizontalFocus(owner, target);
    expect(intrinsic).toHaveBeenCalledWith({ left: 20, top: 37, behavior: 'instant' });
    expect(intrinsic.mock.contexts[0]).toBe(owner);
    expect(owner.scrollTo).not.toHaveBeenCalled();
  } finally {
    if (descriptor) Object.defineProperty(Element.prototype, 'scrollTo', descriptor);
    else Reflect.deleteProperty(Element.prototype, 'scrollTo');
  }
});

it.each([
  ['right clipped', 100, 40, 0, 20],
  ['left clipped / RTL', 0, 40, -20, -40],
  ['already visible', 30, 40, 0, null],
  ['oversized spanning both edges', 0, 160, 0, null],
] as const)(
  '%s moves only the owning horizontal offset',
  (_name, left, width, offset, expected) => {
    const owner = document.createElement('div');
    const button = owner.appendChild(document.createElement('button'));
    viewport(owner);
    owner.scrollLeft = offset;
    owner.scrollTop = 37;
    button.getBoundingClientRect = () => rect(left, width);
    revealHorizontalFocus(owner, button);
    expect(owner.scrollLeft).toBe(expected === null ? offset : expected);
    expect(owner.scrollTop).toBe(37);
    expect(owner.scrollTo).not.toHaveBeenCalled();
  },
);

it.each([
  ['web', WebScrollArea],
  ['neutral published Toolbar path', NeutralScrollArea],
] as const)('%s wires focus to the forwarded scroll owner and cleans up', (_name, Area) => {
  const frames = new Map<number, FrameRequestCallback>();
  let id = 0;
  const raf = jest.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    frames.set(++id, callback);
    return id;
  });
  const cancel = jest.spyOn(window, 'cancelAnimationFrame').mockImplementation((key) => {
    if (key != null) frames.delete(key);
  });
  const flush = () => {
    const queued = [...frames.values()];
    frames.clear();
    for (const callback of queued) callback(0);
  };
  const host = document.body.appendChild(document.createElement('div'));
  const root = createRoot(host);
  const ref = createRef<ComponentRef<typeof ScrollView>>();
  try {
    act(() =>
      root.render(
        <Area horizontal ref={ref}>
          <button type="button" aria-label="Tool" />
        </Area>,
      ),
    );
    const owner = ref.current?.getScrollableNode() as unknown as HTMLElement;
    viewport(owner);
    const button = host.querySelector('button');
    if (!button) throw new Error('Missing focus target');
    button.getBoundingClientRect = () => rect(100, 40);
    button.focus();
    flush();
    expect(owner.scrollLeft).toBe(20);
    expect(owner.scrollTo).not.toHaveBeenCalled();
    act(() => root.unmount());
    expect(ref.current).toBeNull();
    expect(frames.size).toBe(0);
  } finally {
    host.remove();
    raf.mockRestore();
    cancel.mockRestore();
  }
});
