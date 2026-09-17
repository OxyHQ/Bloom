/**
 * @jest-environment jsdom
 *
 * The home-search family, rendered through the REAL react-native-web so the
 * assertions read emitted DOM attributes and inline styles rather than props.
 */
import React, { useState } from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { resolveButtonRamps } from '../button/shared';
import {
  BudgetPicker,
  HOME_SEARCH_SEGMENTS,
  HomeSearchBar,
  MoveInPicker,
  PropertyTypePicker,
  SavedSearchCard,
  SaveSearchButton,
  SearchModeTabs,
  homeSearchSegments,
} from '../home-search';
import type { HomeSearchMode, MoveInValue } from '../home-search';
import { budgetPresetLabel } from '../home-search/BudgetPicker';
import { segmentPanelAlign } from '../home-search/HomeSearchBar';
import { StaySearchPanel } from '../stay-search';
import { resolveStaySearchPalette } from '../stay-search/palette';
import { STAY_SEARCH_BAR_HEIGHT } from '../stay-search/constants';
import { tileColumns } from '../stay-filters/PropertyTypeTiles';
import type { PropertyType } from '../stay-filters';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import type { Theme } from '../theme/types';
import { useTheme } from '../theme/use-theme';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;
let theme: Theme;

function CaptureTheme() {
  theme = useTheme();
  return null;
}

