/**
 * @jest-environment jsdom
 *
 * Lyrics: the active-line maths, the scroll target, the preview window and the
 * contrast-safe palette as pure functions; then `LyricsView` and
 * `LyricsPreviewCard` through the REAL react-native-web, reading the emitted
 * DOM — names, `aria-current`, colours, weights, seeking and the
 * "Back to current line" pill.
 *
 * jsdom has no ResizeObserver, so `onLayout` never fires here and the
 * auto-scroll itself is verified in a real browser (see the stories); what it
 * scrolls TO is `lyricsScrollTarget`, pinned below.
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { APP_COLOR_PRESETS } from '../theme';
import { useTheme } from '../theme/use-theme';
import type { Theme } from '../theme/types';
import {
  activeLyricIndex,
  LyricsPreviewCard,
  LyricsView,
  lyricsScrollTarget,
  normalizeLyricLines,
  resolveLyricsPalette,
  type LyricLine,
} from '../lyrics';
import { BREAK_DOTS } from '../lyrics/LyricsParts';
import {
  contrastRatio,
  isSyncedLyrics,
  lyricLineVariant,
  lyricsPreviewWindow,
  lyricsSizeForWidth,
} from '../lyrics/shared';
import { TYPE_SCALE } from '../typography/scale';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;
let theme: Theme;

function ReadTheme() {
  theme = useTheme();
  return null;
}

function mount(
  ui: React.ReactElement,
  mode: 'light' | 'dark' = 'light',
  colorPreset: string = 'teal',
) {
  act(() => {
    root.render(
      <BloomThemeProvider mode={mode} colorPreset={colorPreset as 'teal'}>
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
  jest.useRealTimers();
});

function byTestId(id: string): HTMLElement {
  const el = container.querySelector(`[data-testid="${id}"]`);
  if (!(el instanceof HTMLElement)) throw new Error(`No element for testID "${id}"`);
  return el;
}

function normalise(color: string): string {
  const probe = document.createElement('div');
  probe.style.color = color;
  return probe.style.color;
}

const LINES: LyricLine[] = [
  { time: 5, text: 'First light on the harbour' },
  { time: 9, text: 'Gulls above the ferry' },
  { time: 13, text: '' },
  { time: 17, text: 'Salt upon the railing' },
  { time: 21, text: 'Wind across the water' },
  { time: 25, text: 'Home before the evening' },
  { time: 29, text: 'Lamps along the pier' },
];

describe('activeLyricIndex', () => {
  it('is -1 before the first line, with no lines, and for a non-finite time', () => {
    expect(activeLyricIndex(LINES, 0)).toBe(-1);
    expect(activeLyricIndex(LINES, 4.999)).toBe(-1);
    expect(activeLyricIndex([], 10)).toBe(-1);
    expect(activeLyricIndex(LINES, undefined)).toBe(-1);
    expect(activeLyricIndex(LINES, Number.NaN)).toBe(-1);
    expect(activeLyricIndex(LINES, Number.NEGATIVE_INFINITY)).toBe(-1);
  });

  it('makes a line active exactly at its time, and keeps it until the next', () => {
    expect(activeLyricIndex(LINES, 5)).toBe(0);
    expect(activeLyricIndex(LINES, 8.99)).toBe(0);
    expect(activeLyricIndex(LINES, 9)).toBe(1);
    expect(activeLyricIndex(LINES, 13)).toBe(2);
    expect(activeLyricIndex(LINES, 28.5)).toBe(5);
  });

  it('keeps the last line active from its time to the end and beyond', () => {
    expect(activeLyricIndex(LINES, 29)).toBe(6);
    expect(activeLyricIndex(LINES, 10_000)).toBe(6);
    expect(activeLyricIndex(LINES, Number.POSITIVE_INFINITY)).toBe(-1);
  });

  it('agrees with a linear scan at every quarter second', () => {
    for (let t = -1; t < 35; t += 0.25) {
      let expected = -1;
      LINES.forEach((line, i) => {
        if ((line.time as number) <= t) expected = i;
      });
      expect(activeLyricIndex(LINES, t)).toBe(expected);
    }
  });

  it('picks the LAST of several lines sharing one time', () => {
    const lines = [
      { time: 1, text: 'a' },
      { time: 4, text: 'b' },
      { time: 4, text: 'c' },
      { time: 8, text: 'd' },
    ];
    expect(activeLyricIndex(lines, 4)).toBe(2);
    expect(activeLyricIndex(lines, 3.9)).toBe(0);
  });

  it('works on unsorted input once normalized', () => {
    const shuffled = [LINES[4]!, LINES[0]!, LINES[6]!, LINES[2]!, LINES[1]!, LINES[5]!, LINES[3]!];
    const { lines, synced } = normalizeLyricLines(shuffled, undefined);
    expect(synced).toBe(true);
    expect(lines.map((l) => l.time)).toEqual([5, 9, 13, 17, 21, 25, 29]);
    expect(activeLyricIndex(lines, 22)).toBe(4);
  });
});

describe('normalizeLyricLines', () => {
  it('treats lines with any missing time as unsynced, and keeps their order', () => {
    const lines = [{ time: 3, text: 'a' }, { text: 'b' }, { time: 1, text: 'c' }];
    expect(isSyncedLyrics(lines)).toBe(false);
    expect(normalizeLyricLines(lines, undefined)).toEqual({ lines, synced: false });
  });

  it('splits plain text on line breaks when there are no lines', () => {
    const { lines, synced } = normalizeLyricLines([], 'one\r\ntwo\n\n three ');
    expect(synced).toBe(false);
    expect(lines.map((l) => l.text)).toEqual(['one', 'two', '', 'three']);
    expect(normalizeLyricLines(undefined, '   ').lines).toEqual([]);
  });

  it('keeps the original order of lines with equal times', () => {
    const { lines } = normalizeLyricLines(
      [{ time: 2, text: 'x' }, { time: 1, text: 'a' }, { time: 2, text: 'y' }],
      undefined,
    );
    expect(lines.map((l) => l.text)).toEqual(['a', 'x', 'y']);
  });
});

describe('lyricsScrollTarget', () => {
  it('puts the line centre a third of the way down', () => {
    // centre 500 + 22 = 522; a third of 600 is 200.
    expect(lyricsScrollTarget({ lineTop: 500, lineHeight: 44, viewport: 600, content: 3000 })).toBe(322);
  });

  it('honours a custom anchor', () => {
    expect(
      lyricsScrollTarget({ lineTop: 500, lineHeight: 44, viewport: 600, content: 3000, anchor: 0.5 }),
    ).toBe(222);
  });

  it('clamps to the top and to the end of the content', () => {
    expect(lyricsScrollTarget({ lineTop: 40, lineHeight: 44, viewport: 600, content: 3000 })).toBe(0);
    expect(lyricsScrollTarget({ lineTop: 2950, lineHeight: 44, viewport: 600, content: 3000 })).toBe(2400);
    expect(lyricsScrollTarget({ lineTop: 300, lineHeight: 44, viewport: 600, content: 400 })).toBe(0);
  });
});

describe('lyricsPreviewWindow', () => {
  it('shows the active line second, clamped to both ends', () => {
    expect(lyricsPreviewWindow(20, -1, 5)).toEqual({ start: 0, end: 5 });
    expect(lyricsPreviewWindow(20, 0, 5)).toEqual({ start: 0, end: 5 });
    expect(lyricsPreviewWindow(20, 7, 5)).toEqual({ start: 6, end: 11 });
    expect(lyricsPreviewWindow(20, 19, 5)).toEqual({ start: 15, end: 20 });
    expect(lyricsPreviewWindow(3, 2, 5)).toEqual({ start: 0, end: 3 });
    expect(lyricsPreviewWindow(20, 7, 4)).toEqual({ start: 6, end: 10 });
  });
});

describe('sizes', () => {
  it('steps by width and gives the active line the heavier weight at the same size', () => {
    expect(lyricsSizeForWidth(1024)).toBe('large');
    expect(lyricsSizeForWidth(720)).toBe('large');
    expect(lyricsSizeForWidth(719)).toBe('medium');
    expect(lyricsSizeForWidth(480)).toBe('medium');
    expect(lyricsSizeForWidth(390)).toBe('small');
    for (const size of ['large', 'medium', 'small'] as const) {
      const rest = TYPE_SCALE[lyricLineVariant(size, false)];
      const active = TYPE_SCALE[lyricLineVariant(size, true)];
      expect(active.fontSize).toBe(rest.fontSize);
      expect(active.lineHeight).toBe(rest.lineHeight);
      expect(Number(active.fontWeight)).toBeGreaterThan(Number(rest.fontWeight));
    }
  });
});

describe('resolveLyricsPalette', () => {
  const ARTWORK = ['#6d4bd8', '#1db98a', '#f4d35e', '#f7f3ea', '#ffffff', '#000000', '#d0473c', 'rgb(40 90 200)'];
  const presets = Object.keys(APP_COLOR_PRESETS);

  it('keeps active 7:1, upcoming 4.5:1 and past 3:1 for every artwork colour, preset and mode', () => {
    for (const preset of presets) {
      for (const mode of ['light', 'dark'] as const) {
        mount(<></>, mode, preset);
        for (const colour of [...ARTWORK, undefined]) {
          const p = resolveLyricsPalette(theme, colour);
          const label = `${preset}/${mode}/${colour}`;
          expect([label, contrastRatio(p.background, p.active) >= (colour ? 7 : 4.5)]).toEqual([label, true]);
          expect([label, contrastRatio(p.background, p.upcoming) >= 4.5]).toEqual([label, true]);
          expect([label, contrastRatio(p.background, p.past) >= 3]).toEqual([label, true]);
          expect([label, contrastRatio(p.pill, p.onPill) >= 4.5]).toEqual([label, true]);
          // Past is dimmer than upcoming, upcoming dimmer than active.
          expect(contrastRatio(p.background, p.past)).toBeLessThanOrEqual(contrastRatio(p.background, p.upcoming));
          expect(contrastRatio(p.background, p.upcoming)).toBeLessThan(contrastRatio(p.background, p.active));
        }
      }
    }
  });

  it('paints white text on a shade of the artwork colour', () => {
    mount(<></>);
    const p = resolveLyricsPalette(theme, '#6d4bd8');
    expect(p.fromArtwork).toBe(true);
    expect(p.active).toBe('#ffffff');
    expect(p.background).not.toBe('#6d4bd8');
  });

  it('falls back to the neutral surface and the theme text for absent or unparseable colours', () => {
    mount(<></>);
    for (const colour of [undefined, null, '', 'not-a-colour', 'var(--x)']) {
      const p = resolveLyricsPalette(theme, colour);
      expect(p.fromArtwork).toBe(false);
      expect(p.active).toBe(theme.colors.text);
    }
    expect(resolveLyricsPalette(theme, 'nope').background).toBe(resolveLyricsPalette(theme).background);
  });
});

describe('LyricsView', () => {
  it('is a named region; seekable lines are buttons named by their words', () => {
    mount(<LyricsView lines={LINES} currentTime={18} onSeekLine={() => {}} testID="v" />);
    const region = byTestId('v');
    expect(region.getAttribute('role')).toBe('region');
    expect(region.getAttribute('aria-label')).toBe('Lyrics');
    const buttons = [...container.querySelectorAll('[role="button"]')];
    // The blank line is a gap, not a control.
    expect(buttons.map((b) => b.getAttribute('aria-label'))).toEqual(
      LINES.filter((l) => l.text).map((l) => l.text),
    );
  });

  it('marks exactly the active line current, and paints past / active / upcoming', () => {
    mount(<LyricsView lines={LINES} currentTime={18} onSeekLine={() => {}} artworkColor="#6d4bd8" testID="v" />);
    const current = container.querySelectorAll('[aria-current="true"]');
    expect(current).toHaveLength(1);
    expect(current[0]).toBe(byTestId('v-line-3'));
    const palette = resolveLyricsPalette(theme, '#6d4bd8');
    const text = (i: number) => byTestId(`v-line-${i}`).querySelector('div, span') as HTMLElement;
    expect(text(0).style.color).toBe(normalise(palette.past));
    expect(text(3).style.color).toBe(normalise(palette.active));
    expect(text(4).style.color).toBe(normalise(palette.upcoming));
    expect(Number(text(3).style.fontWeight)).toBeGreaterThan(Number(text(4).style.fontWeight));
    expect(byTestId('v').style.backgroundColor).toBe(normalise(palette.background));
  });

  it('has no current line before the first, and draws the break dots on an active blank line', () => {
    mount(<LyricsView lines={LINES} currentTime={2} testID="v" />);
    expect(container.querySelectorAll('[aria-current]')).toHaveLength(0);
    mount(<LyricsView lines={LINES} currentTime={14} testID="v" />);
    expect(byTestId('v-line-2').getAttribute('aria-current')).toBe('true');
    expect(byTestId('v-line-2').textContent).toBe(BREAK_DOTS);
    mount(<LyricsView lines={LINES} currentTime={18} testID="v" />);
    expect(byTestId('v-line-2').textContent).toBe('');
  });

  it('seeks with the pressed line and its index', () => {
    const onSeekLine = jest.fn();
    mount(<LyricsView lines={LINES} currentTime={18} onSeekLine={onSeekLine} testID="v" />);
    act(() => byTestId('v-line-5').click());
    expect(onSeekLine).toHaveBeenCalledWith(LINES[5], 5);
  });

  it('draws no controls without onSeekLine', () => {
    mount(<LyricsView lines={LINES} currentTime={18} testID="v" />);
    expect(container.querySelectorAll('[role="button"]')).toHaveLength(0);
  });

  it('draws unsynced text plainly: full colour, no current line, no controls', () => {
    const onSeekLine = jest.fn();
    mount(<LyricsView text={'one\ntwo'} currentTime={100} onSeekLine={onSeekLine} testID="v" />);
    expect(container.querySelectorAll('[role="button"]')).toHaveLength(0);
    expect(container.querySelectorAll('[aria-current]')).toHaveLength(0);
    const palette = resolveLyricsPalette(theme);
    const text = byTestId('v-line-1').querySelector('div, span') as HTMLElement;
    expect(text.textContent).toBe('two');
    expect(text.style.color).toBe(normalise(palette.active));
  });

  it('draws the empty text and the provider footer', () => {
    mount(<LyricsView lines={[]} emptyText="No words here" testID="v" />);
    expect(byTestId('v').textContent).toBe('No words here');
    mount(<LyricsView lines={LINES} currentTime={6} providerText="Lyrics provided by the label" testID="v" />);
    expect(byTestId('v').textContent).toContain('Lyrics provided by the label');
  });

  it('shows "Back to current line" after a user scroll, returns on press, and resumes after the delay', () => {
    jest.useFakeTimers();
    mount(<LyricsView lines={LINES} currentTime={18} resumeDelay={3000} testID="v" />);
    expect(container.querySelector('[data-testid="v-back"]')).toBeNull();

    const scroll = byTestId('v-scroll');
    act(() => {
      scroll.dispatchEvent(new WheelEvent('wheel', { deltaY: 200, bubbles: true }));
    });
    const pill = byTestId('v-back');
    expect(pill.getAttribute('role')).toBe('button');
    expect(pill.getAttribute('aria-label')).toBe('Back to current line');

    act(() => pill.click());
    expect(container.querySelector('[data-testid="v-back"]')).toBeNull();

    act(() => {
      scroll.dispatchEvent(new WheelEvent('wheel', { deltaY: 200, bubbles: true }));
    });
    expect(container.querySelector('[data-testid="v-back"]')).not.toBeNull();
    act(() => {
      jest.advanceTimersByTime(2999);
    });
    expect(container.querySelector('[data-testid="v-back"]')).not.toBeNull();
    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(container.querySelector('[data-testid="v-back"]')).toBeNull();
  });

  it('never shows the pill for unsynced lyrics or before the first line', () => {
    mount(<LyricsView text={'a\nb'} testID="v" />);
    act(() => {
      byTestId('v-scroll').dispatchEvent(new WheelEvent('wheel', { deltaY: 200, bubbles: true }));
    });
    expect(container.querySelector('[data-testid="v-back"]')).toBeNull();
    mount(<LyricsView lines={LINES} currentTime={1} testID="v" />);
    act(() => {
      byTestId('v-scroll').dispatchEvent(new WheelEvent('wheel', { deltaY: 200, bubbles: true }));
    });
    expect(container.querySelector('[data-testid="v-back"]')).toBeNull();
  });
});

describe('LyricsPreviewCard', () => {
  const MANY: LyricLine[] = Array.from({ length: 12 }, (_, i) => ({ time: i * 4, text: `Line ${i}` }));

  it('shows five lines with the active one second, and the show-lyrics button', () => {
    const onShowLyrics = jest.fn();
    mount(<LyricsPreviewCard lines={MANY} currentTime={17} onShowLyrics={onShowLyrics} testID="c" />);
    const card = byTestId('c');
    expect(card.getAttribute('role')).toBe('region');
    expect(card.getAttribute('aria-label')).toBe('Lyrics');
    expect(card.style.borderTopLeftRadius).toBe('16px');
    expect(card.style.borderBottomRightRadius).toBe('16px');
    const shown = [...card.querySelectorAll('[data-testid^="c-line-"]')].map((el) => el.textContent);
    expect(shown).toEqual(['Line 3', 'Line 4', 'Line 5', 'Line 6', 'Line 7']);
    expect(byTestId('c-line-4').getAttribute('aria-current')).toBe('true');
    const button = byTestId('c-show');
    expect(button.getAttribute('aria-label')).toBe('Show lyrics');
    act(() => button.click());
    expect(onShowLyrics).toHaveBeenCalledTimes(1);
  });

  it('shows four lines when asked, clamps at the end, and seeks', () => {
    const onSeekLine = jest.fn();
    mount(<LyricsPreviewCard lines={MANY} currentTime={999} visibleLines={4} onSeekLine={onSeekLine} testID="c" />);
    const shown = [...byTestId('c').querySelectorAll('[data-testid^="c-line-"]')].map((el) => el.textContent);
    expect(shown).toEqual(['Line 8', 'Line 9', 'Line 10', 'Line 11']);
    act(() => byTestId('c-line-9').click());
    expect(onSeekLine).toHaveBeenCalledWith(MANY[9], 9);
  });

  it('shows the first lines of unsynced text, skipping verse gaps, with no button without onShowLyrics', () => {
    mount(<LyricsPreviewCard text={'a\n\nb\nc\n\nd\ne\nf'} testID="c" />);
    const shown = [...byTestId('c').querySelectorAll('[data-testid^="c-line-"]')].map((el) => el.textContent);
    expect(shown).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(container.querySelector('[data-testid="c-show"]')).toBeNull();
  });
});
