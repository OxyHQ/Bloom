import { MIN_THUMB, offsetOfThumb, thumbOf } from '../scroll-area-geometry';

describe('thumbOf', () => {
  it('is nothing to draw when the content fits, or nothing has been measured yet', () => {
    expect(thumbOf({ viewport: 400, content: 400, offset: 0 }, 400).scrollable).toBe(false);
    expect(thumbOf({ viewport: 400, content: 300, offset: 0 }, 400).scrollable).toBe(false);
    expect(thumbOf({ viewport: 0, content: 900, offset: 0 }, 400).scrollable).toBe(false);
    expect(thumbOf({ viewport: 400, content: 900, offset: 0 }, 0).scrollable).toBe(false);
  });

  it('is as long as the visible share of the content, on the track', () => {
    expect(thumbOf({ viewport: 400, content: 800, offset: 0 }, 400).size).toBe(200);
  });

  it('touches the start at rest and the end at the bottom', () => {
    const top = thumbOf({ viewport: 400, content: 800, offset: 0 }, 400);
    const bottom = thumbOf({ viewport: 400, content: 800, offset: 400 }, 400);
    expect(top.position).toBe(0);
    expect(bottom.position + bottom.size).toBe(400);
  });

  it('moves in proportion between the ends', () => {
    expect(thumbOf({ viewport: 400, content: 800, offset: 200 }, 400).position).toBe(100);
  });

  it('never shrinks below something a hand can grab', () => {
    expect(thumbOf({ viewport: 400, content: 400_000, offset: 0 }, 400).size).toBe(MIN_THUMB);
  });

  it('stays on the track for an offset beyond the content (rubber-banding, a collapsed box)', () => {
    const past = thumbOf({ viewport: 400, content: 800, offset: 9_000 }, 400);
    const before = thumbOf({ viewport: 400, content: 800, offset: -50 }, 400);
    expect(past.position + past.size).toBe(400);
    expect(before.position).toBe(0);
  });
});

describe('offsetOfThumb', () => {
  const axis = { viewport: 400, content: 1_000 };

  it('is the inverse of thumbOf: the thumb at the end of the track is the end of the content', () => {
    const thumb = thumbOf({ ...axis, offset: 0 }, 400);
    expect(offsetOfThumb(400 - thumb.size, axis, 400, thumb.size)).toBe(600);
    expect(offsetOfThumb(0, axis, 400, thumb.size)).toBe(0);
  });

  it('round-trips any offset', () => {
    for (const offset of [0, 90, 300, 600]) {
      const thumb = thumbOf({ ...axis, offset }, 400);
      expect(offsetOfThumb(thumb.position, axis, 400, thumb.size)).toBeCloseTo(offset, 6);
    }
  });

  it('clamps a drag past either end, and is 0 where there is nothing to scroll', () => {
    expect(offsetOfThumb(-30, axis, 400, 160)).toBe(0);
    expect(offsetOfThumb(9_999, axis, 400, 160)).toBe(600);
    expect(offsetOfThumb(10, { viewport: 400, content: 400 }, 400, 400)).toBe(0);
  });
});
