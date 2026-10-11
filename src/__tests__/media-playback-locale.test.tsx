/**
 * The media-playback families speak the app's language: each draws or
 * announces its catalog's words under `LocaleProvider`, counts pluralise by
 * the language's own rules, a subject sits where the language puts it (never
 * behind an English "for"), and a caller's `labels`/`*Label` still wins.
 */
import React, { createRef } from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

import { LocaleProvider } from '../locale';
import { COMMON_MESSAGES } from '../locale/common-messages';
import { AlbumCard, PlaylistCard } from '../media-card';
import { LikeButton, PlayButton } from '../media-controls';
import { MEDIA_CONTROLS_MESSAGES } from '../media-controls/messages';
import { DiscographyFilter, FollowButton } from '../media-header';
import { ConnectBanner, TransportControls } from '../media-player';
import { MEDIA_PLAYER_MESSAGES } from '../media-player/messages';
import { FilterChips, Shelf } from '../media-shelf';
import { PortalOutlet, PortalProvider } from '../portal';
import { QueuePanel } from '../queue-panel';
import { SortablePhotoGrid } from '../sortable-media';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { EpisodeRow, SelectionBar } from '../track-list';
import { TRACK_LIST_MESSAGES } from '../track-list/messages';
import { formatEpisodeLength, formatEpisodeRemaining } from '../track-list/shared';
import { ZoomableMediaGallery, type ZoomableMediaGalleryHandle } from '../zoomable-media-gallery';
import { messagesIn } from './support/messages-in';

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

describe('media-player', () => {
  it('names the transport from the catalogs, and a label override wins', () => {
    const music = renderIn(
      'es',
      <TransportControls
        playing={false}
        onPlayPause={noop}
        onPrevious={noop}
        onNext={noop}
        onShuffleChange={noop}
      />,
    );
    expect(music.getByLabelText('Aleatorio')).toBeTruthy();
    expect(music.getByLabelText('Anterior')).toBeTruthy();
    expect(music.getByLabelText('Reproducir')).toBeTruthy();

    const custom = renderIn(
      'es',
      <TransportControls
        playing={false}
        onPlayPause={noop}
        onShuffleChange={noop}
        labels={{ shuffle: 'Mezclar' }}
      />,
    );
    expect(custom.getByLabelText('Mezclar')).toBeTruthy();
  });

  it('pluralises the skip buttons by the language’s rules', () => {
    const podcast = renderIn(
      'ru',
      <TransportControls
        variant="podcast"
        playing={false}
        onPlayPause={noop}
        onSkipBack={noop}
        onSkipForward={noop}
        skipBackSeconds={15}
        skipForwardSeconds={30}
      />,
    );
    expect(podcast.getByLabelText('Назад на 15 секунд')).toBeTruthy();
    expect(podcast.getByLabelText('Вперёд на 30 секунд')).toBeTruthy();
    expect(messagesIn(MEDIA_PLAYER_MESSAGES, 'ru').minutes(1)).toBe('1 минута');
    expect(messagesIn(MEDIA_PLAYER_MESSAGES, 'ru').minutes(3)).toBe('3 минуты');
    expect(messagesIn(MEDIA_PLAYER_MESSAGES, 'ru').minutes(45)).toBe('45 минут');
    expect(messagesIn(MEDIA_PLAYER_MESSAGES, 'ar').minutes(2)).toBe('دقيقتان');
    expect(MEDIA_PLAYER_MESSAGES.en.skipBack(15)).toBe('Back 15 seconds');
  });

  it('places the device inside the banner sentence, and a label keeps the old shape', () => {
    expect(
      renderIn('ja', <ConnectBanner deviceName="Kitchen" />).getByText('Kitchenで再生中'),
    ).toBeTruthy();
    expect(
      renderIn('ja', <ConnectBanner deviceName="Kitchen" label="Now on" />).getByText(
        'Now on Kitchen',
      ),
    ).toBeTruthy();
    expect(
      renderIn(undefined, <ConnectBanner deviceName="Kitchen" />).getByText('Listening on Kitchen'),
    ).toBeTruthy();
  });
});

