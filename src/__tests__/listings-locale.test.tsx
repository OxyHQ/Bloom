/**
 * The listings group — listing-actions, listing-editor, property-insights,
 * stay-search, stay-filters, home-search, listing-details, tenancy,
 * listing-card, booking, eviction — speaks the locale from `LocaleProvider`,
 * pluralises per language, and still lets a caller's `labels`/`*Label` win.
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import { BookingBar, BookingCard, PriceBreakdown, TripCard } from '../booking';
import { BOOKING_MESSAGES } from '../booking/messages';
import { priceAccessibilityName } from '../booking/shared';
import { EvictionReportCard, EvictionTimeline } from '../eviction';
import { EVICTION_MESSAGES } from '../eviction/messages';
import {
  BudgetPicker,
  SavedSearchCard,
  SaveSearchButton,
  SearchModeTabs,
  homeSearchSegments,
  HOME_SEARCH_SEGMENTS,
} from '../home-search';
import { HOME_SEARCH_MESSAGES } from '../home-search/messages';
import {
  ApplicationChecklist,
  MortgageCalculator,
  RentalActionCard,
  SaleActionCard,
  ViewingScheduler,
} from '../listing-actions';
import { LISTING_ACTIONS_MESSAGES } from '../listing-actions/messages';
import { FavoriteButton, ListingCard } from '../listing-card';
import { LISTING_CARD_MESSAGES } from '../listing-card/messages';
import { ContactCard, AmenityList, ReviewCard, ReviewSummary } from '../listing-details';
import { LISTING_DETAILS_MESSAGES } from '../listing-details/messages';
import {
  AddressPrecisionPicker,
  ListingPreviewPane,
  ListingQualityMeter,
  OfferingEditor,
  PropertyTypeSelector,
} from '../listing-editor';
import { LISTING_EDITOR_MESSAGES } from '../listing-editor/messages';
import { LocaleProvider } from '../locale';
import { EnergyBadge, NeighbourhoodScores, PriceEstimate } from '../property-insights';
import { PROPERTY_INSIGHTS_MESSAGES } from '../property-insights/messages';
import {
  EnergyRatingFilter,
  FeatureFilter,
  FilterFooter,
  FilterTriggerButton,
  PropertyTypeFilter,
} from '../stay-filters';
import { STAY_FILTERS_MESSAGES } from '../stay-filters/messages';
import { DateFlexibilityChips, GuestPicker, StaySearchCompact } from '../stay-search';
import { STAY_SEARCH_MESSAGES } from '../stay-search/messages';
import { DocumentList, MaintenanceRequestCard, RentPaymentList, TenancyTimeline } from '../tenancy';
import { TENANCY_MESSAGES } from '../tenancy/messages';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

function renderIn(locale: string | undefined, ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      <LocaleProvider locale={locale}>{ui}</LocaleProvider>
    </BloomThemeProvider>,
  );
}

describe('listing-actions and booking', () => {
  const DAYS = [{ value: '2026-10-01', weekday: 'jue', day: '1' }];

  describe('listing-actions speaks the locale', () => {
    it('draws a Spanish viewing scheduler, and its own labels still win', () => {
      const es = renderIn('es', <ViewingScheduler days={DAYS} slots={[]} mode="in-person" />);
      expect(es.getByText('Programar una visita')).toBeTruthy();
      expect(es.getByText('No quedan horas disponibles este día')).toBeTruthy();
      expect(es.getByText('Solicitar visita')).toBeTruthy();
      expect(es.getByText('Videollamada')).toBeTruthy();

      const own = renderIn('es', <ViewingScheduler days={DAYS} slots={[]} title="Ver el piso" submitLabel="Pedir cita" />);
      expect(own.getByText('Ver el piso')).toBeTruthy();
      expect(own.getByText('Pedir cita')).toBeTruthy();
      expect(own.queryByText('Programar una visita')).toBeNull();
    });

    it('keeps a null title hidden', () => {
      const es = renderIn('es', <ViewingScheduler title={null} days={DAYS} slots={[]} />);
      expect(es.queryByText('Programar una visita')).toBeNull();
    });

    it('localises the rental and sale cards, statuses included', () => {
      const rental = renderIn('es', <RentalActionCard price="1.250 €" status="reserved" onApply={() => {}} />);
      expect(rental.getByText('Solicitar una visita')).toBeTruthy();
      expect(rental.getByText('Reservado')).toBeTruthy();
      expect(rental.getByText(LISTING_ACTIONS_MESSAGES.es.rentalStatusMessage.reserved)).toBeTruthy();
      expect(rental.getByLabelText('1.250 € por mes')).toBeTruthy();

      const sale = renderIn('de', <SaleActionCard price="385.000 €" status="sold" statusLabel="Weg" />);
      expect(sale.getByText('Makler kontaktieren')).toBeTruthy();
      expect(sale.getByText('Weg')).toBeTruthy();
    });

    it('counts an application in the language, and names each action in it', () => {
      const items = [
        { key: 'id', title: 'DNI', status: 'verified' as const },
        { key: 'pay', title: 'Nóminas', status: 'missing' as const },
      ];
      const es = renderIn('es', <ApplicationChecklist items={items} />);
      expect(es.getByText('Tu solicitud')).toBeTruthy();
      expect(es.getByText('1 de 2 listos', { includeHiddenElements: true })).toBeTruthy();
      expect(es.getByText('Falta')).toBeTruthy();
      expect(es.getByLabelText('Subir: Nóminas')).toBeTruthy();
    });

    it('localises the mortgage calculator, with a plural term name, and labels still win', () => {
      const ru = renderIn('ru', <MortgageCalculator termOptions={[1, 3, 25]} disclaimer={null} />);
      expect(ru.getByText('Ипотечный калькулятор')).toBeTruthy();
      expect(ru.getByLabelText('1 год')).toBeTruthy();
      expect(ru.getByLabelText('3 года')).toBeTruthy();
      expect(ru.getByLabelText('25 лет')).toBeTruthy();

      const own = renderIn('es', <MortgageCalculator labels={{ title: 'Mi hipoteca' }} disclaimer={null} />);
      expect(own.getByText('Mi hipoteca')).toBeTruthy();
      expect(own.getByText('Cuota mensual')).toBeTruthy();
    });

    it('pluralises the term in Arabic', () => {
      const ar = LISTING_ACTIONS_MESSAGES.ar.termYears;
      expect([ar(1), ar(2), ar(5), ar(15)]).toEqual(['سنة واحدة', 'سنتان', '5 سنوات', '15 سنة']);
    });
  });

  describe('booking speaks the locale', () => {
    it('draws a Spanish booking card, and its own labels still win', () => {
      const es = renderIn('es', <BookingCard price="180 €" guests="1 huésped" />);
      expect(es.getByText('Llegada')).toBeTruthy();
      expect(es.getByText('Comprobar disponibilidad')).toBeTruthy();

      const dated = renderIn('es', <BookingCard price="180 €" checkIn="1/10" checkOut="5/10" guests="1 huésped" checkInLabel="Entrada" />);
      expect(dated.getByText('Reservar')).toBeTruthy();
      expect(dated.getByText('Todavía no se te cobrará nada')).toBeTruthy();
      expect(dated.getByText('Entrada')).toBeTruthy();
    });

    it('localises the bar, the total, trip statuses and the spoken price', () => {
      expect(renderIn('fr', <BookingBar price="180 €" priceUnit="nuit" />).getByText('Réserver')).toBeTruthy();
      expect(renderIn('fr', <BookingBar price="180 €" priceUnit="nuit" />).getByLabelText('180 € par nuit')).toBeTruthy();
      expect(renderIn('it', <PriceBreakdown rows={[]} total="900 €" />).getByText('Totale')).toBeTruthy();
      expect(renderIn('ja', <TripCard title="海辺の家" status="confirmed" />).getByText('確定')).toBeTruthy();
      expect(renderIn('ja', <TripCard title="海辺の家" status="confirmed" statusLabel="OK" />).getByText('OK')).toBeTruthy();
    });

    it('places the unit and the earlier price in the language’s own order', () => {
      expect(priceAccessibilityName('$162', 'night', '$180')).toBe('$162 per night, originally $180');
      expect(priceAccessibilityName('₺900', 'gece', '₺1000', BOOKING_MESSAGES.tr)).toBe('gece başına ₺900, önceki fiyat ₺1000');
      expect(BOOKING_MESSAGES.es.priceName('180 €', 'noche')).toBe('180 € por noche');
    });
  });
});

describe('listing-editor, tenancy and eviction', () => {
  const noop = () => {};

  describe('listing-editor speaks the locale', () => {
    it('draws OfferingEditor in Spanish, with plural month chips', () => {
      const screen = renderIn(
        'es',
        <OfferingEditor value={{ kinds: ['rent'] }} onValueChange={noop} depositOptions={[0, 1, 2]} />,
      );
      expect(screen.getByText('En alquiler')).toBeTruthy();
      expect(screen.getByText('Alquiler mensual')).toBeTruthy();
      expect(screen.getByText('Ninguna')).toBeTruthy();
      expect(screen.getByText('1 mes')).toBeTruthy();
      expect(screen.getByText('2 meses')).toBeTruthy();
      expect(screen.getByLabelText('¿Cómo se ofrece la vivienda?')).toBeTruthy();
    });

    it('lets OfferingEditor labels win over the catalog', () => {
      const screen = renderIn(
        'es',
        <OfferingEditor value={{ kinds: ['rent'] }} onValueChange={noop} labels={{ monthlyRent: 'Renta' }} />,
      );
      expect(screen.getByText('Renta')).toBeTruthy();
      expect(screen.queryByText('Alquiler mensual')).toBeNull();
    });

    it('names the quality meter, the pickers and the preview in the locale', () => {
      const quality = renderIn('de', <ListingQualityMeter items={[{ key: 'p', label: 'Fotos', done: false }]} />);
      expect(quality.getByText('Qualität des Inserats')).toBeTruthy();
      expect(quality.getByText('Ausbaufähig')).toBeTruthy();
      expect(quality.getByLabelText('Fotos, Offen')).toBeTruthy();

      expect(renderIn('es', <PropertyTypeSelector value={null} onValueChange={noop} />).getByLabelText('Tipo de inmueble')).toBeTruthy();

      const precision = renderIn('es', <AddressPrecisionPicker value="street" onValueChange={noop} />);
      expect(precision.getByText('Solo la calle')).toBeTruthy();
      expect(precision.getByLabelText('Precisión de la dirección')).toBeTruthy();
      // `null` still hides the footnote.
      expect(
        renderIn('es', <AddressPrecisionPicker value="street" onValueChange={noop} footnote={null} />).queryByText(
          LISTING_EDITOR_MESSAGES.es.addressPrecisionFootnote,
        ),
      ).toBeNull();

      const preview = renderIn(
        'es',
        <ListingPreviewPane listing={{ title: 'Ático', photos: [], reviewCount: 3 }} defaultMode="page" />,
      );
      expect(preview.getByText('Vista previa')).toBeTruthy();
      expect(preview.getByText('Página')).toBeTruthy();
    });

    it('pluralises the review count per language, pre-formatted counts included', () => {
      const { reviews } = LISTING_EDITOR_MESSAGES.ru;
      expect(reviews(1, '1')).toBe('1 отзыв');
      expect(reviews(3, '3')).toBe('3 отзыва');
      expect(reviews(12, '12')).toBe('12 отзывов');
      expect(LISTING_EDITOR_MESSAGES.en.reviews(1, '1')).toBe('1 review');
      expect(LISTING_EDITOR_MESSAGES.en.reviews(100, '1.2k')).toBe('1.2k reviews');
    });
  });

  describe('tenancy speaks the locale', () => {
    it('pluralises the maintenance comment count and names the photos', () => {
      const screen = renderIn(
        'ru',
        <MaintenanceRequestCard
          title="Течёт кран"
          category="plumbing"
          stage="reported"
          commentCount={5}
          photos={[{ source: 'https://example.com/a.jpg' }]}
        />,
      );
      expect(screen.getByText('5 комментариев')).toBeTruthy();
      expect(screen.getByText('Сантехника')).toBeTruthy();
      expect(screen.getByLabelText('Фото 1 из 1')).toBeTruthy();
      expect(TENANCY_MESSAGES.ru.comments(1)).toBe('1 комментарий');
      expect(TENANCY_MESSAGES.ru.comments(3)).toBe('3 комментария');
    });

    it('draws the rent and document lists in Spanish, and a caller label still wins', () => {
      const payments = renderIn(
        'es',
        <RentPaymentList
          layout="narrow"
          paidThisYear="3.450 €"
          payments={[{ id: 'a', month: 'marzo de 2026', dueDate: '1 mar', amount: '1.150 €', status: 'paid', onDownloadReceipt: noop }]}
        />,
      );
      expect(payments.getByText('Pagado este año')).toBeTruthy();
      expect(payments.getByText('Pagado')).toBeTruthy();
      expect(payments.getByText('Vence el 1 mar')).toBeTruthy();
      expect(payments.getByLabelText('Descargar recibo de marzo de 2026')).toBeTruthy();

      const docs = renderIn(
        'es',
        <DocumentList layout="narrow" documents={[{ id: 'd', name: 'Contrato.pdf', status: 'pending', onSign: noop }]} />,
      );
      expect(docs.getByText('Firmar')).toBeTruthy();
      expect(docs.getByLabelText('Firmar Contrato.pdf')).toBeTruthy();
      expect(docs.getByText('Pendiente de firma')).toBeTruthy();
      expect(renderIn('es', <DocumentList documents={[]} />).getByText('No hay documentos')).toBeTruthy();
      expect(renderIn('es', <DocumentList documents={[]} emptyLabel="Nada" />).getByText('Nada')).toBeTruthy();
    });

    it('names timeline markers by state in the locale', () => {
      const screen = renderIn('fr', <TenancyTimeline events={[{ title: 'Signalé', state: 'current' }]} />);
      expect(screen.getByLabelText('En cours')).toBeTruthy();
    });
  });

  describe('eviction speaks the locale', () => {
    it('draws the report card in Spanish, and a caller label still wins', () => {
      const screen = renderIn(
        'es',
        <EvictionReportCard date="23 sept" area="Lavapiés" status="postponed" verified onAttendingChange={noop} onShare={noop} />,
      );
      expect(screen.getByText('Aplazado')).toBeTruthy();
      expect(screen.getByText('Estaré allí')).toBeTruthy();
      expect(screen.getByText('Compartir')).toBeTruthy();
      expect(screen.getByLabelText('Verificado por la comunidad')).toBeTruthy();

      const own = renderIn(
        'es',
        <EvictionReportCard date="23 sept" area="Lavapiés" status="postponed" onShare={noop} shareLabel="Difundir" />,
      );
      expect(own.getByText('Difundir')).toBeTruthy();
    });

    it('names the case history and its sources in the locale', () => {
      const screen = renderIn(
        'de',
        <EvictionTimeline events={[{ id: '1', kind: 'published', title: 'Veröffentlicht', date: '2. Sep.', source: 'Nachbarschaft' }]} />,
      );
      expect(screen.getByLabelText('Fallverlauf')).toBeTruthy();
      expect(screen.getByText('2. Sep. · Quelle: Nachbarschaft')).toBeTruthy();
      expect(EVICTION_MESSAGES.en.source('Court')).toBe('Source: Court');
    });
  });
});

describe('property-insights, listing-details and listing-card', () => {
  describe('property-insights speaks the locale', () => {
    it('names and labels an EnergyBadge in Spanish, and a label prop still wins', () => {
      const es = renderIn('es', <EnergyBadge rating="C" />);
      expect(es.getByText('Energía')).toBeTruthy();
      expect(es.getByLabelText('Calificación energética C')).toBeTruthy();
      expect(renderIn('es', <EnergyBadge pending />).getByLabelText('Calificación energética pendiente')).toBeTruthy();
      expect(renderIn('es', <EnergyBadge rating="C" label="Eficiencia" />).getByText('Eficiencia')).toBeTruthy();
    });

    it('draws PriceEstimate words and the comparables plural in Spanish', () => {
      const base = { low: 360000, high: 395000, asking: 385000, confidence: 'high' as const, expanded: true, reasons: ['Sol'] };
      const one = renderIn('es', <PriceEstimate {...base} comparables={1} />);
      expect(one.getByText('Precio estimado')).toBeTruthy();
      expect(one.getByText('Precio justo')).toBeTruthy();
      expect(one.getByText('Basado en 1 vivienda comparable')).toBeTruthy();
      expect(renderIn('es', <PriceEstimate {...base} comparables={12} />).getByText('Basado en 12 viviendas comparables')).toBeTruthy();
      expect(renderIn('es', <PriceEstimate {...base} comparables={12} title="Valor" />).getByText('Valor')).toBeTruthy();
    });

    it('pluralises the comparables line by each language’s rules', () => {
      const { ru, ar, en } = PROPERTY_INSIGHTS_MESSAGES;
      expect(en.comparables(1)).toBe('Based on 1 comparable home');
      expect(en.comparables(12)).toBe('Based on 12 comparable homes');
      expect(ru.comparables(21)).toBe('На основе 21 похожего объекта');
      expect(ru.comparables(3)).toBe('На основе 3 похожих объектов');
      expect(ar.comparables(2)).toBe('استنادًا إلى منزلين مماثلين');
    });

    it('gives a score its value text in the locale', () => {
      const { getByLabelText } = renderIn('de', <NeighbourhoodScores items={[{ label: 'Verkehr', value: 8.4 }]} />);
      const bar = getByLabelText('Verkehr');
      expect(bar.props['aria-valuetext']).toBe('8.4 von 10');
    });
  });

  describe('listing-details speaks the locale', () => {
    it('names a review’s stars and the summary score in Spanish', () => {
      expect(renderIn('es', <ReviewCard name="Ana" rating={5} text="Genial" />).getByLabelText('Valoración: 5 de 5')).toBeTruthy();
      expect(renderIn('es', <ReviewSummary rating={5} distribution={[{ label: '5', value: 1 }]} />).getByText('Valoración general')).toBeTruthy();
    });

    it('counts amenities with the language’s plural forms', () => {
      const items = [{ label: 'Wifi' }, { label: 'Cocina' }];
      expect(
        renderIn('es', <AmenityList items={items} columns={1} limit={1} total={42} onShowAll={() => {}} />).getByText('Mostrar los 42 servicios'),
      ).toBeTruthy();
      expect(LISTING_DETAILS_MESSAGES.ru.showAllAmenities(22)).toBe('Показать все 22 удобства');
      expect(LISTING_DETAILS_MESSAGES.en.showAllAmenities(42)).toBe('Show all 42 amenities');
    });

    it('labels a landlord card in Spanish, and verifiedLabel still wins', () => {
      const es = renderIn('es', <ContactCard role="landlord" name="Ana" verified activeListings={1} onMessage={() => {}} />);
      expect(es.getByText('Propietario')).toBeTruthy();
      expect(es.getByText('1 anuncio activo')).toBeTruthy();
      expect(es.getByText('Enviar mensaje')).toBeTruthy();
      expect(es.getByLabelText('Verificado')).toBeTruthy();
      expect(
        renderIn('es', <ContactCard role="landlord" name="Ana" verified verifiedLabel="Comprobado" />).getByLabelText('Comprobado'),
      ).toBeTruthy();
    });
  });

  describe('listing-card speaks the locale', () => {
    const stay = {
      title: 'Alvora',
      photos: ['https://example.com/a.jpg'],
      rating: 4.92,
      reviewCount: 1,
      status: 'reserved' as const,
      testID: 'c',
    };

    it('composes the card’s name in Spanish, with the review plural', () => {
      const { getByLabelText } = renderIn('es', <ListingCard {...stay} onPress={() => {}} />);
      expect(getByLabelText('Alvora, Reservado, Valoración: 4.92 de 5, 1 reseña')).toBeTruthy();
      expect(LISTING_CARD_MESSAGES.es.ratedWithReviews('4.92', '128')).toBe('Valoración: 4.92 de 5, 128 reseñas');
      expect(LISTING_CARD_MESSAGES.ru.ratedWithReviews('4.9', '3')).toBe('Оценка 4.9 из 5, 3 отзыва');
      expect(LISTING_CARD_MESSAGES.en.ratedWithReviews('4.92', '128')).toBe('Rated 4.92 out of 5, 128 reviews');
    });

    it('names the heart in Spanish, and saveLabel still wins', () => {
      expect(renderIn('es', <FavoriteButton favorite={false} onFavoriteChange={() => {}} />).getByLabelText('Guardar en favoritos')).toBeTruthy();
      expect(renderIn('es', <FavoriteButton favorite onFavoriteChange={() => {}} />).getByLabelText('Quitar de favoritos')).toBeTruthy();
      expect(
        renderIn('es', <FavoriteButton favorite={false} onFavoriteChange={() => {}} saveLabel="Me gusta" />).getByLabelText('Me gusta'),
      ).toBeTruthy();
    });
  });
});

describe('stay-search, stay-filters and home-search', () => {
  const noop = () => {};
  const guests = { adults: 2, children: 0, infants: 0, pets: 0 };

  describe('stay-search speaks the locale', () => {
    it('titles the compact trigger, the guest rows and the flexibility chips in Spanish', () => {
      const compact = renderIn('es', <StaySearchCompact onPress={noop} onFilterPress={noop} />);
      expect(compact.getByText('¿A dónde vas?')).toBeTruthy();
      expect(compact.getByLabelText('Filtros')).toBeTruthy();

      const picker = renderIn('es', <GuestPicker value={guests} onChange={noop} />);
      expect(picker.getByText('Adultos')).toBeTruthy();
      expect(picker.getByText('Menores de 2 años')).toBeTruthy();

      const chips = renderIn('es', <DateFlexibilityChips value="exact" onChange={noop} />);
      expect(chips.getByLabelText('Flexibilidad de fechas')).toBeTruthy();
      expect(chips.getByText('Fechas exactas')).toBeTruthy();
      // One and many.
      expect(chips.getByText('± 1 día')).toBeTruthy();
      expect(chips.getByText('± 7 días')).toBeTruthy();
    });

    it('pluralises the day offsets per language', () => {
      expect(STAY_SEARCH_MESSAGES.ru.plusMinusDays(1)).toBe('± 1 день');
      expect(STAY_SEARCH_MESSAGES.ru.plusMinusDays(3)).toBe('± 3 дня');
      expect(STAY_SEARCH_MESSAGES.ru.plusMinusDays(7)).toBe('± 7 дней');
      expect(STAY_SEARCH_MESSAGES.ar.plusMinusDays(2)).toBe('± يومان');
    });

    it("keeps a caller's title and labels over the catalog", () => {
      const compact = renderIn('es', <StaySearchCompact onPress={noop} title="Destino" />);
      expect(compact.getByText('Destino')).toBeTruthy();
      const picker = renderIn('es', <GuestPicker value={guests} onChange={noop} labels={{ adults: 'Mayores' }} />);
      expect(picker.getByText('Mayores')).toBeTruthy();
      expect(picker.getByText('Niños')).toBeTruthy();
    });
  });

  describe('stay-filters speaks the locale', () => {
    it('names the trigger with a plural count of applied filters', () => {
      expect(renderIn('es', <FilterTriggerButton count={1} onPress={noop} />).getByLabelText('Filtros, 1 aplicado')).toBeTruthy();
      expect(renderIn('es', <FilterTriggerButton count={3} onPress={noop} />).getByLabelText('Filtros, 3 aplicados')).toBeTruthy();
      // English is unchanged.
      expect(renderIn('en', <FilterTriggerButton count={3} onPress={noop} />).getByLabelText('Filters, 3 applied')).toBeTruthy();
    });

    it('translates the built-in options, group names and the energy summary', () => {
      const features = renderIn('es', <FeatureFilter value={[]} onValueChange={noop} />);
      expect(features.getByLabelText('Características')).toBeTruthy();
      expect(features.getByText('Ascensor')).toBeTruthy();

      const types = renderIn('es', <PropertyTypeFilter value={[]} onValueChange={noop} />);
      expect(types.getByLabelText('Tipo de inmueble')).toBeTruthy();
      expect(types.getByText('Habitación')).toBeTruthy();

      const energy = renderIn('es', <EnergyRatingFilter value={null} onValueChange={noop} />);
      expect(energy.getByText('Cualquier calificación')).toBeTruthy();
      expect(energy.getByLabelText('C o mejor')).toBeTruthy();
    });

    it("keeps a caller's labels and clearLabel over the catalog", () => {
      const footer = renderIn('es', <FilterFooter resultsLabel="Ver 12" onApply={noop} onClear={noop} clearLabel="Limpiar" />);
      expect(footer.getByText('Limpiar')).toBeTruthy();
      expect(renderIn('es', <FilterFooter resultsLabel="Ver 12" onApply={noop} onClear={noop} />).getByText('Borrar todo')).toBeTruthy();
      const features = renderIn('es', <FeatureFilter value={[]} onValueChange={noop} labels={{ pool: 'Alberca' }} />);
      expect(features.getByText('Alberca')).toBeTruthy();
      expect(features.getByText('Jardín')).toBeTruthy();
    });

    it('ships every built-in option in every language', () => {
      for (const messages of Object.values(STAY_FILTERS_MESSAGES)) {
        expect(Object.keys(messages.propertyTypes)).toHaveLength(8);
        expect(Object.keys(messages.features)).toHaveLength(11);
      }
    });
  });

  describe('home-search speaks the locale', () => {
    it('labels the mode tabs, the save button and the budget in Spanish', () => {
      const tabs = renderIn('es', <SearchModeTabs value="rent" onValueChange={noop} />);
      expect(tabs.getByLabelText('Modo de búsqueda')).toBeTruthy();
      expect(tabs.getByText('Alquilar')).toBeTruthy();

      expect(renderIn('es', <SaveSearchButton saved={false} onSavedChange={noop} />).getByText('Guardar búsqueda')).toBeTruthy();

      const budget = renderIn('es', <BudgetPicker value={[null, null]} onValueChange={noop} formatAmount={(n) => `€${n}`} />);
      expect(budget.getByText('Presupuesto mensual')).toBeTruthy();
      expect(budget.getByText('Hasta €800')).toBeTruthy();
    });

    it('counts new results with the plural and names the footer actions in the language', () => {
      const card = renderIn(
        'es',
        <SavedSearchCard title="Pisos en Halden" newCount={3} onPress={noop} onEdit={noop} onDelete={noop} />,
      );
      expect(card.getByText('3 nuevos')).toBeTruthy();
      expect(card.getByText('Alertas desactivadas')).toBeTruthy();
      expect(card.getByLabelText('Editar: Pisos en Halden')).toBeTruthy();
      expect(HOME_SEARCH_MESSAGES.es.newCount(1)).toBe('1 nuevo');
      expect(HOME_SEARCH_MESSAGES.ru.newCount(5)).toBe('5 новых');
    });

    it("keeps a caller's labels over the catalog", () => {
      const tabs = renderIn('es', <SearchModeTabs value="rent" onValueChange={noop} labels={{ rent: 'Renta' }} />);
      expect(tabs.getByText('Renta')).toBeTruthy();
      expect(tabs.getByText('Comprar')).toBeTruthy();
      const card = renderIn('es', <SavedSearchCard title="X" newCount={2} formatNewCount={(n) => `+${n}`} />);
      expect(card.getByText('+2')).toBeTruthy();
    });

    it('builds the segment presets in a given locale, English by default constant', () => {
      expect(homeSearchSegments('rent', {}, undefined, 'es').map((s) => s.label)).toEqual([
        'Ubicación',
        'Entrada',
        'Presupuesto',
      ]);
      expect(homeSearchSegments('stays', {}, undefined, 'es')[0]!.label).toBe('Dónde');
      expect(HOME_SEARCH_SEGMENTS.rent.map((s) => s.label)).toEqual(['Location', 'Move-in', 'Budget']);
    });
  });
});
