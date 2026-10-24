/**
 * @jest-environment jsdom
 */

/**
 * A trigger whose `asChild` control is positioned out of flow leaves its anchor
 * wrapper an empty 0×0 box, and the menu opened wherever that box fell — the
 * window's corner in the case that found it. The surface now anchors to the
 * control and warns once in development where the geometry belongs.
 */
import { triggerRectOf } from '../floating/use-anchor-rect';

function box(left: number, top: number, width: number, height: number) {
  return () => ({ left, top, right: left + width, bottom: top + height, width, height }) as DOMRect;
}

function wrapperWith(wrapperBox: () => DOMRect, childBox?: () => DOMRect) {
  const wrapper = document.createElement('div');
  wrapper.getBoundingClientRect = wrapperBox;
  if (childBox) {
    const child = document.createElement('button');
    child.getBoundingClientRect = childBox;
    wrapper.appendChild(child);
  }
  return wrapper as never;
}

let warn: jest.SpyInstance;
beforeEach(() => {
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => warn.mockRestore());

it('anchors to the wrapper when it hugs the control', () => {
  const rect = triggerRectOf(wrapperWith(box(10, 20, 80, 32), box(10, 20, 80, 32)));
  expect(rect).toEqual({ left: 10, top: 20, right: 90, bottom: 52 });
  expect(warn).not.toHaveBeenCalled();
});

it('anchors to the out-of-flow control when the wrapper is 0×0, and warns once', () => {
  const detached = () => wrapperWith(box(0, 0, 0, 0), box(600, 40, 32, 32));
  expect(triggerRectOf(detached())).toEqual({ left: 600, top: 40, right: 632, bottom: 72 });
  triggerRectOf(detached());
  expect(warn).toHaveBeenCalledTimes(1);
  expect(String(warn.mock.calls[0][0])).toMatch(/TRIGGER's `style` \/ `className`/);
});

it('keeps an empty wrapper when the control is empty too (a hidden trigger)', () => {
  expect(triggerRectOf(wrapperWith(box(0, 0, 0, 0), box(0, 0, 0, 0)))).toEqual({
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  });
});
