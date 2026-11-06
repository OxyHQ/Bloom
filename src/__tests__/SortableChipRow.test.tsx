/**
 * @jest-environment jsdom
 *
 * `SortableChipRow` through the REAL react-native-web: the keyboard path (the
 * arrows move one chip, the ends do nothing, disabled is inert) and the nearest
 * chip under a point. The pointer drag is verified in a browser.
 */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { nearestChipIndex } from '../sortable-chip-row/reorder';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

const { SortableChipRow } = require('../sortable-chip-row/SortableChipRow');

function items() {
  return ['a', 'b', 'c'].map((key) => ({
    key,
    label: key.toUpperCase(),
    node: <span>{key}</span>,
  }));
}

function press(el: Element, key: string) {
  el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
}

describe('nearestChipIndex', () => {
  const rects = [
    { x: 0, y: 0, width: 40, height: 20 },
    { x: 48, y: 0, width: 40, height: 20 },
    { x: 0, y: 28, width: 40, height: 20 },
  ];

  it('is the chip whose centre is nearest the point', () => {
    expect(nearestChipIndex(rects, 10, 5)).toBe(0);
    expect(nearestChipIndex(rects, 70, 8)).toBe(1);
    expect(nearestChipIndex(rects, 12, 40)).toBe(2);
  });

  it('is 0 for an empty list', () => {
    expect(nearestChipIndex([], 5, 5)).toBe(0);
  });
});

describe('SortableChipRow keyboard', () => {
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

  function render(props: Partial<Parameters<typeof SortableChipRow>[0]> = {}) {
    const onReorder = jest.fn();
    act(() => {
      root.render(<SortableChipRow items={items()} onReorder={onReorder} {...props} />);
    });
    return onReorder;
  }

  it('moves a chip one place with the arrow keys, and stops at the ends', () => {
    const onReorder = render();
    const chip = container.querySelector('[data-testid="sortable-chip-b"]');
    expect(chip).not.toBeNull();
    act(() => press(chip as Element, 'ArrowRight'));
    expect(onReorder).toHaveBeenLastCalledWith(['a', 'c', 'b']);
    act(() => press(chip as Element, 'ArrowLeft'));
    expect(onReorder).toHaveBeenLastCalledWith(['b', 'a', 'c']);
    const first = container.querySelector('[data-testid="sortable-chip-a"]') as Element;
    const before = onReorder.mock.calls.length;
    act(() => press(first, 'ArrowLeft'));
    expect(onReorder.mock.calls.length).toBe(before);
  });

  it('does nothing when disabled', () => {
    const onReorder = render({ disabled: true });
    const chip = container.querySelector('[data-testid="sortable-chip-b"]') as Element;
    act(() => press(chip, 'ArrowRight'));
    expect(onReorder).not.toHaveBeenCalled();
  });
});
