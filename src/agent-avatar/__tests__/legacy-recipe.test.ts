import { avatarHex } from '../avatar-color';
import { legacyContours } from '../legacy-contours';
import {
  legacyCharacterRecipe,
  legacyRecipe,
  legacyRecipeUnsupported,
  radialContour,
} from '../legacy-recipe';
import { DEFAULT_CONFIG, EYES, FOLD_CONFIG, type AvatarConfig } from '../model';

const recipe = (patch: Partial<AvatarConfig> = {}) => ({
  ...DEFAULT_CONFIG,
  ...patch,
});

describe('legacy appearance migration', () => {
  it.each([
    ['blob', 'circle', 'circle'],
    ['blob', 'triangle', 'rounded_triangle'],
    ['blob', 'flower', 'six_lobed_flower'],
    ['blob', 'diamond', 'rounded_diamond'],
    ['fold', 'heart', 'heart'],
    ['fold', 'flower', 'six_lobed_flower'],
    ['fold', 'diamond', 'rounded_diamond'],
  ] as const)(
    'reuses the existing %s %s body as %s',
    (family, shape, expected) => {
      const config =
        family === 'fold'
          ? recipe({ family, foldShape: shape as AvatarConfig['foldShape'] })
          : recipe({ family, shape: shape as AvatarConfig['shape'] });
      expect(legacyRecipe(config)).toMatchObject({ shape: expected });
      expect(legacyRecipe(config).points).toBeUndefined();
    },
  );

  it.each([
    { family: 'alien' },
    { family: 'mascot' },
    { face: false },
  ] as Partial<AvatarConfig>[])(
    'keeps unsupported appearances on their existing renderer: %p',
    (patch) => {
      expect(legacyRecipeUnsupported(recipe(patch))).toBe(true);
    },
  );

  it('accepts ordinary expressions without changing the saved appearance', () => {
    const config = Object.freeze(recipe({ eyes: 'wink', expression: 100 }));
    const before = JSON.stringify(config);
    expect(legacyRecipeUnsupported(config)).toBe(false);
    const migrated = legacyRecipe(config);
    expect(JSON.stringify(config)).toBe(before);
    expect(migrated.patch.bodyColor).toBe(avatarHex(config));
    expect(migrated.eyes).toBe('oval');
    expect(migrated.patch).not.toHaveProperty('eyeTransforms');
  });

  it.each([
    [0, '#ff0000'],
    [60, '#ffff00'],
    [120, '#00ff00'],
    [180, '#00ffff'],
    [240, '#0000ff'],
    [300, '#ff00ff'],
  ])('keeps an exact custom HSL color at hue %s', (hue, hex) => {
    const config = recipe({
      hue: hue as number,
      saturation: 100,
      lightness: 50,
    });
    expect(avatarHex(config)).toBe(hex);
    expect(legacyRecipe(config).patch.bodyColor).toBe(hex);
  });

  it('retains the historical default lightness and achromatic custom colors', () => {
    expect(avatarHex(recipe({ saturation: 0 }))).toBe('#c2c2c2');
    expect(avatarHex(recipe({ saturation: 0, lightness: 0 }))).toBe('#000000');
    expect(avatarHex(recipe({ saturation: 0, lightness: 100 }))).toBe(
      '#ffffff',
    );
  });

  it('distinguishes all remaining paper contours with positive, counterclockwise geometry', () => {
    const shapes = [
      'slender',
      'pocket',
      'petal',
      'star',
      'cloud',
      'shield',
    ] as const;
    const outlines = shapes.map((foldShape) => {
      const points = legacyRecipe({ ...FOLD_CONFIG, foldShape }).points!;
      expect(points.length).toBeGreaterThanOrEqual(16);
      expect(points[0]![0]).toBeGreaterThan(0);
      expect(points[0]![1]).toBeCloseTo(0, 12);
      let area = 0;
      points.forEach(([x, y], index) => {
        expect(Number.isFinite(x) && Number.isFinite(y)).toBe(true);
        expect(Math.hypot(x, y)).toBeGreaterThan(0);
        const next = points[(index + 1) % points.length]!;
        area += x * next[1] - next[0] * y;
      });
      expect(area).toBeGreaterThan(0);
      return JSON.stringify(points);
    });
    expect(new Set(outlines).size).toBe(shapes.length);
  });

  it('reflects the paper silhouette without reversing renderer sample order', () => {
    const right = legacyRecipe({
      ...FOLD_CONFIG,
      foldDirection: 'right',
    }).points!;
    const left = legacyRecipe({
      ...FOLD_CONFIG,
      foldDirection: 'left',
    }).points!;
    expect(left).toHaveLength(right.length);
    for (let i = 0; i < right.length; i++) {
      const mirrored =
        left[(right.length / 2 - i + right.length) % right.length]!;
      expect(mirrored[0]).toBeCloseTo(-right[i]![0], 8);
      expect(mirrored[1]).toBeCloseTo(right[i]![1], 8);
    }
  });

  it('samples the circular contour from positive X without rotation or scaling', () => {
    const sampled = radialContour(
      legacyContours(recipe({ shape: 'circle' })),
      180,
    );
    sampled.forEach(([x, y], i) => {
      const angle = (i * Math.PI * 2) / 180;
      expect(x).toBeCloseTo(Math.cos(angle), 10);
      expect(y).toBeCloseTo(Math.sin(angle), 10);
    });
  });

  it('uses the outermost union intersection of overlapping front and back layers', () => {
    const front: [number, number][] = [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ];
    const back: [number, number][] = [
      [-0.5, -0.5],
      [2, -0.5],
      [2, 0.5],
      [-0.5, 0.5],
    ];
    const sampled = radialContour([front, back]);
    expect(sampled[0]![0]).toBeCloseTo(2, 10);
    expect(sampled[64]![1]).toBeCloseTo(1, 10);
    expect(sampled[128]![0]).toBeCloseTo(-1, 10);
    expect(
      radialContour([back.slice().reverse(), front.slice().reverse()]),
    ).toEqual(sampled);
  });

  it('rejects invalid deformation resolutions and geometry missing its origin', () => {
    expect(() => radialContour([], 8)).toThrow();
    expect(() => radialContour([], 256)).toThrow();
  });

  it('uses the actual catalog eye selection without legacy transforms', () => {
    const config = recipe({
      character: { preset: 'bloom', selections: { eyes: 'sleepy_lids' } },
    });
    expect(legacyRecipe(config).eyes).toBe('sleepy_lids');
    expect(Object.keys(legacyRecipe(config).patch)).toEqual(['bodyColor']);
  });

  it.each(EYES)(
    'retires the old %s expression in favour of original 3D eyes',
    (eyes) => {
      expect(
        legacyRecipe(
          recipe({
            eyes,
            expression: 100,
            eyeTilt: 80,
            eyeGap: 12,
            eyeSize: 34,
            lightEyes: true,
          }),
        ),
      ).toEqual(legacyRecipe(recipe()));
    },
  );

  it('keeps the custom body color when selecting a new 3D eye style', () => {
    expect(
      legacyRecipe(
        recipe({
          character: {
            preset: 'bloom',
            bodyColor: '#123456',
            selections: { eyes: 'dots' },
          },
        }),
      ),
    ).toMatchObject({ eyes: 'dots', patch: { bodyColor: '#123456' } });
  });
  it.each(['cloud', 'heart'] as const)(
    'keeps catalog accessories and one capability identity on %s',
    (foldShape) => {
      const config = {
        ...FOLD_CONFIG,
        foldShape,
        character: {
          preset: 'bloom',
          bodyColor: '#123456',
          selections: {
            eyes: 'sparkle_capsules',
            eyewear: 'tall_oval_frames',
            accessory: 'beret',
          },
        },
      };
      const result = legacyRecipe(config);
      expect(result.selections).toEqual({
        eyewear: 'tall_oval_frames',
        accessory: 'beret',
      });
      expect(legacyCharacterRecipe(config)).toEqual({
        preset: 'legacy',
        selections: {
          shape: result.shape ?? 'circle',
          eyes: result.eyes,
          ...result.selections,
        },
        ...result.patch,
      });
    },
  );
});
