/**
 * @jest-environment jsdom
 *
 * The music cards, rendered through the REAL react-native-web so the
 * assertions read the emitted DOM: names on the link, the hover-reveal hooks,
 * cover geometry, the mosaic fallback, progress values and contrast.
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import type { Theme } from '../theme/types';
import {
  AlbumCard,
  ArtistCard,
  AudiobookCard,
  EpisodeCard,
  EventCard,
  FriendActivityCard,
  GenreCard,
  MediaCard,
  MixCard,
  PlaylistCard,
  PodcastCard,
  ProfileCard,
  QuickAccessTile,
  RecapCard,
  ShareCard,
  SongCard,
} from '../media-card';
import { episodeProgressState } from '../media-card/EpisodeCard';
import { playlistCoverKind } from '../media-card/PlaylistCard';
import {
  contrastRatio,
  COVER_TEXT_CONTRAST,
  MEDIA_CARD_CSS,
  resolveCoverTint,
  resolveMediaCardPaint,
  resolvePlayVisibility,
} from '../media-card/shared';
import { ImageResolverProvider } from '../image-resolver/context';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;
let theme: Theme;

function ReadTheme() {
  theme = useTheme();
  return null;
}

function mount(ui: React.ReactElement, mode: 'light' | 'dark' = 'light') {
  act(() => {
    root.render(
      <BloomThemeProvider mode={mode} colorPreset="teal">
        <ReadTheme />
        {ui}
      </BloomThemeProvider>,
    );
  });
}

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function byTestId(id: string): HTMLElement {
  const el = container.querySelector(`[data-testid="${id}"]`);
  if (!(el instanceof HTMLElement)) throw new Error(`No element for testID "${id}"`);
  return el;
}

function query(id: string): HTMLElement | null {
  return container.querySelector(`[data-testid="${id}"]`);
}

function normalise(color: string): string {
  const probe = document.createElement('div');
  probe.style.backgroundColor = color;
  return probe.style.backgroundColor;
}

const noop = () => undefined;

/** react-native-web writes a radius as its four longhands. */
function radius(id: string): string {
  const style = byTestId(id).style;
  return style.borderRadius || style.borderTopLeftRadius;
}
const ART = 'https://example.test/cover.jpg';

describe('resolvePlayVisibility', () => {
  it('draws nothing without onPlay or with never', () => {
    expect(resolvePlayVisibility({ hasOnPlay: false, playing: true, web: true })).toBe('none');
    expect(resolvePlayVisibility({ hasOnPlay: true, mode: 'never', playing: true, web: true })).toBe('none');
  });

  it('reveals on hover on web, and is not drawn on native, at rest', () => {
    expect(resolvePlayVisibility({ hasOnPlay: true, web: true })).toBe('hover');
    expect(resolvePlayVisibility({ hasOnPlay: true, web: false })).toBe('none');
  });

  it('stays visible while playing, loading or current, and with always', () => {
    for (const state of [{ playing: true }, { loading: true }, { current: true }, { mode: 'always' as const }]) {
      expect(resolvePlayVisibility({ hasOnPlay: true, web: true, ...state })).toBe('visible');
      expect(resolvePlayVisibility({ hasOnPlay: true, web: false, ...state })).toBe('visible');
    }
  });
});

describe('resolveCoverTint', () => {
  it('keeps light text at 4.5:1 over both gradient stops, for dark, bright and pale colours', () => {
    mount(<></>);
    for (const mode of ['light', 'dark'] as const) {
      mount(<></>, mode);
      for (const color of ['#7c3aed', '#e0a800', '#f5e9a8', '#bae6fd', '#0e7490', '#ffffff', '#000000']) {
        const tint = resolveCoverTint(theme, color);
        expect(contrastRatio(tint.top, tint.text)).toBeGreaterThanOrEqual(COVER_TEXT_CONTRAST);
        expect(contrastRatio(tint.bottom, tint.text)).toBeGreaterThanOrEqual(COVER_TEXT_CONTRAST);
      }
    }
  });

  it('falls back to neutral without a colour or with one that does not parse', () => {
    mount(<></>);
    const neutral = resolveCoverTint(theme);
    expect(resolveCoverTint(theme, 'not-a-colour')).toEqual(neutral);
    expect(contrastRatio(neutral.top, neutral.text)).toBeGreaterThanOrEqual(COVER_TEXT_CONTRAST);
  });

  it('keeps a colour that already clears the bar at its own 500 stop', () => {
    mount(<></>);
    const tint = resolveCoverTint(theme, '#7c3aed');
    expect(normalise(tint.top)).toBe(normalise('#7c3aed'));
  });
});

