import { filterColor, filterColorBounds, type RGB } from '../surface/filter-color';

describe('surface filter enclosure', () => {
  it('includes mixed-channel saturation extremes missed by the diagonal', () => {
    const range = { min: [0.05, 0.3, 0.15] as RGB, max: [0.45, 0.7, 0.9] as RGB };
    const stages = [['saturate', 1.8705]] as const;
    const box = filterColorBounds(range, stages);
    const mixed = filterColor([0.45, 0.3, 0.15], stages);
    expect(mixed[0]).toBeGreaterThan(filterColor(range.max, stages)[0]);
    for (let channel = 0; channel < 3; channel++) {
      expect(mixed[channel]).toBeGreaterThanOrEqual(box.min[channel]!);
      expect(mixed[channel]).toBeLessThanOrEqual(box.max[channel]!);
    }
  });

  it('preserves a genuinely known solid through each clamped stage', () => {
    const color: RGB = [0.2, 0.7, 0.1];
    const stages = [
      ['saturate', 1.87],
      ['contrast', 0.44],
      ['brightness', 1.38],
    ] as const;
    const output = filterColor(color, stages);
    expect(filterColorBounds({ min: color, max: color }, stages)).toEqual({
      min: output,
      max: output,
    });
  });

  it('rejects unsupported stages and invalid enclosures instead of asserting a bound', () => {
    const cube = { min: [0, 0, 0] as RGB, max: [1, 1, 1] as RGB };
    for (const stage of [
      ['hue-rotate', 20],
      ['brightness', NaN],
      ['contrast', -1],
    ] as const) {
      expect(() => filterColorBounds(cube, [stage])).toThrow(RangeError);
    }
    expect(() => filterColorBounds({ min: [0.8, 0, 0], max: [0.2, 1, 1] }, [])).toThrow(RangeError);
  });
});