function mount(ui: React.ReactElement, mode: 'light' | 'dark' = 'light') {
  act(() => {
    root.render(
      <BloomThemeProvider mode={mode} colorPreset="teal">
        <CaptureTheme />
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

function click(id: string) {
  act(() => {
    byTestId(id).click();
  });
}

function css(color: string): string {
  const probe = document.createElement('div');
  probe.style.backgroundColor = color;
  return probe.style.backgroundColor;
}

function borderCss(color: string): string {
  const probe = document.createElement('div');
  probe.style.borderTopColor = color;
  return probe.style.borderTopColor;
}

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

describe('segment presets', () => {
  it('gives every mode its segments in order', () => {
    const keys = (m: HomeSearchMode) => HOME_SEARCH_SEGMENTS[m].map((s) => s.label);
    expect(keys('rent')).toEqual(['Location', 'Move-in', 'Budget']);
    expect(keys('buy')).toEqual(['Location', 'Price', 'Property type']);
    expect(keys('stays')).toEqual(['Where', 'Check in', 'Check out', 'Who']);
    expect(keys('swap')).toEqual(['Where', 'Dates', 'Home size']);
  });

  it('fills values and applies per-key overrides', () => {
    const segments = homeSearchSegments('rent', { budget: '€900' }, { location: { label: 'Area', flex: 2 } });
    expect(segments.map((s) => [s.key, s.label, s.value, s.flex])).toEqual([
      ['location', 'Area', undefined, 2],
      ['moveIn', 'Move-in', undefined, 1],
      ['budget', 'Budget', '€900', 1.5],
    ]);
  });

  it('aligns a panel start / centre / end by position unless a segment says otherwise', () => {
    const three = [{}, {}, {}];
    expect([0, 1, 2].map((i) => segmentPanelAlign(three, i))).toEqual(['start', 'center', 'end']);
    expect(segmentPanelAlign([{}, { panelAlign: 'end' }, {}], 1)).toBe('end');
  });
});

function RentBar({ onChange, panel }: { onChange?: (s: string | null) => void; panel?: React.ReactNode }) {
  const [segment, setSegment] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  return (
    <HomeSearchBar
      testID="bar"
      segments={homeSearchSegments('rent', { location: 'Old Halden' })}
      activeSegment={segment}
      onActiveSegmentChange={(s) => {
        onChange?.(s);
        setSegment(s);
      }}
      query={query}
      onQueryChange={setQuery}
      searchLabel="Find homes"
      panel={panel}
    />
  );
}

describe('HomeSearchBar', () => {
  it('draws any segments in the 66-tall search pill, each a named button with aria-expanded', () => {
    const onChange = jest.fn();
    mount(<RentBar onChange={onChange} />);
    const bar = byTestId('bar').firstElementChild as HTMLElement;
    expect(bar.getAttribute('role')).toBe('search');
    expect(bar.style.height).toBe(`${STAY_SEARCH_BAR_HEIGHT}px`);
    expect(byTestId('bar-location').getAttribute('aria-label')).toBe('Location, Old Halden');
    expect(byTestId('bar-budget').getAttribute('aria-label')).toBe('Budget, Add budget');
    expect(byTestId('bar-moveIn').getAttribute('aria-expanded')).toBe('false');
    expect(query('bar-separator-2')).not.toBeNull();
    expect(query('bar-separator-3')).toBeNull();
    click('bar-moveIn');
    expect(onChange).toHaveBeenLastCalledWith('moveIn');
    expect(byTestId('bar-moveIn').getAttribute('aria-expanded')).toBe('true');
    const palette = resolveStaySearchPalette(theme);
    expect((byTestId('bar-moveIn').parentElement as HTMLElement).style.backgroundColor).toBe(css(palette.segmentActive));
  });

  it('puts the search button in the last segment, labelled while open, and aligns the panel', () => {
    mount(<RentBar panel={<StaySearchPanel>x</StaySearchPanel>} />);
    expect(byTestId('bar-budget').parentElement?.contains(byTestId('bar-search'))).toBe(true);
    expect(byTestId('bar-search').getAttribute('aria-label')).toBe('Find homes');
    expect(byTestId('bar-search').textContent).toBe('');
    click('bar-budget');
    expect(byTestId('bar-search').textContent).toBe('Find homes');
    expect(byTestId('bar-panel').style.justifyContent).toBe('flex-end');
    click('bar-moveIn');
    expect(byTestId('bar-panel').style.justifyContent).toBe('center');
  });

  it('makes the open FIRST segment a text field when a query handler is set', () => {
    mount(<RentBar />);
    click('bar-location');
    const input = byTestId('bar-location-input') as HTMLInputElement;
    expect(input.tagName).toBe('INPUT');
    expect(input.getAttribute('aria-label')).toBe('Location');
    click('bar-moveIn');
    expect(query('bar-moveIn-input')).toBeNull();
  });
});

describe('SearchModeTabs', () => {
  function Tabs(props: { variant?: 'tabs' | 'segmented'; onChange?: (m: HomeSearchMode) => void }) {
    const [mode, setMode] = useState<HomeSearchMode>('buy');
    return (
      <SearchModeTabs
        testID="modes"
        variant={props.variant}
        value={mode}
        onValueChange={(m) => {
          props.onChange?.(m);
          setMode(m);
        }}
      />
    );
  }

  it('tabs: a named tablist of aria-selected tabs with a text-colour underline on the selected one', () => {
    const onChange = jest.fn();
    mount(<Tabs onChange={onChange} />);
    const list = byTestId('modes');
    expect(list.getAttribute('role')).toBe('tablist');
    expect(list.getAttribute('aria-label')).toBe('Search mode');
    const tabs = Array.from(list.querySelectorAll('[role="tab"]'));
    expect(tabs.map((t) => t.textContent)).toEqual(['Rent', 'Buy', 'Vacation rentals', 'Swap']);
    expect(byTestId('modes-buy').getAttribute('aria-selected')).toBe('true');
    expect(byTestId('modes-rent').getAttribute('aria-selected')).toBe('false');
    expect(byTestId('modes-buy-bar').style.backgroundColor).toBe(css(theme.colors.text));
    expect(byTestId('modes-rent-bar').style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
    expect(byTestId('modes-buy').getAttribute('tabindex')).toBe('0');
    expect(byTestId('modes-rent').getAttribute('tabindex')).toBe('-1');
    click('modes-swap');
    expect(onChange).toHaveBeenLastCalledWith('swap');
    expect(byTestId('modes-swap').getAttribute('aria-selected')).toBe('true');
  });

  it('honours a subset, order and labels', () => {
    mount(<SearchModeTabs modes={['buy', 'rent']} labels={{ rent: 'To rent' }} value="rent" onValueChange={() => {}} testID="m" />);
    expect(Array.from(byTestId('m').querySelectorAll('[role="tab"]')).map((t) => t.textContent)).toEqual(['Buy', 'To rent']);
  });

  it('segmented: a pill SegmentedControl tablist', () => {
    mount(<Tabs variant="segmented" />);
    const list = container.querySelector('[role="tablist"]') as HTMLElement;
    expect(list.getAttribute('aria-label')).toBe('Search mode');
    expect(list.style.borderTopLeftRadius).toBe('9999px');
    expect(byTestId('modes-buy').getAttribute('aria-selected')).toBe('true');
    click('modes-rent');
    expect(byTestId('modes-rent').getAttribute('aria-selected')).toBe('true');
  });
});

describe('BudgetPicker', () => {
  function H({ period, onChange }: { period?: 'month' | 'total'; onChange?: (v: [number | null, number | null]) => void }) {
    const [v, setV] = useState<[number | null, number | null]>([null, null]);
    return (
      <BudgetPicker
        period={period}
        value={v}
        onValueChange={(n) => {
          onChange?.(n);
          setV(n);
        }}
        formatAmount={(n) => `€${n}`}
        testID="b"
      />
    );
  }

  it('labels presets from the formatter', () => {
    const f = (n: number) => `€${n}`;
    expect(budgetPresetLabel({ min: null, max: 800 }, f)).toBe('Up to €800');
    expect(budgetPresetLabel({ min: 800, max: 1200 }, f)).toBe('€800 – €1200');
    expect(budgetPresetLabel({ min: 1800, max: null }, f)).toBe('€1800+');
    expect(budgetPresetLabel({ min: 1, max: 2, label: 'Cheap' }, f)).toBe('Cheap');
  });

  it('a preset sets both ends and toggles off; its chip reports aria-pressed', () => {
    const onChange = jest.fn();
    mount(<H onChange={onChange} />);
    expect(byTestId('b-preset-1').textContent).toBe('€800 – €1200');
    expect(byTestId('b-preset-1').getAttribute('aria-pressed')).toBe('false');
    click('b-preset-1');
    expect(onChange).toHaveBeenLastCalledWith([800, 1200]);
    expect(byTestId('b-preset-1').getAttribute('aria-pressed')).toBe('true');
    expect((byTestId('b-min') as HTMLInputElement).value).toBe('€800');
    click('b-preset-1');
    expect(onChange).toHaveBeenLastCalledWith([null, null]);
    expect((byTestId('b-min') as HTMLInputElement).value).toBe('');
  });

  it('typed amounts snap to the period step, can not pass the other end, and empty means open', () => {
    const onChange = jest.fn();
    mount(<H period="total" onChange={onChange} />);
    expect(byTestId('b-preset-3').textContent).toBe('€600000+');
    typeInto('b-max', '301,200');
    expect(onChange).toHaveBeenLastCalledWith([null, 300000]);
    typeInto('b-min', '450000');
    expect(onChange).toHaveBeenLastCalledWith([300000, 300000]);
    typeInto('b-max', '');
    expect(onChange).toHaveBeenLastCalledWith([300000, null]);
  });
});

describe('MoveInPicker', () => {
  function H({ onChange }: { onChange: (v: MoveInValue) => void }) {
    const [v, setV] = useState<MoveInValue>({ timing: 'date', date: new Date(2026, 9, 15), contractLength: 'any' });
    return (
      <MoveInPicker
        value={v}
        onValueChange={(n) => {
          onChange(n);
          setV(n);
        }}
        defaultMonth={new Date(2026, 9, 1)}
        testID="m"
      />
    );
  }

  it('a timing chip clears the day and toggles back; contract length is single-select', () => {
    const onChange = jest.fn();
    mount(<H onChange={onChange} />);
    expect(byTestId('m-asap').textContent).toBe('As soon as possible');
    expect(byTestId('m-asap').getAttribute('aria-pressed')).toBe('false');
    click('m-asap');
    expect(onChange).toHaveBeenLastCalledWith({ timing: 'asap', date: null, contractLength: 'any' });
    expect(byTestId('m-asap').getAttribute('aria-pressed')).toBe('true');
    click('m-flexible');
    expect(onChange.mock.lastCall[0].timing).toBe('flexible');
    click('m-flexible');
    expect(onChange.mock.lastCall[0].timing).toBe('date');
    expect(byTestId('m-length-any').getAttribute('aria-pressed')).toBe('true');
    click('m-length-long');
    expect(onChange.mock.lastCall[0].contractLength).toBe('long');
    expect(byTestId('m-length-long').textContent).toBe('1+ year');
    expect(byTestId('m-length-any').getAttribute('aria-pressed')).toBe('false');
    expect(query('m-calendar')).not.toBeNull();
  });
});

describe('PropertyTypePicker', () => {
  it('picks 2 to 4 columns from the width', () => {
    expect(tileColumns(0, 96)).toBe(4);
    expect(tileColumns(200, 96)).toBe(2);
    expect(tileColumns(320, 96)).toBe(3);
    expect(tileColumns(900, 96)).toBe(4);
  });

  it('a named group of aria-pressed tiles, radius 12; selected is a 2px text border on a neutral tint', () => {
    const onChange = jest.fn();
    function H() {
      const [v, setV] = useState<PropertyType[]>(['house']);
      return (
        <PropertyTypePicker
          value={v}
          onValueChange={(n) => {
            onChange(n);
            setV(n);
          }}
          labels={{ other: 'Other' }}
          testID="t"
        />
      );
    }
    mount(<H />);
    const group = byTestId('t');
    expect(group.getAttribute('role')).toBe('group');
    expect(group.getAttribute('aria-label')).toBe('Property type');
    expect(group.querySelectorAll('[role="button"]')).toHaveLength(8);
    expect(byTestId('t-other').textContent).toBe('Other');
    const house = byTestId('t-house');
    const { neutral } = resolveButtonRamps(theme);
    expect(house.getAttribute('aria-pressed')).toBe('true');
    expect(house.style.borderTopLeftRadius).toBe('12px');
    expect(house.style.borderTopWidth).toBe('2px');
    expect(house.style.borderTopColor).toBe(borderCss(theme.colors.text));
    expect(house.style.backgroundColor).toBe(css(neutral[100]));
    expect(byTestId('t-room').style.borderTopWidth).toBe('1px');
    click('t-studio');
    click('t-apartment');
    expect(onChange).toHaveBeenLastCalledWith(['apartment', 'house', 'studio']);
  });
});

describe('SavedSearchCard and SaveSearchButton', () => {
  it('names the open button with the new count; actions are siblings, not nested', () => {
    const onPress = jest.fn();
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    mount(
      <SavedSearchCard
        title="Flats in Old Halden"
        criteria={['Rent', '2+ bedrooms']}
        newCount={12}
        alertFrequency="Daily alerts"
        onPress={onPress}
        onEdit={onEdit}
        onDelete={onDelete}
        testID="s"
      />,
    );
    const open = byTestId('s-open');
    expect(open.getAttribute('role')).toBe('button');
    expect(open.getAttribute('aria-label')).toBe('Flats in Old Halden, 12 new');
    expect(byTestId('s-badge').textContent).toBe('12 new');
    expect(open.contains(byTestId('s-edit'))).toBe(false);
    expect(byTestId('s-edit').getAttribute('aria-label')).toBe('Edit Flats in Old Halden');
    expect(byTestId('s-delete').getAttribute('aria-label')).toBe('Delete Flats in Old Halden');
    expect(byTestId('s').style.borderTopLeftRadius).toBe('16px');
    expect(container.textContent).toContain('2+ bedrooms');
    expect(container.textContent).toContain('Daily alerts');
    click('s-open');
    click('s-edit');
    click('s-delete');
    expect([onPress, onEdit, onDelete].map((f) => f.mock.calls.length)).toEqual([1, 1, 1]);
  });

  it('shows no badge at zero and "Alerts off" without a frequency', () => {
    mount(<SavedSearchCard title="Swap" testID="s" />);
    expect(query('s-badge')).toBeNull();
    expect(query('s-open')).toBeNull();
    expect(container.textContent).toContain('Alerts off');
  });

  it('the save toggle reports aria-pressed and flips its label', () => {
    function H() {
      const [saved, setSaved] = useState(false);
      return <SaveSearchButton saved={saved} onSavedChange={setSaved} testID="save" />;
    }
    mount(<H />);
    expect(byTestId('save').getAttribute('role')).toBe('button');
    expect(byTestId('save').getAttribute('aria-pressed')).toBe('false');
    expect(byTestId('save').getAttribute('aria-label')).toBe('Save search');
    click('save');
    expect(byTestId('save').getAttribute('aria-pressed')).toBe('true');
    expect(byTestId('save').textContent).toBe('Saved');
    expect(byTestId('save').style.backgroundColor).toBe(css(theme.colors.text));
  });
});
