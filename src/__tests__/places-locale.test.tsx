/**
 * @jest-environment jsdom
 *
 * The places group — directions, navigation, map chrome, places and their
 * details — speaking the app's locale through the REAL react-native-web.
 *
 * Each family renders at least one real component under `LocaleProvider` and
 * the test reads the emitted DOM: the drawn text or the `aria-label` a screen
 * reader hears. It also pins the three things a catalog cannot say about
 * itself: that counts pluralise per language, that a caller's `labels`/`*Label`
 * still wins over the catalog, and that English is still what an app with no
 * locale gets (the runtime here is English).
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { AddressList } from '../address';
import { CategoryBar } from '../category-bar';
import { DirectionsSteps, DirectionsSummary, TransitLineBadge } from '../directions';
import type { DirectionsLeg, DirectionsRoute } from '../directions';
import { RiFireLine } from '../icons/remix/RiFireLine';
import { LocaleProvider } from '../locale';
import { LocationPuck } from '../location-puck';
import { MapAttribution, MapScaleBar } from '../map-attribution';
import { MapCompass, MapControls } from '../map-controls';
import { MapClusterMarker, MapSearchAreaButton } from '../map-marker';
import { MAP_MARKER_MESSAGES } from '../map-marker/messages';
import { ArrivalBar, LaneGuidance, NavigationBanner, SpeedLimitPill } from '../navigation-banner';
import { NAVIGATION_BANNER_MESSAGES } from '../navigation-banner/messages';
import { PlaceActions, PlaceCard } from '../place-card';
import { PLACE_CARD_MESSAGES } from '../place-card/messages';
import { describeBusyChart } from '../place-details';
import { PLACE_DETAILS_MESSAGES } from '../place-details/messages';
import { PlaceAmenities } from '../place-details/PlaceAmenities';
import { PlaceHours } from '../place-details/PlaceHours';
import { PlaceInfoList } from '../place-details/PlaceInfoList';
import { PlaceTransit } from '../place-details/PlaceTransit';
import { PlaceList } from '../place-list/PlaceList';
import { PlaceListCard } from '../place-list/PlaceListCard';
import { PLACE_LIST_MESSAGES } from '../place-list/messages';
import { PlaceReviewCard, PlaceReviewSummary, WriteReviewPrompt } from '../place-reviews';
import { RouteStops } from '../route-stops';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { messagesIn } from './support/messages-in';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

/** Mounts under `locale` (Spanish by default); `null` mounts with no `LocaleProvider` at all. */
function mount(ui: React.ReactElement, locale: string | null = 'es'): HTMLElement {
  act(() => {
    root.render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        {locale === null ? ui : <LocaleProvider locale={locale}>{ui}</LocaleProvider>}
      </BloomThemeProvider>,
    );
  });
  return container;
}

/** Every accessible name in the tree. */
function names(): string[] {
  return Array.from(container.querySelectorAll('[aria-label]')).map(
    (node) => node.getAttribute('aria-label')!,
  );
}

function hasName(name: string): boolean {
  return names().includes(name);
}

function text(): string {
  return container.textContent ?? '';
}

const noop = () => undefined;

// ---------------------------------------------------------------------------
//  address · category-bar · map-attribution · map-marker · location-puck
// ---------------------------------------------------------------------------

describe('address', () => {
  it('draws the empty state and names the list in the locale; its props still win', () => {
    mount(<AddressList sections={[]} />);
    expect(text()).toContain('Aún no hay nada aquí');
    mount(
      <AddressList
        sections={[{ title: 'Guardadas', entries: [{ id: 'a', title: 'Casa' }] }]}
        variant="picker"
      />,
    );
    expect(hasName('Direcciones')).toBe(true);
    mount(<AddressList sections={[]} emptyTitle="Sin direcciones" />);
    expect(text()).toContain('Sin direcciones');
  });
});

