/**
 * @jest-environment jsdom
 *
 * The property-insights parts through the REAL react-native-web: geometry,
 * colours and the rendered accessibility attributes. Width-driven halves
 * (`onLayout`) are in `PropertyInsightsLayout.test.tsx`.
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { chartHueTone, resolveMonoTone } from '../chart-cards/palette';
import { RiBusLine, RiSubwayLine } from '../icons/remix';
import {
  EnergyBadge,
  EnergyLabel,
  NearbyPlaces,
  NeighbourhoodScores,
  PriceEstimate,
  PriceHistoryChart,
  PricePerAreaComparison,
  RentHistoryList,
} from '../property-insights';
import {
  computePriceVerdict,
  defaultFormatVerdict,
  estimateGeometry,
  priceVerdictTone,
} from '../property-insights/PriceEstimate';
import { describePriceHistory, priceDomain, stepPath } from '../property-insights/PriceHistoryChart';
import { rentDeltaTone } from '../property-insights/RentHistoryList';
import {
  ENERGY_CLASSES,
  contrastRatio,
  formatEuros,
  formatEurosCompact,
  resolveEnergyTones,
  resolveInsightPalette,
} from '../property-insights/shared';
import { resolveMeterColors } from '../stat-bar';
import { buildTheme } from '../theme/build-theme';
import { APP_COLOR_PRESETS, type AppColorName } from '../theme/color-presets';
import { srgbToOklch } from '../theme/color-space';
import { parseRgba } from '../theme/color-utils';
import { resolveAccentColors } from '../theme/accent-colors';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import type { Theme } from '../theme/types';
import { useTheme } from '../theme/use-theme';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;
let theme: Theme;

function ReadTheme() {
  theme = useTheme();
  return null;
}

function mount(ui: React.ReactElement, mode: 'light' | 'dark' = 'light', colorPreset = 'teal') {
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
});

function byTestId(id: string): HTMLElement {
  const el = container.querySelector(`[data-testid="${id}"]`);
  if (!(el instanceof HTMLElement)) throw new Error(`No element for testID "${id}"`);
  return el;
}
const queryTestId = (id: string) => container.querySelector(`[data-testid="${id}"]`);

function normalise(color: string): string {
  const probe = document.createElement('div');
  probe.style.color = color;
  return probe.style.color;
}

// ---------------------------------------------------------------------------

describe('energy tones', () => {
  it.each(['light', 'dark'] as const)('run green → yellow → red, and every letter clears 4.5:1 (%s)', (mode) => {
    mount(<></>, mode);
    const tones = resolveEnergyTones(theme);
    expect(tones).toHaveLength(7);
    const hue = (c: string) => srgbToOklch(parseRgba(c)!).h;
    // A is green, D a yellow, G a red.
    expect(hue(tones[0]!.fill)).toBeGreaterThan(120);
    expect(hue(tones[3]!.fill)).toBeGreaterThan(70);
    expect(hue(tones[3]!.fill)).toBeLessThan(120);
    expect(hue(tones[6]!.fill)).toBeLessThan(45);
    // D is the lightest step.
    const l = tones.map((t) => srgbToOklch(parseRgba(t.fill)!).l);
    expect(Math.max(...l)).toBe(l[3]);
    for (const tone of tones) expect(contrastRatio(tone.fill, tone.foreground)).toBeGreaterThanOrEqual(4.5);
    // Neighbours are distinct colours.
    expect(new Set(tones.map((t) => t.fill)).size).toBe(7);
  });

  it('every letter clears 4.5:1 on its bar in EVERY preset and mode', () => {
    const failures: string[] = [];
    for (const preset of Object.keys(APP_COLOR_PRESETS)) {
      for (const mode of ['light', 'dark'] as const) {
        resolveEnergyTones(buildTheme(preset as AppColorName, mode)).forEach((tone, i) => {
          const ratio = contrastRatio(tone.fill, tone.foreground);
          if (ratio < 4.5) failures.push(`${preset}/${mode}/${ENERGY_CLASSES[i]} ${ratio.toFixed(2)}`);
        });
      }
    }
    expect(failures).toEqual([]);
  });
});

describe('EnergyLabel', () => {
  it('draws seven bars from 40% to 100%, in the class colours, and tags the ratings on their rows', () => {
    mount(
      <EnergyLabel
        consumption={{ rating: 'C', value: '112 kWh/m²·year' }}
        emissions={{ rating: 'D', value: '24 kg CO₂/m²·year' }}
        testID="e"
      />,
    );
    const tones = resolveEnergyTones(theme);
    ENERGY_CLASSES.forEach((letter, i) => {
      const bar = byTestId(`e-bar-${letter}`);
      expect(bar.style.width || getComputedStyle(bar).width).toBe(`${40 + i * 10}%`);
      expect(getComputedStyle(bar).height).toBe('24px');
      expect(getComputedStyle(bar).backgroundColor).toBe(normalise(tones[i]!.fill));
    });
    // jsdom never lays out, so two columns render compact: the tag is the letter, the value moves below.
    expect(byTestId('e-consumption-tag').textContent).toBe('C');
    expect(getComputedStyle(byTestId('e-consumption-tag-body')).backgroundColor).toBe(normalise(tones[2]!.fill));
    expect(byTestId('e-values').textContent).toContain('C · 112 kWh/m²·year');
  });

  it('is one named image, composed from both ratings', () => {
    mount(
      <EnergyLabel consumption={{ rating: 'C', value: '112 kWh/m²·year' }} emissions={{ rating: 'D' }} testID="e" />,
    );
    const label = byTestId('e');
    expect(label.getAttribute('role')).toBe('img');
    expect(label.getAttribute('aria-label')).toBe('Energy rating. Consumption: C, 112 kWh/m²·year. Emissions: D.');
  });

  it('a single rating carries its value in the tag', () => {
    mount(<EnergyLabel consumption={{ rating: 'A', value: '38 kWh/m²·year' }} testID="e" />);
    expect(byTestId('e-consumption-tag').textContent).toBe('A · 38 kWh/m²·year');
    expect(queryTestId('e-values')).toBeNull();
  });

  it('pending: neutral bars, no tags, the note, and a pending name', () => {
    mount(<EnergyLabel pending consumption={{ rating: 'C' }} testID="e" />);
    const palette = resolveInsightPalette(theme);
    expect(getComputedStyle(byTestId('e-bar-A')).backgroundColor).toBe(normalise(palette.hairline));
    expect(queryTestId('e-consumption-tag')).toBeNull();
    expect(byTestId('e-pending').textContent).toBe('Certificate in progress');
    expect(byTestId('e').getAttribute('aria-label')).toBe('Energy rating: Certificate in progress');
  });
});

describe('EnergyBadge', () => {
  it('a pill with a class-coloured disc, named "Energy rating C"', () => {
    mount(<EnergyBadge rating="C" testID="b" />);
    const badge = byTestId('b');
    expect(badge.getAttribute('role')).toBe('img');
    expect(badge.getAttribute('aria-label')).toBe('Energy rating C');
    expect(getComputedStyle(badge).height).toBe('24px');
    expect(Number.parseFloat(getComputedStyle(badge).borderTopLeftRadius)).toBeGreaterThan(100);
    expect(getComputedStyle(byTestId('b-disc')).backgroundColor).toBe(normalise(resolveEnergyTones(theme)[2]!.fill));
    expect(badge.textContent).toBe('CEnergy');
  });

  it('small is 20 tall; pending draws the clock and "Pending"', () => {
    mount(<EnergyBadge size="small" pending testID="b" />);
    expect(getComputedStyle(byTestId('b')).height).toBe('20px');
    expect(byTestId('b').textContent).toBe('Pending');
    expect(byTestId('b-disc').querySelector('svg')).not.toBeNull();
    expect(byTestId('b').getAttribute('aria-label')).toBe('Energy rating pending');
  });
});

// ---------------------------------------------------------------------------

describe('PriceEstimate — verdict maths', () => {
  it('measures against the NEAREST edge of the range', () => {
    expect(computePriceVerdict(362000, 398000, 385000)).toEqual({ position: 'within', ratio: 0 });
    const above = computePriceVerdict(250000, 278000, 300000);
    expect(above.position).toBe('above');
    expect(defaultFormatVerdict(above)).toBe('Above estimate by 8%');
    expect(defaultFormatVerdict(computePriceVerdict(362000, 398000, 340000))).toBe('Below estimate by 6%');
    expect(defaultFormatVerdict({ position: 'above', ratio: 0.001 })).toBe('Above estimate by 1%');
  });

  it('tones: within / below success, above warning up to the threshold, error beyond', () => {
    expect(priceVerdictTone({ position: 'within', ratio: 0 })).toBe('success');
    expect(priceVerdictTone({ position: 'below', ratio: 0.3 })).toBe('success');
    expect(priceVerdictTone({ position: 'above', ratio: 0.08 })).toBe('warning');
    expect(priceVerdictTone({ position: 'above', ratio: 0.22 })).toBe('error');
    expect(priceVerdictTone({ position: 'above', ratio: 0.08 }, 0.05)).toBe('error');
  });

  it('confidence widens the drawn band: 0 / 25% / 50% of the range each side', () => {
    expect(estimateGeometry(100, 200, 'high', []).soft).toEqual([100, 200]);
    expect(estimateGeometry(100, 200, 'medium', []).soft).toEqual([75, 225]);
    expect(estimateGeometry(100, 200, 'low', []).soft).toEqual([50, 250]);
    const { domain } = estimateGeometry(100, 200, 'high', [400]);
    expect(domain[0]).toBeLessThan(100);
    expect(domain[1]).toBeGreaterThan(400);
  });
});

describe('PriceEstimate', () => {
  const base = {
    low: 362000,
    high: 398000,
    estimate: 381000,
    asking: 385000,
    reasons: ['Nine sales nearby', 'Renovated in 2021'],
    comparables: 24,
    method: 'Automated valuation',
    version: 'Model 3.2',
    updated: 'Updated 2 Sep 2026',
    testID: 'pe',
  };

  it('draws the range, a success "Fair price" chip, the band and the asking marker', () => {
    mount(<PriceEstimate {...base} confidence="high" />);
    const palette = resolveInsightPalette(theme);
    expect(byTestId('pe-range').textContent).toBe('€362,000 – €398,000');
    const verdict = byTestId('pe-verdict');
    expect(verdict.textContent).toBe('Fair price');
    expect(getComputedStyle(verdict).backgroundColor).toBe(
      normalise(resolveAccentColors(theme.colors, 'success', 'subtle').background),
    );
    expect(getComputedStyle(byTestId('pe-band')).backgroundColor).toBe(normalise(palette.band));
    expect(queryTestId('pe-soft-band')).toBeNull();
    expect(getComputedStyle(byTestId('pe-track')).height).toBe('8px');
    expect(getComputedStyle(byTestId('pe-asking')).height).toBe('24px');
    expect(queryTestId('pe-estimate')).not.toBeNull();
    expect(byTestId('pe-bar').getAttribute('role')).toBe('img');
    expect(byTestId('pe-bar').getAttribute('aria-label')).toBe(
      'Estimated price €362,000 – €398,000, Asking €385,000, High confidence',
    );
    expect(byTestId('pe-footer').textContent).toBe('Automated valuation · Model 3.2 · Updated 2 Sep 2026');
  });

  it('positions the band and the marker as shares of the domain', () => {
    mount(<PriceEstimate {...base} confidence="high" />);
    const { band, domain } = estimateGeometry(362000, 398000, 'high', [385000, 381000]);
    const pct = (v: number) => ((v - domain[0]) / (domain[1] - domain[0])) * 100;
    const bandStyle = byTestId('pe-band').style;
    expect(Number.parseFloat(getComputedStyle(byTestId('pe-band')).left || bandStyle.left)).toBeCloseTo(pct(band[0]), 3);
    expect(Number.parseFloat(getComputedStyle(byTestId('pe-asking')).left)).toBeCloseTo(pct(385000), 3);
  });

  it('above by more than 10% is an error chip', () => {
    mount(<PriceEstimate low={180000} high={205000} asking={250000} confidence="high" testID="pe" />);
    expect(byTestId('pe-verdict').textContent).toBe('Above estimate by 22%');
    expect(getComputedStyle(byTestId('pe-verdict')).backgroundColor).toBe(
      normalise(resolveAccentColors(theme.colors, 'error', 'subtle').background),
    );
  });

  it('LOW confidence widens the band, paints no firm core, hides the estimate tick and withholds the verdict', () => {
    mount(<PriceEstimate {...base} confidence="low" />);
    const palette = resolveInsightPalette(theme);
    expect(getComputedStyle(byTestId('pe-soft-band')).backgroundColor).toBe(normalise(palette.bandSoft));
    expect(getComputedStyle(byTestId('pe-band')).backgroundColor).toBe(normalise(palette.bandSoft));
    expect(queryTestId('pe-estimate')).toBeNull();
    expect(byTestId('pe-verdict').textContent).toBe('Not enough data for a verdict');
    expect(container.textContent).not.toContain('Fair price');
  });

  it('the confidence meter is a named progressbar with 1..3 filled segments', () => {
    mount(<PriceEstimate {...base} confidence="medium" />);
    const meter = byTestId('pe-meter');
    expect(meter.getAttribute('role')).toBe('progressbar');
    expect(meter.getAttribute('aria-label')).toBe('Medium confidence');
    expect(meter.getAttribute('aria-valuemin')).toBe('1');
    expect(meter.getAttribute('aria-valuemax')).toBe('3');
    expect(meter.getAttribute('aria-valuenow')).toBe('2');
    const palette = resolveInsightPalette(theme);
    expect(getComputedStyle(byTestId('pe-meter-1')).backgroundColor).toBe(normalise(palette.text));
    expect(getComputedStyle(byTestId('pe-meter-2')).backgroundColor).toBe(normalise(palette.track));
  });

  it('"Why this estimate" toggles the reasons with aria-expanded', () => {
    const onExpandedChange = jest.fn();
    mount(<PriceEstimate {...base} confidence="high" onExpandedChange={onExpandedChange} />);
    const toggle = byTestId('pe-reasons-toggle');
    expect(toggle.getAttribute('role')).toBe('button');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(queryTestId('pe-reasons')).toBeNull();
    act(() => toggle.click());
    expect(byTestId('pe-reasons-toggle').getAttribute('aria-expanded')).toBe('true');
    expect(byTestId('pe-reasons').querySelectorAll('[role="listitem"]')).toHaveLength(2);
    expect(byTestId('pe-comparables').textContent).toBe('Based on 24 comparable homes');
    expect(onExpandedChange).toHaveBeenCalledWith(true);
  });
});

// ---------------------------------------------------------------------------

describe('PriceHistoryChart — maths and summary', () => {
  it('a step path holds each price until the next point', () => {
    expect(stepPath([{ x: 0, y: 10 }, { x: 5, y: 20 }, { x: 9, y: 15 }])).toBe('M0,10H5V20H9V15');
  });

  it('the Y domain is nice ticks around the prices, never from zero', () => {
    const { ticks, domain } = priceDomain([405000, 385000]);
    expect(domain[0]).toBeGreaterThan(0);
    expect(domain[0]).toBeLessThanOrEqual(385000);
    expect(domain[1]).toBeGreaterThanOrEqual(405000);
    expect(ticks.length).toBeGreaterThanOrEqual(3);
  });

  it('composes an accessible summary of the period and its events', () => {
    const data = [
      { label: 'Sep', value: 405000, title: 'September 2025' },
      { label: 'Mar', value: 385000, title: 'March 2026' },
    ];
    expect(
      describePriceHistory('Price history', '1Y', data, [{ index: 1, kind: 'price-drop', label: 'Price drop −5%' }], formatEuros),
    ).toBe('Price history, 1Y: from €405,000 in September 2025 to €385,000 in March 2026. Price drop −5%, March 2026.');
  });

  it('formats euros and compact ticks', () => {
    expect(formatEuros(385000)).toBe('€385,000');
    expect(formatEurosCompact(385000)).toBe('€385K');
    expect(formatEurosCompact(1250000)).toBe('€1.3M');
  });
});

describe('PriceHistoryChart', () => {
  it('headline at rest is the current price; the legend lists the events', () => {
    mount(
      <PriceHistoryChart
        data={[
          { label: 'Sep', value: 405000 },
          { label: 'Mar', value: 385000 },
        ]}
        events={[
          { index: 0, kind: 'listed', label: 'Listed', date: 'Sep 2025' },
          { index: 1, kind: 'price-drop', label: 'Price drop −5%' },
        ]}
        testID="ph"
      />,
    );
    expect(byTestId('ph-headline').textContent).toBe('€385,000');
    const legend = byTestId('ph-legend');
    expect(legend.getAttribute('role')).toBe('list');
    expect(legend.textContent).toBe('ListedSep 2025Price drop −5%Mar');
  });

  it('with fewer than two points it draws a named empty state instead of a plot', () => {
    mount(<PriceHistoryChart data={[]} currentPrice={219000} testID="ph" />);
    const empty = byTestId('ph-empty');
    expect(empty.getAttribute('role')).toBe('img');
    expect(empty.getAttribute('aria-label')).toBe('Price history: No price history yet');
    expect(queryTestId('ph-plot')).toBeNull();
    expect(byTestId('ph-headline').textContent).toBe('€219,000');
  });

  it('periods draw the switcher; choosing one reports it', () => {
    const onPeriodChange = jest.fn();
    const pts = [
      { label: 'a', value: 1 },
      { label: 'b', value: 2 },
    ];
    mount(
      <PriceHistoryChart
        periods={[
          { id: '1y', label: '1Y', data: pts },
          { id: 'all', label: 'All', data: [...pts, { label: 'c', value: 3 }] },
        ]}
        onPeriodChange={onPeriodChange}
        format={String}
        testID="ph"
      />,
    );
    const all = byTestId('ph-range-all');
    act(() => (all.querySelector('[role="radio"]') as HTMLElement | null ?? all).click());
    expect(onPeriodChange).toHaveBeenCalledWith('all');
  });
});

// ---------------------------------------------------------------------------

describe('PricePerAreaComparison', () => {
  it('bars are shares of the largest value, painted from the CHART palette', () => {
    mount(
      <PricePerAreaComparison
        rows={[
          { label: 'This home', value: 2000, display: '€2,000/m²', highlight: true },
          { label: 'Street', value: 4000, display: '€4,000/m²' },
        ]}
        testID="pc"
      />,
    );
    expect(byTestId('pc').getAttribute('role')).toBe('list');
    expect(byTestId('pc').getAttribute('aria-label')).toBe('Price per square metre');
    expect(byTestId('pc-row-0-fill').style.width || getComputedStyle(byTestId('pc-row-0-fill')).width).toBe('50%');
    expect(getComputedStyle(byTestId('pc-row-1-fill')).width).toBe('100%');
    // This is a CHART, not a meter: each bar is a different subject, so its
    // colour says WHICH one it is. The highlighted row is the brand-anchored
    // data hue and the comparators the single-ink neutral — neither is the
    // accent, which would have claimed the row was progress toward something.
    expect(getComputedStyle(byTestId('pc-row-0-fill')).backgroundColor).toBe(
      normalise(chartHueTone(theme, 6).color),
    );
    expect(getComputedStyle(byTestId('pc-row-1-fill')).backgroundColor).toBe(
      normalise(resolveMonoTone(theme).color),
    );
    expect(getComputedStyle(byTestId('pc-row-0-fill')).backgroundColor).not.toBe(
      normalise(resolveMeterColors(theme).fill),
    );
    expect(byTestId('pc-row-0').getAttribute('aria-label')).toBe('This home: €2,000/m²');
  });
});

describe('NeighbourhoodScores', () => {
  const items = [
    { icon: RiBusLine, label: 'Transport', value: 9.2, description: 'Metro 4 min' },
    { label: 'Quiet', value: 5 },
  ];

  it('bars are named progressbars with flat aria-values, filled primary to value / max', () => {
    mount(<NeighbourhoodScores items={items} columns={1} testID="ns" />);
    const bar = byTestId('ns-item-0-bar');
    expect(bar.getAttribute('role')).toBe('progressbar');
    expect(bar.getAttribute('aria-label')).toBe('Transport');
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
    expect(bar.getAttribute('aria-valuemax')).toBe('10');
    expect(bar.getAttribute('aria-valuenow')).toBe('9.2');
    expect(bar.getAttribute('aria-valuetext')).toBe('9.2 out of 10');
    expect(getComputedStyle(byTestId('ns-item-0-fill')).width).toBe('92%');
    expect(getComputedStyle(byTestId('ns-item-0-fill')).backgroundColor).toBe(normalise(theme.colors.primary));
    expect(byTestId('ns-item-1').textContent).toBe('Quiet5');
  });

  it('rings: a 56 progressbar whose arc offset is the missing share', () => {
    mount(<NeighbourhoodScores items={items} variant="rings" max={10} testID="ns" />);
    const ring = byTestId('ns-item-1-ring');
    expect(ring.getAttribute('role')).toBe('progressbar');
    expect(ring.getAttribute('aria-valuenow')).toBe('5');
    expect(getComputedStyle(ring).width).toBe('56px');
    const arc = ring.querySelectorAll('circle')[1]!;
    const r = (56 - 5) / 2;
    expect(Number(arc.getAttribute('stroke-dashoffset'))).toBeCloseTo(2 * Math.PI * r * 0.5, 3);
  });
});

describe('NearbyPlaces', () => {
  it('one named list item per place', () => {
    mount(<NearbyPlaces items={[{ icon: RiSubwayLine, name: 'Lapa', category: 'Metro', time: '4 min' }]} testID="np" />);
    expect(byTestId('np').getAttribute('role')).toBe('list');
    const row = byTestId('np-item-0');
    expect(row.getAttribute('role')).toBe('listitem');
    expect(row.getAttribute('aria-label')).toBe('Lapa, Metro, 4 min walk');
    expect(row.querySelectorAll('svg')).toHaveLength(2);
  });
});

describe('RentHistoryList', () => {
  it('rows with hairlines between them and toned delta chips', () => {
    mount(
      <RentHistoryList
        items={[
          { period: 'Since Oct 2026', amount: '€1,150 / month', delta: '+4%', note: 'Current listing' },
          { period: 'Mar 2021 – Sep 2023', amount: '€1,040 / month', delta: '−2%' },
        ]}
        testID="rh"
      />,
    );
    expect(byTestId('rh').getAttribute('aria-label')).toBe('Rent history');
    expect(getComputedStyle(byTestId('rh-item-0')).borderTopWidth).toBe('0px');
    expect(getComputedStyle(byTestId('rh-item-1')).borderTopWidth).toBe('1px');
    expect(byTestId('rh-item-0').getAttribute('aria-label')).toBe('€1,150 / month, Since Oct 2026, +4%, Current listing');
    expect(getComputedStyle(byTestId('rh-item-0-delta')).backgroundColor).toBe(
      normalise(resolveAccentColors(theme.colors, 'warning', 'subtle').background),
    );
    expect(getComputedStyle(byTestId('rh-item-1-delta')).backgroundColor).toBe(
      normalise(resolveAccentColors(theme.colors, 'success', 'subtle').background),
    );
  });

  it('tones by sign and draws the empty state', () => {
    expect(rentDeltaTone('+4%')).toBe('warning');
    expect(rentDeltaTone('-3%')).toBe('success');
    expect(rentDeltaTone('0%')).toBe('default');
    mount(<RentHistoryList items={[]} testID="rh" />);
    expect(byTestId('rh-empty').textContent).toBe('No history for this home yet');
  });
});
