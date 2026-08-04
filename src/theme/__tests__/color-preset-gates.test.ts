/**
 * The gate groups must PARTITION the preset list.
 *
 * A consumer builds its picker from these three, so a preset missing from all of
 * them disappears with no error, and one appearing in two is offered to people
 * who should not have it. Neither shows up as a type error, a failed render, or
 * anything else the rest of the suite can see — the picker just renders a
 * different set of swatches than intended.
 */
import {
  APP_COLOR_NAMES,
  APP_COLOR_PRESETS,
  FREE_COLOR_NAMES,
  HANDLE_COLOR_NAMES,
  PREMIUM_COLOR_NAMES,
} from '../color-presets';

describe('colour preset gates', () => {
  it('partitions every preset exactly once', () => {
    const grouped = [...FREE_COLOR_NAMES, ...HANDLE_COLOR_NAMES, ...PREMIUM_COLOR_NAMES];
    expect([...grouped].sort()).toEqual([...APP_COLOR_NAMES].sort());
    expect(new Set(grouped).size).toBe(grouped.length);
  });

  // Vacuity floor: an empty gated group would satisfy the partition above while
  // meaning "nothing is gated at all", which is the bug this file exists for.
  it('actually gates something in each direction', () => {
    expect(FREE_COLOR_NAMES.length).toBeGreaterThan(10);
    expect(HANDLE_COLOR_NAMES.length).toBeGreaterThan(0);
    expect(PREMIUM_COLOR_NAMES.length).toBeGreaterThan(0);
  });

  // The specific assignment, stated so a change to it is a deliberate edit here
  // rather than a silent consequence of adding a preset.
  it('reserves the brand colours by handle and sells the colourless one', () => {
    expect([...HANDLE_COLOR_NAMES].sort()).toEqual(['faircoin', 'oxy']);
    expect(PREMIUM_COLOR_NAMES).toEqual(['mono']);
    expect(FREE_COLOR_NAMES).not.toContain('mono');
    expect(FREE_COLOR_NAMES).toContain('teal');
  });

  it('keeps the declared gate and the derived group in agreement', () => {
    for (const name of APP_COLOR_NAMES) {
      const { gate } = APP_COLOR_PRESETS[name];
      if (gate === undefined) expect(FREE_COLOR_NAMES).toContain(name);
      else if (gate === 'handle') expect(HANDLE_COLOR_NAMES).toContain(name);
      else expect(PREMIUM_COLOR_NAMES).toContain(name);
    }
  });
});
