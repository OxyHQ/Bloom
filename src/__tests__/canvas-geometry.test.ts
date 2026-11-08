import { canvasSafeArea, canvasVisibleRect } from '../canvas/geometry';
import { createCanvasStore } from '../canvas/context';
import { resolveSheetDetents, sheetPanIntent } from '../bottom-sheet/drag-geometry';

describe('canvas local geometry', () => {
  it('does not reapply safe edges already consumed by an inset host', () => {
    expect(
      canvasSafeArea(
        { x: 20, y: 80, width: 350, height: 700 },
        { width: 390, height: 844 },
        { top: 44, left: 0, right: 0, bottom: 34 },
      ),
    ).toEqual({ top: 0, left: 0, right: 0, bottom: 0 });
    expect(
      canvasSafeArea(
        { x: 0, y: 0, width: 390, height: 844 },
        { width: 390, height: 844 },
        { top: 44, left: 0, right: 0, bottom: 34 },
      ),
    ).toEqual({ top: 44, left: 0, right: 0, bottom: 34 });
  });
  it('intersects keyboard occlusion once for resized and unresized hosts', () => {
    const visible = { x: 0, y: 0, width: 390, height: 500 };
    expect(canvasVisibleRect(390, 844, 0, 80, visible).height).toBe(420);
    expect(canvasVisibleRect(390, 420, 0, 80, visible).height).toBe(420);
    expect(canvasVisibleRect(390, 420, 0, 80).height).toBe(420);
  });
  it('translates a panned visual viewport into local physical coordinates', () => {
    expect(canvasVisibleRect(400, 800, 20, 30, { x: 40, y: 80, width: 300, height: 500 })).toEqual({
      x: 20,
      y: 50,
      width: 300,
      height: 500,
    });
  });
  it.each([0, 40, 100, 240, 844])('bounds every detent by the actual %ipx room', (room) => {
    const geometry = resolveSheetDetents(room, 150, 380);
    expect(geometry.peek).toBeLessThanOrEqual(geometry.half);
    expect(geometry.half).toBeLessThanOrEqual(geometry.full);
    expect(geometry.full).toBe(room);
    expect(geometry.offsets.peek).toBeGreaterThanOrEqual(0);
  });
  it('combines overlapping claims by maximum and releases independently', () => {
    const store = createCanvasStore();
    store.left.claim('panel', 400);
    store.left.claim('control', 80);
    store.right.claim('other', 60);
    store.edges(72, 320, true);
    expect(store.read().occupied).toEqual({ top: 72, bottom: 320, left: 400, right: 60 });
    store.left.release('panel');
    expect(store.read().occupied.left).toBe(80);
    const snapshot = store.read();
    store.left.claim('control', 80);
    expect(store.read()).toBe(snapshot);
  });
});
describe('shared sheet gesture intent', () => {
  it('keeps modal dismissal thresholds distinct from persistent expansion', () => {
    expect(sheetPanIntent(-9, 0, 300, 'dismiss')).toBe('fail');
    expect(sheetPanIntent(-9, 0, 300, 'detents')).toBe('activate');
    expect(sheetPanIntent(-9, 0, 0, 'detents')).toBe('fail');
    expect(sheetPanIntent(9, 3, 0, 'dismiss')).toBe('activate');
    expect(sheetPanIntent(9, 3, 0, 'detents')).toBe('fail');
  });
  it('hands a full panel scroll to its child and only collapses at the top', () => {
    expect(sheetPanIntent(9, 100, 0, 'detents')).toBe('fail');
    expect(sheetPanIntent(9, 0, 0, 'detents')).toBe('activate');
    expect(sheetPanIntent(7, 0, 0, 'detents')).toBe('wait');
  });
});
