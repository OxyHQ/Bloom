import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

import { DATE_PICKER_MESSAGES } from '../date-picker/messages';
import { BLOOM_LANGUAGES, LocaleProvider, resolveBloomLanguage, useBloomLocale } from '../locale';
import { pickMessages } from '../locale/messages';
import { plural, pluralCategory } from '../locale/plural';

describe('resolveBloomLanguage', () => {
  it('reads the primary subtag of any BCP 47 spelling', () => {
    expect(resolveBloomLanguage('es-MX')).toBe('es');
    expect(resolveBloomLanguage('pt_BR')).toBe('pt');
    expect(resolveBloomLanguage('ca-ES-valencia')).toBe('ca');
    expect(resolveBloomLanguage('ZH-Hans-CN')).toBe('zh');
  });

  it('falls back to English for a language Bloom does not ship, and for none', () => {
    expect(resolveBloomLanguage('nl-NL')).toBe('en');
    expect(resolveBloomLanguage('')).toBe('en');
    expect(resolveBloomLanguage(undefined)).toBe('en');
  });
});

describe('pluralCategory (CLDR cardinals, whole numbers)', () => {
  it('English, Spanish, German: one only at 1', () => {
    expect([0, 1, 2, 21].map((n) => pluralCategory('en', n))).toEqual(['other', 'one', 'other', 'other']);
  });

  it('French and Portuguese: 0 and 1 are both one', () => {
    expect([0, 1, 2].map((n) => pluralCategory('fr', n))).toEqual(['one', 'one', 'other']);
  });

  it('Russian: one / few / many by the last digits', () => {
    expect([1, 2, 5, 11, 12, 21, 22, 25, 111].map((n) => pluralCategory('ru', n))).toEqual([
      'one', 'few', 'many', 'many', 'many', 'one', 'few', 'many', 'many',
    ]);
  });

  it('Arabic: all six categories', () => {
    expect([0, 1, 2, 3, 10, 11, 99, 100, 102].map((n) => pluralCategory('ar', n))).toEqual([
      'zero', 'one', 'two', 'few', 'few', 'many', 'many', 'other', 'other',
    ]);
  });

  it('Japanese and Chinese never inflect', () => {
    expect(pluralCategory('ja', 1)).toBe('other');
    expect(pluralCategory('zh', 2)).toBe('other');
  });

  it('falls back to other for a category the forms leave out', () => {
    expect(plural('ru', 3, { other: '{n} x' })).toBe('3 x');
  });
});

describe('message catalogs', () => {
  it('ships the date-picker family in every Bloom language, each translated', () => {
    const english = DATE_PICKER_MESSAGES.en;
    for (const language of BLOOM_LANGUAGES) {
      const messages = DATE_PICKER_MESSAGES[language];
      expect(Object.keys(messages).sort()).toEqual(Object.keys(english).sort());
      expect(Object.keys(messages.presets).sort()).toEqual(Object.keys(english.presets).sort());
      if (language !== 'en') {
        // A catalog pasted from English passes the type-check; it must not pass this.
        expect(messages.cancel).not.toBe(english.cancel);
        expect(messages.presets.today).not.toBe(english.presets.today);
        expect(messages.daysSelected(14)).not.toBe(english.daysSelected(14));
      }
    }
  });

  it('pluralises the day count per language', () => {
    const days = (language: string, n: number) => pickMessages(DATE_PICKER_MESSAGES, language).daysSelected(n);
    expect(days('en', 1)).toBe('1 day selected');
    expect(days('en', 14)).toBe('14 days selected');
    expect(days('es', 1)).toBe('1 día seleccionado');
    expect(days('ru', 22)).toBe('Выбрано 22 дня');
    expect(days('ru', 25)).toBe('Выбрано 25 дней');
    expect(days('ar', 2)).toBe('تم تحديد يومين');
  });
});

describe('useBloomLocale', () => {
  function Probe({ locale }: { locale?: string }) {
    return <Text testID="probe">{useBloomLocale(locale) ?? 'runtime'}</Text>;
  }

  it('prefers the prop, then the provider, then the runtime', () => {
    expect(render(<Probe />).getByTestId('probe')).toHaveTextContent('runtime');
    expect(
      render(
        <LocaleProvider locale="de-DE">
          <Probe />
        </LocaleProvider>,
      ).getByTestId('probe'),
    ).toHaveTextContent('de-DE');
    expect(
      render(
        <LocaleProvider locale="de-DE">
          <Probe locale="fr" />
        </LocaleProvider>,
      ).getByTestId('probe'),
    ).toHaveTextContent('fr');
  });
});
