/**
 * The media-playback families speak the app's language: each draws or
 * announces its catalog's words under `LocaleProvider`, counts pluralise by
 * the language's own rules, a subject sits where the language puts it (never
 * behind an English "for"), and a caller's `labels`/`*Label` still wins.
 */
import type React from 'react';
import { createRef } from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

import { LocaleProvider } from '../locale';
import { LikeButton, PlayButton } from '../media-controls';
import { MEDIA_CONTROLS_MESSAGES } from '../media-controls/messages';
import { DiscographyFilter, FollowButton } from '../media-header';
import { FilterChips, Shelf } from '../media-shelf';
import { PortalOutlet, PortalProvider } from '../portal';
import { SortablePhotoGrid } from '../sortable-media';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { ZoomableMediaGallery, type ZoomableMediaGalleryHandle } from '../zoomable-media-gallery';

function renderIn(locale: string | undefined, ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      <LocaleProvider locale={locale}>{ui}</LocaleProvider>
    </BloomThemeProvider>,
  );
}

const noop = () => {};

describe('media-controls', () => {
  it('names the play button with the subject where the language puts it', () => {
    expect(
      renderIn(
        'es',
        <PlayButton playing={false} onPress={noop} subject="Night Drive" />,
      ).getByLabelText('Reproducir Night Drive'),
    ).toBeTruthy();
    expect(
      renderIn('ja', <PlayButton playing onPress={noop} subject="Night Drive" />).getByLabelText(
        'Night Driveを一時停止',
      ),
    ).toBeTruthy();
    // A caller's word keeps the old "<word> <subject>" shape.
    expect(
      renderIn(
        'es',
        <PlayButton playing={false} onPress={noop} subject="Night Drive" playLabel="Escuchar" />,
      ).getByLabelText('Escuchar Night Drive'),
    ).toBeTruthy();
  });

  it('names the like button in the locale, and an accessibilityLabel wins', () => {
    expect(
      renderIn('de', <LikeButton liked={false} onLikedChange={noop} />).getByLabelText(
        'In deiner Bibliothek speichern',
      ),
    ).toBeTruthy();
    expect(
      renderIn(
        'de',
        <LikeButton liked={false} onLikedChange={noop} accessibilityLabel="Merken" />,
      ).getByLabelText('Merken'),
    ).toBeTruthy();
  });

  it('keeps English with no locale anywhere', () => {
    expect(
      renderIn(
        undefined,
        <PlayButton playing={false} onPress={noop} subject="Night Drive" />,
      ).getByLabelText('Play Night Drive'),
    ).toBeTruthy();
    expect(MEDIA_CONTROLS_MESSAGES.en.seekValue('1:23', '3:45')).toBe('1:23 of 3:45');
  });
});

describe('media-header', () => {
  it('titles the discography and its chips in the locale; null still means no heading', () => {
    const de = renderIn('de', <DiscographyFilter value="albums" onValueChange={noop} />);
    expect(de.getByText('Diskografie')).toBeTruthy();
    expect(de.getByText('Alben')).toBeTruthy();
    expect(de.getByText('Singles und EPs')).toBeTruthy();
    expect(
      renderIn(
        'de',
        <DiscographyFilter value="albums" onValueChange={noop} title={null} />,
      ).queryByText('Diskografie'),
    ).toBeNull();
  });

  it('labels the follow button, and a label prop wins', () => {
    expect(
      renderIn('es', <FollowButton following={false} onFollowChange={noop} />).getByLabelText(
        'Seguir',
      ),
    ).toBeTruthy();
    expect(
      renderIn(
        'es',
        <FollowButton following={false} onFollowChange={noop} label="Suscribirse" />,
      ).getByLabelText('Suscribirse'),
    ).toBeTruthy();
  });
});

describe('media-shelf', () => {
  it('names the filter group and the show-all link in the locale', () => {
    expect(
      renderIn(
        'es',
        <FilterChips
          options={[{ value: 'all', label: 'Todo' }]}
          value="all"
          onValueChange={noop}
        />,
      ).getByLabelText('Filtros'),
    ).toBeTruthy();
    expect(
      renderIn(
        'it',
        <Shelf title="Per te" onShowAll={noop}>
          {null}
        </Shelf>,
      ).getAllByText('Mostra tutto').length,
    ).toBeGreaterThan(0);
  });
});

describe('sortable-media', () => {
  it('names the grid and each photo in the locale, and labels still win', () => {
    const photos = [
      { id: 'a', uri: 'https://cloud.oxy.so/a.jpg' },
      { id: 'b', uri: 'https://cloud.oxy.so/b.jpg' },
    ];
    // Tiles draw once the grid has a measured width.
    const laidOut = (ui: React.ReactElement) => {
      const utils = renderIn('it', ui);
      act(() => {
        fireEvent(utils.getByTestId('g'), 'layout', {
          nativeEvent: { layout: { width: 640, height: 400 } },
        });
      });
      return utils;
    };
    const grid = laidOut(
      <SortablePhotoGrid photos={photos} onReorder={noop} onRemove={noop} testID="g" />,
    );
    expect(grid.getByLabelText('Foto')).toBeTruthy();
    expect(grid.getByLabelText('Foto 2 di 2')).toBeTruthy();
    expect(grid.getByLabelText('Rimuovi la foto 2')).toBeTruthy();
    expect(
      laidOut(
        <SortablePhotoGrid
          photos={photos}
          onReorder={noop}
          labels={{ photo: (p) => `Immagine ${p}` }}
          testID="g"
        />,
      ).getByLabelText('Immagine 2'),
    ).toBeTruthy();
  });
});

describe('zoomable-media-gallery', () => {
  function openGallery(locale: string, labels?: { close?: string }) {
    const ref = createRef<ZoomableMediaGalleryHandle>();
    const utils = renderIn(
      locale,
      <PortalProvider>
        <ZoomableMediaGallery ref={ref} labels={labels} />
        <PortalOutlet />
      </PortalProvider>,
    );
    act(() => {
      ref.current?.open([{ uri: 'https://cloud.oxy.so/a.jpg' }], 0);
    });
    return utils;
  }

  it('names the close targets in the locale, and a labels.close wins', () => {
    expect(openGallery('es').getAllByLabelText('Cerrar visor multimedia').length).toBeGreaterThan(
      0,
    );
    expect(openGallery('es', { close: 'Salir' }).getAllByLabelText('Salir').length).toBeGreaterThan(
      0,
    );
  });
});
