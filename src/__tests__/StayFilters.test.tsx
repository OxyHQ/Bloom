/**
 * @jest-environment jsdom
 *
 * The stay-filters parts, rendered through the REAL react-native-web so the
 * assertions read the emitted DOM: geometry, colours, behaviour and the
 * accessibility attributes (a prop-level test cannot see what react-native-web
 * does with `aria-*`).
 */
import React, { useState } from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { RiWifiLine } from '../icons/remix/RiWifiLine';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import type { Theme } from '../theme/types';
import { useTheme } from '../theme/use-theme';
import {
  AmenityFilter,
  AreaRangeFilter,
  AvailabilityFilter,
  CountFilter,
  EnergyRatingFilter,
  FeatureFilter,
  FloorFilter,
  PropertyTypeFilter,
  FilterFooter,
  FilterSection,
  FilterTriggerButton,
  PriceHistogram,
  PriceRangeFilter,
  SegmentedFilter,
  SwitchFilterRow,
  ToggleChipGroup,
} from '../stay-filters';
import { histogramSelection } from '../stay-filters/PriceHistogram';
import { chartHueTone } from '../chart-cards/palette';
import { parsePriceInput, priceScaleMapping, PRICE_SCALE_POSITIONS } from '../stay-filters/PriceRangeFilter';
import { contrastRatio, resolveEnergyRatingPaint } from '../stay-filters/EnergyRatingFilter';
import { commitRangeField } from '../stay-filters/RangeFields';
import type { EnergyRating, HousingFeature } from '../stay-filters';

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

function maybeTestId(id: string): HTMLElement | null {
  return container.querySelector(`[data-testid="${id}"]`);
}

function press(id: string) {
  act(() => {
    byTestId(id).click();
  });
}

function normalise(color: string): string {
  const probe = document.createElement('div');
  probe.style.color = color;
  return probe.style.color;
}

function bg(el: HTMLElement): string {
  const probe = document.createElement('div');
  probe.style.backgroundColor = getComputedStyle(el).backgroundColor;
  return probe.style.backgroundColor;
}

function normaliseBg(color: string): string {
  const probe = document.createElement('div');
  probe.style.backgroundColor = color;
  return probe.style.backgroundColor;
}

