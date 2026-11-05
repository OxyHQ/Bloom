/** @jest-environment jsdom */
/**
 * `setDragImage` on the web: an HTML5 drag's image made from the dragged
 * element as it looks, the point pressed in it kept under the pointer — the
 * element itself for one item; for several, the element over stacked copies of
 * it with the count on a red badge at its top right, built off screen, given
 * to the browser and removed once it took its picture.
 */
import { setDragImage } from '../drop-zone/drag-image.web';

function transfer() {
  return { setDragImage: jest.fn() } as unknown as DataTransfer & {
    setDragImage: jest.Mock;
  };
}

function item(): HTMLElement {
  const element = document.createElement('div');
  element.id = 'item';
  element.className = 'cell';
  element.textContent = 'notes.txt';
  element.getBoundingClientRect = () =>
    ({ x: 0, y: 0, left: 0, top: 0, width: 96, height: 80, right: 96, bottom: 80 }) as DOMRect;
  document.body.appendChild(element);
  return element;
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => {
  jest.useRealTimers();
  document.body.innerHTML = '';
});

test('one item: the element itself, held where it was pressed', () => {
  const data = transfer();
  const element = item();
  setDragImage(data, element, { x: 30, y: 12 });
  expect(data.setDragImage).toHaveBeenCalledTimes(1);
  expect(data.setDragImage).toHaveBeenCalledWith(element, 30, 12);
  expect(document.body.children).toHaveLength(1);
});

test('three items: the element over two copies, the count badged, removed after', () => {
  const data = transfer();
  const element = item();
  setDragImage(data, element, { x: 30, y: 12, count: 3 });
  expect(data.setDragImage).toHaveBeenCalledTimes(1);
  const [stack, x, y] = data.setDragImage.mock.calls[0] as [HTMLElement, number, number];
  expect(stack).not.toBe(element);
  // The pressed point stays under the pointer: the badge's half above the item moves it down.
  expect([x, y]).toEqual([30, 22]);
  const copies = Array.from(stack.querySelectorAll('.cell')) as HTMLElement[];
  expect(copies).toHaveLength(3);
  // No copy keeps the element's id; the front one is last, at the stack's top left, whole.
  expect(copies.some((copy) => copy.id !== '')).toBe(false);
  expect(copies.map((copy) => [copy.style.left, copy.style.top, copy.style.opacity])).toEqual([
    ['6px', '16px', '0.5'],
    ['3px', '13px', '0.75'],
    ['0px', '10px', '1'],
  ]);
  const badge = stack.querySelector('span') as HTMLElement;
  expect(badge.textContent).toBe('3');
  expect(badge.style.background).toBe('rgb(255, 59, 48)');
  expect(badge.style.left).toBe('86px');
  expect(stack.isConnected).toBe(true);
  jest.runAllTimers();
  expect(stack.isConnected).toBe(false);
  expect(element.isConnected).toBe(true);
});

test('two items stack one copy; a thousand say 999+', () => {
  const two = transfer();
  setDragImage(two, item(), { x: 0, y: 0, count: 2 });
  const [stack] = two.setDragImage.mock.calls[0] as [HTMLElement];
  expect(stack.querySelectorAll('.cell')).toHaveLength(2);
  const many = transfer();
  setDragImage(many, item(), { x: 0, y: 0, count: 1000 });
  const [pile] = many.setDragImage.mock.calls[0] as [HTMLElement];
  expect(pile.querySelectorAll('.cell')).toHaveLength(3);
  expect(pile.querySelector('span')?.textContent).toBe('999+');
});

test('without a transfer or an element, nothing', () => {
  expect(() => setDragImage(null, item(), { x: 0, y: 0, count: 3 })).not.toThrow();
  const data = transfer();
  setDragImage(data, null, { x: 0, y: 0 });
  expect(data.setDragImage).not.toHaveBeenCalled();
  expect(document.body.children).toHaveLength(1);
});
