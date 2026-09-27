import React from 'react';
import { render } from '@testing-library/react-native';

import { Announcement } from '../announcement';
import { COMMON_MESSAGES } from '../locale/common-messages';
import { BLOOM_LANGUAGES, LocaleProvider } from '../locale';
import { PageHeader } from '../page-header';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

function renderIn(locale: string | undefined, ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      <LocaleProvider locale={locale}>{ui}</LocaleProvider>
    </BloomThemeProvider>,
  );
}

describe('COMMON_MESSAGES', () => {
  it('ships every common word in every Bloom language, each translated', () => {
    const english = COMMON_MESSAGES.en;
    for (const language of BLOOM_LANGUAGES) {
      const messages = COMMON_MESSAGES[language];
      expect(Object.keys(messages).sort()).toEqual(Object.keys(english).sort());
      if (language !== 'en') {
        // A catalog pasted from English passes the type-check; it must not pass this.
        for (const key of ['close', 'loading', 'back', 'cancel', 'search'] as const) {
          expect(messages[key]).not.toBe(english[key]);
        }
        expect(messages.stepOf(2, 5)).not.toBe(english.stepOf(2, 5));
      }
    }
  });

  it('says the step and the total in the sentence', () => {
    expect(COMMON_MESSAGES.en.stepOf(2, 5)).toBe('Step 2 of 5');
    expect(COMMON_MESSAGES.es.stepOf(2, 5)).toBe('Paso 2 de 5');
  });
});

describe('families speak the common words in the locale', () => {
  it('names a PageHeader back button from the locale, and a backLabel still wins', () => {
    const onBack = jest.fn();
    expect(
      renderIn('es', <PageHeader presentation="bar" title="Bandeja" onBack={onBack} testID="h" />).getByLabelText('Atrás'),
    ).toBeTruthy();
    expect(
      renderIn('de', <PageHeader presentation="bar" title="Inbox" onBack={onBack} testID="h" />).getByLabelText('Zurück'),
    ).toBeTruthy();
    expect(
      renderIn('es', <PageHeader presentation="bar" title="Bandeja" onBack={onBack} backLabel="Volver al buzón" testID="h" />)
        .getByLabelText('Volver al buzón'),
    ).toBeTruthy();
  });

  it('keeps English with no locale anywhere (the runtime here is English)', () => {
    expect(
      renderIn(undefined, <PageHeader presentation="bar" title="Inbox" onBack={() => {}} testID="h" />).getByLabelText('Back'),
    ).toBeTruthy();
  });

  it("names an Announcement's close button from the locale", () => {
    const { getByLabelText } = renderIn(
      'fr',
      <Announcement title="Passez à Pro" dismissible onClose={() => {}} testID="card" />,
    );
    expect(getByLabelText('Ignorer')).toBeTruthy();
  });
});
