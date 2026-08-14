import {
  resolveDropdownPlacement,
  type DropdownPlacementInput,
} from '../overlay/dropdown-placement';

const VIEWPORT = { width: 1000, height: 500 };
const GUTTER = 8;

/** A 200x40 trigger at (400, y), the shape the web `Menu` anchors against. */
function trigger(y: number) {
  return { top: y, bottom: y + 40, left: 400, right: 600 };
}

function place(overrides: Partial<DropdownPlacementInput>): { top: number; left: number } {
  return resolveDropdownPlacement({
    anchor: trigger(100),
    size: { width: 180, height: 100 },
    viewport: VIEWPORT,
    offset: 6,
    gutter: GUTTER,
    align: 'end',
    ...overrides,
  });
}

describe('resolveDropdownPlacement', () => {
  describe('vertical', () => {
    it('sits below the anchor when it fits', () => {
      // Trigger 100..140, surface 100 tall, offset 6 → 146..246, well inside 500.
      expect(place({}).top).toBe(146);
    });

    it('flips above the anchor when there is no room below', () => {
      // Trigger 420..460: below would end at 566, past 500 - 8. Above starts at
      // 420 - 6 - 100 = 314, which clears the top gutter.
      expect(place({ anchor: trigger(420) }).top).toBe(314);
    });

    it('prefers below when BOTH sides fit — flipping is a fallback, not a preference', () => {
      expect(place({ anchor: trigger(200), size: { width: 180, height: 100 } }).top).toBe(246);
    });

    it('clamps into the viewport when neither side fits', () => {
      // 460 tall against a 500 viewport: nothing fits either side of a
      // mid-screen trigger, so it pins to 500 - 8 - 460 = 32.
      expect(place({ anchor: trigger(200), size: { width: 180, height: 460 } }).top).toBe(32);
    });

    it('pins to the top gutter when the surface is taller than the viewport', () => {
      // Overflowing the BOTTOM keeps the first rows reachable; the opposite
      // choice would push the surface's start off-screen and strand every row.
      expect(place({ anchor: trigger(200), size: { width: 180, height: 900 } }).top).toBe(GUTTER);
    });

    it('treats a zero-area anchor (a right-click point) as its own edge', () => {
      const point = { top: 300, bottom: 300, left: 900, right: 900 };
      expect(place({ anchor: point, offset: 0, align: 'start' }).top).toBe(300);
      // 300 + 250 = 550 > 500 - 8, so it flips to 300 - 250 = 50.
      expect(
        place({ anchor: point, offset: 0, align: 'start', size: { width: 180, height: 250 } }).top,
      ).toBe(50);
    });
  });

  describe('horizontal', () => {
    it("align 'end' lines the surface's right edge up with the anchor's", () => {
      expect(place({ size: { width: 180, height: 100 } }).left).toBe(420);
    });

    it("align 'start' lines the surface's left edge up with the anchor's", () => {
      expect(place({ align: 'start' }).left).toBe(400);
    });

    it('clamps a surface that would overflow the right edge', () => {
      const point = { top: 100, bottom: 100, left: 980, right: 980 };
      // 980 + 180 would reach 1160; pinned to 1000 - 8 - 180.
      expect(place({ anchor: point, align: 'start' }).left).toBe(812);
    });

    it('clamps a surface that would overflow the left edge', () => {
      const narrow = { top: 100, bottom: 140, left: 0, right: 20 };
      // Right-aligning to x=20 would start at -160.
      expect(place({ anchor: narrow }).left).toBe(GUTTER);
    });

    it('pins to the left gutter when the surface is wider than the viewport', () => {
      expect(place({ size: { width: 1200, height: 100 } }).left).toBe(GUTTER);
    });

    it("align 'center' lines the two midpoints up", () => {
      // Trigger 400..600 → midpoint 500; a 180-wide surface starts at 410.
      expect(place({ align: 'center' }).left).toBe(410);
    });

    it("align 'center' is genuinely a third answer, not an alias of either edge", () => {
      const start = place({ align: 'start' }).left;
      const end = place({ align: 'end' }).left;
      const center = place({ align: 'center' }).left;
      // Which of `start`/`end` is the larger number depends on whether the
      // surface is narrower than the anchor (here it is: 180 against 200), so the
      // property is that `center` sits strictly BETWEEN them, not which side.
      expect(center).not.toBe(start);
      expect(center).not.toBe(end);
      expect(center).toBeGreaterThan(Math.min(start, end));
      expect(center).toBeLessThan(Math.max(start, end));
    });

    it("align 'center' centres on a zero-area anchor (a point)", () => {
      const point = { top: 100, bottom: 100, left: 500, right: 500 };
      expect(place({ anchor: point, align: 'center' }).left).toBe(410);
    });

    it("align 'center' takes the same clamp as the other two", () => {
      // Centring on a trigger hard against the left edge would start at -80.
      const edge = { top: 100, bottom: 140, left: 0, right: 40 };
      expect(place({ anchor: edge, align: 'center' }).left).toBe(GUTTER);
      // …and against the right edge it would run past 1000.
      const far = { top: 100, bottom: 140, left: 960, right: 1000 };
      expect(place({ anchor: far, align: 'center' }).left).toBe(812);
    });

    // The reason to migrate popover onto this function at all (batch 2): its own
    // positioner clamps only the TOP, so an oversized panel runs off the bottom
    // of the viewport. This one clamps both ends of the vertical axis for every
    // alignment, `'center'` included.
    it("align 'center' still gets the vertical clamp popover's own positioner lacks", () => {
      expect(
        place({ anchor: trigger(200), align: 'center', size: { width: 180, height: 460 } }).top,
      ).toBe(32);
    });
  });
});
