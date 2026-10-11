/**
 * The commerce families speak the app's language: under `LocaleProvider
 * locale="es"` each one draws or announces its own strings in Spanish, a
 * count takes the right plural form, and a caller's `labels` / `*Label` prop
 * still wins over the catalog. English output is pinned by each family's own
 * suite, which runs in the English runtime locale.
 */
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { CarrierQuoteList } from '../carrier-quote';
import { CARRIER_QUOTE_MESSAGES } from '../carrier-quote/messages';
import { ContributionsCard, RevenueChartCard, StepsCard } from '../chart-cards';
import { contributionLabel } from '../chart-cards/contributions-cells';
import { CHART_CARDS_MESSAGES } from '../chart-cards/messages';
import { CheckoutConfirm } from '../checkout-summary';
import { CHECKOUT_SUMMARY_MESSAGES } from '../checkout-summary/messages';
import { JobBoard } from '../job-board';
import { JOB_BOARD_MESSAGES } from '../job-board/messages';
import { ListingCard } from '../listing-card';
import { LocaleProvider } from '../locale';
import { OfferingBadge } from '../offering-badge';
import { OFFERING_BADGE_MESSAGES } from '../offering-badge/messages';
import { PaymentStatusBar } from '../payment-status';
import { PAYMENT_STATUS_MESSAGES } from '../payment-status/messages';
import { VEHICLE_PICKER_MESSAGES } from '../vehicle-picker/messages';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { VendorCard } from '../vendor-card';
import { VENDOR_CARD_MESSAGES } from '../vendor-card/messages';
import { messagesIn } from './support/messages-in';

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
    expect(messagesIn(VENDOR_CARD_MESSAGES, 'ru').rated('4.8', 1)).toBe('Оценка 4.8 из 5, 1 отзыв');
    expect(messagesIn(VENDOR_CARD_MESSAGES, 'ru').rated('4.8', 3)).toBe(
      'Оценка 4.8 из 5, 3 отзыва',
    );
    expect(messagesIn(VENDOR_CARD_MESSAGES, 'ru').rated('4.8', 25)).toBe(
      'Оценка 4.8 из 5, 25 отзывов',
    );
    expect(VENDOR_CARD_MESSAGES.en.rated('4.8', 1)).toBe('Rated 4.8 out of 5, 1 review');
  });

  it('lets availabilityLabel and factLabels win over the catalog', () => {
    const { getByText, getByTestId } = renderIn(
      'es',
      <VendorCard
        {...vendor}
        availabilityLabel="Vuelve pronto"
        factLabels={{ deliveryTime: 'Llega en' }}
      />,
    );
    expect(getByText('Vuelve pronto')).toBeTruthy();
    expect(getByTestId('v-link').props.accessibilityLabel).toContain('Llega en 25–35 min');
  });
});

describe('payment-status, checkout-summary, offering-badge', () => {
  it('draw their words in the locale', () => {
    expect(
      renderIn('es', <PaymentStatusBar state="failed" />).getByText(
        messagesIn(PAYMENT_STATUS_MESSAGES, 'es').states.failed,
      ),
    ).toBeTruthy();
    expect(
      renderIn('de', <PaymentStatusBar state="paid" />).getByText(
        messagesIn(PAYMENT_STATUS_MESSAGES, 'de').states.paid,
      ),
    ).toBeTruthy();
    expect(
      renderIn('es', <CheckoutConfirm amount="49,62 €" onConfirm={() => {}} />).getAllByText(
        new RegExp(messagesIn(CHECKOUT_SUMMARY_MESSAGES, 'es').placeOrder),
      ).length,
    ).toBeGreaterThan(0);
    expect(
      renderIn('fr', <OfferingBadge offering="sale" />).getByText(
        messagesIn(OFFERING_BADGE_MESSAGES, 'fr').offerings.sale,
      ),
    ).toBeTruthy();
  });
});

describe('listing-card offerings (review of #226)', () => {
  it("names the card's offerings in the locale, not English", () => {
    const { getByLabelText } = renderIn(
      'es',
      <ListingCard
        title="Alvora"
        photos={['https://example.com/a.jpg']}
        offerings={['long_term_rent']}
        onPress={() => {}}
      />,
    );
    expect(
      getByLabelText(
        new RegExp(`Alvora, ${messagesIn(OFFERING_BADGE_MESSAGES, 'es').offerings.long_term_rent}`),
      ),
    ).toBeTruthy();
  });
});

