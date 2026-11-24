/**
 * @jest-environment jsdom
 *
 * The creator-studio family speaks the app's
 * locale: rendered through the REAL react-native-web under a Spanish (or
 * Russian / Arabic) `LocaleProvider`, the DOM carries the catalog's words —
 * visible text and accessible names — while a caller's own `labels` /
 * `*Label` prop still wins over them.
 */
import type React from 'react';
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
    const screen = mount(
      <ReleaseCard release={RELEASE} actions={[{ label: 'Borrar' }]} testID="c" />,
    );
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
      <ReleaseCard
        release={RELEASE}
        labels={{
          tracks: (n) => `${n} pistas`,
          statuses: {
            ...messagesIn(CREATOR_STUDIO_MESSAGES, 'es').releaseStatuses,
            'in-review': 'Revisando',
          },
        }}
      />,
    );
    expect(screen.getByText('Sencillo · 14 mar 2026 · 1 pistas')).toBeTruthy();
    expect(screen.getByText('Revisando')).toBeTruthy();
  });

  it('TrackUploadRow: status words and the common Retry, with a label override winning', () => {
    let screen = mount(
      <TrackUploadRow
        fileName="a.wav"
        size="1 MB"
        status="failed"
        onRetry={() => {}}
        onRemove={() => {}}
      />,
    );
    expect(screen.getByText('Error al subir')).toBeTruthy();
    expect(screen.getByText('Reintentar')).toBeTruthy();
    expect(screen.getByLabelText('Quitar a.wav')).toBeTruthy();
    screen = mount(
      <TrackUploadRow
        fileName="a.wav"
        size="1 MB"
        status="queued"
        labels={{ queued: 'Esperando' }}
      />,
    );
    expect(screen.getByText('Esperando')).toBeTruthy();
  });

  it('AudienceOverview: heading and default periods, while a title prop wins', () => {
    let screen = mount(<AudienceOverview metrics={[]} period="7d" onPeriodChange={() => {}} />);
    expect(screen.getByText('Audiencia')).toBeTruthy();
    expect(screen.getByText('28 días')).toBeTruthy();
    screen = mount(
      <AudienceOverview metrics={[]} period="7d" onPeriodChange={() => {}} title="Oyentes" />,
    );
    expect(screen.getByText('Oyentes')).toBeTruthy();
    expect(screen.queryByText('Audiencia')).toBeNull();
  });

  it('CreditsEditor and IsrcField: empty state, button, per-row names and the hint', () => {
    let screen = mount(<CreditsEditor credits={[]} onCreditsChange={() => {}} />);
    expect(screen.getByText('Créditos')).toBeTruthy();
    expect(screen.getByText('Añadir crédito')).toBeTruthy();
    screen = mount(
      <CreditsEditor
        credits={[{ id: 'x', role: 'producer', name: 'Ana' }]}
        onCreditsChange={() => {}}
      />,
    );
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
