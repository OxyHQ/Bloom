/**
 * @jest-environment jsdom
 *
 * The creator-studio, music-library and lyrics families speak the app's
 * locale: rendered through the REAL react-native-web under a Spanish (or
 * Russian / Arabic) `LocaleProvider`, the DOM carries the catalog's words —
 * visible text and accessible names — while a caller's own `labels` /
 * `*Label` prop still wins over them.
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { within } from '@testing-library/dom';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import {
  AudienceOverview,
  CreditsEditor,
  IsrcField,
  ReleaseCard,
  TopTracksTable,
  TrackUploadRow,
  artworkDimensionsError,
  type CreatorRelease,
} from '../creator-studio';
import { CREATOR_STUDIO_MESSAGES } from '../creator-studio/messages';
import { LocaleProvider } from '../locale';
import { LyricsPreviewCard, LyricsView } from '../lyrics';
import { LibraryItem, LibraryPanel, RecentSearches, SearchField, TopResultCard, type LibraryEntry } from '../music-library';
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

function mount(ui: React.ReactElement, locale = 'es') {
  act(() => {
    root.render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <LocaleProvider locale={locale}>{ui}</LocaleProvider>
      </BloomThemeProvider>,
    );
  });
  return within(container);
}

const RELEASE: CreatorRelease = {
  id: 'r1',
  title: 'Low Tide',
  artist: 'Maya',
  type: 'single',
  releaseDate: '14 mar 2026',
  status: 'in-review',
  trackCount: 1,
};

describe('creator-studio in the app locale', () => {
  it('ReleaseCard: type, status, a plural track count and the menu name in Spanish', () => {
    const screen = mount(<ReleaseCard release={RELEASE} actions={[{ label: 'Borrar' }]} testID="c" />);
    expect(screen.getByText('Sencillo · 14 mar 2026 · 1 canción')).toBeTruthy();
    expect(screen.getByText('En revisión')).toBeTruthy();
    expect(screen.getAllByLabelText('Más acciones de Low Tide').length).toBeGreaterThan(0);
  });

  it('pluralises the track count per language', () => {
    let screen = mount(<ReleaseCard release={{ ...RELEASE, trackCount: 5 }} />);
    expect(screen.getByText('Sencillo · 14 mar 2026 · 5 canciones')).toBeTruthy();
    screen = mount(<ReleaseCard release={{ ...RELEASE, trackCount: 3 }} />, 'ru');
    expect(screen.getByText('Сингл · 14 mar 2026 · 3 трека')).toBeTruthy();
    screen = mount(<ReleaseCard release={{ ...RELEASE, trackCount: 11 }} />, 'ru');
    expect(screen.getByText('Сингл · 14 mar 2026 · 11 треков')).toBeTruthy();
    screen = mount(<ReleaseCard release={{ ...RELEASE, trackCount: 2 }} />, 'ar');
    expect(screen.getByText(/مقطعان/)).toBeTruthy();
  });

  it('ReleaseCard: a labels entry still wins over the catalog', () => {
    const screen = mount(
      <ReleaseCard release={RELEASE} labels={{ tracks: (n) => `${n} pistas`, statuses: { ...messagesIn(CREATOR_STUDIO_MESSAGES, 'es').releaseStatuses, 'in-review': 'Revisando' } }} />,
    );
    expect(screen.getByText('Sencillo · 14 mar 2026 · 1 pistas')).toBeTruthy();
    expect(screen.getByText('Revisando')).toBeTruthy();
  });

  it('TrackUploadRow: status words and the common Retry, with a label override winning', () => {
    let screen = mount(<TrackUploadRow fileName="a.wav" size="1 MB" status="failed" onRetry={() => {}} onRemove={() => {}} />);
    expect(screen.getByText('Error al subir')).toBeTruthy();
    expect(screen.getByText('Reintentar')).toBeTruthy();
    expect(screen.getByLabelText('Quitar a.wav')).toBeTruthy();
    screen = mount(<TrackUploadRow fileName="a.wav" size="1 MB" status="queued" labels={{ queued: 'Esperando' }} />);
    expect(screen.getByText('Esperando')).toBeTruthy();
  });

  it('AudienceOverview: heading and default periods, while a title prop wins', () => {
    let screen = mount(<AudienceOverview metrics={[]} period="7d" onPeriodChange={() => {}} />);
    expect(screen.getByText('Audiencia')).toBeTruthy();
    expect(screen.getByText('28 días')).toBeTruthy();
    screen = mount(<AudienceOverview metrics={[]} period="7d" onPeriodChange={() => {}} title="Oyentes" />);
    expect(screen.getByText('Oyentes')).toBeTruthy();
    expect(screen.queryByText('Audiencia')).toBeNull();
  });

  it('CreditsEditor and IsrcField: empty state, button, per-row names and the hint', () => {
    let screen = mount(<CreditsEditor credits={[]} onCreditsChange={() => {}} />);
    expect(screen.getByText('Créditos')).toBeTruthy();
    expect(screen.getByText('Añadir crédito')).toBeTruthy();
    screen = mount(<CreditsEditor credits={[{ id: 'x', role: 'producer', name: 'Ana' }]} onCreditsChange={() => {}} />);
    expect(screen.getByLabelText('Quitar crédito 1, Ana')).toBeTruthy();
    screen = mount(<IsrcField value="" onChangeText={() => {}} />);
    expect(screen.getByText('Formato: CC-XXX-YY-NNNNN')).toBeTruthy();
  });

  it('TopTracksTable: title and empty line', () => {
    const screen = mount(<TopTracksTable tracks={[]} />);
    expect(screen.getAllByText('Canciones principales').length).toBeGreaterThan(0);
    expect(screen.getByText('Aún no hay reproducciones en este periodo.')).toBeTruthy();
  });

  it('artworkDimensionsError takes a locale', () => {
    expect(artworkDimensionsError(3000, 2000, 3000, 'es')).toBe(
      'La portada debe ser cuadrada: esta imagen mide 3000×2000 px.',
    );
    expect(artworkDimensionsError(3000, 2000)).toMatch(/square/);
  });
});

const ITEMS: LibraryEntry[] = [
  { id: 'a', title: 'Night Drive', kind: 'playlist', subtitle: 'Maya', pinned: true, downloaded: true },
];

describe('music-library in the app locale', () => {
  it('LibraryPanel: title, filters and the kind in a meta line', () => {
    const screen = mount(<LibraryPanel items={ITEMS} onExpandedChange={() => {}} testID="lib" />);
    expect(screen.getAllByText('Tu biblioteca').length).toBeGreaterThan(0);
    expect(screen.getByText('Álbumes')).toBeTruthy();
    expect(screen.getByText('Playlist · Maya')).toBeTruthy();
    // The common word, not a family copy.
    expect(screen.getByLabelText('Mostrar más')).toBeTruthy();
  });

  it('LibraryPanel: a nested labels entry still wins', () => {
    const screen = mount(<LibraryPanel items={ITEMS} labels={{ filter: { albums: 'Discos' } }} />);
    expect(screen.getByText('Discos')).toBeTruthy();
    expect(screen.getByText('Artistas')).toBeTruthy();
  });

  it('LibraryItem: the spoken states, with a *Label prop winning', () => {
    let screen = mount(<LibraryItem item={ITEMS[0]!} />);
    expect(screen.getByLabelText('Night Drive, Playlist · Maya, Fijado, Descargado')).toBeTruthy();
    screen = mount(<LibraryItem item={ITEMS[0]!} pinnedLabel="Anclado" />, 'es');
    expect(screen.getByLabelText('Night Drive, Playlist · Maya, Anclado, Descargado')).toBeTruthy();
  });

  it('SearchField, TopResultCard and RecentSearches', () => {
    let screen = mount(<SearchField value="" onChangeText={() => {}} onBrowsePress={() => {}} />);
    expect(screen.getByPlaceholderText('¿Qué quieres escuchar?')).toBeTruthy();
    expect(screen.getByLabelText('Explorar')).toBeTruthy();
    screen = mount(<TopResultCard title="Lumen Vale" kind="artist" />);
    expect(screen.getByText('Artista')).toBeTruthy();
    screen = mount(
      <RecentSearches items={[{ id: '1', title: 'Lumen Vale' }]} onRemove={() => {}} onClearAll={() => {}} />,
    );
    expect(screen.getByText('Búsquedas recientes')).toBeTruthy();
    expect(screen.getByLabelText('Quitar Lumen Vale')).toBeTruthy();
    screen = mount(<RecentSearches items={[]} title="Historial" />);
    expect(screen.getByText('Historial')).toBeTruthy();
  });
});

describe('lyrics in the app locale', () => {
  it('LyricsView: the region name and the empty line', () => {
    const screen = mount(<LyricsView lines={[]} />);
    expect(screen.getByLabelText('Letra')).toBeTruthy();
    expect(screen.getByText('La letra de esta canción no está disponible')).toBeTruthy();
  });

  it('LyricsPreviewCard: heading and pill, with a label prop winning', () => {
    let screen = mount(<LyricsPreviewCard text={'uno\ndos'} onShowLyrics={() => {}} />);
    expect(screen.getByText('Letra')).toBeTruthy();
    expect(screen.getByText('Mostrar letra')).toBeTruthy();
    screen = mount(<LyricsPreviewCard text={'uno'} onShowLyrics={() => {}} showLyricsLabel="Ver todo" />);
    expect(screen.getByText('Ver todo')).toBeTruthy();
  });
});