/** Types into a react-native-web TextInput the way a user does: focus, input, blur. */
function typeInto(id: string, text: string) {
  const input = byTestId(id) as HTMLInputElement;
  act(() => {
    input.focus();
  });
  act(() => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    setter?.call(input, text);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  act(() => {
    input.blur();
  });
}

// ---------------------------------------------------------------------------

describe('FilterSection', () => {
  it('is a named group with a heading, 32 above and below, and a hairline unless divider={false}', () => {
    mount(
      <FilterSection title="Price range" description="Nightly prices" testID="s">
        <></>
      </FilterSection>,
    );
    const section = byTestId('s');
    expect(section.getAttribute('role')).toBe('group');
    expect(section.getAttribute('aria-label')).toBe('Price range');
    const heading = section.querySelector('[role="heading"]');
    expect(heading?.textContent).toBe('Price range');
    expect(heading?.getAttribute('aria-level')).toBe('3');
    expect(section.textContent).toContain('Nightly prices');
    const cs = getComputedStyle(section);
    expect(cs.paddingTop).toBe('32px');
    expect(cs.paddingBottom).toBe('32px');
    expect(cs.borderBottomWidth).toBe('1px');

    expect(cs.borderBottomColor).toBe(normalise(theme.colors.border));

    mount(<FilterSection title="Last" divider={false} testID="s" />);
    expect(getComputedStyle(byTestId('s')).borderBottomWidth).toBe('0px');
  });
});

describe('PriceHistogram', () => {
  it('selects buckets by midpoint', () => {
    // 4 buckets over 0..100: midpoints 12.5, 37.5, 62.5, 87.5.
    expect(histogramSelection(4, 0, 100, [0, 100])).toEqual([true, true, true, true]);
    expect(histogramSelection(4, 0, 100, [30, 70])).toEqual([false, true, true, false]);
    expect(histogramSelection(4, 0, 100, [40, 60])).toEqual([false, false, false, false]);
  });

  it.each(['light', 'dark'] as const)(
    'draws in-range bars in the chart series tone and the rest in neutral, heights proportional (%s)',
    (mode) => {
      mount(<PriceHistogram buckets={[10, 40, 20, 0]} min={0} max={100} value={[30, 70]} height={80} testID="h" />, mode);
      const h = byTestId('h');
      expect(h.getAttribute('aria-hidden')).toBe('true');
      const bars = [0, 1, 2, 3].map((i) => byTestId(`h-bar-${i}`));
      expect(bars.map((b) => getComputedStyle(b).height)).toEqual(['20px', '80px', '40px', '0px']);

      const out = normaliseBg(theme.colors.textTertiary);
      const inRange = normaliseBg(chartHueTone(theme, 6).color);
      expect(bars.map(bg)).toEqual([out, inRange, inRange, out]);
      expect(getComputedStyle(bars[1] as HTMLElement).borderTopLeftRadius).toBe('3px');
      expect(getComputedStyle(h).columnGap || getComputedStyle(h).gap).toContain('2px');
    },
  );

  it('keeps a non-empty bucket at least 2px tall', () => {
    mount(<PriceHistogram buckets={[1, 1000]} min={0} max={10} value={[0, 10]} height={64} testID="h" />);
    expect(getComputedStyle(byTestId('h-bar-0')).height).toBe('2px');
  });
});

describe('PriceRangeFilter', () => {
  function Harness({ onChange }: { onChange?: (v: [number, number]) => void }) {
    const [value, setValue] = useState<[number, number]>([100, 400]);
    return (
      <PriceRangeFilter
        buckets={[1, 2, 3, 4]}
        min={0}
        max={1000}
        step={10}
        value={value}
        onValueChange={(v) => {
          onChange?.(v);
          setValue(v);
        }}
        formatPrice={(n) => `$${n}`}
        testID="p"
      />
    );
  }

  it('parses typed prices', () => {
    expect(parsePriceInput('$1,200')).toBe(1200);
    expect(parsePriceInput('45.5')).toBe(45.5);
    expect(parsePriceInput('abc')).toBeNull();
    expect(parsePriceInput('')).toBeNull();
  });

  it('shows formatted prices, names both thumbs and the fields, and draws the histogram', () => {
    mount(<Harness />);
    expect((byTestId('p-min') as HTMLInputElement).value).toBe('$100');
    expect((byTestId('p-max') as HTMLInputElement).value).toBe('$400');
    const thumbs = Array.from(byTestId('p-slider').querySelectorAll('[role="slider"]'));
    expect(thumbs.map((t) => t.getAttribute('aria-label'))).toEqual(['Minimum', 'Maximum']);
    expect(thumbs.map((t) => t.getAttribute('aria-valuenow'))).toEqual(['100', '400']);
    expect(byTestId('p-slider').getAttribute('aria-label')).toBe('Price range');
    expect(byTestId('p-min').getAttribute('aria-label')).toBe('Minimum');
    expect(maybeTestId('p-histogram')).not.toBeNull();
    // The slider's 6px rail is pulled up onto the bars' baseline.
    expect(getComputedStyle(byTestId('p-slider')).marginTop).toBe('-13px');
  });

  it('commits a typed value on blur: snapped, clamped to its own side, and reflected on the slider', () => {
    const onChange = jest.fn();
    mount(<Harness onChange={onChange} />);
    typeInto('p-min', '252');
    expect(onChange).toHaveBeenLastCalledWith([250, 400]);
    expect((byTestId('p-min') as HTMLInputElement).value).toBe('$250');
    expect(byTestId('p-slider').querySelector('[role="slider"]')?.getAttribute('aria-valuenow')).toBe('250');
    // The maximum can not go under the minimum.
    typeInto('p-max', '90');
    expect(onChange).toHaveBeenLastCalledWith([250, 250]);
    expect((byTestId('p-max') as HTMLInputElement).value).toBe('$250');
  });

  it('restores the committed value when a draft does not parse', () => {
    const onChange = jest.fn();
    mount(<Harness onChange={onChange} />);
    typeInto('p-max', 'lots');
    expect(onChange).not.toHaveBeenCalled();
    expect((byTestId('p-max') as HTMLInputElement).value).toBe('$400');
  });

  it('draws no histogram without buckets, and does not pull the slider up', () => {
    mount(<PriceRangeFilter min={0} max={10} value={[0, 10]} onValueChange={() => {}} testID="p" />);
    expect(maybeTestId('p-histogram')).toBeNull();
    expect(getComputedStyle(byTestId('p-slider')).marginTop).not.toBe('-13px');
  });
});

describe('SegmentedFilter', () => {
  it('is a named, full-width radiogroup whose segments report aria-checked', () => {
    const onChange = jest.fn();
    function H() {
      const [v, setV] = useState<'any' | 'room'>('any');
      return (
        <SegmentedFilter
          options={[
            { value: 'any', label: 'Any type' },
            { value: 'room', label: 'Room' },
          ]}
          value={v}
          onValueChange={(n) => {
            onChange(n);
            setV(n);
          }}
          accessibilityLabel="Type of place"
          testID="t"
        />
      );
    }
    mount(<H />);
    const group = container.querySelector('[role="radiogroup"]') as HTMLElement;
    expect(group.getAttribute('aria-label')).toBe('Type of place');
    expect(getComputedStyle(group).alignSelf).toBe('stretch');
    expect(byTestId('t-any').getAttribute('aria-checked')).toBe('true');
    press('t-room');
    expect(onChange).toHaveBeenCalledWith('room');
    expect(byTestId('t-room').getAttribute('aria-checked')).toBe('true');
    expect(byTestId('t-any').getAttribute('aria-checked')).toBe('false');
  });
});

describe('CountFilter', () => {
  function H({ onChange, initial = null }: { onChange?: (n: number | null) => void; initial?: number | null }) {
    const [v, setV] = useState<number | null>(initial);
    return (
      <CountFilter
        title="Bedrooms"
        value={v}
        onValueChange={(n) => {
          onChange?.(n);
          setV(n);
        }}
        testID="c"
      />
    );
  }

  it('is a radiogroup named by the title: Any, 1..7, 8+', () => {
    mount(<H />);
    const group = container.querySelector('[role="radiogroup"]') as HTMLElement;
    expect(group.getAttribute('aria-label')).toBe('Bedrooms');
    const radios = Array.from(group.querySelectorAll('[role="radio"]'));
    expect(radios.map((r) => r.textContent)).toEqual(['Any', '1', '2', '3', '4', '5', '6', '7', '8+']);
    expect(radios.map((r) => r.getAttribute('aria-checked'))).toEqual([
      'true', 'false', 'false', 'false', 'false', 'false', 'false', 'false', 'false',
    ]);
  });

  it('selects one count at a time and "Any" returns null', () => {
    const onChange = jest.fn();
    mount(<H onChange={onChange} />);
    press('c-3');
    press('c-8');
    press('c-any');
    expect(onChange.mock.calls.map(([n]) => n)).toEqual([3, 8, null]);
    expect(byTestId('c-any').getAttribute('aria-checked')).toBe('true');
  });

  it.each(['light', 'dark'] as const)('paints the selected pill inverted, 40 tall and a full pill (%s)', (mode) => {
    mount(<H initial={2} />, mode);
    const on = byTestId('c-2');
    const off = byTestId('c-3');
    expect(bg(on)).toBe(normaliseBg(theme.colors.text));
    expect(getComputedStyle(on.querySelector('[dir="auto"]') as HTMLElement).color).toBe(
      normalise(theme.colors.background),
    );
    expect(bg(off)).toBe('rgba(0, 0, 0, 0)');

    expect(getComputedStyle(off).borderTopColor).toBe(normalise(theme.colors.border));
    expect(getComputedStyle(on).height).toBe('40px');
    expect(getComputedStyle(on).borderTopLeftRadius).toBe('9999px');
  });

  it('disabled: every pill says so and presses do nothing', () => {
    const onChange = jest.fn();
    mount(<CountFilter title="Beds" value={null} onValueChange={onChange} disabled testID="c" />);
    expect(byTestId('c-1').getAttribute('aria-disabled')).toBe('true');
    press('c-1');
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('ToggleChipGroup and AmenityFilter', () => {
  const OPTIONS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((v) => ({
    value: v,
    label: v.toUpperCase(),
    icon: RiWifiLine,
  }));

  it('is a named group of aria-pressed toggles reporting the selection in option order', () => {
    const onChange = jest.fn();
    function H() {
      const [v, setV] = useState<string[]>(['c']);
      return (
        <ToggleChipGroup
          options={OPTIONS.slice(0, 4)}
          value={v}
          onValueChange={(n) => {
            onChange(n);
            setV(n);
          }}
          accessibilityLabel="Amenities"
          testID="g"
        />
      );
    }
    mount(<H />);
    expect(byTestId('g').getAttribute('role')).toBe('group');
    expect(byTestId('g').getAttribute('aria-label')).toBe('Amenities');
    expect(byTestId('g-a').getAttribute('role')).toBe('button');
    expect(byTestId('g-a').getAttribute('aria-pressed')).toBe('false');
    expect(byTestId('g-c').getAttribute('aria-pressed')).toBe('true');
    expect(byTestId('g-a').querySelector('svg')).not.toBeNull();
    press('g-d');
    press('g-a');
    expect(onChange.mock.calls.map(([n]) => n)).toEqual([['c', 'd'], ['a', 'c', 'd']]);
    press('g-c');
    expect(onChange).toHaveBeenLastCalledWith(['a', 'd']);
    expect(byTestId('g-c').getAttribute('aria-pressed')).toBe('false');
  });

  it('folds past collapsedCount, keeps a selected option past the fold visible, and toggles aria-expanded', () => {
    function H() {
      const [v, setV] = useState<string[]>(['h']);
      return (
        <AmenityFilter
          options={OPTIONS}
          value={v}
          onValueChange={setV}
          collapsedCount={3}
          accessibilityLabel="Amenities"
          testID="am"
        />
      );
    }
    mount(<H />);
    const labels = () => Array.from(byTestId('am-group').querySelectorAll('[role="button"]')).map((b) => b.textContent);
    expect(labels()).toEqual(['A', 'B', 'C', 'H']);
    const toggle = byTestId('am-toggle');
    expect(toggle.textContent).toBe('Show more');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    press('am-toggle');
    expect(labels()).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
    expect(byTestId('am-toggle').textContent).toBe('Show less');
    expect(byTestId('am-toggle').getAttribute('aria-expanded')).toBe('true');
  });

  it('draws no link when every option fits', () => {
    mount(<AmenityFilter options={OPTIONS.slice(0, 2)} value={[]} onValueChange={() => {}} accessibilityLabel="A" testID="am" />);
    expect(maybeTestId('am-toggle')).toBeNull();
  });
});

describe('SwitchFilterRow', () => {
  it('names the switch by its title and reports aria-checked', () => {
    const onChange = jest.fn();
    mount(
      <SwitchFilterRow title="Instant Book" description="No waiting" value onValueChange={onChange} testID="sw" />,
    );
    const sw = container.querySelector('[role="switch"]') as HTMLElement;
    expect(sw.getAttribute('aria-label')).toBe('Instant Book');
    expect(sw.getAttribute('aria-checked')).toBe('true');
    expect(container.textContent).toContain('No waiting');
  });
});

describe('FilterFooter', () => {
  it('clears and applies, draws the top hairline, and shows the loading state on the apply button', () => {
    const onClear = jest.fn();
    const onApply = jest.fn();
    mount(<FilterFooter resultsLabel="Show 1,000+ places" onClear={onClear} onApply={onApply} testID="f" />);
    const footer = byTestId('f');
    expect(getComputedStyle(footer).borderTopWidth).toBe('1px');
    expect(getComputedStyle(footer).paddingLeft).toBe('24px');
    expect(byTestId('f-clear').textContent).toBe('Clear all');
    expect(byTestId('f-clear').getAttribute('role')).toBe('button');
    expect(byTestId('f-apply').textContent).toContain('Show 1,000+ places');
    press('f-clear');
    press('f-apply');
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(onApply).toHaveBeenCalledTimes(1);

    mount(<FilterFooter resultsLabel="Show 2 places" loading clearDisabled onClear={onClear} onApply={onApply} testID="f" />);
    expect(byTestId('f-apply').getAttribute('aria-busy')).toBe('true');
    expect(byTestId('f-clear').getAttribute('aria-disabled')).toBe('true');
    press('f-clear');
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});

describe('FilterTriggerButton', () => {
  it('says how many filters are applied in its name and its badge', () => {
    mount(<FilterTriggerButton testID="t" />);
    expect(byTestId('t').getAttribute('aria-label')).toBe('Filters');
    expect(byTestId('t').textContent).toBe('Filters');

    mount(<FilterTriggerButton count={3} testID="t" />);
    expect(byTestId('t').getAttribute('aria-label')).toBe('Filters, 3 applied');
    expect(container.textContent).toContain('3');
  });
});

// ---------------------------------------------------------------------------
//  Housing filters
// ---------------------------------------------------------------------------

describe('PriceRangeFilter scale="log"', () => {
  it('maps prices by ratio: the geometric midpoint sits mid-slider, ends are exact, steps snap', () => {
    const m = priceScaleMapping('log', 50_000, 2_000_000, 5000);
    expect([m.sliderMin, m.sliderMax]).toEqual([0, PRICE_SCALE_POSITIONS]);
    expect(m.toPrice(0)).toBe(50_000);
    expect(m.toPrice(PRICE_SCALE_POSITIONS)).toBe(2_000_000);
    // sqrt(50k × 2M) ≈ 316,228 → snapped to 5,000
    expect(m.toPrice(PRICE_SCALE_POSITIONS / 2)).toBe(315_000);
    expect(m.toPosition(316_228)).toBe(PRICE_SCALE_POSITIONS / 2);
    expect(m.toPrice(m.toPosition(600_000)) % 5000).toBe(0);
  });

  it('offsets by one when min is 0, and stays linear by default', () => {
    const m = priceScaleMapping('log', 0, 1000, 1);
    expect(m.toPrice(0)).toBe(0);
    expect(m.toPrice(PRICE_SCALE_POSITIONS)).toBe(1000);
    expect(m.toPrice(PRICE_SCALE_POSITIONS / 2)).toBe(31);
    const linear = priceScaleMapping('linear', 0, 1000, 1);
    expect([linear.sliderMin, linear.sliderMax, linear.toPrice(400)]).toEqual([0, 1000, 400]);
  });

  it('drives the slider in positions and keeps the fields in prices', () => {
    function H() {
      const [v, setV] = useState<[number, number]>([200_000, 800_000]);
      return (
        <PriceRangeFilter scale="log" step={5000} min={50_000} max={2_000_000} value={v} onValueChange={setV} formatPrice={(n) => `€${n}`} testID="p" />
      );
    }
    mount(<H />);
    const thumbs = Array.from(byTestId('p-slider').querySelectorAll('[role="slider"]'));
    expect(thumbs[0]?.getAttribute('aria-valuemax')).not.toBeNull();
    expect(thumbs.map((t) => t.getAttribute('aria-valuenow'))).toEqual(['75', '150']);
    expect((byTestId('p-min') as HTMLInputElement).value).toBe('€200000');
    typeInto('p-min', '1,000,000');
    expect((byTestId('p-min') as HTMLInputElement).value).toBe('€800000');
  });
});

describe('range fields', () => {
  it('snaps and clamps a typed value to its own side, open ends allowed', () => {
    expect(commitRangeField([null, 100], 0, 130, { min: 0, step: 5 })).toEqual([100, 100]);
    expect(commitRangeField([40, null], 1, 22, { min: 0, step: 5 })).toEqual([40, 40]);
    expect(commitRangeField([null, null], 1, 72, { min: 0, max: 500, step: 5 })).toEqual([null, 70]);
  });
});

describe('AreaRangeFilter', () => {
  it('is a named group of m² fields; an emptied field commits null; the slider is optional', () => {
    const onChange = jest.fn();
    function H({ slider }: { slider?: boolean }) {
      const [v, setV] = useState<[number | null, number | null]>([60, null]);
      return (
        <AreaRangeFilter
          slider={slider}
          value={v}
          onValueChange={(n) => {
            onChange(n);
            setV(n);
          }}
          testID="a"
        />
      );
    }
    mount(<H />);
    expect(byTestId('a').getAttribute('role')).toBe('group');
    expect(byTestId('a').getAttribute('aria-label')).toBe('Area');
    expect(maybeTestId('a-slider')).toBeNull();
    expect((byTestId('a-min') as HTMLInputElement).value).toBe('60 m²');
    expect((byTestId('a-max') as HTMLInputElement).value).toBe('');
    typeInto('a-max', '121');
    expect(onChange).toHaveBeenLastCalledWith([60, 120]);
    typeInto('a-min', '');
    expect(onChange).toHaveBeenLastCalledWith([null, 120]);

    // Same component, so the state carries over: an open end rests on its bound.
    mount(<H slider />);
    const thumbs = Array.from(byTestId('a-slider').querySelectorAll('[role="slider"]'));
    expect(thumbs.map((t) => t.getAttribute('aria-valuenow'))).toEqual(['0', '120']);
  });
});

describe('PropertyTypeFilter', () => {
  it('draws the large tiles as a group of aria-pressed toggles', () => {
    const onChange = jest.fn();
    mount(<PropertyTypeFilter value={['room']} onValueChange={onChange} columns={2} testID="pt" />);
    expect(byTestId('pt').getAttribute('aria-label')).toBe('Property type');
    expect(byTestId('pt-room').getAttribute('aria-pressed')).toBe('true');
    expect(byTestId('pt-room').style.minHeight).toBe('100px');
    expect(byTestId('pt-apartment').parentElement?.children).toHaveLength(2);
    press('pt-hostel');
    expect(onChange).toHaveBeenLastCalledWith(['room', 'hostel']);
  });
});

describe('FeatureFilter', () => {
  it('chips: the eleven features as aria-pressed toggles with icons', () => {
    const onChange = jest.fn();
    mount(<FeatureFilter<HousingFeature> value={['pool']} onValueChange={onChange} labels={{ pets: 'Pet friendly' }} testID="f" />);
    const buttons = Array.from(byTestId('f').querySelectorAll('[role="button"]'));
    expect(buttons.map((b) => b.textContent)).toEqual([
      'Elevator', 'Parking', 'Terrace', 'Garden', 'Pool', 'Furnished', 'Pet friendly',
      'Air conditioning', 'Heating', 'Accessible', 'Storage room',
    ]);
    expect(byTestId('f').getAttribute('aria-label')).toBe('Features');
    expect(byTestId('f-pool').getAttribute('aria-pressed')).toBe('true');
    expect(byTestId('f-elevator').querySelector('svg')).not.toBeNull();
    press('f-elevator');
    expect(onChange).toHaveBeenLastCalledWith(['elevator', 'pool']);
  });

  it('checkboxes: checkbox roles with aria-checked, reporting in option order', () => {
    const onChange = jest.fn();
    mount(<FeatureFilter variant="checkboxes" value={['heating']} onValueChange={onChange} testID="f" />);
    const boxes = Array.from(byTestId('f').querySelectorAll('[role="checkbox"]'));
    expect(boxes).toHaveLength(11);
    const heating = boxes.find((b) => b.getAttribute('aria-checked') === 'true');
    expect(heating).toBeDefined();
    act(() => {
      (boxes[0] as HTMLElement).click();
    });
    expect(onChange).toHaveBeenLastCalledWith(['elevator', 'heating']);
  });
});

describe('EnergyRatingFilter', () => {
  it('paints A→G from success to error with a legible letter', () => {
    mount(<EnergyRatingFilter value={null} onValueChange={() => {}} />);
    const paint = resolveEnergyRatingPaint(theme);
    expect(paint.A.fill).toBe(theme.colors.success);
    expect(paint.D.fill).toBe(theme.colors.warning);
    expect(paint.G.fill).toBe(theme.colors.error);
    for (const r of ['A', 'B', 'C', 'D', 'E', 'F', 'G'] as EnergyRating[]) {
      expect(contrastRatio(paint[r].fill, paint[r].foreground)).toBeGreaterThanOrEqual(3);
    }
  });

  it('"and better": the chosen letter and everything above it stay coloured; pressing it again clears', () => {
    const onChange = jest.fn();
    function H() {
      const [v, setV] = useState<EnergyRating | null>(null);
      return (
        <EnergyRatingFilter
          value={v}
          onValueChange={(n) => {
            onChange(n);
            setV(n);
          }}
          testID="e"
        />
      );
    }
    mount(<H />);
    const group = container.querySelector('[role="radiogroup"]') as HTMLElement;
    expect(group.getAttribute('aria-label')).toBe('Energy rating');
    expect(byTestId('e-summary').textContent).toBe('Any rating');
    expect(byTestId('e-C').getAttribute('aria-label')).toBe('C and better');
    expect(byTestId('e-A').getAttribute('aria-label')).toBe('A only');
    press('e-C');
    expect(onChange).toHaveBeenLastCalledWith('C');
    expect(byTestId('e-C').getAttribute('aria-checked')).toBe('true');
    expect(byTestId('e-B').getAttribute('aria-checked')).toBe('false');
    expect(byTestId('e-summary').textContent).toBe('C and better');
    const paint = resolveEnergyRatingPaint(theme);
    expect(bg(byTestId('e-B'))).toBe(normaliseBg(paint.B.fill));
    expect(bg(byTestId('e-D'))).not.toBe(normaliseBg(paint.D.fill));
    expect(byTestId('e-C').style.borderTopColor).not.toBe('transparent');
    press('e-C');
    expect(onChange).toHaveBeenLastCalledWith(null);
  });
});

describe('AvailabilityFilter', () => {
  it('names the switch; "available now" disables the date picker', () => {
    const onNow = jest.fn();
    function H() {
      const [now, setNow] = useState(false);
      return (
        <AvailabilityFilter
          availableNow={now}
          onAvailableNowChange={(n) => {
            onNow(n);
            setNow(n);
          }}
          date={null}
          onDateChange={() => {}}
          testID="av"
        />
      );
    }
    mount(<H />);
    const sw = container.querySelector('[role="switch"]') as HTMLElement;
    expect(sw.getAttribute('aria-label')).toBe('Available now');
    expect(container.textContent).toContain('Available from');
    const picker = byTestId('av-date');
    expect(picker.getAttribute('aria-disabled')).not.toBe('true');
    act(() => {
      sw.click();
    });
    expect(onNow).toHaveBeenLastCalledWith(true);
    expect(byTestId('av-date').getAttribute('aria-disabled')).toBe('true');
  });
});

describe('FloorFilter', () => {
  it('Ground, Middle, Top, With elevator as a named group of toggles', () => {
    const onChange = jest.fn();
    mount(<FloorFilter value={[]} onValueChange={onChange} testID="fl" />);
    expect(byTestId('fl').getAttribute('aria-label')).toBe('Floor');
    expect(Array.from(byTestId('fl').querySelectorAll('[role="button"]')).map((b) => b.textContent)).toEqual([
      'Ground', 'Middle', 'Top', 'With elevator',
    ]);
    press('fl-elevator');
    expect(onChange).toHaveBeenLastCalledWith(['elevator']);
  });
});
