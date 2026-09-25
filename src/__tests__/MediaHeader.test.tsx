/**
 * @jest-environment jsdom
 *
 * The media headers, rendered through the REAL react-native-web so the
 * assertions read the emitted DOM — plus the pure colour and title-size maths
 * walked over every preset, mode and a sweep of artwork colours.
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { buildTheme } from '../theme/build-theme';
import { surfaceFillOn } from '../styles/surface-levels';
import { APP_COLOR_PRESETS } from '../theme/color-presets';
import { srgbToOklch } from '../theme/color-space';
import { parseRgba } from '../theme/color-utils';
import type { Theme } from '../theme/types';
import { useTheme } from '../theme/use-theme';
import { TYPE_SCALE } from '../typography/scale';
import {
  ArtistAbout,
  ArtistHero,
  ArtistStats,
  AudiobookHeader,
  CollectionHeader,
  DiscographyFilter,
  DownloadButton,
  EpisodeHeader,
  FollowButton,
  MediaActionBar,
  mediaHeaderScrollProgress,
  PodcastShowHeader,
  PopularTracks,
  ProfileHeader,
  resolveMediaHeaderPaint,
  selectTitleVariant,
  ShuffleButton,
  StickyMediaTopBar,
  TITLE_STEPS,
} from '../media-header';
import { tintArtworkColor } from '../media-header/shared';
import { AA_TEXT_CONTRAST, contrastRatio, readableOn } from '../styles/color-contrast';

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

function queryTestId(id: string): HTMLElement | null {
  return container.querySelector(`[data-testid="${id}"]`);
}

function normalise(color: string): string {
  const probe = document.createElement('div');
  probe.style.color = color;
  return probe.style.color;
}

// ---------------------------------------------------------------------------
//  Colour
// ---------------------------------------------------------------------------

const PRESETS = Object.keys(APP_COLOR_PRESETS) as (keyof typeof APP_COLOR_PRESETS)[];

/** Twelve hues at three lightnesses, plus the extremes a backend can send. */
const ARTWORK: string[] = [
  '#000000',
  '#ffffff',
  '#808080',
  '#ff0000',
  '#00ff00',
  '#0000ff',
  '#ffff00',
  '#1f3b73',
  '#c8d96f',
  '#ff5fa2',
  'rgb(12, 200, 180)',
];
for (let h = 0; h < 360; h += 30) {
  for (const l of [20, 50, 85]) {
    // hsl → hex via the DOM would need jsdom; build it by hand.
    const c = (1 - Math.abs((2 * l) / 100 - 1)) * 1;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l / 100 - c / 2;
    const [r, g, b] =
      h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
    const hex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
    ARTWORK.push(`#${hex(r)}${hex(g)}${hex(b)}`);
  }
}