describe('the card link', () => {
  it('names the card from title, type and subtitle, and is a button with onPress', () => {
    mount(<SongCard title="Night Drive" artists={['Mara Vell', 'Juno Park']} explicit artwork={ART} onPress={noop} testID="s" />);
    const link = byTestId('s-link');
    expect(link.getAttribute('role')).toBe('button');
    expect(link.getAttribute('aria-label')).toBe('Night Drive, Explicit, Song, Mara Vell, Juno Park');
  });

  it('is a real anchor with href on web', () => {
    mount(<AlbumCard title="Low Tide" artist="Mara Vell" year="2026" href="/album/low-tide" testID="a" />);
    const link = byTestId('a-link');
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('/album/low-tide');
    expect(link.getAttribute('aria-label')).toBe('Low Tide, Album, 2026, Mara Vell');
  });

  it('is a sibling of the play button and the menu trigger, never their ancestor', () => {
    mount(<SongCard title="Night Drive" artwork={ART} onPress={noop} onPlay={noop} menuItems={[{ label: 'Share' }]} testID="s" />);
    const link = byTestId('s-link');
    expect(link.querySelector('[role="button"]')).toBeNull();
    expect(link.children.length).toBe(0);
    expect(byTestId('s-menu').getAttribute('aria-label')).toBe('More options for Night Drive');
    expect(byTestId('s-play').querySelector('[aria-label="Play Night Drive"]')).not.toBeNull();
  });

  it('marks the selected card with aria-current and the selected wash', () => {
    mount(<SongCard title="x" selected onPress={noop} testID="s" />);
    expect(byTestId('s-link').getAttribute('aria-current')).toBe('true');
    expect(byTestId('s').style.backgroundColor).toBe(normalise(resolveMediaCardPaint(theme).selected));
    mount(<SongCard title="x" onPress={noop} testID="s" />);
    expect(byTestId('s-link').hasAttribute('aria-current')).toBe(false);
    expect(byTestId('s').style.backgroundColor).toBe('');
  });

  it('hangs the hover wash off a data attribute, set only on a pressable card', () => {
    mount(<SongCard title="x" onPress={noop} testID="s" />);
    expect(byTestId('s').hasAttribute('data-bloom-media-card-hover')).toBe(true);
    expect(byTestId('s').style.getPropertyValue('--bloom-media-card-hover')).not.toBe('');
    mount(<SongCard title="x" testID="s" />);
    expect(byTestId('s').hasAttribute('data-bloom-media-card-hover')).toBe(false);
  });
});

describe('the play button', () => {
  it('is revealed on hover at rest and always shown while playing', () => {
    mount(<SongCard title="x" onPlay={noop} testID="s" />);
    expect(byTestId('s-play').getAttribute('data-bloom-media-card-reveal')).toBe('hover');
    mount(<SongCard title="x" onPlay={noop} playing testID="s" />);
    expect(byTestId('s-play').hasAttribute('data-bloom-media-card-reveal')).toBe(false);
    expect(byTestId('s-play').querySelector('[aria-label="Pause x"]')).not.toBeNull();
    mount(<SongCard title="x" testID="s" />);
    expect(query('s-play')).toBeNull();
  });

  it('sits bottom-right on a tile and centred on a row cover', () => {
    mount(<SongCard title="x" onPlay={noop} testID="s" />);
    expect(byTestId('s-play').style.right).toBe('8px');
    expect(byTestId('s-play').style.bottom).toBe('8px');
    mount(<SongCard title="x" layout="row" onPlay={noop} testID="s" />);
    expect(byTestId('s-play').style.width).toBe('56px');
    expect(byTestId('s-play').style.justifyContent).toBe('center');
  });

  it('reveals without scale: the sheet animates opacity and a translate only', () => {
    expect(MEDIA_CARD_CSS).toContain('[data-bloom-media-card-reveal="hover"]');
    expect(MEDIA_CARD_CSS).toContain(':focus-within [data-bloom-media-card-reveal="hover"]');
    expect(MEDIA_CARD_CSS).not.toMatch(/scale/);
    expect(MEDIA_CARD_CSS).toContain('prefers-reduced-motion');
  });
});

