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
    side: 'bottom',
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

    // `side` is what let `Popover` (batch 2) drop its own positioner: its
    // `placement` prop names the preferred side outright, which a
    // below-only resolver could not express.
    it("side 'top' sits ABOVE the anchor when it fits", () => {
      // Trigger 100..140, surface 100 tall, offset 6 → 100 - 6 - 100 = -6…
      // which does NOT clear the gutter, so use a lower trigger.
      expect(place({ anchor: trigger(200), side: 'top' }).top).toBe(94);
    });

    it("side 'top' is a PREFERENCE — it flips below when there is no room above", () => {
      // Trigger 20..60: above would start at 20 - 6 - 100 = -86, past the top
      // gutter. Below starts at 60 + 6 = 66 and fits.
      expect(place({ anchor: trigger(20), side: 'top' }).top).toBe(66);
    });

    it("side 'top' and side 'bottom' disagree when BOTH sides fit", () => {
      const anchor = trigger(200);
      expect(place({ anchor, side: 'bottom' }).top).toBe(246);
      expect(place({ anchor, side: 'top' }).top).toBe(94);
    });

    it("side 'top' pins to the top gutter when neither side fits", () => {
      // 460 tall against a 500 viewport, so neither side fits and the PREFERRED
      // position is clamped: above = 200 - 6 - 460 = -266 → the gutter.
      //
      // The max end of the clamp is unreachable for `'top'` by construction:
      // `above` is only clamped when it is BELOW the gutter, and the gutter is
      // below the max. That is why the two-sided clamp — the thing popover's own
      // positioner lacked — is asserted on the `'bottom'` side (see the
      // `align 'center'` case), which is where it actually bites.
      expect(
        place({ anchor: trigger(200), side: 'top', size: { width: 180, height: 460 } }).top,
      ).toBe(GUTTER);
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

  /**
   * The submenu axis. A sub-panel flies out BESIDE its trigger row, so `side`
   * names the horizontal axis and `align` moves the surface vertically — the
   * same two helpers with the anchor's edges swapped, not a second positioner.
   */
  describe("side 'right' / 'left' — the submenu axis", () => {
    it("side 'right' sits to the RIGHT of the anchor when it fits", () => {
      // Trigger 400..600, surface 180 wide, offset 6 → 606..786, inside 1000 - 8.
      expect(place({ side: 'right' }).left).toBe(606);
    });

    it("side 'right' flips LEFT when there is no room on the right", () => {
      // Trigger 850..980: right would end at 1166, past 1000 - 8. Left starts at
      // 850 - 6 - 180 = 664 and clears the gutter.
      const near = { top: 100, bottom: 140, left: 850, right: 980 };
      expect(place({ anchor: near, side: 'right' }).left).toBe(664);
    });

    it("side 'left' sits to the LEFT when it fits, and flips right when it does not", () => {
      expect(place({ side: 'left' }).left).toBe(214);
      const edge = { top: 100, bottom: 140, left: 20, right: 60 };
      expect(place({ anchor: edge, side: 'left' }).left).toBe(66);
    });

    it("side 'right' and side 'left' disagree when BOTH sides fit", () => {
      expect(place({ side: 'right' }).left).toBe(606);
      expect(place({ side: 'left' }).left).toBe(214);
    });

    it('clamps into the viewport when neither side fits', () => {
      // 900 wide against a 1000 viewport: right ends at 1506, left starts at
      // -506, so the PREFERRED position is clamped to 1000 - 8 - 900.
      expect(place({ side: 'right', size: { width: 900, height: 100 } }).left).toBe(92);
    });

    it('pins to the left gutter when the surface is wider than the viewport', () => {
      // Same choice the vertical axis makes: overflow the FAR edge so the
      // surface's start stays reachable.
      expect(place({ side: 'right', size: { width: 1200, height: 100 } }).left).toBe(GUTTER);
    });

    /**
     * The property that makes this ONE resolver rather than two: `align` acts on
     * whichever axis `side` did not name. A resolver that kept `align` on the
     * horizontal axis for every side would pass every test above and place every
     * submenu at its trigger's `left`.
     */
    it("align acts on the VERTICAL axis when the side is horizontal", () => {
      const anchor = trigger(100); // 100..140
      expect(place({ anchor, side: 'right', align: 'start' }).top).toBe(100);
      expect(place({ anchor, side: 'right', align: 'end' }).top).toBe(40);
      expect(place({ anchor, side: 'right', align: 'center' }).top).toBe(70);
    });

    it('leaves `left` untouched by `align` when the side is horizontal', () => {
      const anchor = trigger(100);
      const start = place({ anchor, side: 'right', align: 'start' }).left;
      const end = place({ anchor, side: 'right', align: 'end' }).left;
      const center = place({ anchor, side: 'right', align: 'center' }).left;
      expect(start).toBe(606);
      expect(end).toBe(606);
      expect(center).toBe(606);
    });

    it('clamps the cross axis into the viewport', () => {
      // Trigger 460..500 against a 500-tall viewport: aligning the panel's top
      // to 460 would run it to 560, so it pins to 500 - 8 - 100.
      const low = { top: 460, bottom: 500, left: 400, right: 600 };
      expect(place({ anchor: low, side: 'right', align: 'start' }).top).toBe(392);
      const high = { top: 0, bottom: 40, left: 400, right: 600 };
      expect(place({ anchor: high, side: 'right', align: 'end' }).top).toBe(GUTTER);
    });

    it('a horizontal side and a vertical side are genuinely different answers', () => {
      // Vacuity floor: if `side` were ignored for the two new values, `'right'`
      // would silently behave as `'bottom'` and every case above would still
      // pass on `left` alone.
      const anchor = trigger(100);
      const bottom = place({ anchor, side: 'bottom', align: 'start' });
      const right = place({ anchor, side: 'right', align: 'start' });
      expect(right.left).not.toBe(bottom.left);
      expect(right.top).not.toBe(bottom.top);
    });
  });
});
