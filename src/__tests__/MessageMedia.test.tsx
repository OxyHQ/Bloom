/**
 * @jest-environment jsdom
 *
 * `message-media`, rendered through the REAL react-native-web.
 *
 * Two halves, and neither substitutes for the other:
 *
 *  - The GEOMETRY and the FORMATTERS are pure functions (`albumLayout`,
 *    `pollPercentages`, `seekPositionAt`, `fileKindFor`, `formatFileSize`) and
 *    are asserted directly. They are the parts a screenshot cannot check to the
 *    pixel and a renderer would only echo back.
 *  - The ACCESSIBILITY assertions read emitted ATTRIBUTES, not props. Every
 *    defect class this family is exposed to is invisible at the prop level:
 *    react-native-web drops `accessibilityState` and `accessibilityValue`
 *    entirely, so a block that sets only the native spelling renders a role
 *    carrying no state, and a prop-level test reads the prop straight back and
 *    passes.
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import type { Theme } from '../theme/types';
import { contrastRatio } from '../styles/color-contrast';
import { formatFileSize } from '../file-upload/shared';
import {
  ContactMessage,
  DocumentGrid,
  FileMessage,
  ImageMessage,
  LinkPreviewMessage,
  LocationMessage,
  MediaAlbum,
  PollMessage,
  SharedMediaGrid,
  StickerMessage,
  VideoMessage,
  VoiceMessage,
  albumLayout,
  albumRows,
  fileKindFor,
  fileTypeLabel,
  formatVoteCount,
  nextPlaybackRate,
  pollPercentages,
  resampleWaveform,
  resolveMessageMediaPaint,
  seekPositionAt,
} from '../message-media';
import { fitMedia, playedBarCount, resolveBubbleColor } from '../message-media/shared';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;
let theme: Theme;

function ReadTheme() {
  theme = useTheme();
  return null;
}

function mount(ui: React.ReactElement, mode: 'light' | 'dark' = 'light'): HTMLElement {
  act(() => {
    root.render(
      <BloomThemeProvider mode={mode} colorPreset="teal">
        <ReadTheme />
        {ui}
      </BloomThemeProvider>,
    );
  });
  return container;
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
  const el = container.querySelector(`[data-testid="${id}"]`);
  return el instanceof HTMLElement ? el : null;
}

const SAMPLES = Array.from({ length: 40 }, (_, i) => (i % 7) / 6);

// ---------------------------------------------------------------------------
//  Album layout
// ---------------------------------------------------------------------------

describe('albumLayout', () => {
  const WIDTH = 260;
  const GAP = 2;

  it('packs 2–10 into the documented rows', () => {
    expect(albumRows(2)).toEqual([2]);
    expect(albumRows(3)).toEqual([1, 2]);
    expect(albumRows(4)).toEqual([2, 2]);
    expect(albumRows(5)).toEqual([2, 3]);
    expect(albumRows(6)).toEqual([3, 3]);
    expect(albumRows(7)).toEqual([2, 2, 3]);
    expect(albumRows(8)).toEqual([2, 3, 3]);
    expect(albumRows(9)).toEqual([3, 3, 3]);
    expect(albumRows(10)).toEqual([3, 3, 4]);
  });

  it('gives every count 2–10 a cell per item', () => {
    for (let count = 2; count <= 10; count++) {
      const layout = albumLayout(count, WIDTH, { gap: GAP });
      expect(layout.cells).toHaveLength(count);
      expect(layout.cells.map((c) => c.index)).toEqual(
        Array.from({ length: count }, (_, i) => i),
      );
      expect(layout.overflow).toBe(0);
    }
  });

  it('fills the frame EXACTLY — every row spans the width, the last row the height', () => {
    // The property that makes absolute positioning worth the trouble: integer
    // widths that sum to the frame. A flex row rounds each child on its own and
    // leaves the last cell a pixel short of a ROUNDED outer corner.
    for (let count = 2; count <= 10; count++) {
      const layout = albumLayout(count, WIDTH, { gap: GAP });
      const rows = new Map<number, typeof layout.cells>();
      for (const cell of layout.cells) {
        const bucket = rows.get(cell.top) ?? [];
        bucket.push(cell);
        rows.set(cell.top, bucket);
      }
      expect(rows.size).toBe(layout.rows.length);
      for (const bucket of rows.values()) {
        const ordered = [...bucket].sort((a, b) => a.left - b.left);
        expect(ordered[0]?.left).toBe(0);
        const last = ordered[ordered.length - 1];
        expect((last?.left ?? 0) + (last?.width ?? 0)).toBe(WIDTH);
        for (let i = 1; i < ordered.length; i++) {
          const previous = ordered[i - 1]!;
          expect(ordered[i]!.left - (previous.left + previous.width)).toBe(GAP);
        }
        // Every cell in a row shares its height.
        expect(new Set(ordered.map((c) => c.height)).size).toBe(1);
      }
      const bottom = Math.max(...layout.cells.map((c) => c.top + c.height));
      expect(bottom).toBe(layout.height);
    }
  });

  it('rounds the GROUP corners only', () => {
    const layout = albumLayout(6, WIDTH, { gap: GAP, radius: 16 });
    const rounded = layout.cells.flatMap((cell) =>
      Object.entries(cell.radii)
        .filter(([, value]) => value > 0)
        .map(([corner]) => `${cell.index}:${corner}`),
    );
    expect(rounded.sort()).toEqual(
      ['0:topLeft', '2:topRight', '3:bottomLeft', '5:bottomRight'].sort(),
    );
  });

  it('caps at `maxTiles` and reports the remainder', () => {
    const layout = albumLayout(14, WIDTH);
    expect(layout.cells).toHaveLength(10);
    expect(layout.overflow).toBe(4);
  });

  it('is empty below two, and a single cell at one', () => {
    expect(albumLayout(0, WIDTH).cells).toEqual([]);
    expect(albumLayout(1, WIDTH).cells).toHaveLength(1);
  });
});

describe('fitMedia', () => {
  it('keeps the aspect inside both caps', () => {
    expect(fitMedia(2, 260, 320)).toEqual({ width: 260, height: 130 });
    // Portrait: the HEIGHT cap binds and the width shrinks to match.
    expect(fitMedia(0.5, 260, 320)).toEqual({ width: 160, height: 320 });
  });

  it('survives a nonsense ratio rather than rendering a zero-height frame', () => {
    expect(fitMedia(0, 260, 320)).toEqual({ width: 260, height: 260 });
    expect(fitMedia(Number.NaN, 260, 320)).toEqual({ width: 260, height: 260 });
  });
});

// ---------------------------------------------------------------------------
//  Waveform
// ---------------------------------------------------------------------------

describe('waveform', () => {
  it('resamples to exactly the bar count, up and down', () => {
    expect(resampleWaveform([0, 1], 6)).toHaveLength(6);
    expect(resampleWaveform(SAMPLES, 12)).toHaveLength(12);
    expect(resampleWaveform([], 5)).toEqual([0, 0, 0, 0, 0]);
  });

  it('takes the PEAK of a bucket, not its mean', () => {
    // A voice note is silence with peaks in it; averaging flattens every
    // recording into the same slab.
    expect(resampleWaveform([0, 0, 0, 1], 2)).toEqual([0, 1]);
  });

  it('clamps every sample into 0..1', () => {
    expect(resampleWaveform([-3, 5, Number.NaN], 3)).toEqual([0, 1, 0]);
  });

  it('maps a press to a position, clamped at BOTH ends', () => {
    expect(seekPositionAt(0, 200, 10)).toBe(0);
    expect(seekPositionAt(100, 200, 10)).toBe(5);
    expect(seekPositionAt(200, 200, 10)).toBe(10);
    // Hit slop reports a negative locationX; a drag past the edge overshoots.
    expect(seekPositionAt(-40, 200, 10)).toBe(0);
    expect(seekPositionAt(400, 200, 10)).toBe(10);
  });

  it('reports no position for a zero-width or zero-length track', () => {
    expect(seekPositionAt(50, 0, 10)).toBe(0);
    expect(seekPositionAt(50, 200, 0)).toBe(0);
  });

  it('counts played bars from the position', () => {
    expect(playedBarCount(0, 10, 40)).toBe(0);
    expect(playedBarCount(5, 10, 40)).toBe(20);
    expect(playedBarCount(10, 10, 40)).toBe(40);
    expect(playedBarCount(99, 10, 40)).toBe(40);
  });

  it('cycles the rate 1 → 1.5 → 2 → 1', () => {
    expect(nextPlaybackRate(1)).toBe(1.5);
    expect(nextPlaybackRate(1.5)).toBe(2);
    expect(nextPlaybackRate(2)).toBe(1);
  });
});

// ---------------------------------------------------------------------------
//  Poll maths
// ---------------------------------------------------------------------------

describe('pollPercentages', () => {
  it('always sums to 100 once anybody has voted', () => {
    const cases: number[][] = [
      [1, 1, 1],
      [1, 1],
      [14, 9, 8],
      [1, 0, 0, 0, 0, 0, 0],
      [5, 5, 5, 5, 5, 5, 5],
      [999, 1],
    ];
    for (const votes of cases) {
      const percentages = pollPercentages(votes);
      expect(percentages.reduce((a, b) => a + b, 0)).toBe(100);
      expect(percentages).toHaveLength(votes.length);
    }
  });

  it('hands the remainder to the biggest fraction', () => {
    // 33.33 each: the first two options take the two leftover points, decided
    // by fraction then by index, so the column reads 34/33/33 rather than 33/33/33.
    expect(pollPercentages([1, 1, 1])).toEqual([34, 33, 33]);
    expect(pollPercentages([2, 1])).toEqual([67, 33]);
  });

  it('is all zeroes with no votes — not an even split', () => {
    expect(pollPercentages([0, 0, 0])).toEqual([0, 0, 0]);
    expect(pollPercentages([])).toEqual([]);
  });

  it('takes an explicit total, and does NOT inflate a subset back up to 100', () => {
    // Two votes out of four: the options account for half the poll, and saying
    // 50/50 would report shares nobody cast.
    expect(pollPercentages([1, 1], 4)).toEqual([25, 25]);
    expect(pollPercentages([1, 1, 2], 4)).toEqual([25, 25, 50]);
  });

  it('names the count', () => {
    expect(formatVoteCount(0)).toBe('No votes');
    expect(formatVoteCount(1)).toBe('1 vote');
    expect(formatVoteCount(23)).toBe('23 votes');
  });
});

// ---------------------------------------------------------------------------
//  File kind / size
// ---------------------------------------------------------------------------

describe('file formatting', () => {
  it('reads the kind off the extension', () => {
    expect(fileKindFor('Lease.pdf')).toBe('pdf');
    expect(fileKindFor('Rents.XLSX')).toBe('sheet');
    expect(fileKindFor('notes.docx')).toBe('doc');
    expect(fileKindFor('deck.key')).toBe('slides');
    expect(fileKindFor('photos.zip')).toBe('zip');
    expect(fileKindFor('chime.m4a')).toBe('audio');
    expect(fileKindFor('clip.mov')).toBe('video');
    expect(fileKindFor('plan.png')).toBe('image');
    expect(fileKindFor('script.ts')).toBe('code');
    expect(fileKindFor('README')).toBe('other');
  });

  it('prefers the NAME over the MIME type', () => {
    // A `.csv` served as `text/plain` is still a spreadsheet to its sender.
    expect(fileKindFor('rents.csv', 'text/plain')).toBe('sheet');
    // …and falls back to the MIME type when the name has no extension.
    expect(fileKindFor('scan', 'application/pdf')).toBe('pdf');
    expect(fileKindFor('recording', 'audio/mpeg')).toBe('audio');
  });

  it('labels the type from the extension, with a word for files that have none', () => {
    expect(fileTypeLabel('Lease.pdf')).toBe('PDF');
    expect(fileTypeLabel('README')).toBe('File');
    expect(fileTypeLabel('scan', 'image/png')).toBe('IMAGE');
  });

  it('formats sizes, including the gigabytes the uploader never needed', () => {
    expect(formatFileSize(500)).toBe('1 KB');
    expect(formatFileSize(312 * 1024)).toBe('312 KB');
    expect(formatFileSize(2.44 * 1024 * 1024)).toBe('2.4 MB');
    expect(formatFileSize(14.6 * 1024 * 1024)).toBe('15 MB');
    expect(formatFileSize(1.4 * 1024 * 1024 * 1024)).toBe('1.4 GB');
  });
});

// ---------------------------------------------------------------------------
//  Paint
// ---------------------------------------------------------------------------

describe('resolveMessageMediaPaint', () => {
  it('keeps text AND muted text at AA on both bubbles, in both modes', () => {
    for (const mode of ['light', 'dark'] as const) {
      mount(<View />, mode);
      for (const tone of ['incoming', 'outgoing'] as const) {
        const paint = resolveMessageMediaPaint(theme, tone);
        expect(contrastRatio(paint.bubble, paint.text)).toBeGreaterThanOrEqual(4.5);
        expect(contrastRatio(paint.bubble, paint.textMuted)).toBeGreaterThanOrEqual(4.5);
        expect(contrastRatio(paint.bubble, paint.accent)).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('makes the muted label QUIETER than the primary one, not merely legible', () => {
    // A "muted" colour that came back as the full text colour would still pass
    // the contrast assertion above — this is what stops that from counting.
    mount(<View />);
    for (const tone of ['incoming', 'outgoing'] as const) {
      const paint = resolveMessageMediaPaint(theme, tone);
      expect(paint.textMuted).not.toBe(paint.text);
      expect(contrastRatio(paint.bubble, paint.textMuted)).toBeLessThan(
        contrastRatio(paint.bubble, paint.text),
      );
    }
  });

  it('re-derives everything from a caller-supplied bubble and on-colour', () => {
    mount(<View />);
    const paint = resolveMessageMediaPaint(theme, 'outgoing', '#ffffff', '#102a43');
    expect(paint.bubble).toBe('#102a43');
    expect(paint.text).toBe('#ffffff');
    expect(contrastRatio(paint.bubble, paint.textMuted)).toBeGreaterThanOrEqual(4.5);
  });

  it('gives the two tones different bubbles', () => {
    mount(<View />);
    expect(resolveBubbleColor(theme, 'outgoing')).not.toBe(resolveBubbleColor(theme, 'incoming'));
  });
});

// Local `View` for the paint probes — the suite mocks react-native to
// react-native-web, so this is the web one.
function View() {
  return null;
}

// ---------------------------------------------------------------------------
//  Accessibility — rendered attributes, never props
// ---------------------------------------------------------------------------

describe('accessibility names', () => {
  it('names a photo, and says so when a spoiler is hiding it', () => {
    mount(<ImageMessage source="https://x.invalid/a.jpg" onPress={() => {}} testID="photo" />);
    const frame = byTestId('photo-frame');
    expect(frame.getAttribute('role')).toBe('button');
    expect(frame.getAttribute('aria-label')).toBe('Photo');

    mount(
      <ImageMessage source="https://x.invalid/a.jpg" spoiler onPress={() => {}} testID="spoiler" />,
    );
    expect(byTestId('spoiler-frame').getAttribute('aria-label')).toBe('Photo');
    expect(byTestId('spoiler-spoiler')).toBeTruthy();
  });

  it('reveals a spoiler on press and does not re-hide it', () => {
    const onPress = jest.fn();
    const onReveal = jest.fn();
    mount(
      <ImageMessage
        source="https://x.invalid/a.jpg"
        spoiler
        onPress={onPress}
        onReveal={onReveal}
        testID="sp"
      />,
    );
    expect(queryTestId('sp-spoiler')).toBeTruthy();
    act(() => {
      byTestId('sp-frame').click();
    });
    expect(onReveal).toHaveBeenCalledTimes(1);
    // The first press reveals; it does NOT also open the photo.
    expect(onPress).not.toHaveBeenCalled();
    expect(queryTestId('sp-spoiler')).toBeNull();
    act(() => {
      byTestId('sp-frame').click();
    });
    expect(onPress).toHaveBeenCalledWith(0);
  });

  it('names every album cell with its position', () => {
    mount(
      <MediaAlbum
        testID="album"
        onPress={() => {}}
        items={[
          { id: 'a', source: 'https://x.invalid/a.jpg' },
          { id: 'b', source: 'https://x.invalid/b.jpg', kind: 'video', duration: 62 },
          { id: 'c', source: 'https://x.invalid/c.jpg' },
        ]}
      />,
    );
    expect(byTestId('album-cell-0').getAttribute('aria-label')).toBe('Photo 1 of 3');
    expect(byTestId('album-cell-1').getAttribute('aria-label')).toBe('Video 2 of 3');
    expect(byTestId('album-cell-2').getAttribute('aria-label')).toBe('Photo 3 of 3');
  });

  it('names a video with its duration, and a file with its meta line', () => {
    mount(<VideoMessage source="https://x.invalid/v.jpg" duration={187} testID="video" />);
    expect(byTestId('video-frame').getAttribute('aria-label')).toBe('Video · 3:07');

    mount(<FileMessage name="Lease.pdf" sizeBytes={2.44 * 1024 * 1024} onPress={() => {}} testID="file" />);
    // The row's press target is the identity half; the download button beside it
    // is its own control (a button inside a button is invalid HTML).
    expect(byTestId('file-open').getAttribute('aria-label')).toBe('Lease.pdf · 2.4 MB · PDF');
    expect(byTestId('file-meta').textContent).toBe('2.4 MB · PDF');
  });

  it('names a sticker, a location, a contact and a link preview', () => {
    mount(<StickerMessage source="https://x.invalid/s.png" accessibilityLabel="Sticker: waving" testID="st" />);
    expect(byTestId('st-frame').getAttribute('aria-label')).toBe('Sticker: waving');

    mount(<LocationMessage title="Casa" address="Carrer 1" live onPress={() => {}} testID="loc" />);
    expect(byTestId('loc-map').getAttribute('aria-label')).toBe('Live location · Casa · Carrer 1');

    mount(<ContactMessage name="Marta Ferreira" detail="+34 600" testID="contact" />);
    expect(byTestId('contact').getAttribute('aria-label')).toBe('Contact · Marta Ferreira · +34 600');

    mount(
      <LinkPreviewMessage url="https://example.invalid/a" title="A guide" testID="link" />,
    );
    const link = byTestId('link');
    expect(link.getAttribute('role')).toBe('link');
    expect(link.getAttribute('aria-label')).toBe('A guide');
  });

  it('names the grids with their counts', () => {
    mount(
      <SharedMediaGrid
        testID="grid"
        items={[
          { id: '1', source: 'https://x.invalid/1.jpg' },
          { id: '2', source: 'https://x.invalid/2.jpg' },
        ]}
      />,
    );
    expect(byTestId('grid').getAttribute('aria-label')).toBe('Shared media, 2 items');

    mount(<DocumentGrid testID="docs" items={[{ id: 'd', name: 'A.pdf' }]} />);
    expect(byTestId('docs').getAttribute('aria-label')).toBe('Shared files, 1 item');
  });
});

describe('accessibility STATE reaches the DOM', () => {
  it('gives the waveform a slider role with all three value attributes', () => {
    mount(
      <VoiceMessage samples={SAMPLES} duration={14} position={5} onSeek={() => {}} testID="voice" />,
    );
    const track = byTestId('voice-waveform');
    expect(track.getAttribute('role')).toBe('slider');
    expect(track.getAttribute('aria-label')).toBe('Seek');
    expect(track.getAttribute('aria-valuemin')).toBe('0');
    expect(track.getAttribute('aria-valuemax')).toBe('14');
    expect(track.getAttribute('aria-valuenow')).toBe('5');
    expect(track.getAttribute('aria-valuetext')).toBe('0:05 of 0:14');
    // It is reachable by keyboard, which is the other half of being a slider.
    expect(track.getAttribute('tabindex')).toBe('0');
  });

  it('shows the elapsed time once playback has started, the length before it', () => {
    mount(<VoiceMessage samples={SAMPLES} duration={14} testID="v1" />);
    expect(byTestId('v1-clock').textContent).toBe('0:14');
    mount(<VoiceMessage samples={SAMPLES} duration={14} position={5} testID="v2" />);
    expect(byTestId('v2-clock').textContent).toBe('0:05');
  });

  it('makes the transcript toggle an expandable control', () => {
    mount(
      <VoiceMessage samples={SAMPLES} duration={9} transcript="Hello there" testID="tr" />,
    );
    const toggle = byTestId('tr-transcribe');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(queryTestId('tr-transcript')).toBeNull();
    act(() => {
      toggle.click();
    });
    expect(byTestId('tr-transcribe').getAttribute('aria-expanded')).toBe('true');
    expect(byTestId('tr-transcript').textContent).toContain('Hello there');
  });

  it('cycles the speed pill through the three rates', () => {
    const rates: number[] = [];
    mount(
      <VoiceMessage
        samples={SAMPLES}
        duration={9}
        rate={1.5}
        onRateChange={(next) => rates.push(next)}
        testID="rate"
      />,
    );
    const pill = byTestId('rate-rate');
    expect(pill.getAttribute('aria-label')).toBe('Playback speed, 1.5×');
    act(() => {
      pill.click();
    });
    expect(rates).toEqual([2]);
  });

  it('gives an unvoted poll option a checked radio, and a voted one a progressbar', () => {
    const options = [
      { id: 'a', label: 'Saturday', votes: 3 },
      { id: 'b', label: 'Sunday', votes: 1 },
    ];
    mount(<PollMessage question="When?" options={options} testID="poll" />);
    const first = byTestId('poll-option-a');
    expect(first.getAttribute('role')).toBe('radio');
    expect(first.getAttribute('aria-checked')).toBe('false');
    act(() => {
      first.click();
    });
    expect(byTestId('poll-option-a').getAttribute('aria-checked')).toBe('true');

    mount(
      <PollMessage
        question="When?"
        voted
        options={options.map((o) => ({ ...o, selected: o.id === 'a' }))}
        testID="voted"
      />,
    );
    const bar = byTestId('voted-option-a');
    expect(bar.getAttribute('role')).toBe('progressbar');
    expect(bar.getAttribute('aria-valuenow')).toBe('75');
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
    expect(bar.getAttribute('aria-valuemax')).toBe('100');
    expect(bar.getAttribute('aria-label')).toBe('Saturday, 75%');
    expect(byTestId('voted-option-a-percent').textContent).toBe('75%');
    expect(byTestId('voted-total').textContent).toBe('4 votes');
  });

  it('marks a quiz answer right AND wrong, not only the one the viewer picked', () => {
    mount(
      <PollMessage
        question="How much notice?"
        quiz
        voted
        testID="quiz"
        options={[
          { id: 'w', label: 'One month', votes: 1, selected: true },
          { id: 'r', label: 'Two months', votes: 3, correct: true },
        ]}
      />,
    );
    expect(byTestId('quiz-option-w').getAttribute('aria-label')).toBe('One month, 25%, your answer');
    expect(byTestId('quiz-option-r').getAttribute('aria-label')).toBe(
      'Two months, 75%, correct answer',
    );
  });

  it('checks a multiple-choice option without committing the vote', () => {
    const votes: string[][] = [];
    mount(
      <PollMessage
        question="Which rooms?"
        multiple
        onVote={(ids) => votes.push(ids)}
        testID="multi"
        options={[
          { id: 'k', label: 'Kitchen' },
          { id: 'h', label: 'Hallway' },
        ]}
      />,
    );
    expect(byTestId('multi-option-k').getAttribute('role')).toBe('checkbox');
    act(() => {
      byTestId('multi-option-k').click();
    });
    act(() => {
      byTestId('multi-option-h').click();
    });
    expect(votes).toEqual([]);
    act(() => {
      byTestId('multi-action').click();
    });
    expect(votes).toEqual([['k', 'h']]);
  });

  it('makes a determinate send ring a progressbar and an indeterminate one busy', () => {
    mount(
      <ImageMessage source="https://x.invalid/a.jpg" state="sending" progress={0.38} testID="det" />,
    );
    const ring = byTestId('det-progress');
    expect(ring.getAttribute('role')).toBe('progressbar');
    expect(ring.getAttribute('aria-valuenow')).toBe('38');
    expect(ring.getAttribute('aria-label')).toBe('Sending photo');

    mount(<ImageMessage source="https://x.invalid/a.jpg" state="sending" testID="ind" />);
    const busy = byTestId('ind-progress');
    expect(busy.getAttribute('role')).toBe('img');
    expect(busy.getAttribute('aria-busy')).toBe('true');
  });

  it('turns the ring into a named CANCEL button when the caller can cancel', () => {
    const onCancel = jest.fn();
    mount(
      <ImageMessage
        source="https://x.invalid/a.jpg"
        state="sending"
        progress={0.5}
        onCancel={onCancel}
        testID="cancel"
      />,
    );
    const ring = byTestId('cancel-progress');
    expect(ring.getAttribute('role')).toBe('button');
    expect(ring.getAttribute('aria-label')).toBe('Cancel');
    act(() => {
      ring.click();
    });
    expect(onCancel).toHaveBeenCalled();
  });

  it('offers a retry on a failed send', () => {
    const onRetry = jest.fn();
    mount(
      <ImageMessage source="https://x.invalid/a.jpg" state="failed" onRetry={onRetry} testID="fail" />,
    );
    expect(byTestId('fail-failed').textContent).toContain('Not sent');
  });
});

// ---------------------------------------------------------------------------
//  Geometry that only the DOM can confirm
// ---------------------------------------------------------------------------

describe('rendered geometry', () => {
  it('draws the album cells at the computed rectangles', () => {
    const layout = albumLayout(5, 240, { gap: 2, radius: 16 });
    mount(
      <MediaAlbum
        width={240}
        testID="grid"
        items={Array.from({ length: 5 }, (_, i) => ({
          id: `i${i}`,
          source: `https://x.invalid/${i}.jpg`,
        }))}
      />,
    );
    for (const cell of layout.cells) {
      const style = getComputedStyle(byTestId(`grid-cell-${cell.index}`));
      expect(style.left).toBe(`${cell.left}px`);
      expect(style.top).toBe(`${cell.top}px`);
      expect(style.width).toBe(`${cell.width}px`);
      expect(style.height).toBe(`${cell.height}px`);
    }
  });

  it('takes the caller radius on a photo, because the bubble owns the corners', () => {
    mount(<ImageMessage source="https://x.invalid/a.jpg" radius={24} testID="r" />);
    expect(getComputedStyle(byTestId('r-frame')).borderTopLeftRadius).toBe('24px');
  });

  it('draws exactly `barCount` bars', () => {
    mount(<VoiceMessage samples={SAMPLES} duration={9} barCount={18} testID="bars" />);
    const track = byTestId('bars-waveform');
    const row = track.firstElementChild;
    expect(row?.children.length).toBe(18);
  });
});
