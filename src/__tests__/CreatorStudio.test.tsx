/**
 * @jest-environment jsdom
 *
 * The creator studio, rendered through the REAL react-native-web so the
 * assertions read the emitted DOM: names, roles, state attributes, colours
 * and the controlled callbacks. Pure helpers (status mapping, ISRC, artwork
 * validation, waveform) are tested directly.
 *
 * jsdom lays nothing out, so `onLayout` is driven by a stand-in ResizeObserver
 * and fixed `offsetWidth` / `offsetHeight`.
 */
import React, { useState } from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

// --- layout stand-ins (installed before react-native-web creates its observer) ---
const observed = new Set<Element>();
let resizeCallback: ((entries: Array<{ target: Element }>) => void) | null = null;
class FakeResizeObserver {
  constructor(callback: (entries: Array<{ target: Element }>) => void) {
    resizeCallback = callback;
  }
  observe(node: Element) {
    observed.add(node);
  }
  unobserve(node: Element) {
    observed.delete(node);
  }
  disconnect() {
    observed.clear();
  }
}
(window as unknown as { ResizeObserver: unknown }).ResizeObserver = FakeResizeObserver;
let layoutWidth = 1000;
Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
  configurable: true,
  get() {
    return layoutWidth;
  },
});
Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
  configurable: true,
  get() {
    return 300;
  },
});

import { resolveAccentColors } from '../theme/accent-colors';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import type { Theme } from '../theme/types';
import { Sparkline, sparklinePoints } from '../chart-cards/primitives/Sparkline';
import { StatCard } from '../stat-cards/StatCards';
import { RiGroupLine } from '../icons/remix/RiGroupLine';
import {
  ArtistChipsInput,
  artworkDimensionsError,
  ArtworkUploader,
  AudienceOverview,
  CreditsEditor,
  formatIsrc,
  isValidIsrc,
  PayoutSummaryCard,
  PitchCard,
  RELEASE_STATUS_LABELS,
  RELEASE_STATUS_TONES,
  ReleaseCard,
  ReleaseStatusBadge,
  ReleaseTimeline,
  StreamsChart,
  TopTracksTable,
  TrackUploadRow,
  type ReleaseStatus,
  type TrackCredit,
} from '../creator-studio';
import {
  addUnique,
  clampProgress,
  placeholderWaveform,
  releaseStatusNeedsReason,
  resolveCreatorStudioPaint,
  toggleTag,
  uploadBarKind,
} from '../creator-studio/shared';
import { releaseStepAccessibilityLabel } from '../creator-studio/ReleaseTimeline';

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

async function flushLayout() {
  await act(async () => {
    resizeCallback?.(Array.from(observed).map((target) => ({ target })));
    await new Promise((resolve) => setTimeout(resolve, 5));
  });
}