describe('category-bar', () => {
  /** Give the track real scroll geometry and fire one scroll event, so both arrows exist. */
  function scrollTrack(x: number, viewport: number, content: number) {
    const track = container.querySelector('[data-testid="c-track"]') as HTMLElement;
    Object.defineProperty(track, 'scrollLeft', { configurable: true, value: x });
    Object.defineProperty(track, 'scrollWidth', { configurable: true, value: content });
    Object.defineProperty(track, 'offsetWidth', { configurable: true, value: viewport });
    act(() => {
      track.dispatchEvent(new Event('scroll', { bubbles: false }));
    });
  }
  const items = [
    { key: 'a', label: 'Strand', icon: RiFireLine },
    { key: 'b', label: 'Berge', icon: RiFireLine },
  ];

  it('names its web arrows in the locale; previousLabel still wins', () => {
    mount(<CategoryBar items={items} value="a" accessibilityLabel="Kategorien" testID="c" />, 'de');
    scrollTrack(100, 400, 1000);
    expect(hasName('Vorherige Kategorien')).toBe(true);
    expect(hasName('Nächste Kategorien')).toBe(true);
    mount(
      <CategoryBar
        items={items}
        value="a"
        accessibilityLabel="Kategorien"
        previousLabel="Zurück"
        testID="c"
      />,
      'de',
    );
    scrollTrack(100, 400, 1000);
    expect(hasName('Zurück')).toBe(true);
  });
});

describe('map-attribution', () => {
  it('names the strip and the scale in the locale; a scaleLabel still wins', () => {
    mount(
      <MapAttribution credit="© OpenStreetMap" scales={[{ width: 80, label: '500 m' }]} />,
      'fr',
    );
    expect(hasName('Données cartographiques')).toBe(true);
    expect(hasName('Échelle, 500 m')).toBe(true);
    mount(<MapScaleBar scales={[{ width: 80, label: '500 m' }]} scaleLabel="Maßstab" />, 'fr');
    expect(hasName('Maßstab, 500 m')).toBe(true);
  });
});

describe('map-marker', () => {
  it('draws the search pill in the locale; a label still wins', () => {
    mount(<MapSearchAreaButton onPress={noop} />);
    expect(text()).toContain('Buscar en esta zona');
    mount(<MapSearchAreaButton variant="toggle" checked={false} onCheckedChange={noop} />);
    expect(text()).toContain('Buscar al mover el mapa');
    mount(<MapSearchAreaButton onPress={noop} label="Buscar aquí" />);
    expect(text()).toContain('Buscar aquí');
  });

  it('counts a cluster per language', () => {
    mount(<MapClusterMarker count={1} />);
    expect(hasName('1 alojamiento')).toBe(true);
    mount(<MapClusterMarker count={5} />, 'ru');
    expect(hasName('5 вариантов жилья')).toBe(true);
    mount(<MapClusterMarker count={3} />, 'ru');
    expect(hasName('3 варианта жилья')).toBe(true);
    // A pre-formatted count takes the language's "many" form rather than a guess.
    expect(MAP_MARKER_MESSAGES.en.stays('99+')).toBe('99+ stays');
    expect(messagesIn(MAP_MARKER_MESSAGES, 'ar').stays(2)).toBe('مكانا إقامة');
  });
});