describe('resolveMediaHeaderPaint', () => {
  it('reads a real sweep', () => {
    expect(PRESETS.length).toBeGreaterThanOrEqual(5);
    expect(ARTWORK.length).toBe(11 + 36);
  });

  it('keeps band text at AA over both ends of the band, for every preset × mode × artwork colour', () => {
    const failures: string[] = [];
    let checked = 0;
    for (const preset of PRESETS) {
      for (const mode of ['light', 'dark'] as const) {
        const t = buildTheme(preset, mode);
        for (const color of [...ARTWORK, undefined]) {
          const p = resolveMediaHeaderPaint(t, color);
          for (const [name, fg] of [['onBand', p.onBand], ['onBandMuted', p.onBandMuted]] as const) {
            for (const surface of [p.bandTop, p.bandBottom]) {
              checked++;
              const ratio = contrastRatio(fg, surface);
              if (ratio < AA_TEXT_CONTRAST) failures.push(`${preset}/${mode}/${color}/${name}: ${ratio.toFixed(2)}`);
            }
          }
          checked++;
          if (contrastRatio(p.onBar, p.bar) < AA_TEXT_CONTRAST) failures.push(`${preset}/${mode}/${color}/bar`);
        }
      }
    }
    expect(checked).toBe(PRESETS.length * 2 * (ARTWORK.length + 1) * 5);
    expect(failures).toEqual([]);
  });

  it('makes the muted band text visibly different from the primary one', () => {
    const p = resolveMediaHeaderPaint(buildTheme('teal', 'light'), '#1f3b73');
    expect(p.onBandMuted).not.toBe(p.onBand);
  });

  it('falls back to a theme surface when the artwork colour is absent or unparsable', () => {
    for (const mode of ['light', 'dark'] as const) {
      const t = buildTheme('teal', mode);
      const none = resolveMediaHeaderPaint(t);
      const junk = resolveMediaHeaderPaint(t, 'not-a-colour');
      const real = resolveMediaHeaderPaint(t, '#ff5fa2');
      expect(none.fallback).toBe(true);
      expect(junk.fallback).toBe(true);
      expect(junk.bandTop).toBe(none.bandTop);
      expect(real.fallback).toBe(false);
      expect(real.bandTop).not.toBe(none.bandTop);
      expect(none.bandTop).toBe(surfaceFillOn(t, t.colors.background));
    }
  });

  it('pulls the artwork colour into the mode’s lightness band and keeps its hue', () => {
    for (const color of ['#000000', '#ffffff', '#ff0000', '#1f3b73', '#c8d96f']) {
      const light = srgbToOklch(parseRgba(tintArtworkColor(color, false)!)!);
      const dark = srgbToOklch(parseRgba(tintArtworkColor(color, true)!)!);
      expect(light.l).toBeGreaterThanOrEqual(0.655);
      expect(light.l).toBeLessThanOrEqual(0.845);
      expect(dark.l).toBeGreaterThanOrEqual(0.295);
      expect(dark.l).toBeLessThanOrEqual(0.445);
      expect(light.c).toBeLessThanOrEqual(0.145);
    }
    const src = srgbToOklch(parseRgba('#1f3b73')!);
    const tinted = srgbToOklch(parseRgba(tintArtworkColor('#1f3b73', false)!)!);
    expect(Math.abs(tinted.h - src.h)).toBeLessThan(6);
  });

  it('picks the candidate with the best WORST contrast', () => {
    expect(readableOn(['#ffffff', '#eeeeee'], ['#ffffff', '#111111'])).toBe('#111111');
    expect(readableOn(['#101010', '#303030'], ['#111111', '#ffffff'])).toBe('#ffffff');
    // A gradient from white to black: the mid-grey end decides.
    expect(readableOn(['#ffffff', '#555555'], ['#000000', '#ffffff'])).toBe('#000000');
  });
});

// ---------------------------------------------------------------------------
//  Title size
// ---------------------------------------------------------------------------

describe('selectTitleVariant', () => {
  it('uses the display steps of the type ramp, largest first', () => {
    const sizes = TITLE_STEPS.map((s) => TYPE_SCALE[s.variant].fontSize);
    expect(sizes).toEqual([64, 56, 48, 40, 32, 24]);
    expect(TITLE_STEPS.every((s) => s.variant.endsWith('-bold'))).toBe(true);
  });

  it('gives a short title the largest step on a wide line', () => {
    expect(selectTitleVariant('Moss', 900)).toBe('large-title-bold');
    expect(selectTitleVariant('Liked Songs', 900)).toBe('large-title-bold');
  });

  it('steps down as the title grows, never up', () => {
    const order = TITLE_STEPS.map((s) => s.variant);
    let last = 0;
    for (let n = 1; n <= 140; n += 3) {
      const idx = order.indexOf(selectTitleVariant('x'.repeat(n), 900));
      expect(idx).toBeGreaterThanOrEqual(last);
      last = idx;
    }
    expect(last).toBe(order.length - 1);
  });

  it('picks the step whose estimated line count fits', () => {
    // 33 chars: 64px ≈ 1183 (2 lines at 900, over its 1-line allowance),
    // 56px ≈ 1035 (2 lines), 48px ≈ 887 → display-2 on one line.
    expect(selectTitleVariant('Midnight Harbour Sessions, Vol. 2', 900)).toBe('display-2-bold');
    expect(selectTitleVariant('Midnight Harbour Sessions, Vol. 2', 1100)).toBe('display-1-bold');
    expect(selectTitleVariant('Midnight Harbour Sessions, Vol. 2', 1200)).toBe('large-title-bold');
  });

  it('never goes above display-4 on a phone-width line', () => {
    expect(selectTitleVariant('Moss', 358)).toBe('display-4-bold');
    expect(selectTitleVariant('Road trip to the northern lakes, summer edition, part two', 358)).toBe('title-1-bold');
  });
});

