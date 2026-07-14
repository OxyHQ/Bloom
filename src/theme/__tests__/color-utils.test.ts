import { parseRgb, withAlpha } from '../color-utils';

describe('color-utils', () => {
  describe('parseRgb', () => {
    it('parses canonical space-separated rgb', () => {
      expect(parseRgb('rgb(31 153 239)')).toEqual({ r: 31, g: 153, b: 239 });
    });
    it('parses legacy comma-separated rgb / rgba', () => {
      expect(parseRgb('rgb(31, 153, 239)')).toEqual({ r: 31, g: 153, b: 239 });
      expect(parseRgb('rgba(31, 153, 239, 0.5)')).toEqual({ r: 31, g: 153, b: 239 });
    });
    it('parses #rrggbb and #rgb hex', () => {
      expect(parseRgb('#1f99ef')).toEqual({ r: 31, g: 153, b: 239 });
      expect(parseRgb('#abc')).toEqual({ r: 170, g: 187, b: 204 });
    });
    it('returns null on unparseable input', () => {
      expect(parseRgb('hsl(277 50% 5%)')).toBeNull();
      expect(parseRgb('transparent')).toBeNull();
      expect(parseRgb('#12')).toBeNull();
      expect(parseRgb('')).toBeNull();
    });
  });

  describe('withAlpha', () => {
    it('composes canonical space-separated rgb at the given alpha', () => {
      expect(withAlpha('rgb(31 153 239)', 0.5)).toBe('rgba(31, 153, 239, 0.5)');
    });
    it('composes at alpha 0 (fully transparent, not the transparent keyword)', () => {
      expect(withAlpha('rgb(31 153 239)', 0)).toBe('rgba(31, 153, 239, 0)');
    });
    it('handles legacy comma rgb and hex input', () => {
      expect(withAlpha('rgb(31, 153, 239)', 0.5)).toBe('rgba(31, 153, 239, 0.5)');
      expect(withAlpha('#1f99ef', 1)).toBe('rgba(31, 153, 239, 1)');
    });
    it('returns the input unchanged when it cannot be parsed', () => {
      expect(withAlpha('hsl(277 50% 5%)', 0.5)).toBe('hsl(277 50% 5%)');
      expect(withAlpha('transparent', 0)).toBe('transparent');
    });
  });
});
