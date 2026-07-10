import {
  typographyDefaultsWhenNoClassName,
  mergeTypographyStyle,
} from '../defaults';

describe('typography defaults', () => {
  it('omits inline defaults when className is present', () => {
    expect(
      typographyDefaultsWhenNoClassName('text-[56px] font-bold', {
        fontSize: 13,
        color: 'red',
      }),
    ).toBeUndefined();
  });

  it('keeps inline defaults when className is absent', () => {
    expect(
      typographyDefaultsWhenNoClassName(undefined, { fontSize: 13, color: 'red' }),
    ).toEqual({ fontSize: 13, color: 'red' });
  });

  it('keeps inline defaults when className is blank', () => {
    expect(
      typographyDefaultsWhenNoClassName('   ', { fontSize: 13 }),
    ).toEqual({ fontSize: 13 });
  });

  it('merges base font family after optional defaults', () => {
    expect(
      mergeTypographyStyle(
        'text-[56px]',
        { fontSize: 13, color: 'red' },
        { fontFamily: 'BlomusModernus' },
        { letterSpacing: -0.5 },
      ),
    ).toEqual([
      undefined,
      { fontFamily: 'BlomusModernus' },
      { letterSpacing: -0.5 },
    ]);
  });

  it('includes defaults when className is absent', () => {
    expect(
      mergeTypographyStyle(
        undefined,
        { fontSize: 13, color: 'red' },
        { fontFamily: 'BlomusModernus' },
        undefined,
      ),
    ).toEqual([
      { fontSize: 13, color: 'red' },
      { fontFamily: 'BlomusModernus' },
      undefined,
    ]);
  });
});
