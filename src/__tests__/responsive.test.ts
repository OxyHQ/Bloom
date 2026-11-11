import { BREAKPOINTS } from '../styles/breakpoints';
import { resolveResponsive, responsiveThresholds } from '../styles/responsive';

describe('resolveResponsive', () => {
  it('returns a plain value at every width', () => {
    expect(resolveResponsive('row', 0)).toBe('row');
    expect(resolveResponsive(3, 5000)).toBe(3);
    expect(resolveResponsive(false, 1)).toBe(false);
  });

  it('leaves an absent value absent', () => {
    expect(resolveResponsive<'row'>(undefined, 800)).toBeUndefined();
  });

  it('applies base below sm and each tier from its own min-width', () => {
    const value = { base: 'a', md: 'b', xl: 'c' } as const;
    expect(resolveResponsive(value, 0)).toBe('a');
    expect(resolveResponsive(value, BREAKPOINTS.md - 1)).toBe('a');
    expect(resolveResponsive(value, BREAKPOINTS.md)).toBe('b');
    expect(resolveResponsive(value, BREAKPOINTS.xl - 1)).toBe('b');
    expect(resolveResponsive(value, BREAKPOINTS.xl)).toBe('c');
    expect(resolveResponsive(value, 9999)).toBe('c');
  });

  it('lets the widest reached tier win whatever order the keys were written in', () => {
    const value = { xl: 'wide', base: 'narrow', sm: 'small' } as const;
    expect(resolveResponsive(value, BREAKPOINTS.xl)).toBe('wide');
    expect(resolveResponsive(value, BREAKPOINTS.sm)).toBe('small');
  });

  it('is undefined below the first named tier when base is omitted', () => {
    expect(resolveResponsive({ lg: 'x' } as const, BREAKPOINTS.lg - 1)).toBeUndefined();
  });

  it('treats a falsy tier value as set, not as missing', () => {
    expect(resolveResponsive({ base: true, md: false }, BREAKPOINTS.md)).toBe(false);
  });
});

describe('responsiveThresholds', () => {
  it('is empty for a plain or absent value', () => {
    expect(responsiveThresholds('row')).toEqual([]);
    expect(responsiveThresholds(undefined)).toEqual([]);
    expect(responsiveThresholds({ base: 'row' })).toEqual([]);
  });

  it('lists the min-width of every named tier, narrowest first', () => {
    expect(responsiveThresholds({ base: 'a', xl: 'b', md: 'c' })).toEqual([
      BREAKPOINTS.md,
      BREAKPOINTS.xl,
    ]);
  });
});