describe('job-board and carrier-quote', () => {
  it('draw their empty states and names in the locale', () => {
    const board = renderIn('es', <JobBoard jobs={[]} />);
    expect(board.getByText(messagesIn(JOB_BOARD_MESSAGES, 'es').emptyTitle)).toBeTruthy();
    expect(board.getByText(messagesIn(JOB_BOARD_MESSAGES, 'es').emptyDescription)).toBeTruthy();
    const quotes = renderIn('ru', <CarrierQuoteList quotes={[]} />);
    expect(quotes.getByText(messagesIn(CARRIER_QUOTE_MESSAGES, 'ru').emptyTitle)).toBeTruthy();
  });

  it('pluralise their counts per language, and join phrases without an English connector', () => {
    expect(messagesIn(JOB_BOARD_MESSAGES, 'ru').labels.count(3)).toBe('3 заказа');
    expect(messagesIn(JOB_BOARD_MESSAGES, 'ru').labels.count(5)).toBe('5 заказов');
    expect(messagesIn(CARRIER_QUOTE_MESSAGES, 'ar').labels.count(2)).toBe('عرضان');
    expect(messagesIn(JOB_BOARD_MESSAGES, 'es').route('Recogida', 'Entrega')).toBe(
      'Recogida y Entrega',
    );
    expect(messagesIn(CARRIER_QUOTE_MESSAGES, 'ja').priceDetailsFor('Rápido')).toBe(
      'Rápidoの料金の内訳',
    );
  });

  it("draws the board's default filter bands and vehicle names in the locale (review of #235)", () => {
    const board = renderIn('es', <JobBoard jobs={[]} defaultFiltersOpen />);
    expect(
      board.getAllByText(messagesIn(JOB_BOARD_MESSAGES, 'es').bands.anyDistance).length,
    ).toBeGreaterThan(0);
    expect(
      board.getAllByText(messagesIn(JOB_BOARD_MESSAGES, 'es').bands.underKm(10)).length,
    ).toBeGreaterThan(0);
    expect(
      board.getAllByText(messagesIn(JOB_BOARD_MESSAGES, 'es').bands.nextHours(4)).length,
    ).toBeGreaterThan(0);
    expect(
      board.getAllByText(messagesIn(VEHICLE_PICKER_MESSAGES, 'es').vehicles.van.label).length,
    ).toBeGreaterThan(0);
    expect(board.queryByText('Any distance')).toBeNull();
    expect(messagesIn(JOB_BOARD_MESSAGES, 'ru').bands.nextHours(4)).toBe('В ближайшие 4 часа');
  });

  it('keep a caller empty title over the catalog', () => {
    expect(
      renderIn('es', <JobBoard jobs={[]} emptyTitle="Nada por aquí" />).getByText('Nada por aquí'),
    ).toBeTruthy();
  });
});

describe('chart-cards', () => {
  const REVENUE = [
    { label: 'Jan', current: 9840, previous: 8210 },
    { label: 'Feb', current: 10120, previous: 8460 },
  ];

  /** The plot draws its surface once it has a size. */
  function surfaceName(locale: string | undefined) {
    const screen = renderIn(locale as string, <RevenueChartCard testID="rev" data={REVENUE} />);
    fireEvent(screen.getByTestId('rev-plot'), 'layout', {
      nativeEvent: { layout: { width: 400, height: 200, x: 0, y: 0 } },
    });
    return {
      screen,
      name: screen.getByTestId('rev-plot-surface').props.accessibilityLabel as string,
    };
  }

  it('titles and announces a chart in the locale', () => {
    const { screen, name } = surfaceName('es');
    expect(screen.getByText(messagesIn(CHART_CARDS_MESSAGES, 'es').titles.revenue)).toBeTruthy();
    expect(name).toBe('Gráfico de ingresos: este año frente al año pasado');
  });

  it('keeps English byte-identical with no locale', () => {
    expect(surfaceName(undefined).name).toBe('Revenue chart: this year against last year');
  });

  it("pluralises contributions and dates the grid the locale's way", () => {
    expect(
      contributionLabel({ count: 1, date: '26 abr' }, messagesIn(CHART_CARDS_MESSAGES, 'es')),
    ).toBe('1 contribución el 26 abr');
    expect(contributionLabel({ count: 0 }, messagesIn(CHART_CARDS_MESSAGES, 'es'))).toBe(
      'Sin contribuciones',
    );
    expect(messagesIn(CHART_CARDS_MESSAGES, 'ru').contributions(22, undefined)).toBe('22 вклада');
    expect(messagesIn(CHART_CARDS_MESSAGES, 'tr').ringItem('Hareket', '300', 60)).toBe(
      'Hareket 300, hedefin %60 kadarı',
    );
  });

  it("draws the locale's month names when the caller passes none", () => {
    const { getByText } = renderIn('es', <ContributionsCard cells={[]} />);
    expect(getByText('ene')).toBeTruthy();
  });

  it('names the contribution periods and a selected month in the locale (review of #235)', () => {
    const card = renderIn('es', <ContributionsCard cells={[]} />);
    expect(
      card.getAllByText(messagesIn(CHART_CARDS_MESSAGES, 'es').monthly).length,
    ).toBeGreaterThan(0);
    expect(card.queryByText('Monthly')).toBeNull();
    const selected = renderIn('es', <RevenueChartCard data={REVENUE} activeIndex={0} />);
    expect(selected.getAllByText('enero').length).toBeGreaterThan(0);
    expect(
      renderIn(
        undefined as unknown as string,
        <RevenueChartCard data={REVENUE} activeIndex={0} />,
      ).getAllByText('January').length,
    ).toBeGreaterThan(0);
  });

  it('lets a caller title win', () => {
    expect(
      renderIn('es', <StepsCard data={[]} title="Mis pasos" />).getByText('Mis pasos'),
    ).toBeTruthy();
  });
});
