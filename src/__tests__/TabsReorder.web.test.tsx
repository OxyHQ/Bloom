/** @jest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { Tabs, TabsTrigger } from '../tabs';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function mount(onReorder: jest.Mock, onSelect = jest.fn(), enabled = true) {
  act(() =>
    root.render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <Tabs value="a" onValueChange={onSelect} onReorder={enabled ? onReorder : undefined}>
          <TabsTrigger value="a" label="A" reorderable />
          <TabsTrigger value="locked" label="Locked" />
          <TabsTrigger
            value="b"
            label="B"
            reorderable
            trailing={<button type="button">Settings</button>}
          />
        </Tabs>
        <Tabs value="c" onReorder={onReorder}>
          <TabsTrigger value="c" label="Other strip" reorderable />
        </Tabs>
      </BloomThemeProvider>,
    ),
  );
  return [...container.querySelectorAll<HTMLElement>('[role="tab"]')];
}
function drag(target: HTMLElement, kind: string) {
  const event = new Event(kind, { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'dataTransfer', {
    value: { setData: jest.fn(), effectAllowed: '' },
  });
  act(() => target.dispatchEvent(event));
  return event;
}
it('requests a sibling move without selecting and never transfers across strips', () => {
  const reorder = jest.fn();
  const select = jest.fn();
  const [a, locked, b, other] = mount(reorder, select);
  expect(a!.draggable).toBe(true);
  expect(locked!.draggable).toBe(false);
  drag(a!, 'dragstart');
  drag(other!, 'drop');
  expect(reorder).not.toHaveBeenCalled();
  expect(drag(b!, 'dragover').defaultPrevented).toBe(true);
  drag(b!, 'drop');
  expect(reorder).toHaveBeenCalledWith('a', 'b');
  expect(select).not.toHaveBeenCalled();
  drag(b!, 'drop');
  expect(reorder).toHaveBeenCalledTimes(1);
});
it('supports keyboard reorder, skips immutable tabs, and clears disabled listeners', () => {
  const reorder = jest.fn();
  const select = jest.fn();
  const [a] = mount(reorder, select);
  act(() =>
    a!.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
      }),
    ),
  );
  expect(reorder).toHaveBeenCalledWith('a', 'b');
  expect(select).not.toHaveBeenCalled();
  mount(reorder, select, false);
  expect(a!.draggable).toBe(false);
  drag(a!, 'dragstart');
  drag(container.querySelectorAll<HTMLElement>('[role="tab"]')[2]!, 'drop');
  expect(reorder).toHaveBeenCalledTimes(1);
});
it('cancels drag and leaves trailing controls outside the drag target', () => {
  const reorder = jest.fn();
  const [a, , b] = mount(reorder);
  drag(a!, 'dragstart');
  drag(a!, 'dragend');
  drag(b!, 'drop');
  expect(reorder).not.toHaveBeenCalled();
  expect(b!.contains(container.querySelector('button'))).toBe(false);
});