beforeEach(() => {
  layoutWidth = 1000;
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

function maybe(id: string): HTMLElement | null {
  return container.querySelector(`[data-testid="${id}"]`);
}

function normalise(color: string): string {
  const probe = document.createElement('div');
  probe.style.backgroundColor = color;
  return probe.style.backgroundColor;
}

function press(el: Element) {
  act(() => {
    (el as HTMLElement).click();
  });
}

// ---------------------------------------------------------------------------
//  Pure helpers
// ---------------------------------------------------------------------------

describe('release status mapping', () => {
  it('gives every status a label and a distinct tone recipe', () => {
    const statuses: ReleaseStatus[] = ['draft', 'in-review', 'scheduled', 'live', 'rejected', 'takedown'];
    expect(Object.keys(RELEASE_STATUS_TONES).sort()).toEqual([...statuses].sort());
    expect(RELEASE_STATUS_TONES).toEqual({
      draft: { tone: 'default', fill: 'subtle' },
      'in-review': { tone: 'warning', fill: 'subtle' },
      scheduled: { tone: 'info', fill: 'subtle' },
      live: { tone: 'success', fill: 'subtle' },
      rejected: { tone: 'error', fill: 'subtle' },
      takedown: { tone: 'error', fill: 'outlined' },
    });
    const recipes = statuses.map((s) => `${RELEASE_STATUS_TONES[s].tone}/${RELEASE_STATUS_TONES[s].fill}`);
    expect(new Set(recipes).size).toBe(statuses.length);
    expect(RELEASE_STATUS_LABELS['in-review']).toBe('In review');
    expect(RELEASE_STATUS_LABELS.takedown).toBe('Taken down');
  });

  it('shows a reason only for rejected and taken-down releases', () => {
    expect(releaseStatusNeedsReason('rejected')).toBe(true);
    expect(releaseStatusNeedsReason('takedown')).toBe(true);
    for (const s of ['draft', 'in-review', 'scheduled', 'live'] as const) expect(releaseStatusNeedsReason(s)).toBe(false);
  });
});

describe('ISRC', () => {
  it('groups as CC-XXX-YY-NNNNN while typing, uppercased and capped', () => {
    expect(formatIsrc('gb')).toBe('GB');
    expect(formatIsrc('gbx')).toBe('GB-X');
    expect(formatIsrc('gbxyz26')).toBe('GB-XYZ-26');
    expect(formatIsrc('gb xyz 26 12345 999')).toBe('GB-XYZ-26-12345');
  });

  it('validates the complete shape', () => {
    expect(isValidIsrc('GB-XYZ-26-12345')).toBe(true);
    expect(isValidIsrc('GBXYZ2612345')).toBe(true);
    expect(isValidIsrc('GB-XYZ-26-1234')).toBe(false);
    expect(isValidIsrc('1B-XYZ-26-12345')).toBe(false);
    expect(isValidIsrc('GB-XYZ-2A-12345')).toBe(false);
  });
});

describe('artwork and upload helpers', () => {
  it('rejects artwork that is too small or not square', () => {
    expect(artworkDimensionsError(3000, 3000)).toBeNull();
    expect(artworkDimensionsError(4000, 4000)).toBeNull();
    expect(artworkDimensionsError(1400, 1400)).toMatch(/too small \(1400×1400 px\).*3000×3000/);
    expect(artworkDimensionsError(3000, 2000)).toMatch(/square/);
    expect(artworkDimensionsError(1000, 1000, 800)).toBeNull();
  });

  it('maps statuses to bars and clamps progress', () => {
    expect(uploadBarKind('uploading')).toBe('determinate');
    expect(uploadBarKind('processing')).toBe('indeterminate');
    for (const s of ['queued', 'ready', 'failed'] as const) expect(uploadBarKind(s)).toBe('none');
    expect(clampProgress(-4)).toBe(0);
    expect(clampProgress(41.6)).toBe(42);
    expect(clampProgress(180)).toBe(100);
    expect(clampProgress(undefined)).toBe(0);
  });

  it('draws the same placeholder waveform for the same file, within 0.2–1', () => {
    const a = placeholderWaveform('01 Low Tide.wav', 40);
    expect(a).toEqual(placeholderWaveform('01 Low Tide.wav', 40));
    expect(a).not.toEqual(placeholderWaveform('02 Other.wav', 40));
    expect(a.every((h) => h >= 0.2 && h <= 1)).toBe(true);
  });

  it('adds names once and caps tags', () => {
    expect(addUnique(['Juno'], ' juno ')).toEqual(['Juno']);
    expect(addUnique(['Juno'], ' Pim ')).toEqual(['Juno', 'Pim']);
    expect(addUnique(['a', 'b'], 'c', 2)).toEqual(['a', 'b']);
    expect(toggleTag(['a'], 'a', 3)).toEqual([]);
    expect(toggleTag(['a', 'b', 'c'], 'd', 3)).toEqual(['a', 'b', 'c']);
  });

  it('scales sparkline points to the box and centres a flat series', () => {
    const pts = sparklinePoints([0, 5, 10], 100, 20, 2);
    expect(pts.map((p) => p.x)).toEqual([2, 50, 98]);
    expect(pts[0]!.y).toBe(18);
    expect(pts[2]!.y).toBe(2);
    expect(sparklinePoints([4, 4, 4], 100, 20, 2).every((p) => p.y === 10)).toBe(true);
    expect(sparklinePoints([1], 100, 20, 2)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
//  Releases
// ---------------------------------------------------------------------------

describe('ReleaseStatusBadge', () => {
  it('paints each status from its accent recipe', () => {
    for (const status of ['live', 'rejected', 'takedown', 'scheduled'] as const) {
      mount(<ReleaseStatusBadge status={status} testID="b" />);
      const el = byTestId('b');
      expect(el.textContent).toBe(RELEASE_STATUS_LABELS[status]);
      const { tone, fill } = RELEASE_STATUS_TONES[status];
      const colors = resolveAccentColors(theme.colors, tone, fill);
      if (fill === 'outlined') {
        expect(el.style.borderTopWidth).toBe('1px');
      } else {
        expect(el.style.backgroundColor).toBe(normalise(colors.background));
      }
    }
  });
});

describe('ReleaseCard', () => {
  const release = {
    id: 'r1',
    title: 'Northbound',
    artist: 'Juno Varga',
    type: 'single' as const,
    releaseDate: '9 Jul 2026',
    status: 'rejected' as const,
    statusReason: 'The artwork contains a web address.',
    trackCount: 2,
  };

  it('names the pressable by the title, the menu by the release, and shows the reason', () => {
    const onPress = jest.fn();
    mount(<ReleaseCard release={release} onPress={onPress} actions={[{ label: 'Delete', destructive: true }]} testID="c" />);
    const open = byTestId('c-open');
    expect(open.getAttribute('role')).toBe('button');
    expect(open.getAttribute('aria-label')).toBe('Northbound');
    press(open);
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(byTestId('c-actions').getAttribute('aria-label')).toBe('More actions for Northbound');
    // Siblings, never nested.
    expect(open.contains(byTestId('c-actions'))).toBe(false);
    expect(byTestId('c-reason').textContent).toBe('The artwork contains a web address.');
    expect(byTestId('c-status').textContent).toBe('Rejected');
    expect(container.textContent).toContain('Single · 9 Jul 2026 · 2 tracks');
  });

  it('hides the reason for a live release, the menu without actions, and the pressable without onPress', () => {
    mount(<ReleaseCard release={{ ...release, status: 'live', trackCount: 1 }} testID="c" />);
    expect(maybe('c-reason')).toBeNull();
    expect(maybe('c-actions')).toBeNull();
    expect(maybe('c-open')).toBeNull();
    expect(container.textContent).toContain('1 track');
  });
});

describe('ReleaseTimeline', () => {
  const steps = [
    { id: 'up', label: 'Uploaded', state: 'complete' as const, date: '2 Mar' },
    { id: 'review', label: 'Review', state: 'current' as const, description: 'Usually 2–3 days.' },
    { id: 'art', label: 'Artwork', state: 'error' as const },
    { id: 'live', label: 'Live', state: 'upcoming' as const },
  ];

  it('is a named list of named items with the current step marked', async () => {
    mount(<ReleaseTimeline steps={steps} testID="t" />);
    const list = byTestId('t');
    expect(list.getAttribute('role')).toBe('list');
    expect(list.getAttribute('aria-label')).toBe('Release progress');
    expect(byTestId('t-step-up').getAttribute('role')).toBe('listitem');
    expect(byTestId('t-step-up').getAttribute('aria-label')).toBe('Uploaded, complete, 2 Mar');
    expect(byTestId('t-step-review').getAttribute('aria-current')).toBe('step');
    expect(byTestId('t-step-up').hasAttribute('aria-current')).toBe(false);
    expect(byTestId('t-step-art').getAttribute('aria-label')).toBe('Artwork, needs attention');
    expect(releaseStepAccessibilityLabel(steps[1]!)).toBe('Review, in progress, Usually 2–3 days.');
  });

  it('falls back to vertical when a horizontal row would be too narrow', async () => {
    layoutWidth = 1000;
    mount(<ReleaseTimeline steps={steps} orientation="horizontal" testID="t" />);
    await flushLayout();
    expect(getComputedStyle(byTestId('t')).flexDirection).toBe('row');
    layoutWidth = 300;
    await flushLayout();
    expect(getComputedStyle(byTestId('t')).flexDirection).not.toBe('row');
  });
});

// ---------------------------------------------------------------------------
//  Uploads
// ---------------------------------------------------------------------------

describe('TrackUploadRow', () => {
  it('uploading: a named progressbar with flat aria values, busy, percent and time left', () => {
    mount(
      <TrackUploadRow fileName="Low Tide.wav" size={46_300_000} status="uploading" progress={41.6} remaining="About 20 s left" testID="u" />,
    );
    const bar = byTestId('u-progress');
    expect(bar.getAttribute('role')).toBe('progressbar');
    expect(bar.getAttribute('aria-valuenow')).toBe('42');
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
    expect(bar.getAttribute('aria-valuemax')).toBe('100');
    expect(bar.getAttribute('aria-label')).toBe('Uploading Low Tide.wav');
    expect((bar.firstElementChild as HTMLElement).style.width).toBe('42%');
    expect(byTestId('u').getAttribute('aria-busy')).toBe('true');
    expect(byTestId('u-status').textContent).toBe('42% · About 20 s left');
    expect(container.textContent).toContain('44 MB');
  });

  it('processing: transcoding text and a decorative running bar, no progressbar', () => {
    mount(<TrackUploadRow fileName="a.flac" size="40 MB" status="processing" testID="u" />);
    expect(maybe('u-progress')).toBeNull();
    expect(byTestId('u-processing').getAttribute('aria-hidden')).toBe('true');
    expect(byTestId('u-status').textContent).toBe('Transcoding…');
    expect(byTestId('u').getAttribute('aria-busy')).toBe('true');
  });

  it('queued and ready are not busy; ready shows the waveform and duration', () => {
    mount(<TrackUploadRow fileName="a.wav" size="1 MB" status="queued" testID="u" />);
    expect(byTestId('u-status').textContent).toBe('Queued');
    expect(byTestId('u').getAttribute('aria-busy')).not.toBe('true');
    mount(<TrackUploadRow fileName="a.wav" size="1 MB" status="ready" duration="3:42" testID="u" />);
    expect(byTestId('u-status').textContent).toBe('Ready · 3:42');
    expect(maybe('u-waveform')).not.toBeNull();
    expect(maybe('u-retry')).toBeNull();
  });

  it('failed: the message in the error colour, retry and remove fire', () => {
    const onRetry = jest.fn();
    const onRemove = jest.fn();
    mount(
      <TrackUploadRow fileName="Live.aiff" size="1 MB" status="failed" error="Connection dropped." onRetry={onRetry} onRemove={onRemove} testID="u" />,
    );
    const message = byTestId('u-status').firstElementChild as HTMLElement;
    expect(message.textContent).toBe('Connection dropped.');
    expect(message.style.color).toBe(normalise(resolveCreatorStudioPaint(theme).error));
    press(byTestId('u-retry'));
    expect(onRetry).toHaveBeenCalledTimes(1);
    const remove = byTestId('u-remove');
    expect(remove.getAttribute('aria-label')).toBe('Remove Live.aiff');
    press(remove);
    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
//  Metadata
// ---------------------------------------------------------------------------

function CreditsHarness({ initial, onChange }: { initial: TrackCredit[]; onChange?: (c: TrackCredit[]) => void }) {
  const [credits, setCredits] = useState(initial);
  let n = 0;
  return (
    <CreditsEditor
      credits={credits}
      createId={() => `new-${n++}`}
      onCreditsChange={(next) => {
        setCredits(next);
        onChange?.(next);
      }}
      testID="cr"
    />
  );
}

describe('CreditsEditor', () => {
  it('adds a credit with the first role and removes one by its named button', () => {
    const onChange = jest.fn();
    mount(
      <CreditsHarness
        initial={[
          { id: 'a', role: 'songwriter', name: 'Juno Varga' },
          { id: 'b', role: 'producer', name: 'Teodor Brask' },
        ]}
        onChange={onChange}
      />,
    );
    expect(container.querySelectorAll('[data-testid^="cr-row-"]').length).toBe(2);
    press(byTestId('cr-add'));
    expect(container.querySelectorAll('[data-testid^="cr-row-"]').length).toBe(3);
    expect(onChange).toHaveBeenLastCalledWith([
      { id: 'a', role: 'songwriter', name: 'Juno Varga' },
      { id: 'b', role: 'producer', name: 'Teodor Brask' },
      { id: 'new-0', role: 'songwriter', name: '' },
    ]);

    const remove = byTestId('cr-remove-0');
    expect(remove.getAttribute('aria-label')).toBe('Remove credit 1, Juno Varga');
    expect(byTestId('cr-remove-2').getAttribute('aria-label')).toBe('Remove credit 3');
    press(remove);
    expect(container.querySelectorAll('[data-testid^="cr-row-"]').length).toBe(2);
    expect(onChange.mock.calls[onChange.mock.calls.length - 1]![0].map((c: TrackCredit) => c.id)).toEqual(['b', 'new-0']);
  });

  it('shows the empty line with no credits and names each input and role', () => {
    mount(<CreditsHarness initial={[]} />);
    expect(container.textContent).toContain('Credit the songwriters');
    // A new key: the harness keeps its own state across a re-render.
    mount(<CreditsHarness key="one" initial={[{ id: 'a', role: 'producer', name: '' }]} />);
    expect(container.querySelector('input[aria-label="Name, credit 1"]')).not.toBeNull();
    expect(container.querySelector('[aria-label="Role, credit 1"]')).not.toBeNull();
    expect(container.textContent).toContain('Producer');
  });
});

describe('ArtistChipsInput', () => {
  it('names each remove glyph and removes that name', () => {
    const onValuesChange = jest.fn();
    mount(<ArtistChipsInput label="Featured artists" values={['Ilse Marrow', 'Pim']} onValuesChange={onValuesChange} testID="a" />);
    const remove = byTestId('a-remove-Pim');
    expect(remove.getAttribute('role')).toBe('button');
    expect(remove.getAttribute('aria-label')).toBe('Remove Pim');
    press(remove);
    expect(onValuesChange).toHaveBeenCalledWith(['Ilse Marrow']);
  });

  it('disables input and add at the cap', () => {
    mount(<ArtistChipsInput label="Artists" values={['A', 'B']} max={2} onValuesChange={() => {}} testID="a" />);
    expect(byTestId('a-add').getAttribute('aria-disabled')).toBe('true');
  });
});

// ---------------------------------------------------------------------------
//  Dashboard pieces
// ---------------------------------------------------------------------------

describe('StatCard accessory', () => {
  it('renders the accessory beside the tile only when given', () => {
    const stat = { icon: RiGroupLine, label: 'Listeners', value: '1', delta: '+1%', deltaColor: 'lime' as const };
    mount(<StatCard stat={stat} testID="s" />);
    expect(maybe('s-accessory')).toBeNull();
    mount(<StatCard stat={{ ...stat, accessory: <Sparkline data={[1, 2, 3]} testID="sp" /> }} testID="s" />);
    expect(byTestId('s-accessory').contains(byTestId('sp'))).toBe(true);
    // Decorative unless named.
    expect(byTestId('sp').getAttribute('aria-hidden')).toBe('true');
    mount(<Sparkline data={[1, 2, 3]} accessibilityLabel="Rising" testID="sp" />);
    expect(byTestId('sp').getAttribute('role')).toBe('img');
    expect(byTestId('sp').getAttribute('aria-label')).toBe('Rising');
  });
});

describe('AudienceOverview', () => {
  it('names the period radiogroup, marks the selection and reports a change', () => {
    const onPeriodChange = jest.fn();
    mount(
      <AudienceOverview
        metrics={[
          { kind: 'listeners', label: 'Listeners', value: '48,210', delta: '+12%', trend: 'up', series: [1, 2, 3] },
          { kind: 'saves', label: 'Saves', value: '6,120', delta: '-3%', trend: 'down' },
        ]}
        period="28d"
        onPeriodChange={onPeriodChange}
        testID="o"
      />,
    );
    const group = container.querySelector('[role="radiogroup"]')!;
    expect(group.getAttribute('aria-label')).toBe('Period');
    expect(byTestId('o-period-28d').getAttribute('aria-checked')).toBe('true');
    expect(byTestId('o-period-7d').getAttribute('aria-checked')).toBe('false');
    press(byTestId('o-period-12m'));
    expect(onPeriodChange).toHaveBeenCalledWith('12m');
    expect(maybe('o-stats-0-accessory')).not.toBeNull();
    expect(maybe('o-stats-1-accessory')).toBeNull();
    expect(container.textContent).toContain('48,210');
  });
});

describe('StreamsChart', () => {
  it('names the plot with the metric and its releases, and switches metric', async () => {
    const onMetricChange = jest.fn();
    const data = Array.from({ length: 5 }, (_, i) => ({ label: `${i + 1} Mar`, value: 100 * (i + 1) }));
    mount(
      <StreamsChart
        metrics={[
          { id: 'streams', label: 'Streams', data },
          { id: 'listeners', label: 'Listeners', data: data.map((d) => ({ ...d, value: d.value / 10 })) },
        ]}
        events={[{ index: 2, label: 'Low Tide · Single' }]}
        onMetricChange={onMetricChange}
        testID="sc"
      />,
    );
    await flushLayout();
    expect(byTestId('sc-plot-surface').getAttribute('role')).toBe('img');
    expect(byTestId('sc-plot-surface').getAttribute('aria-label')).toBe('Streams over time; releases: Low Tide · Single (3 Mar)');
    expect(byTestId('sc-event-2').textContent).toBe('Low Tide · Single');
    expect(byTestId('sc-headline').textContent).toBeTruthy();
    press(byTestId('sc-range-listeners'));
    expect(onMetricChange).toHaveBeenCalledWith('listeners');
    await flushLayout();
    expect(byTestId('sc-plot-surface').getAttribute('aria-label')).toMatch(/^Listeners over time/);
  });
});

describe('TopTracksTable', () => {
  const tracks = [
    { id: 'a', title: 'Low Tide', streams: 1200, listeners: 300, saves: 40, trend: 'up' as const },
    { id: 'b', title: 'Glass Orchard', streams: 800, listeners: 200, saves: 10, trend: 'new' as const },
  ];

  it('names the trend glyphs and drops listeners and saves when narrow', async () => {
    mount(<TopTracksTable tracks={tracks} testID="tt" />);
    await flushLayout();
    expect(byTestId('tt-trend-a').getAttribute('role')).toBe('img');
    expect(byTestId('tt-trend-a').getAttribute('aria-label')).toBe('Rising');
    expect(byTestId('tt-trend-b').getAttribute('aria-label')).toBe('New entry');
    expect(container.textContent).toContain('1,200');
    expect(container.textContent).toContain('Listeners');

    layoutWidth = 390;
    await flushLayout();
    expect(container.textContent).not.toContain('Listeners');
    expect(container.textContent).toContain('1,200');
  });
});

describe('PayoutSummaryCard', () => {
  it('shows the estimate, facts and a named monthly chart; the current month is the chart tone', async () => {
    const onViewStatements = jest.fn();
    mount(
      <PayoutSummaryCard
        estimated="$1,284.50"
        delta={0.147}
        lastPayout={{ amount: '$1,120.00', date: '28 Aug' }}
        nextPayoutDate="28 Sep 2026"
        months={[
          { label: 'Aug', value: 1120 },
          { label: 'Sep', value: 1284.5 },
        ]}
        onViewStatements={onViewStatements}
        testID="p"
      />,
    );
    await flushLayout();
    expect(byTestId('p-estimate').textContent).toBe('$1,284.50');
    expect(byTestId('p-delta').textContent).toBe('+14.7%');
    expect(container.textContent).toContain('$1,120.00 · 28 Aug');
    expect(container.textContent).toContain('28 Sep 2026');
    expect(byTestId('p-plot-surface').getAttribute('aria-label')).toBe('Monthly earnings: Aug $1,120, Sep $1,285');
    press(byTestId('p-statements'));
    expect(onViewStatements).toHaveBeenCalledTimes(1);
  });
});

describe('PitchCard', () => {
  const base = {
    releases: [{ value: 'r', label: 'Glass Orchard' }],
    onReleaseChange: () => {},
    moods: ['Dreamy', 'Calm', 'Energetic'],
    onSelectedMoodsChange: jest.fn(),
    genres: ['Folk'],
    selectedGenres: [] as string[],
    onSelectedGenresChange: () => {},
    onPitchChange: () => {},
  };

  it('toggles mood chips with aria-pressed, caps them, and gates submit', () => {
    const onSelectedMoodsChange = jest.fn();
    mount(
      <PitchCard {...base} maxTags={2} selectedMoods={['Dreamy', 'Calm']} onSelectedMoodsChange={onSelectedMoodsChange} pitch="" testID="pc" />,
    );
    expect(byTestId('pc-moods').getAttribute('aria-label')).toBe('Mood');
    expect(byTestId('pc-moods-Dreamy').getAttribute('aria-pressed')).toBe('true');
    expect(byTestId('pc-moods-Energetic').getAttribute('aria-pressed')).toBe('false');
    expect(byTestId('pc-moods-Energetic').getAttribute('aria-disabled')).toBe('true');
    press(byTestId('pc-moods-Dreamy'));
    expect(onSelectedMoodsChange).toHaveBeenCalledWith(['Calm']);
    expect(byTestId('pc-submit').getAttribute('aria-disabled')).toBe('true');
  });

  it('replaces the form with a status panel once sent', () => {
    const onEdit = jest.fn();
    mount(<PitchCard {...base} release="r" selectedMoods={[]} pitch="x" status="submitted" submittedAt="Sent 2 Mar" onEdit={onEdit} testID="pc" />);
    expect(maybe('pc-submit')).toBeNull();
    expect(byTestId('pc-status').textContent).toContain('Pitch sent');
    expect(byTestId('pc-status').textContent).toContain('Glass Orchard · Sent 2 Mar');
    press(byTestId('pc-edit'));
    expect(onEdit).toHaveBeenCalledTimes(1);
    mount(<PitchCard {...base} release="r" selectedMoods={[]} pitch="x" status="accepted" testID="pc" />);
    expect(byTestId('pc-status').textContent).toContain('Picked for review');
    expect(maybe('pc-edit')).toBeNull();
  });
});

describe('ArtworkUploader', () => {
  it('shows the drop zone without artwork, the named preview with it, and the error ring + message', () => {
    mount(<ArtworkUploader testID="art" />);
    expect(byTestId('art-dropzone').getAttribute('aria-label')).toBe('Upload artwork');
    expect(container.textContent).toContain('3000×3000 px, JPG or PNG');

    const onRemove = jest.fn();
    mount(<ArtworkUploader artwork="https://example.test/cover.png" onRemove={onRemove} error="Artwork is too small." testID="art" />);
    expect(maybe('art-dropzone')).toBeNull();
    expect(container.querySelector('[aria-label="Release artwork"]')).not.toBeNull();
    expect(byTestId('art-error').textContent).toBe('Artwork is too small.');
    expect(byTestId('art-error-ring').style.borderTopColor).toBe(normalise(resolveCreatorStudioPaint(theme).error));
    expect(byTestId('art-remove').getAttribute('aria-label')).toBe('Remove artwork');
    press(byTestId('art-remove'));
    expect(onRemove).toHaveBeenCalledTimes(1);

    press(byTestId('art-replace'));
    expect(maybe('art-dropzone')).not.toBeNull();
    press(byTestId('art-cancel'));
    expect(maybe('art-dropzone')).toBeNull();
  });
});
