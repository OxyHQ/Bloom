import { parseRgb, parseRgba, withAlpha } from '../color-utils';

describe('color-utils', () => {
  describe('parseRgba', () => {
    // The alpha is what half the palette carries: the `*Subtle` tints resolve to
    // `rgba(r, g, b, 0.13)` and every frosted surface is a low-alpha tint, so a
    // resolver compositing onto one has to know it is compositing onto something
    // translucent. Dropping it turns a tint into an opaque fill — a change that
    // renders perfectly and is wrong.
    it('reads the alpha a colour was written with', () => {
      expect(parseRgba('rgba(213, 86, 255, 0.13)')).toEqual({ r: 213, g: 86, b: 255, a: 0.13 });
      expect(parseRgba('rgb(31 153 239 / 0.5)')).toEqual({ r: 31, g: 153, b: 239, a: 0.5 });
      expect(parseRgba('rgb(31 153 239 / 50%)')).toEqual({ r: 31, g: 153, b: 239, a: 0.5 });
    });
    it('reads a colour with no alpha component as fully opaque', () => {
      expect(parseRgba('rgb(31 153 239)')).toEqual({ r: 31, g: 153, b: 239, a: 1 });
      expect(parseRgba('#1f99ef')).toEqual({ r: 31, g: 153, b: 239, a: 1 });
    });
    it('refuses a colour whose alpha it cannot read, rather than guessing 1', () => {
      // Guessing would silently flatten whatever it was actually asked about.
      expect(parseRgba('rgb(31 153 239 / var(--a))')).toBeNull();
    });
  });
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
    it('discards the alpha rather than reporting it', () => {
      // The distinction from `parseRgba`, stated: a caller reaching for this one
      // is asking about the channels only.
      expect(parseRgb('rgba(31, 153, 239, 0.5)')).toEqual({ r: 31, g: 153, b: 239 });
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