describe('covers', () => {
  it('draws the tile sizes 200 / 160 / 120 and row sizes 56 / 48', () => {
    for (const [size, px] of [['large', 200], ['medium', 160], ['small', 120]] as const) {
      mount(<AlbumCard title="x" size={size} testID="a" />);
      expect(byTestId('a-artwork').style.width).toBe(`${px}px`);
      expect(byTestId('a').style.width).toBe(`${px + 24}px`);
    }
    mount(<AlbumCard title="x" layout="row" testID="a" />);
    expect(byTestId('a-artwork').style.width).toBe('56px');
    mount(<AlbumCard title="x" layout="row" size="small" testID="a" />);
    expect(byTestId('a-artwork').style.width).toBe('48px');
  });

  it('rounds an artist and a profile, squares an album (8, 6 small and in rows) and a show (12)', () => {
    mount(<ArtistCard name="x" testID="c" />);
    expect(radius('c-artwork')).toBe('9999px');
    mount(<ProfileCard name="x" testID="c" />);
    expect(radius('c-artwork')).toBe('9999px');
    mount(<AlbumCard title="x" testID="c" />);
    expect(radius('c-artwork')).toBe('8px');
    mount(<AlbumCard title="x" size="small" testID="c" />);
    expect(radius('c-artwork')).toBe('6px');
    mount(<AlbumCard title="x" layout="row" testID="c" />);
    expect(radius('c-artwork')).toBe('6px');
    mount(<PodcastCard title="x" testID="c" />);
    expect(radius('c-artwork')).toBe('12px');
  });

  it('draws an audiobook 2:3', () => {
    mount(<AudiobookCard title="x" testID="b" />);
    expect(byTestId('b-artwork').style.width).toBe('160px');
    expect(byTestId('b-artwork').style.height).toBe('240px');
  });

  it('resolves an id through the ImageResolver and passes a URL through', () => {
    const resolver = jest.fn((id: string) => `https://cdn.test/${id}.jpg`);
    mount(
      <ImageResolverProvider value={resolver}>
        <AlbumCard title="x" artwork="cover-1" artworkVariant="thumb" testID="a" />
        <AlbumCard title="y" artwork={ART} testID="b" />
      </ImageResolverProvider>,
    );
    expect(resolver).toHaveBeenCalledWith('cover-1', 'thumb');
    expect(resolver).not.toHaveBeenCalledWith(ART, expect.anything());
  });
});

describe('PlaylistCard covers', () => {
  it('prefers artwork, then the mosaic, then a generated cover', () => {
    expect(playlistCoverKind(ART, [ART])).toBe('artwork');
    expect(playlistCoverKind(undefined, [ART])).toBe('mosaic');
    expect(playlistCoverKind(undefined, [])).toBe('generated');
    expect(playlistCoverKind(undefined, ['', ''])).toBe('generated');
    expect(playlistCoverKind(undefined, undefined)).toBe('generated');
  });

  it('draws four cells for four covers and fills missing cells with the placeholder', () => {
    mount(<PlaylistCard title="x" mosaic={[ART, ART, ART, ART, ART]} testID="p" />);
    expect(byTestId('p-mosaic').children.length).toBe(4);
    mount(<PlaylistCard title="x" mosaic={[ART, ART]} testID="p" />);
    const paint = resolveMediaCardPaint(theme);
    expect(byTestId('p-mosaic-2').style.backgroundColor).toBe(normalise(paint.placeholder));
    expect(byTestId('p-mosaic-3').style.backgroundColor).toBe(normalise(paint.placeholder));
    expect(byTestId('p-mosaic-2').style.width).toBe('80px');
  });

  it('generates a gradient cover from artworkColor', () => {
    mount(<PlaylistCard title="x" artworkColor="#2f7d6d" testID="p" />);
    expect(query('p-mosaic')).toBeNull();
    expect(byTestId('p-artwork').querySelector('svg linearGradient')).not.toBeNull();
  });

  it('names the owner line and the collaborative mark', () => {
    mount(<PlaylistCard title="Late Hours" owner="Maya" trackCount="42 songs" collaborative onPress={noop} testID="p" />);
    expect(byTestId('p-link').getAttribute('aria-label')).toBe('Late Hours, Playlist, Collaborative, By Maya · 42 songs');
  });
});

