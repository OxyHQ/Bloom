import {
  resizeRetainedSpans,
  retainedGeometry,
  retainedLine,
  retainedOrder,
  retainedSlots,
} from '../app-shell/retained-geometry';

const at = (edge: { fraction: number; offset: number }, extent: number) =>
  edge.fraction * extent + edge.offset;

describe('retained panel geometry', () => {
  it('divides a line by its fractions with fixed gaps, at any extent', () => {
    const fractions = [0.5, 0.25, 0.25];
    for (const extent of [1000, 1416, 640]) {
      const free = extent - 14;
      const boxes = fractions.map((_, i) => retainedLine(fractions, i, 7));
      const lead = boxes.map((b) => at(b.lead, extent));
      const trail = boxes.map((b) => extent - at(b.trail, extent));
      expect(lead[0]).toBeCloseTo(0, 9);
      expect(trail[0]).toBeCloseTo(free * 0.5, 9);
      expect(lead[1]).toBeCloseTo(free * 0.5 + 7, 9);
      expect(trail[2]).toBeCloseTo(extent, 9);
      for (let i = 1; i < 3; i++) expect(lead[i]! - trail[i - 1]!).toBeCloseTo(7, 9);
    }
  });

  it('groups a stack into the slot of its first panel, in array order', () => {
    expect(
      retainedSlots([{ id: 'a' }, { id: 'b', stack: 's' }, { id: 'c' }, { id: 'd', stack: 's' }]),
    ).toEqual([
      { key: 'a', ids: ['a'] },
      { key: 's', ids: ['b', 'd'] },
      { key: 'c', ids: ['c'] },
    ]);
  });

  it('places a stack across the slot and its boundaries where the gaps are', () => {
    const g = retainedGeometry([{ id: 'a' }, { id: 'b', stack: 's' }, { id: 'c', stack: 's' }], {
      axis: 'horizontal',
      gap: 7,
      spans: { a: 1, s: 1, b: 3, c: 1 },
    });
    const W = 1007;
    const H = 807;
    expect(at(g.boxes.b!.start, W)).toBeCloseTo(507, 9);
    expect(at(g.boxes.b!.top, H)).toBeCloseTo(0, 9);
    expect(H - at(g.boxes.b!.bottom, H)).toBeCloseTo(600, 9);
    expect(at(g.boxes.c!.top, H)).toBeCloseTo(607, 9);
    expect(g.boundaries.map((b) => [b.level, b.before, b.after])).toEqual([
      ['main', 'a', 's'],
      ['cross', 'b', 'c'],
    ]);
    expect(at(g.boundaries[0]!.at, W)).toBeCloseTo(503.5, 9);
    expect(at(g.boundaries[1]!.at, H)).toBeCloseTo(603.5, 9);
  });

  it('resizes a pair by its combined weight and never under a minimum', () => {
    const keys = ['a', 'b', 'c'];
    const next = resizeRetainedSpans({ a: 1, b: 1, c: 1 }, keys, 'a', 'b', 50, 900, {
      before: 220,
      after: 220,
    });
    expect(next.a! + next.b!).toBeCloseTo(2, 9);
    expect(next.a! / (next.a! + next.b!)).toBeCloseTo(350 / 600, 9);
    const capped = resizeRetainedSpans({ a: 1, b: 1, c: 1 }, keys, 'a', 'b', 200, 900, {
      before: 220,
      after: 220,
    });
    expect(capped.a! / (capped.a! + capped.b!)).toBeCloseTo(380 / 600, 9);
    expect(next.c).toBe(1);
    const floored = resizeRetainedSpans({ a: 1, b: 1, c: 1 }, keys, 'a', 'b', -500, 900, {
      before: 220,
      after: 220,
    });
    expect(floored.a! / (floored.a! + floored.b!)).toBeCloseTo(220 / 600, 9);
  });

  it('keeps the order ids were first seen in, appending newcomers and returners', () => {
    const first = retainedOrder([], ['a', 'b', 'c']);
    expect(retainedOrder(first, ['c', 'a', 'b'])).toBe(first);
    expect(retainedOrder(first, ['b', 'a'])).toEqual(['a', 'b']);
    expect(retainedOrder(['a', 'b'], ['c', 'a', 'b'])).toEqual(['a', 'b', 'c']);
  });
});