describe('mediaHeaderScrollProgress', () => {
  it('is 0 before start, 1 from end, linear between', () => {
    expect(mediaHeaderScrollProgress(0, 200, 280)).toBe(0);
    expect(mediaHeaderScrollProgress(240, 200, 280)).toBe(0.5);
    expect(mediaHeaderScrollProgress(500, 200, 280)).toBe(1);
    expect(mediaHeaderScrollProgress(200, 200, 200)).toBe(1);
  });
});

// ---------------------------------------------------------------------------
//  CollectionHeader
// ---------------------------------------------------------------------------

describe('CollectionHeader', () => {
  const owners = [{ name: 'Velvet Harbour', avatar: 'https://example.test/a.jpg', onPress: jest.fn() }];

  it('renders the title as a level-1 heading on the band colour, with the chosen step', () => {
    mount(
      <CollectionHeader
        typeLabel="Album"
        title="Moss"
        artworkColor="#1f3b73"
        owners={owners}
        year="2025"
        summary="12 songs, 48 min"
        testID="h"
      />,
    );
    const title = byTestId('h-title');
    expect(title.getAttribute('role')).toBe('heading');
    expect(title.getAttribute('aria-level')).toBe('1');
    const paint = resolveMediaHeaderPaint(theme, '#1f3b73');
    expect(title.style.color).toBe(normalise(paint.onBand));
    // jsdom lays nothing out; the frame assumes a desktop width before layout.
    expect(title.getAttribute('data-bloom-media-header-title')).toBe(selectTitleVariant('Moss', 1024 - 48 - 232 - 24));
    expect(title.style.fontSize).toBe('64px');
    expect(container.textContent).toContain('Album');
    expect(container.textContent).toContain('2025');
    expect(container.textContent).toContain('12 songs, 48 min');
  });

  it('makes owner names links and presses them', () => {
    mount(<CollectionHeader typeLabel="Album" title="Moss" owners={owners} testID="h" />);
    const link = container.querySelector('[role="link"][aria-label="Velvet Harbour"]') as HTMLElement;
    expect(link).not.toBeNull();
    act(() => link.click());
    expect(owners[0]!.onPress).toHaveBeenCalledTimes(1);
  });

  it('draws the cover at 232 with a radius of 6', () => {
    mount(<CollectionHeader typeLabel="Album" title="Moss" cover="https://example.test/c.jpg" testID="h" />);
    const cover = byTestId('h-cover');
    expect(cover.style.width).toBe('232px');
    expect(cover.style.height).toBe('232px');
    expect(cover.style.borderTopLeftRadius || cover.style.borderRadius).toContain('6px');
  });

  it('exposes an edit affordance only when editable with a handler', () => {
    const onEdit = jest.fn();
    mount(<CollectionHeader typeLabel="Playlist" title="Mix" onEdit={onEdit} testID="h" />);
    expect(queryTestId('h-edit')).toBeNull();

    mount(<CollectionHeader typeLabel="Playlist" title="Mix" editable onEdit={onEdit} testID="h" />);
    const edit = byTestId('h-edit');
    expect(edit.getAttribute('role')).toBe('button');
    expect(edit.getAttribute('aria-label')).toBe('Edit details');
    expect(queryTestId('h-edit-badge')).not.toBeNull();
    act(() => edit.click());
    const titleButton = container.querySelector('[aria-label="Edit details: Mix"]') as HTMLElement;
    act(() => titleButton.click());
    expect(onEdit).toHaveBeenCalledTimes(2);
  });

  it('tints the liked-songs band from the accent, not the artwork colour', () => {
    mount(<CollectionHeader variant="liked" typeLabel="Playlist" title="Liked Songs" artworkColor="#00ff00" testID="h" />);
    const green = resolveMediaHeaderPaint(theme, '#00ff00');
    const title = byTestId('h-title');
    // Not green-derived, and the cover draws the heart, not an image.
    expect(byTestId('h-cover').querySelector('img')).toBeNull();
    expect(byTestId('h-cover').querySelector('svg')).not.toBeNull();
    expect(title.style.color).toBeTruthy();
    expect(green.fallback).toBe(false);
  });
});

// ---------------------------------------------------------------------------
//  Action bar
// ---------------------------------------------------------------------------