describe('location-puck', () => {
  it('announces the state and the bearing in the locale; stateLabels still win', () => {
    mount(<LocationPuck state="located" heading={90} />);
    expect(hasName('Tu ubicación, orientado a 90 grados')).toBe(true);
    mount(<LocationPuck state="stale" headingUnknown />, 'ja');
    expect(hasName('最後に確認された現在地')).toBe(true);
    mount(<LocationPuck state="located" headingUnknown stateLabels={{ located: 'Aquí estás' }} />);
    expect(hasName('Aquí estás')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
//  route-stops · directions · navigation-banner · map-controls
// ---------------------------------------------------------------------------

describe('route-stops', () => {
  const stops = [
    { id: 'a', title: 'Casa', state: 'reached' as const },
    { id: 'b', title: 'Mercado', state: 'current' as const },
    { id: 'c', title: 'Oficina' },
  ];

  it('names positions, states and controls in the locale', () => {
    mount(<RouteStops stops={stops} onRemoveStop={noop} onAddStop={noop} />);
    expect(hasName('Paradas de la ruta')).toBe(true);
    expect(hasName('Origen, Alcanzada, Casa')).toBe(true);
    expect(hasName('Parada 2, Parada actual, Mercado')).toBe(true);
    expect(hasName('Quitar Oficina')).toBe(true);
    expect(text()).toContain('Añadir una parada');
  });

  it('puts the verb where German puts it, and lets labels win', () => {
    mount(<RouteStops stops={stops} onRemoveStop={noop} />, 'de');
    expect(hasName('Oficina entfernen')).toBe(true);
    mount(
      <RouteStops
        stops={stops}
        onAddStop={noop}
        labels={{ addStop: 'Otra parada', origin: 'Salida' }}
      />,
    );
    expect(text()).toContain('Otra parada');
    expect(hasName('Salida, Alcanzada, Casa')).toBe(true);
  });
});

describe('directions', () => {
  const routes: DirectionsRoute[] = [
    { id: 'r1', duration: '24 min', traffic: 'light' },
    { id: 'r2', duration: '31 min', traffic: 'heavy' },
  ];
  const legs: DirectionsLeg[] = [
    {
      id: 'l1',
      title: 'Carrer del Roure',
      steps: [
        { id: 's1', maneuver: 'left', instruction: 'Carrer del Roure' },
        { id: 's2', maneuver: 'right', instruction: 'Via Augusta' },
      ],
    },
  ];

  it('draws the summary in the locale', () => {
    mount(
      <DirectionsSummary
        routes={routes}
        mode="walk"
        modes={['drive', 'walk']}
        onModeChange={noop}
        onStart={noop}
      />,
    );
    expect(hasName('Indicaciones')).toBe(true);
    expect(text()).toContain('A pie');
    expect(text()).toContain('Tráfico fluido');
    expect(text()).toContain('Otras rutas');
    expect(text()).toContain('Iniciar');
    expect(hasName('31 min, Tráfico denso')).toBe(true);
  });

  it('announces each step with the maneuver word and the current step in the locale', () => {
    mount(<DirectionsSteps legs={legs} currentStepId="s2" />, 'fr');
    expect(hasName('Tournez à gauche, Carrer del Roure')).toBe(true);
    expect(hasName('Étape actuelle, Tournez à droite, Via Augusta')).toBe(true);
    mount(<TransitLineBadge line={{ name: 'L4', headsign: 'Trinitat Nova' }} />, 'ca');
    expect(hasName('Línia L4, Trinitat Nova')).toBe(true);
  });

  it('lets labels and currentLabel win', () => {
    mount(
      <DirectionsSummary
        routes={routes}
        onStart={noop}
        labels={{ start: 'Vamos', figure: 'En coche' }}
      />,
    );
    expect(text()).toContain('Vamos');
    expect(text()).toContain('En coche');
    mount(<DirectionsSteps legs={legs} currentStepId="s1" currentLabel="Ahora" />);
    expect(hasName('Ahora, Gira a la izquierda, Carrer del Roure')).toBe(true);
  });
});

describe('navigation-banner', () => {
  it('announces the banner with the next maneuver in the language’s own order', () => {
    mount(
      <NavigationBanner
        maneuver="right"
        distance="400 m"
        instruction="Carrer del Roure"
        thenManeuver="left"
      />,
    );
    expect(hasName('400 m, Gira a la derecha, Carrer del Roure, luego gira a la izquierda')).toBe(
      true,
    );
    expect(text()).toContain('luego gira a la izquierda');
    mount(
      <NavigationBanner maneuver="right" instruction="Hauptstraße" thenManeuver="roundabout" />,
      'de',
    );
    // German keeps the noun capitalised mid-sentence; only the first letter drops.
    expect(text()).toContain('dann im Kreisverkehr');
    mount(<NavigationBanner maneuver="right" instruction="Calle Mayor" state="rerouting" />);
    expect(text()).toContain('Buscando una nueva ruta');
  });

  it('lets a caller’s then word keep the English-shaped line', () => {
    mount(
      <NavigationBanner
        maneuver="right"
        instruction="Calle Mayor"
        thenManeuver="left"
        labels={{ then: 'y después' }}
      />,
    );
    expect(text()).toContain('y después gira a la izquierda');
  });

  it('counts lanes per language and joins them with the language’s own "and"', () => {
    const lanes = [
      { directions: ['left' as const] },
      { directions: ['straight' as const], allowed: true },
      { directions: ['straight' as const], allowed: true },
    ];
    mount(<LaneGuidance lanes={lanes} />);
    expect(hasName('Indicación de carriles, 3 carriles, usa el carril 2 y carril 3')).toBe(true);
    mount(<LaneGuidance lanes={lanes} />, 'ru');
    expect(names().some((name) => name.startsWith('Подсказка по полосам, 3 полосы'))).toBe(true);
    expect(messagesIn(NAVIGATION_BANNER_MESSAGES, 'ru').laneCount(5)).toBe('5 полос');
    expect(messagesIn(NAVIGATION_BANNER_MESSAGES, 'ar').laneCount(2)).toBe('حارتان');
  });

  it('names the speed sign and the arrival strip in the locale; labels win', () => {
    mount(<SpeedLimitPill limit={50} unit="km/h" exceeded />);
    expect(hasName('Límite de velocidad 50 km/h, por encima del límite')).toBe(true);
    mount(
      <ArrivalBar arrival="18:42" remainingTime="24 min" remainingDistance="8,2 km" onEnd={noop} />,
      'it',
    );
    expect(hasName('Arrivo 18:42, Rimanente 24 min, Distanza 8,2 km')).toBe(true);
    expect(text()).toContain('Termina');
    mount(
      <ArrivalBar
        arrival="18:42"
        remainingTime="24 min"
        remainingDistance="8,2 km"
        onEnd={noop}
        labels={{ end: 'Salir' }}
      />,
    );
    expect(text()).toContain('Salir');
  });
});

describe('map-controls', () => {
  it('names every control in the locale; labels win', () => {
    mount(
      <MapControls onLocate={noop} onZoomIn={noop} onZoomOut={noop} onTiltChange={noop} />,
      'pt',
    );
    expect(hasName('Controles do mapa')).toBe(true);
    expect(hasName('Mostrar minha localização')).toBe(true);
    expect(hasName('Aumentar zoom')).toBe(true);
    expect(hasName('Inclinar o mapa')).toBe(true);
    mount(<MapControls onZoomIn={noop} onZoomOut={noop} labels={{ zoomIn: 'Más cerca' }} />);
    expect(hasName('Más cerca')).toBe(true);
    expect(hasName('Alejar')).toBe(true);
  });

  it('names the compass with the bearing in the locale', () => {
    mount(<MapCompass heading={45} onPress={noop} />, 'zh');
    expect(hasName('朝向 45 度。重置为正北')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
//  place-card · place-list · place-reviews · place-details
// ---------------------------------------------------------------------------

describe('place-card', () => {
  const place = {
    name: 'Forner de la Plaça',
    category: 'Panadería',
    rating: 4.6,
    reviewCount: 318,
    openState: 'closing-soon' as const,
  };

  it('composes the name with the rating sentence and the state in the locale', () => {
    mount(<PlaceCard {...place} onPress={noop} testID="p" />);
    expect(
      hasName(
        'Forner de la Plaça, Panadería, Valoración de 4.6 sobre 5, 318 reseñas, Cierra pronto',
      ),
    ).toBe(true);
    expect(text()).toContain('Cierra pronto');
    // The card's own Rating speaks the locale too: no English sentence left.
    expect(names().filter((name) => /out of|review/i.test(name))).toEqual([]);
  });

  it('pluralises the review count per language', () => {
    expect(PLACE_CARD_MESSAGES.en.rated('4.6', 1)).toBe('Rated 4.6 out of 5, 1 review');
    expect(PLACE_CARD_MESSAGES.en.rated('4.6', 318)).toBe('Rated 4.6 out of 5, 318 reviews');
    expect(messagesIn(PLACE_CARD_MESSAGES, 'ru').rated('4,6', 22)).toBe(
      'Оценка 4,6 из 5, 22 отзыва',
    );
    expect(messagesIn(PLACE_CARD_MESSAGES, 'ru').rated('4,6', 25)).toBe(
      'Оценка 4,6 из 5, 25 отзывов',
    );
    expect(messagesIn(PLACE_CARD_MESSAGES, 'fr').rated('4,6', 0)).toBe('Noté 4,6 sur 5, 0 avis');
  });

  it('says New for an unrated place and names the action row, in the locale; props win', () => {
    mount(<PlaceCard {...place} rating={null} onPress={noop} testID="p" />, 'de');
    expect(names().some((name) => name.includes('Neu'))).toBe(true);
    mount(<PlaceCard {...place} openLabel="Tanca a les 20:00" onPress={noop} testID="p" />, 'ca');
    expect(text()).toContain('Tanca a les 20:00');
    mount(<PlaceActions actions={[{ id: 'call', label: 'Llamar', onPress: noop }]} />);
    expect(hasName('Acciones')).toBe(true);
  });
});

describe('place-list', () => {
  it('counts, shares and names visibility in the locale', () => {
    mount(<PlaceListCard name="Por visitar" count={12} visibility="shared" onPress={noop} />);
    expect(hasName('Por visitar, 12 lugares, Compartida')).toBe(true);
    expect(messagesIn(PLACE_LIST_MESSAGES, 'es').places(1)).toBe('1 lugar');
    expect(messagesIn(PLACE_LIST_MESSAGES, 'ru').places(21)).toBe('21 место');
    expect(messagesIn(PLACE_LIST_MESSAGES, 'ru').places(12)).toBe('12 мест');
  });

  it('names the list and its controls in the locale; labels win', () => {
    const places = [
      { id: 'a', place: { name: 'Forn' } },
      { id: 'b', place: { name: 'Bar' } },
    ];
    mount(<PlaceList places={places} onReorder={noop} onRemove={noop} />, 'it');
    expect(hasName('Luoghi salvati')).toBe(true);
    expect(hasName('Sposta in posizione 2')).toBe(true);
    expect(hasName("Rimuovi Forn dall'elenco")).toBe(true);
    mount(
      <PlaceList places={places} onRemove={noop} labels={{ remove: (name) => `Treure ${name}` }} />,
      'it',
    );
    expect(hasName('Treure Forn')).toBe(true);
  });
});

describe('place-reviews', () => {
  it('draws the review card in the locale; *Label props win', () => {
    mount(
      <PlaceReviewCard
        authorLabel="Inquilino anónimo"
        text="Buen piso."
        rating={4}
        wouldRecommend
        depositReturned={false}
        onHelpfulChange={noop}
        onReport={noop}
      />,
    );
    expect(text()).toContain('Lo recomendaría');
    expect(text()).toContain('Fianza no devuelta');
    expect(text()).toContain('Útil');
    expect(text()).toContain('Denunciar');
    mount(
      <PlaceReviewCard
        authorLabel="Ana"
        text="Bien."
        rating={4}
        wouldRecommend
        recommendLabel="¡Sí!"
      />,
    );
    expect(text()).toContain('¡Sí!');
  });

  it('builds the prompt around the building in the language’s own order', () => {
    mount(<WriteReviewPrompt buildingTitle="Calle del Olmo 14" onStart={noop} />, 'ja');
    expect(text()).toContain('ここに住んでいましたか？');
    expect(text()).toContain('Calle del Olmo 14の今後の入居者のためにご協力ください。');
    expect(text()).toContain('レビューを書く');
  });

  it('counts reviews per language, and a string count is drawn as given', () => {
    mount(
      <PlaceReviewSummary
        rating={4.2}
        reviewCount={1}
        depositReturnedRate={0.82}
        recommendRate={0.91}
      />,
    );
    expect(text()).toContain('1 reseña');
    expect(text()).toContain('Fianza devuelta en el 82% de los alquileres');
    expect(text()).toContain('El 91% recomendaría vivir aquí');
    mount(<PlaceReviewSummary rating={4.2} reviewCount={46} />, 'ar');
    expect(text()).toContain('46 مراجعة');
    mount(<PlaceReviewSummary rating={4.2} reviewCount="1,2 mil" />);
    expect(text()).toContain('1,2 mil');
  });
});

describe('place-details', () => {
  it('names hours, today and a closed day in the locale; props win', () => {
    const days = [
      { label: 'Lunes', intervals: [{ open: '08:00', close: '20:00' }], today: true },
      { label: 'Domingo' },
    ];
    mount(<PlaceHours days={days} state="open" defaultExpanded />);
    expect(hasName('Horario')).toBe(true);
    expect(hasName('Hoy, Lunes, 08:00 – 20:00')).toBe(true);
    expect(hasName('Domingo, Cerrado')).toBe(true);
    expect(text()).toContain('Abierto');
    mount(<PlaceHours days={days} defaultExpanded todayLabel="Avui" closedLabel="Tancat" />);
    expect(hasName('Avui, Lunes, 08:00 – 20:00')).toBe(true);
    expect(hasName('Domingo, Tancat')).toBe(true);
  });

  it('says what pressing an info row does in the locale, "Copy" from the common words', () => {
    mount(
      <PlaceInfoList
        items={[
          {
            id: 'a',
            label: 'Dirección',
            value: 'Carrer del Forn 12',
            action: 'copy',
            onPress: noop,
          },
          { id: 'b', label: 'Teléfono', value: '934 000 000', action: 'call', onPress: noop },
        ]}
      />,
    );
    expect(hasName('Dirección: Carrer del Forn 12, Copiar')).toBe(true);
    expect(hasName('Teléfono: 934 000 000, Llamar')).toBe(true);
  });

  it('announces stops and departures in the locale; realtimeLabel wins', () => {
    const stops = [
      {
        id: 's',
        name: 'Plaça de la Vila',
        mode: 'metro' as const,
        lines: [{ name: 'L4' }],
        departures: [
          {
            id: 'd',
            line: { name: 'L4' },
            headsign: 'Trinitat Nova',
            time: '4 min',
            realtime: true,
          },
        ],
      },
      { id: 't', name: 'Pont', mode: 'bus' as const },
    ];
    mount(<PlaceTransit stops={stops} />);
    expect(hasName('Transporte público cercano')).toBe(true);
    expect(hasName('Estación de metro, Plaça de la Vila')).toBe(true);
    expect(hasName('Líneas')).toBe(true);
    expect(hasName('Línea L4, hacia Trinitat Nova, 4 min, en tiempo real')).toBe(true);
    expect(text()).toContain('No hay salidas ahora mismo');
    mount(<PlaceTransit stops={stops} realtimeLabel="al moment" />);
    expect(hasName('Línea L4, hacia Trinitat Nova, 4 min, al moment')).toBe(true);
  });

  it('names amenities and the busy chart in the locale', () => {
    mount(
      <PlaceAmenities
        layout="chips"
        items={[{ label: 'Wifi', available: false }, { label: 'Terraza' }]}
      />,
      'es',
    );
    expect(hasName('Servicios')).toBe(true);
    expect(hasName('No disponible: Wifi')).toBe(true);
    // The list layout's expansion button comes from the listing-details
    // catalog, so it reads in the locale too.
    mount(
      <PlaceAmenities
        layout="list"
        items={[{ label: 'Wifi' }, { label: 'Terraza' }, { label: 'Parking' }]}
        limit={1}
        onShowAll={noop}
      />,
      'es',
    );
    expect(text()).not.toMatch(/Show all/);
    expect(text()).toMatch(/3/);
    const day = {
      id: 'tue',
      label: 'Martes',
      hours: [
        { label: '9', value: 90 },
        { label: '11', value: 40 },
      ],
      currentHourIndex: 1,
      trend: 'busier' as const,
    };
    expect(describeBusyChart(day, messagesIn(PLACE_DETAILS_MESSAGES, 'es'))).toBe(
      'Martes, más concurrido a las 9, ahora 11, Más concurrido de lo habitual',
    );
  });
});

// ---------------------------------------------------------------------------
//  English stays English
// ---------------------------------------------------------------------------

describe('with no locale anywhere', () => {
  it('speaks English, byte for byte', () => {
    mount(
      <RouteStops
        stops={[
          { id: 'a', title: 'Home' },
          { id: 'b', title: 'Work' },
        ]}
        onSwap={noop}
      />,
      null,
    );
    expect(hasName('Swap origin and destination')).toBe(true);
    mount(<MapClusterMarker count={12} />, null);
    expect(hasName('12 stays')).toBe(true);
    mount(
      <LaneGuidance lanes={[{ directions: ['left'], allowed: true }, { directions: ['right'] }]} />,
      null,
    );
    expect(hasName('Lane guidance, 2 lanes, use lane 1')).toBe(true);
  });
});
