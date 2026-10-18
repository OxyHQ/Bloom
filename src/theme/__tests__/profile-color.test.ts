import { APP_COLOR_NAMES, resolveProfileColor } from '../color-presets';

describe('persisted profile colours', () => {
  it.each(APP_COLOR_NAMES)('preserves the %s preset recipe', (name) => {
    expect(resolveProfileColor(name)).toEqual({ colorPreset: name });
  });

  it('normalizes historical amber and casing', () => {
    expect(resolveProfileColor(' Amber ')).toEqual({ colorPreset: 'yellow' });
    expect(resolveProfileColor(' BLUE ')).toEqual({ colorPreset: 'blue' });
  });

  it.each([
    ['#AbC', '#aabbcc'],
    ['#123456', '#123456'],
    [' #1D9BF0 ', '#1d9bf0'],
    ['#000', '#000000'],
  ])('retains exact RGB identity for %s', (value, seed) => {
    expect(resolveProfileColor(value)).toEqual({ seed });
  });

  it.each([
    undefined,
    null,
    '',
    ' ',
    'unknown',
    'constructor',
    '__proto__',
    '#abcd',
    '#12345678',
    'rgb(1,2,3)',
  ])('inherits for unsupported value %s', (value) => {
    expect(resolveProfileColor(value)).toBeUndefined();
  });
});