describe('MediaActionBar', () => {
  it('draws only the controls whose handlers are given', () => {
    mount(<MediaActionBar playing={false} playSubject="Moss" testID="a" />);
    expect(byTestId('a-play').getAttribute('aria-label')).toBe('Play Moss');
    expect(byTestId('a-play').style.width).toBe('56px');
    for (const id of ['shuffle', 'like', 'follow', 'download', 'more', 'search', 'view']) {
      expect(queryTestId(`a-${id}`)).toBeNull();
    }
    mount(
      <MediaActionBar
        playing={false}
        onShuffleChange={() => {}}
        onLikedChange={() => {}}
        onFollowChange={() => {}}
        onDownloadPress={() => {}}
        onMorePress={() => {}}
        onSearchPress={() => {}}
        onViewChange={() => {}}
        testID="a"
      />,
    );
    for (const id of ['shuffle', 'like', 'follow', 'download', 'more', 'search', 'view']) {
      expect(queryTestId(`a-${id}`)).not.toBeNull();
    }
    expect(byTestId('a-more').getAttribute('aria-label')).toBe('More options');
    expect(byTestId('a-search').getAttribute('aria-label')).toBe('Search in playlist');
  });

  it('toggles the view with one name and aria-pressed', () => {
    const onViewChange = jest.fn();
    mount(<MediaActionBar playing={false} view="list" onViewChange={onViewChange} testID="a" />);
    const view = byTestId('a-view');
    expect(view.getAttribute('aria-label')).toBe('Compact view');
    expect(view.getAttribute('aria-pressed')).toBe('false');
    act(() => view.click());
    expect(onViewChange).toHaveBeenCalledWith('compact');
  });
});

describe('ShuffleButton', () => {
  it('is a toggle with a fixed name, accent glyph and a dot when on', () => {
    const onShuffleChange = jest.fn();
    mount(<ShuffleButton shuffle={false} onShuffleChange={onShuffleChange} testID="s" />);
    const el = byTestId('s');
    expect(el.getAttribute('role')).toBe('button');
    expect(el.getAttribute('aria-label')).toBe('Shuffle');
    expect(el.getAttribute('aria-pressed')).toBe('false');
    const paint = resolveMediaHeaderPaint(theme);
    expect(el.querySelector('path')?.getAttribute('fill')).toBe(paint.textMuted);
    expect(el.children.length).toBe(1);
    act(() => el.click());
    expect(onShuffleChange).toHaveBeenCalledWith(true);

    mount(<ShuffleButton shuffle onShuffleChange={onShuffleChange} testID="s" />);
    const on = byTestId('s');
    expect(on.getAttribute('aria-pressed')).toBe('true');
    expect(on.getAttribute('aria-label')).toBe('Shuffle');
    expect(on.querySelector('path')?.getAttribute('fill')).toBe(paint.accent);
    expect(on.children.length).toBe(2);
  });
});