describe('media-card', () => {
  it('names an album card with its translated type and the explicit mark', () => {
    const { getByLabelText } = renderIn(
      'es',
      <AlbumCard
        title="Low Tide"
        artist="Mara Vell"
        year="2026"
        albumType="single"
        explicit
        onPress={noop}
      />,
    );
    expect(getByLabelText('Low Tide, Explícito, Sencillo, 2026, Mara Vell')).toBeTruthy();
  });

  it("puts the owner in the language's phrase, and ownerPrefix still wins", () => {
    expect(
      renderIn('fr', <PlaylistCard title="Late Hours" owner="Maya" onPress={noop} />).getByText(
        'Par Maya',
      ),
    ).toBeTruthy();
    expect(
      renderIn(
        'fr',
        <PlaylistCard title="Late Hours" owner="Maya" ownerPrefix="De" onPress={noop} />,
      ).getByText('De Maya'),
    ).toBeTruthy();
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

describe('queue-panel', () => {
  it('draws the empty queue in the locale', () => {
    const { getByText } = renderIn('fr', <QueuePanel />);
    expect(getByText("Votre file d'attente est vide")).toBeTruthy();
  });

  it("names rows with the language's phrase, and a labels.play still wins", () => {
    const track = { id: 't1', title: 'Night Drive', artists: 'Mara Vell' };
    expect(
      renderIn('ja', <QueuePanel nowPlaying={track} onPlay={noop} />).getByLabelText(
        'Night Driveを再生',
      ),
    ).toBeTruthy();
    expect(
      renderIn(
        'ja',
        <QueuePanel nowPlaying={track} onPlay={noop} labels={{ play: '聴く' }} />,
      ).getByLabelText('聴く Night Drive'),
    ).toBeTruthy();
    // A caller's word that happens to equal the catalog's is still the caller's:
    // its "<play> <title>" order is kept, not swapped for the catalog phrase.
    expect(
      renderIn(
        'ja',
        <QueuePanel nowPlaying={track} onPlay={noop} labels={{ play: '再生' }} />,
      ).getByLabelText('再生 Night Drive'),
    ).toBeTruthy();
  });
});

describe('track-list', () => {
  it('pluralises the selection count by the language’s rules, and clearLabel wins', () => {
    const one = renderIn('ru', <SelectionBar count={1} actions={[]} onClear={noop} />);
    expect(one.getByLabelText('Выбран 1 трек')).toBeTruthy();
    expect(one.getByLabelText('Снять выделение')).toBeTruthy();
    expect(
      renderIn('ru', <SelectionBar count={3} actions={[]} onClear={noop} />).getByLabelText(
        'Выбрано 3 трека',
      ),
    ).toBeTruthy();
    expect(
      renderIn(
        'ru',
        <SelectionBar count={5} actions={[]} onClear={noop} clearLabel="Сбросить" />,
      ).getByLabelText('Сбросить'),
    ).toBeTruthy();
  });

  it('names the episode menu with the common connector, not an English "for"', () => {
    const episode = { id: 'e1', title: 'Tide Tables', duration: 48 * 60 };
    const items = () => [{ key: 'share', label: 'Compartir', onPress: noop }];
    expect(
      renderIn(
        'es',
        <EpisodeRow episode={episode} menuItems={items} width={900} />,
      ).getAllByLabelText('Más opciones de Tide Tables').length,
    ).toBeGreaterThan(0);
    expect(
      renderIn(
        undefined,
        <EpisodeRow episode={episode} menuItems={items} width={900} />,
      ).getAllByLabelText('More options for Tide Tables').length,
    ).toBeGreaterThan(0);
    expect(messagesIn(COMMON_MESSAGES, 'es').labelFor('Más opciones', 'X')).not.toMatch(/\bfor\b/);
  });

  it('formats episode lengths with the language’s units', () => {
    expect(formatEpisodeLength(72 * 60)).toBe('1 hr 12 min');
    expect(formatEpisodeLength(72 * 60, messagesIn(TRACK_LIST_MESSAGES, 'de'))).toBe(
      '1 Std. 12 Min.',
    );
    expect(formatEpisodeRemaining(12 * 60, messagesIn(TRACK_LIST_MESSAGES, 'ja'))).toBe('残り12分');
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