describe('SongCard', () => {
  it('draws artist links over the card link when onPressArtist is set', () => {
    const onPressArtist = jest.fn();
    mount(<SongCard title="x" artists={['Mara Vell', { name: 'Juno Park', id: 'juno' }]} onPressArtist={onPressArtist} onPress={noop} testID="s" />);
    const artist = byTestId('s-artist-1');
    expect(artist.getAttribute('role')).toBe('link');
    expect(byTestId('s-link').contains(artist)).toBe(false);
    act(() => artist.click());
    expect(onPressArtist).toHaveBeenCalledWith({ name: 'Juno Park', id: 'juno' }, 1);
    expect(byTestId('s-link').getAttribute('aria-label')).toBe('x, Song, Mara Vell, Juno Park');
  });

  it('shows the now-playing bars and accent title while current', () => {
    mount(<SongCard title="x" current playing onPress={noop} testID="s" />);
    expect(container.querySelector('[aria-label="Now playing"]')).not.toBeNull();
    expect(byTestId('s-title').style.color).toBe(normalise(resolveMediaCardPaint(theme).accent));
    expect(byTestId('s-link').getAttribute('aria-label')).toBe('x, Song, Now playing');
  });

  it('draws a like toggle and the duration in the row layout only', () => {
    const onLikedChange = jest.fn();
    mount(<SongCard title="x" layout="row" duration="3:45" liked onLikedChange={onLikedChange} testID="s" />);
    const like = container.querySelector('[aria-label="Save x to Your Library"]') as HTMLElement;
    expect(like.getAttribute('aria-pressed')).toBe('true');
    expect(container.textContent).toContain('3:45');
    mount(<SongCard title="x" duration="3:45" liked onLikedChange={onLikedChange} testID="s" />);
    expect(container.querySelector('[aria-label="Save x to Your Library"]')).toBeNull();
  });

  it('draws the skeleton busy', () => {
    mount(<SongCard title="x" skeleton testID="s" />);
    expect(byTestId('s').getAttribute('aria-busy')).toBe('true');
    expect(query('s-link')).toBeNull();
  });
});

describe('EpisodeCard progress', () => {
  it('picks played, progress or nothing', () => {
    expect(episodeProgressState(true, 0.4)).toBe('played');
    expect(episodeProgressState(false, 0.4)).toBe('progress');
    expect(episodeProgressState(false, 0)).toBe('none');
    expect(episodeProgressState(false, undefined)).toBe('none');
    expect(episodeProgressState(false, Number.NaN)).toBe('none');
  });

  it('draws a named progressbar with its value and the remaining time in the name', () => {
    mount(<EpisodeCard title="Tide Tables" show="Slow Signals" date="12 Sep" duration="48 min" progress={0.62} remaining="18 min left" onPress={noop} testID="e" />);
    const bar = byTestId('e-progress');
    expect(bar.getAttribute('role')).toBe('progressbar');
    expect(bar.getAttribute('aria-label')).toBe('Tide Tables progress');
    expect(bar.getAttribute('aria-valuenow')).toBe('62');
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
    expect(bar.getAttribute('aria-valuemax')).toBe('100');
    expect(byTestId('e-progress-fill').style.width).toBe('62%');
    expect(byTestId('e-link').getAttribute('aria-label')).toBe('Tide Tables, Episode, Slow Signals, 12 Sep · 48 min, 18 min left');
  });

  it('replaces the bar with the played check', () => {
    mount(<EpisodeCard title="x" progress={0.5} played onPress={noop} testID="e" />);
    expect(query('e-progress')).toBeNull();
    expect(byTestId('e-played').textContent).toBe('Played');
    expect(byTestId('e-link').getAttribute('aria-label')).toBe('x, Episode, Played');
  });

  it('always draws the play button in the row layout, outside the cover', () => {
    mount(<EpisodeCard title="x" layout="row" onPlay={noop} testID="e" />);
    expect(byTestId('e-play').getAttribute('aria-label')).toBe('Play x');
    expect(byTestId('e-play').closest('[data-bloom-media-card-reveal]')).toBeNull();
    expect(byTestId('e-artwork').style.width).toBe('96px');
  });
});

describe('AudiobookCard', () => {
  it('draws the listened fraction', () => {
    mount(<AudiobookCard title="x" author="Ines Calder" narrator="Teo Marsh" progress={1.4} onPress={noop} testID="b" />);
    expect(byTestId('b-progress').getAttribute('aria-valuenow')).toBe('100');
    expect(byTestId('b-link').getAttribute('aria-label')).toBe('x, Audiobook, Ines Calder, Narrated by Teo Marsh');
  });
});