describe('DownloadButton', () => {
  it('keeps one name; pressed once downloaded, busy with a named progressbar while downloading', () => {
    mount(<DownloadButton state="idle" onPress={() => {}} testID="d" />);
    expect(byTestId('d').getAttribute('aria-label')).toBe('Download');
    expect(byTestId('d').getAttribute('aria-pressed')).toBe('false');
    expect(byTestId('d').hasAttribute('aria-busy')).toBe(false);
    expect(queryTestId('d-progress')).toBeNull();

    mount(<DownloadButton state="downloading" progress={0.42} onPress={() => {}} testID="d" />);
    expect(byTestId('d').getAttribute('aria-label')).toBe('Download');
    expect(byTestId('d').getAttribute('aria-busy')).toBe('true');
    const bar = byTestId('d-progress');
    expect(bar.getAttribute('role')).toBe('progressbar');
    expect(bar.getAttribute('aria-label')).toBe('Download progress');
    expect(bar.getAttribute('aria-valuenow')).toBe('42');
    expect(bar.getAttribute('aria-valuemax')).toBe('100');

    const onPress = jest.fn();
    mount(<DownloadButton state="downloaded" onPress={onPress} testID="d" />);
    expect(byTestId('d').getAttribute('aria-pressed')).toBe('true');
    act(() => byTestId('d').click());
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('clamps progress', () => {
    mount(<DownloadButton state="downloading" progress={7} onPress={() => {}} testID="d" />);
    expect(byTestId('d-progress').getAttribute('aria-valuenow')).toBe('100');
  });
});

describe('FollowButton', () => {
  it('preserves toggle state and blocks interaction while loading', () => {
    const onFollowChange = jest.fn();
    mount(<FollowButton following loading size="large" textStyle={{ fontSize: 18 }} onFollowChange={onFollowChange} testID="f" />);
    const el = byTestId('f');
    expect(el.getAttribute('aria-busy')).toBe('true');
    expect(el.getAttribute('aria-pressed')).toBe('true');
    act(() => el.click());
    expect(onFollowChange).not.toHaveBeenCalled();
    mount(<FollowButton following size="large" onFollowChange={onFollowChange} testID="f" />);
    act(() => byTestId('f').click());
    expect(onFollowChange).toHaveBeenCalledWith(false);
  });

  it('keeps its name and toggle semantics in icon-only mode without activating a parent', () => {
    const parent = jest.fn();
    const onFollowChange = jest.fn();
    mount(<div onClick={parent}><FollowButton following iconOnly tone="action" onFollowChange={onFollowChange} testID="f" /></div>);
    const el = byTestId('f');
    expect(el.getAttribute('aria-label')).toBe('Follow');
    expect(el.getAttribute('aria-pressed')).toBe('true');
    expect(el.textContent).toBe('');
    act(() => el.click());
    expect(onFollowChange).toHaveBeenCalledWith(false);
    expect(parent).not.toHaveBeenCalled();
  });

  it('is a surface button toggle: label flips, name and pressed state carry the meaning', () => {
    const onFollowChange = jest.fn();
    mount(<FollowButton following={false} onFollowChange={onFollowChange} testID="f" />);
    const el = byTestId('f');
    expect(el.getAttribute('aria-label')).toBe('Follow');
    expect(el.getAttribute('aria-pressed')).toBe('false');
    expect(el.textContent).toContain('Follow');
    expect(el.style.borderTopWidth || el.style.borderWidth || '0px').toBe('0px');
    expect(el.style.height).toBe('32px');
    act(() => el.click());
    expect(onFollowChange).toHaveBeenCalledWith(true);

    mount(<FollowButton following onFollowChange={onFollowChange} label="Save" followingLabel="Saved" testID="f" />);
    expect(byTestId('f').textContent).toContain('Saved');
    expect(byTestId('f').getAttribute('aria-label')).toBe('Save');
    expect(byTestId('f').getAttribute('aria-pressed')).toBe('true');
  });

  it('takes a caller-supplied name and hint that follow the state', () => {
    const onFollowChange = jest.fn();
    mount(<FollowButton following onFollowChange={onFollowChange}
      accessibilityLabel="Following @nate" accessibilityHint="Unfollows @nate" testID="f" />);
    const el = byTestId('f');
    expect(el.getAttribute('aria-label')).toBe('Following @nate');
    expect(el.getAttribute('aria-pressed')).toBe('true');
    // The visible labels are untouched by the accessible name.
    expect(el.textContent).toContain('Following');
    expect(el.textContent).not.toContain('@nate');
  });
});

// ---------------------------------------------------------------------------
//  Sticky bar
// ---------------------------------------------------------------------------

describe('StickyMediaTopBar', () => {
  it('fills with the band colour and names its play button by the title', () => {
    mount(<StickyMediaTopBar title="Moss" playing={false} artworkColor="#1f3b73" visible testID="t" />);
    const paint = resolveMediaHeaderPaint(theme, '#1f3b73');
    expect(byTestId('t').style.height).toBe('64px');
    expect(byTestId('t-play').getAttribute('aria-label')).toBe('Play Moss');
    const fill = byTestId('t').firstElementChild as HTMLElement;
    expect(fill.style.backgroundColor).toBe(normalise(paint.bar));
  });

  it('hides itself from assistive tech and the pointer below half progress', () => {
    mount(<StickyMediaTopBar title="Moss" playing={false} progress={0.3} testID="t" />);
    expect(byTestId('t').getAttribute('aria-hidden')).toBe('true');
    expect(byTestId('t').style.pointerEvents || getComputedStyle(byTestId('t')).pointerEvents).toBe('none');
    mount(<StickyMediaTopBar title="Moss" playing={false} progress={0.8} testID="t" />);
    expect(byTestId('t').getAttribute('aria-hidden')).not.toBe('true');
    mount(<StickyMediaTopBar title="Moss" playing={false} visible={false} testID="t" />);
    expect(byTestId('t').getAttribute('aria-hidden')).toBe('true');
  });
});

// ---------------------------------------------------------------------------
//  Artist
// ---------------------------------------------------------------------------

describe('ArtistHero', () => {
  it('draws the verified line, the name heading and the listeners', () => {
    mount(<ArtistHero name="Velvet Harbour" verified listeners="1,234,567 monthly listeners" artworkColor="#a0522d" testID="a" />);
    expect(byTestId('a-verified').textContent).toBe('Verified artist');
    expect(byTestId('a-name').getAttribute('role')).toBe('heading');
    expect(byTestId('a-name').textContent).toBe('Velvet Harbour');
    expect(byTestId('a-listeners').textContent).toBe('1,234,567 monthly listeners');
    // No banner: a round avatar and band-coloured text.
    const avatar = byTestId('a-avatar');
    expect(avatar.style.width).toBe('232px');
    expect(byTestId('a-name').style.color).toBe(normalise(resolveMediaHeaderPaint(theme, '#a0522d').onBand));
  });

  it('puts white text over a banner photo and omits the avatar', () => {
    mount(<ArtistHero name="Velvet Harbour" banner="https://example.test/b.jpg" testID="a" />, 'light');
    expect(queryTestId('a-banner')).not.toBeNull();
    expect(queryTestId('a-avatar')).toBeNull();
    expect(byTestId('a-name').style.color).toBe(normalise('#ffffff'));
    expect(queryTestId('a-verified')).toBeNull();
  });
});

describe('ArtistStats and ArtistAbout', () => {
  it('announces each stat as one element, value then label', () => {
    mount(
      <ArtistStats
        stats={[
          { value: '1,204,331', label: 'Followers' },
          { value: '1,234,567', label: 'Monthly listeners' },
        ]}
        testID="s"
      />,
    );
    expect(byTestId('s-0').getAttribute('aria-label')).toBe('1,204,331 Followers');
    expect(byTestId('s-1').getAttribute('aria-label')).toBe('1,234,567 Monthly listeners');
  });

  it('clamps a long bio behind an expandable toggle and lists cities', () => {
    mount(
      <ArtistAbout
        bio={'A long bio. '.repeat(40)}
        cities={[{ city: 'Kessel', count: '84,120 listeners' }]}
        testID="ab"
      />,
    );
    const toggle = byTestId('ab-bio').querySelector('[role="button"]') as HTMLElement;
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    act(() => toggle.click());
    expect((byTestId('ab-bio').querySelector('[role="button"]') as HTMLElement).getAttribute('aria-expanded')).toBe('true');
    expect(byTestId('ab-cities').querySelector('[aria-label="Kessel, 84,120 listeners"]')).not.toBeNull();
  });
});

describe('PopularTracks', () => {
  const tracks = Array.from({ length: 12 }, (_, i) => ({
    id: String(i),
    title: `Track ${i + 1}`,
    plays: '1,000',
    duration: '3:00',
  }));

  it('shows five rows, expands to ten, and carries aria-expanded', () => {
    const onExpandedChange = jest.fn();
    mount(<PopularTracks tracks={tracks} onExpandedChange={onExpandedChange} testID="p" />);
    expect(container.querySelectorAll('[role="listitem"]').length).toBe(5);
    const toggle = byTestId('p-toggle');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(toggle.textContent).toBe('See more');
    act(() => toggle.click());
    expect(container.querySelectorAll('[role="listitem"]').length).toBe(10);
    expect(byTestId('p-toggle').getAttribute('aria-expanded')).toBe('true');
    expect(onExpandedChange).toHaveBeenCalledWith(true);
  });

  it('marks the current track and presses a row', () => {
    const onTrackPress = jest.fn();
    mount(<PopularTracks tracks={tracks} activeTrackId="1" onTrackPress={onTrackPress} testID="p" />);
    const row = byTestId('p-row-1').querySelector('[role="button"]') as HTMLElement;
    expect(row.getAttribute('aria-label')).toBe('Track 2');
    expect(row.getAttribute('aria-current')).toBe('true');
    act(() => row.click());
    expect(onTrackPress).toHaveBeenCalledWith(tracks[1], 1);
  });

  it('draws no toggle when there is nothing to expand', () => {
    mount(<PopularTracks tracks={tracks.slice(0, 4)} testID="p" />);
    expect(queryTestId('p-toggle')).toBeNull();
  });
});

describe('DiscographyFilter', () => {
  it('draws the three default chips with the chosen one pressed', () => {
    const onValueChange = jest.fn();
    mount(<DiscographyFilter value="singles" onValueChange={onValueChange} testID="d" />);
    expect(byTestId('d-albums').getAttribute('aria-pressed')).toBe('false');
    expect(byTestId('d-singles').getAttribute('aria-pressed')).toBe('true');
    expect(byTestId('d-compilations').textContent).toBe('Compilations');
    act(() => byTestId('d-albums').click());
    expect(onValueChange).toHaveBeenCalledWith('albums');
  });
});

// ---------------------------------------------------------------------------
//  Podcast, episode, profile, audiobook
// ---------------------------------------------------------------------------

describe('PodcastShowHeader', () => {
  it('draws the publisher link, rating, follow pill and the latest episode', () => {
    const onPlayPress = jest.fn();
    mount(
      <PodcastShowHeader
        title="The Lighthouse Hours"
        publisher="Kessel Bay Audio"
        onPublisherPress={() => {}}
        rating={4.8}
        ratingCount={210}
        categories={['History']}
        following={false}
        onFollowChange={() => {}}
        latestEpisode={{ title: 'Episode 112', date: 'Sep 15', duration: '48 min', onPlayPress }}
        testID="p"
      />,
    );
    expect(byTestId('p-publisher').getAttribute('role')).toBe('link');
    expect(queryTestId('p-rating')).not.toBeNull();
    expect(byTestId('p-follow').getAttribute('aria-pressed')).toBe('false');
    expect(byTestId('p-latest').textContent).toContain('Latest episode');
    expect(byTestId('p-latest-play').getAttribute('aria-label')).toBe('Play Episode 112');
    act(() => byTestId('p-latest-play').click());
    expect(onPlayPress).toHaveBeenCalledTimes(1);
  });
});

describe('EpisodeHeader', () => {
  it('links the show, reports progress and toggles save', () => {
    const onSavedChange = jest.fn();
    mount(
      <EpisodeHeader
        title="Episode 112"
        showTitle="The Lighthouse Hours"
        onShowPress={() => {}}
        playing={false}
        progress={0.52}
        remainingLabel="23 min left"
        saved={false}
        onSavedChange={onSavedChange}
        onSharePress={() => {}}
        testID="e"
      />,
    );
    expect(byTestId('e-show').getAttribute('aria-label')).toBe('The Lighthouse Hours');
    expect(byTestId('e-progress').getAttribute('aria-valuenow')).toBe('52');
    expect(byTestId('e-save').getAttribute('aria-pressed')).toBe('false');
    expect(byTestId('e-save').getAttribute('aria-label')).toBe('Save episode');
    act(() => byTestId('e-save').click());
    expect(onSavedChange).toHaveBeenCalledWith(true);
    expect(byTestId('e-share').getAttribute('aria-label')).toBe('Share');
  });
});

describe('ProfileHeader', () => {
  it('makes pressable counts links and shows follow or edit', () => {
    const onPress = jest.fn();
    mount(
      <ProfileHeader
        name="Jun Okafor"
        stats={[{ label: '12 public playlists', onPress }, { label: '48 followers' }]}
        following
        onFollowChange={() => {}}
        testID="p"
      />,
    );
    expect(container.textContent).toContain('Profile');
    const link = byTestId('p-stats').querySelector('[role="link"]') as HTMLElement;
    expect(link.getAttribute('aria-label')).toBe('12 public playlists');
    expect(byTestId('p-stats').querySelectorAll('[role="link"]').length).toBe(1);
    act(() => link.click());
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(byTestId('p-follow').getAttribute('aria-pressed')).toBe('true');
    expect(byTestId('p-avatar').style.width).toBe('232px');
  });
});

describe('AudiobookHeader', () => {
  it('draws a 2:3 cover and a named progress bar', () => {
    mount(
      <AudiobookHeader
        title="The Cartographer of Low Tides"
        author="Wren Calloway"
        narrator="Narrated by Ada Moss"
        duration="11 h 42 min"
        chapters="32 chapters"
        progress={0.35}
        testID="b"
      />,
    );
    expect(byTestId('b-cover').style.width).toBe('200px');
    expect(byTestId('b-cover').style.height).toBe('300px');
    const bar = byTestId('b-progress');
    expect(bar.getAttribute('role')).toBe('progressbar');
    expect(bar.getAttribute('aria-label')).toBe('Listening progress');
    expect(bar.getAttribute('aria-valuenow')).toBe('35');
    expect(container.textContent).toContain('32 chapters');
  });
});
