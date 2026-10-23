import { typographyDefaultsWhenNoClassName, mergeTypographyStyle } from '../defaults';

describe('typography defaults', () => {
  it('omits only the keys the className claims', () => {
    expect(
      typographyDefaultsWhenNoClassName('text-[56px] font-bold', {
        fontSize: 13,
        lineHeight: 20,
        fontWeight: '500',
        color: 'red',
      }),
    ).toEqual({ color: 'red' });
    expect(
      typographyDefaultsWhenNoClassName('text-primary', { fontSize: 13, color: 'red' }),
    ).toEqual({ fontSize: 13 });
    expect(
      typographyDefaultsWhenNoClassName('dark:text-white/80 leading-6', {
        fontSize: 13,
        lineHeight: 20,
        color: 'red',
      }),
    ).toEqual({ fontSize: 13 });
  });

  it('keeps colour and size under an unrelated className (the invisible dark-mode text bug)', () => {
    expect(
      typographyDefaultsWhenNoClassName('mt-2 text-center flex-1', {
        fontSize: 14,
        color: 'red',
      }),
    ).toEqual({ fontSize: 14, color: 'red' });
  });

  it('returns undefined when every default is claimed', () => {
    expect(
      typographyDefaultsWhenNoClassName('text-lg text-foreground', { fontSize: 13, color: 'red' }),
    ).toBeUndefined();
  });

  it('keeps inline defaults when className is absent', () => {
    expect(typographyDefaultsWhenNoClassName(undefined, { fontSize: 13, color: 'red' })).toEqual({
      fontSize: 13,
      color: 'red',
    });
  });

  it('keeps inline defaults when className is blank', () => {
    expect(typographyDefaultsWhenNoClassName('   ', { fontSize: 13 })).toEqual({ fontSize: 13 });
  });

  it('merges base font family after optional defaults', () => {
    expect(
      mergeTypographyStyle(
        'text-[56px]',
        { fontSize: 13, color: 'red' },
        { fontFamily: 'BlomusModernus' },
        { letterSpacing: -0.5 },
      ),
    ).toEqual([{ color: 'red' }, { fontFamily: 'BlomusModernus' }, { letterSpacing: -0.5 }]);
  });

  it('includes defaults when className is absent', () => {
    expect(
      mergeTypographyStyle(
        undefined,
        { fontSize: 13, color: 'red' },
        { fontFamily: 'BlomusModernus' },
        undefined,
      ),
    ).toEqual([{ fontSize: 13, color: 'red' }, { fontFamily: 'BlomusModernus' }, undefined]);
  });
});
