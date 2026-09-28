/**
 * The commerce families speak the app's language: under `LocaleProvider
 * locale="es"` each one draws or announces its own strings in Spanish, a
 * count takes the right plural form, and a caller's `labels` / `*Label` prop
 * still wins over the catalog. English output is pinned by each family's own
 * suite, which runs in the English runtime locale.
 */
import React from 'react';
import { render } from '@testing-library/react-native';

import { LocaleProvider } from '../locale';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { VendorCard } from '../vendor-card';
import { VENDOR_CARD_MESSAGES } from '../vendor-card/messages';

function renderIn(locale: string, ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      <LocaleProvider locale={locale}>{ui}</LocaleProvider>
    </BloomThemeProvider>,
  );
}

describe('vendor-card', () => {
  const vendor = {
    name: 'Fig & Ember',
    rating: 4.8,
    reviewCount: 214,
    deliveryTime: '25–35 min',
    availability: 'closed' as const,
    testID: 'v',
  };

  it('draws the status pill and composes its name in Spanish', () => {
    const { getByText, getByTestId } = renderIn('es', <VendorCard {...vendor} />);
    expect(getByText('Cerrado')).toBeTruthy();
    const name = getByTestId('v-link').props.accessibilityLabel as string;
    expect(name).toContain('Valoración: 4.8 de 5, 214 reseñas');
    expect(name).toContain('Tiempo de entrega 25–35 min');
  });

  it('pluralises the review count per language', () => {
    expect(VENDOR_CARD_MESSAGES.ru.rated('4.8', 1)).toBe('Оценка 4.8 из 5, 1 отзыв');
    expect(VENDOR_CARD_MESSAGES.ru.rated('4.8', 3)).toBe('Оценка 4.8 из 5, 3 отзыва');
    expect(VENDOR_CARD_MESSAGES.ru.rated('4.8', 25)).toBe('Оценка 4.8 из 5, 25 отзывов');
    expect(VENDOR_CARD_MESSAGES.en.rated('4.8', 1)).toBe('Rated 4.8 out of 5, 1 review');
  });

  it('lets availabilityLabel and factLabels win over the catalog', () => {
    const { getByText, getByTestId } = renderIn(
      'es',
      <VendorCard {...vendor} availabilityLabel="Vuelve pronto" factLabels={{ deliveryTime: 'Llega en' }} />,
    );
    expect(getByText('Vuelve pronto')).toBeTruthy();
    expect(getByTestId('v-link').props.accessibilityLabel).toContain('Llega en 25–35 min');
  });
});
