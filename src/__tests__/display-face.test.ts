import type { StyleProp, TextStyle } from 'react-native';
import {
  DISPLAY_FACE_FAMILIES,
  displayFaceFamily,
  numericFontWeight,
  withDisplayFaceCut,
} from '../fonts/display-face';
import { FONT_ASSETS } from '../fonts/font-assets.native';
import { FONT_FACE_SOURCES } from '../fonts/font-face-css.web';

describe('the display cut CSS font matching picks from faces at 400 and 700', () => {
  it.each([
    [100, 'BlomusModernus'],
    [200, 'BlomusModernus'],
    [300, 'BlomusModernus'],
    [400, 'BlomusModernus'],
    [500, 'BlomusModernus'],
    [501, 'BlomusModernus-Bold'],
    [600, 'BlomusModernus-Bold'],
    [700, 'BlomusModernus-Bold'],
    [800, 'BlomusModernus-Bold'],
    [900, 'BlomusModernus-Bold'],
  ])('%d → %s', (weight, family) => {
    expect(displayFaceFamily(weight)).toBe(family);
    expect(displayFaceFamily(String(weight))).toBe(family);
  });

  it('reads React Native’s named weights, and unset as normal', () => {
    expect(numericFontWeight(undefined)).toBe(400);
    expect(numericFontWeight('normal')).toBe(400);
    expect(numericFontWeight('medium')).toBe(500);
    expect(numericFontWeight('semibold')).toBe(600);
    expect(numericFontWeight('bold')).toBe(700);
    expect(numericFontWeight('black')).toBe(900);
    expect(numericFontWeight('not-a-weight')).toBe(400);
  });

  it('matches the faces the web declares and the families native registers', () => {
    const webWeights = FONT_FACE_SOURCES.filter((face) => face.family === 'display').map(
      (face) => face.weight,
    );
    expect(webWeights).toEqual(['400', '700']);
    expect(Object.keys(FONT_ASSETS)).toEqual(
      expect.arrayContaining([DISPLAY_FACE_FAMILIES.regular, DISPLAY_FACE_FAMILIES.bold]),
    );
  });
});

describe('withDisplayFaceCut reads the style a native text node is finally given', () => {
  it('lets later entries win, through nested arrays and holes', () => {
    // react-native-css resolves `font-bold` to a number, ahead of Bloom's inline family.
    const resolvedClass = { fontWeight: 700 } as const;
    const style: StyleProp<TextStyle> = [
      resolvedClass,
      [null, { fontFamily: 'BlomusModernus' }, false, undefined],
    ];
    expect(withDisplayFaceCut(style)).toEqual([
      style,
      { fontFamily: 'BlomusModernus-Bold', fontWeight: '700' },
    ]);
    const lighter: StyleProp<TextStyle> = [style, { fontWeight: '400' }];
    expect(withDisplayFaceCut(lighter)).toBe(lighter);
  });

  it('returns any other style untouched, by identity', () => {
    for (const style of [
      undefined,
      { fontWeight: '700' as const },
      [{ fontFamily: 'Inter', fontWeight: '700' as const }],
      [{ fontFamily: 'BlomusModernus', fontWeight: '700' as const }, { fontFamily: 'System' }],
      [{ fontFamily: 'BlomusModernus' }, { fontWeight: '500' as const }],
    ])
      expect(withDisplayFaceCut(style)).toBe(style);
  });
});