describe('the other cards', () => {
  it('ArtistCard names the verified mark and followers', () => {
    mount(<ArtistCard name="Mara Vell" verified followers="1.2M followers" onPress={noop} testID="a" />);
    expect(byTestId('a-link').getAttribute('aria-label')).toBe('Mara Vell, Verified, Artist, 1.2M followers');
  });

  it('MixCard generates its cover with the cover title', () => {
    mount(<MixCard title="Daily Mix 1" description="Mara Vell and more" artworkColor="#7c3aed" onPress={noop} testID="m" />);
    expect(byTestId('m-cover').textContent).toContain('Daily Mix 1');
    expect(byTestId('m-cover').querySelector('svg linearGradient')).not.toBeNull();
    expect(byTestId('m-link').getAttribute('aria-label')).toBe('Daily Mix 1, Mix, Mara Vell and more');
  });

  it('GenreCard keeps its title legible, rotates its cover 25° and is 8-radius', () => {
    mount(<GenreCard title="Folk" color="#f5e9a8" artwork={ART} onPress={noop} testID="g" />);
    const tile = byTestId('g');
    const tint = resolveCoverTint(theme, '#f5e9a8');
    expect(tile.style.backgroundColor).toBe(normalise(tint.top));
    expect(contrastRatio(tint.top, tint.text)).toBeGreaterThanOrEqual(4.5);
    expect(radius('g')).toBe('8px');
    expect(byTestId('g-artwork').style.transform).toContain('rotate(25deg)');
    expect(byTestId('g-link').getAttribute('aria-label')).toBe('Folk');
  });

  it('EventCard names the date and the sold-out state, which replaces the action', () => {
    mount(
      <EventCard title="Mara Vell" month="Oct" day="14" venue="The Lantern Hall" city="Porto" soldOut action={<button>Tickets</button>} onPress={noop} testID="ev" />,
    );
    expect(byTestId('ev-link').getAttribute('aria-label')).toBe('Mara Vell, Event, Oct 14, The Lantern Hall · Porto, Sold out');
    expect(byTestId('ev-sold-out').textContent).toBe('Sold out');
    expect(container.textContent).not.toContain('Tickets');
  });

  it('ProfileCard names follows-you', () => {
    mount(<ProfileCard name="Maya" followsYou onPress={noop} testID="p" />);
    expect(byTestId('p-link').getAttribute('aria-label')).toBe('Maya, Profile, Follows you');
  });

  it('FriendActivityCard draws the live dot and bars instead of the time', () => {
    mount(<FriendActivityCard name="Maya" track="Night Drive" artist="Mara Vell" context="Late Hours" live time="2 min" onPress={noop} testID="f" />);
    expect(query('f-live-dot')).not.toBeNull();
    expect(byTestId('f-live').getAttribute('aria-label')).toBe('Listening now');
    expect(container.textContent).not.toContain('2 min');
    expect(byTestId('f-link').getAttribute('aria-label')).toBe('Maya, Listening now, Night Drive by Mara Vell, Late Hours');
    mount(<FriendActivityCard name="Maya" track="Night Drive" artist="Mara Vell" time="2 min" onPress={noop} testID="f" />);
    expect(query('f-live-dot')).toBeNull();
    expect(container.textContent).toContain('2 min');
  });

  it('QuickAccessTile swaps the bars for the pause button on hover while current (web)', () => {
    mount(<QuickAccessTile title="Late Hours" typeLabel="Playlist" current playing onPlay={noop} onPress={noop} testID="q" />);
    expect(byTestId('q-now-playing').parentElement?.hasAttribute('data-bloom-media-card-conceal')).toBe(true);
    expect(byTestId('q-play').getAttribute('data-bloom-media-card-reveal')).toBe('hover');
    expect(byTestId('q-link').getAttribute('aria-label')).toBe('Late Hours, Playlist, Now playing');
    expect(byTestId('q').style.backgroundColor).toBe(normalise(resolveMediaCardPaint(theme).tile));
    expect(byTestId('q').style.height).toBe('56px');
  });

  it('RecapCard names its share button; ShareCard draws the lyrics', () => {
    const onShare = jest.fn();
    mount(<RecapCard value="48,210" unit="minutes" artworkColor="#7c3aed" onShare={onShare} testID="r" />);
    const share = byTestId('r-share');
    expect(share.getAttribute('aria-label')).toBe('Share');
    act(() => share.click());
    expect(onShare).toHaveBeenCalled();
    mount(<ShareCard title="Night Drive" artist="Mara Vell" lyrics={['one', 'two']} testID="sh" />);
    expect(byTestId('sh-lyrics').textContent).toBe('onetwo');
  });

  it('MediaCard takes an eyebrow, description and footer directly', () => {
    mount(
      <MediaCard title="Custom" eyebrow="Live" description="Something" typeLabel="Session" footer={<span>foot</span>} onPress={noop} testID="c" />,
      'dark',
    );
    expect(container.textContent).toContain('Live');
    expect(container.textContent).toContain('foot');
    expect(byTestId('c-link').getAttribute('aria-label')).toBe('Custom, Session');
  });
});
