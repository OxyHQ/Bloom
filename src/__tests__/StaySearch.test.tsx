/**
 * @jest-environment jsdom
 *
 * The stay-search family, rendered through the REAL react-native-web so the
 * assertions read emitted DOM attributes and inline styles rather than props.
 */
import React, { useState } from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { resolveButtonRamps } from '../button/shared';
import { resolveMenuPalette } from '../floating/menu-palette';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import type { Theme } from '../theme/types';
import {
  DateFlexibilityChips,
  DestinationSuggestions,
  GuestPicker,
  StaySearchBar,
  StaySearchCompact,
  StaySearchPanel,
  StaySearchStep,
  applyGuestCount,
  minimumAdults,
} from '../stay-search';
import type { GuestCounts, StaySearchBarProps, StaySearchSegment } from '../stay-search';
import { nextSelectable } from '../stay-search/DestinationSuggestions';
import { resolveStaySearchPalette } from '../stay-search/palette';
import { STAY_SEARCH_BAR_HEIGHT, STAY_SEARCH_PANEL_RADIUS } from '../stay-search/constants';
import { DISABLED_OPACITY } from '../styles/tokens';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;
let theme: Theme;

function CaptureTheme() {
  theme = useTheme();
  return null;
}

function mount(ui: React.ReactElement, mode: 'light' | 'dark' = 'light'): HTMLElement {
  act(() => {
    root.render(
      <BloomThemeProvider mode={mode} colorPreset="teal">
        <CaptureTheme />
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

function query(id: string): HTMLElement | null {
  return container.querySelector(`[data-testid="${id}"]`);
}

/** react-native-web emits `transparent` as a zero-alpha rgba. */
const CLEAR = 'rgba(0, 0, 0, 0)';

/** jsdom normalises colours to `rgb(...)`; run a resolved colour through it too. */
function css(color: string): string {
  const probe = document.createElement('div');
  probe.style.backgroundColor = color;
  return probe.style.backgroundColor;
}

function click(id: string) {
  act(() => {
    byTestId(id).click();
  });
}

/**
 * react-native-web's hover hook binds `pointerenter`/`pointerleave` where
 * `PointerEvent` exists and `mouseenter`/`mouseleave` otherwise — jsdom has no
 * `PointerEvent`, so the mouse pair it is.
 */
function hover(id: string, type: 'mouseenter' | 'mouseleave' = 'mouseenter') {
  act(() => {
    byTestId(id).dispatchEvent(new MouseEvent(type, { view: window }));
  });
}

function ControlledBar(props: Partial<StaySearchBarProps> & { initial?: StaySearchSegment | null; onChange?: (s: StaySearchSegment | null) => void }) {
  const { initial = null, onChange, ...rest } = props;
  const [segment, setSegment] = useState<StaySearchSegment | null>(initial);
  return (
    <StaySearchBar
      testID="bar"
      {...rest}
      activeSegment={segment}
      onActiveSegmentChange={(s) => {
        onChange?.(s);
        setSegment(s);
      }}
    />
  );
}

describe('StaySearchBar', () => {
  it('draws four segments in split mode and three in single mode, with labels and placeholders', () => {
    mount(<ControlledBar />);
    for (const s of ['destination', 'checkIn', 'checkOut', 'guests']) expect(query(`bar-${s}`)).not.toBeNull();
    expect(query('bar-dates')).toBeNull();
    expect(byTestId('bar-destination').textContent).toBe('WhereSearch destinations');
    expect(byTestId('bar-guests').textContent).toBe('WhoAdd guests');

    act(() => root.unmount());
    root = createRoot(container);
    mount(<ControlledBar datesMode="single" dates={{ checkIn: 'Oct 12', checkOut: 'Oct 16' }} />);
    expect(query('bar-checkIn')).toBeNull();
    expect(byTestId('bar-dates').textContent).toBe('WhenOct 12 – Oct 16');
  });

  it('is a 66-tall full pill with a hairline, on the card surface at rest and neutral while open', () => {
    mount(<ControlledBar />);
    const palette = resolveStaySearchPalette(theme);
    const bar = byTestId('bar').firstElementChild as HTMLElement;
    expect(bar.style.height).toBe(`${STAY_SEARCH_BAR_HEIGHT}px`);
    expect(bar.getAttribute('role')).toBe('search');
    expect(bar.style.borderTopLeftRadius).toBe('9999px');
    expect(bar.style.backgroundColor).toBe(css(palette.barSurface));
    click('bar-checkIn');
    expect((byTestId('bar').firstElementChild as HTMLElement).style.backgroundColor).toBe(css(palette.barSurfaceOpen));
    expect(palette.barSurfaceOpen).not.toBe(palette.barSurface);
  });

  it('a segment is a named button with aria-expanded, raised while open', () => {
    const onChange = jest.fn();
    mount(<ControlledBar destination="Marrowfield" onChange={onChange} />);
    const palette = resolveStaySearchPalette(theme);
    const where = byTestId('bar-destination');
    expect(where.getAttribute('role')).toBe('button');
    expect(where.getAttribute('aria-label')).toBe('Where, Marrowfield');
    expect(where.getAttribute('aria-expanded')).toBe('false');
    click('bar-destination');
    expect(onChange).toHaveBeenLastCalledWith('destination');
    expect(byTestId('bar-destination').getAttribute('aria-expanded')).toBe('true');
    const shell = byTestId('bar-destination').parentElement as HTMLElement;
    expect(shell.style.backgroundColor).toBe(css(palette.segmentActive));
    expect(shell.style.boxShadow).not.toBe('');
  });

  it('hides the separators beside a hovered or open segment only', () => {
    mount(<ControlledBar />);
    const palette = resolveStaySearchPalette(theme);
    const sep = (i: number) => byTestId(`bar-separator-${i}`).style.backgroundColor;
    expect([sep(1), sep(2), sep(3)]).toEqual([css(palette.separator), css(palette.separator), css(palette.separator)]);
    hover('bar-checkIn');
    expect([sep(1), sep(2), sep(3)]).toEqual([CLEAR, CLEAR, css(palette.separator)]);
    expect((byTestId('bar-checkIn').parentElement as HTMLElement).style.backgroundColor).toBe(css(palette.segmentHover));
    hover('bar-checkIn', 'mouseleave');
    click('bar-guests');
    expect([sep(1), sep(2), sep(3)]).toEqual([css(palette.separator), css(palette.separator), CLEAR]);
  });

  it('the search button is icon-only at rest and shows its label while a segment is open', () => {
    const onSearch = jest.fn();
    mount(<ControlledBar onSearch={onSearch} />);
    expect(byTestId('bar-search').getAttribute('aria-label')).toBe('Search');
    expect(byTestId('bar-search').textContent).toBe('');
    click('bar-guests');
    expect(byTestId('bar-search').textContent).toBe('Search');
    click('bar-search');
    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  it('renders the panel only while open, and lifts itself above later content', () => {
    mount(<ControlledBar panel={<StaySearchPanel testID="p">x</StaySearchPanel>} />);
    expect(query('bar-panel')).toBeNull();
    expect(byTestId('bar').style.zIndex).toBe('0');
    click('bar-guests');
    const slot = byTestId('bar-panel');
    expect(slot.style.position).toBe('absolute');
    expect(slot.style.top).toBe(`${STAY_SEARCH_BAR_HEIGHT + 12}px`);
    expect(slot.style.justifyContent).toBe('flex-end');
    expect(byTestId('bar').style.zIndex).toBe('40');
    click('bar-destination');
    expect(byTestId('bar-panel').style.justifyContent).toBe('flex-start');
    click('bar-checkOut');
    expect(byTestId('bar-panel').style.justifyContent).toBe('center');
  });

  it('closes on Escape and on a pointer press outside, not inside', () => {
    const onChange = jest.fn();
    mount(<ControlledBar initial="guests" onChange={onChange} panel={<StaySearchPanel testID="p">x</StaySearchPanel>} />);
    act(() => {
      byTestId('p').dispatchEvent(new Event('pointerdown', { bubbles: true }));
    });
    expect(onChange).not.toHaveBeenCalled();
    act(() => {
      document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    });
    expect(onChange).toHaveBeenLastCalledWith(null);
    click('bar-checkIn');
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(query('p')).toBeNull();
  });

  it('turns the open destination segment into a text field when a query handler is set', () => {
    const onQuery = jest.fn();
    mount(<ControlledBar initial="destination" destinationQuery="mar" onDestinationQueryChange={onQuery} />);
    const input = byTestId('bar-destination-input') as HTMLInputElement;
    expect(input.tagName).toBe('INPUT');
    expect(input.value).toBe('mar');
    expect(input.getAttribute('aria-label')).toBe('Where');
    expect(query('bar-destination')?.getAttribute('role')).toBeNull();
  });

  it('paints the dark palette from the neutral ramp', () => {
    mount(<ControlledBar initial="guests" />, 'dark');
    const { neutral } = resolveButtonRamps(theme);
    const bar = byTestId('bar').firstElementChild as HTMLElement;
    expect(bar.style.backgroundColor).toBe(css(neutral[900]));
    expect((byTestId('bar-guests').parentElement as HTMLElement).style.backgroundColor).toBe(css(neutral[700]));
  });
});

describe('StaySearchPanel', () => {
  it('is the menu surface with radius 32, and a named dialog when labelled', () => {
    mount(
      <StaySearchPanel width={400} accessibilityLabel="Guests" testID="p">
        x
      </StaySearchPanel>,
    );
    const menu = resolveMenuPalette(theme);
    const p = byTestId('p');
    expect(p.style.width).toBe('400px');
    expect(p.style.borderTopLeftRadius).toBe(`${STAY_SEARCH_PANEL_RADIUS}px`);
    expect(p.style.backgroundColor).toBe(css(menu.surface));
    expect(p.style.borderTopColor).toBe(css(menu.border));
    expect(p.getAttribute('role')).toBe('dialog');
    expect(p.getAttribute('aria-label')).toBe('Guests');
  });
});

describe('DestinationSuggestions', () => {
  const items = [
    { id: 'a', title: 'Marrowfield', description: 'Lakeside cabins' },
    { id: 'b', title: 'Old Halden' },
    { id: 'c', title: 'Solvia Bay' },
  ];

  it('is a named listbox of options; hover and arrows move one highlight, Enter selects', () => {
    const onSelect = jest.fn();
    mount(<DestinationSuggestions items={items} onSelect={onSelect} heading="Suggested destinations" testID="ds" />);
    const list = byTestId('ds');
    expect(list.getAttribute('role')).toBe('listbox');
    expect(list.getAttribute('aria-label')).toBe('Suggested destinations');
    expect(list.getAttribute('tabindex')).toBe('0');
    const selected = () => items.map((_, i) => byTestId(`ds-${i}`).getAttribute('aria-selected'));
    expect(byTestId('ds-0').getAttribute('role')).toBe('option');
    expect(selected()).toEqual(['false', 'false', 'false']);

    hover('ds-1');
    expect(selected()).toEqual(['false', 'true', 'false']);
    expect(byTestId('ds-1').style.backgroundColor).toBe(css(resolveStaySearchPalette(theme).rowHighlight));

    const key = (k: string) =>
      act(() => {
        list.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
      });
    key('ArrowDown');
    expect(selected()).toEqual(['false', 'false', 'true']);
    key('ArrowDown');
    expect(selected()).toEqual(['true', 'false', 'false']);
    key('ArrowUp');
    expect(selected()).toEqual(['false', 'false', 'true']);
    key('Enter');
    expect(onSelect).toHaveBeenLastCalledWith(items[2]);

    click('ds-0');
    expect(onSelect).toHaveBeenLastCalledWith(items[0]);
  });

  it('draws a 48px rounded icon tile per row', () => {
    mount(<DestinationSuggestions items={items} onSelect={() => {}} testID="ds" />);
    const tile = byTestId('ds-0').firstElementChild as HTMLElement;
    expect(tile.style.width).toBe('48px');
    expect(tile.style.height).toBe('48px');
    expect(tile.style.borderTopLeftRadius).toBe('12px');
    expect(tile.querySelector('svg')).not.toBeNull();
  });
});

describe('guest rule', () => {
  const none: GuestCounts = { adults: 0, children: 0, infants: 0, pets: 0 };

  it('needs one adult once anyone else is counted', () => {
    expect(minimumAdults(none)).toBe(0);
    expect(minimumAdults({ ...none, pets: 1 })).toBe(1);
    expect(applyGuestCount(none, 'children', 1)).toEqual({ adults: 1, children: 1, infants: 0, pets: 0 });
    expect(applyGuestCount({ adults: 3, children: 0, infants: 0, pets: 0 }, 'infants', 2)).toEqual({ adults: 3, children: 0, infants: 2, pets: 0 });
    expect(applyGuestCount({ ...none, adults: 1, pets: 1 }, 'adults', 0).adults).toBe(1);
    expect(applyGuestCount(none, 'pets', -3).pets).toBe(0);
  });
});

describe('GuestPicker', () => {
  function Harness({ onChange, initial }: { onChange?: (g: GuestCounts) => void; initial: GuestCounts }) {
    const [value, setValue] = useState(initial);
    return (
      <GuestPicker
        value={value}
        onChange={(g) => {
          onChange?.(g);
          setValue(g);
        }}
        max={{ pets: 1 }}
        testID="gp"
      />
    );
  }

  it('renders four named steppers with descriptions and dividers between rows', () => {
    mount(<Harness initial={{ adults: 2, children: 0, infants: 0, pets: 0 }} />);
    const sliders = Array.from(container.querySelectorAll('[role="slider"]'));
    expect(sliders.map((s) => s.getAttribute('aria-label'))).toEqual(['Adults', 'Children', 'Infants', 'Pets']);
    expect(container.textContent).toContain('Ages 13 or above');
    expect(container.textContent).toContain('Bringing a service animal?');
  });

  it('adding a child with no adults sets adults to 1 and disables the adults decrement', () => {
    const onChange = jest.fn();
    mount(<Harness initial={{ adults: 0, children: 0, infants: 0, pets: 0 }} onChange={onChange} />);
    click('gp-children-increment');
    expect(onChange).toHaveBeenLastCalledWith({ adults: 1, children: 1, infants: 0, pets: 0 });
    expect(byTestId('gp-adults-value').getAttribute('aria-valuemin')).toBe('1');
    const dec = byTestId('gp-adults-decrement') as HTMLButtonElement;
    expect(dec.disabled || dec.getAttribute('aria-disabled') === 'true').toBe(true);
  });

  it('honours a per-kind max', () => {
    mount(<Harness initial={{ adults: 1, children: 0, infants: 0, pets: 1 }} />);
    expect(byTestId('gp-pets-value').getAttribute('aria-valuemax')).toBe('1');
    expect(byTestId('gp-children-value').getAttribute('aria-valuemax')).toBeNull();
  });
});

describe('DateFlexibilityChips', () => {
  it('is a named group of pressed-state chips, single select', () => {
    const onChange = jest.fn();
    mount(<DateFlexibilityChips value="exact" onChange={onChange} testID="fx" />);
    expect(byTestId('fx').getAttribute('role')).toBe('group');
    expect(byTestId('fx').getAttribute('aria-label')).toBe('Date flexibility');
    expect(byTestId('fx').textContent).toBe('Exact dates± 1 day± 2 days± 3 days± 7 days');
    expect(byTestId('fx-exact').getAttribute('aria-pressed')).toBe('true');
    expect(byTestId('fx-7').getAttribute('aria-pressed')).toBe('false');
    click('fx-7');
    expect(onChange).toHaveBeenLastCalledWith('7');
  });
});

describe('StaySearchCompact', () => {
  it('is a 56-tall pill; the trigger and the filter button are sibling named buttons', () => {
    const onPress = jest.fn();
    const onFilter = jest.fn();
    mount(<StaySearchCompact onPress={onPress} summary="Anywhere · Any week · Add guests" onFilterPress={onFilter} testID="c" />);
    const trigger = byTestId('c');
    expect(trigger.getAttribute('role')).toBe('button');
    expect(trigger.getAttribute('aria-label')).toBe('Where to?, Anywhere · Any week · Add guests');
    const pill = trigger.parentElement as HTMLElement;
    expect(pill.style.height).toBe('56px');
    expect(pill.style.borderTopLeftRadius).toBe('9999px');
    expect(trigger.contains(byTestId('c-filter'))).toBe(false);
    expect(byTestId('c-filter').getAttribute('aria-label')).toBe('Filters');
    click('c');
    click('c-filter');
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onFilter).toHaveBeenCalledTimes(1);
  });

  it('omits the filter button without a handler', () => {
    mount(<StaySearchCompact onPress={() => {}} testID="c" />);
    expect(query('c-filter')).toBeNull();
    expect(byTestId('c').getAttribute('aria-label')).toBe('Where to?');
  });
});

describe('StaySearchStep', () => {
  it('collapsed: a button row with label and summary, aria-expanded false', () => {
    const onPress = jest.fn();
    mount(<StaySearchStep label="Where" summary="I’m flexible" expanded={false} onPress={onPress} testID="s" />);
    const row = byTestId('s');
    expect(row.getAttribute('role')).toBe('button');
    expect(row.getAttribute('aria-expanded')).toBe('false');
    expect(row.getAttribute('aria-label')).toBe('Where, I’m flexible');
    expect(row.textContent).toBe('WhereI’m flexible');
    click('s');
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('expanded: a card with a heading and the children, radius 20', () => {
    mount(
      <StaySearchStep label="Where" title="Where to?" expanded onPress={() => {}} testID="s">
        <span>content</span>
      </StaySearchStep>,
    );
    const card = byTestId('s');
    expect(card.getAttribute('role')).toBeNull();
    expect(card.style.borderTopLeftRadius).toBe('20px');
    expect(card.querySelector('[role="heading"]')?.textContent).toBe('Where to?');
    expect(card.textContent).toContain('content');
  });
});

// ---------------------------------------------------------------------------
//  A destination row that cannot be chosen
// ---------------------------------------------------------------------------

describe('nextSelectable', () => {
  const rows = (...flags: boolean[]) => flags.map((disabled) => ({ disabled }));

  it('steps over disabled rows and wraps once', () => {
    expect(nextSelectable(rows(false, true, false), 0, 1)).toBe(2);
    expect(nextSelectable(rows(false, true, false), 2, 1)).toBe(0);
    expect(nextSelectable(rows(false, true, false), 0, -1)).toBe(2);
    expect(nextSelectable(rows(true, false, false), 1, -1)).toBe(2);
  });

  it('from nothing highlighted, down starts at the top and up at the bottom', () => {
    expect(nextSelectable(rows(false, false, false), -1, 1)).toBe(0);
    expect(nextSelectable(rows(false, false, false), -1, -1)).toBe(2);
    expect(nextSelectable(rows(true, false, false), -1, 1)).toBe(1);
    expect(nextSelectable(rows(false, false, true), -1, -1)).toBe(1);
  });

  it('is -1 when every row is disabled, and when there are none', () => {
    expect(nextSelectable(rows(true, true), 0, 1)).toBe(-1);
    expect(nextSelectable([], -1, 1)).toBe(-1);
  });
});

describe('DestinationSuggestions — a disabled row', () => {
  const items = [
    { id: 'here', title: 'Use my location', description: 'Find what’s around you', disabled: true, disabledReason: 'Location is off' },
    { id: 'b', title: 'Old Halden' },
    { id: 'c', title: 'Solvia Bay' },
  ];

  it('dims it, marks it aria-disabled, and reads the reason after the title', () => {
    mount(<DestinationSuggestions items={items} onSelect={() => {}} testID="ds" />);
    const row = byTestId('ds-0');
    expect(row.getAttribute('aria-disabled')).toBe('true');
    expect(row.getAttribute('aria-label')).toBe('Use my location, Location is off');
    expect(row.style.opacity).toBe(String(DISABLED_OPACITY));
    // The reason REPLACES the description rather than joining it.
    expect(row.textContent).toBe('Use my locationLocation is off');
  });

  it('answers neither a press nor Enter', () => {
    const onSelect = jest.fn();
    mount(<DestinationSuggestions items={items} onSelect={onSelect} testID="ds" />);
    click('ds-0');
    expect(onSelect).not.toHaveBeenCalled();
    const list = byTestId('ds');
    // Two `act`s: the highlight has to land before Enter reads it.
    act(() => {
      list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    });
    act(() => {
      list.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    });
    // ArrowDown landed on row 1, not the disabled row 0.
    expect(onSelect).toHaveBeenCalledWith(items[1]);
  });

  it('hover never highlights it', () => {
    mount(<DestinationSuggestions items={items} onSelect={() => {}} testID="ds" />);
    hover('ds-0');
    expect(byTestId('ds-0').getAttribute('aria-selected')).toBe('false');
    hover('ds-1');
    expect(byTestId('ds-1').getAttribute('aria-selected')).toBe('true');
  });

  it('the arrow keys step over it in both directions', () => {
    mount(<DestinationSuggestions items={items} onSelect={() => {}} testID="ds" />);
    const list = byTestId('ds');
    const key = (k: string) =>
      act(() => {
        list.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
      });
    const selected = () => items.map((_, i) => byTestId(`ds-${i}`).getAttribute('aria-selected'));
    key('ArrowDown');
    expect(selected()).toEqual(['false', 'true', 'false']);
    key('ArrowUp');
    // Wrapping up from row 1 skips row 0 and lands on the last row.
    expect(selected()).toEqual(['false', 'false', 'true']);
  });

  it('a row with no disabledReason keeps its description, and an enabled row ignores the reason', () => {
    mount(
      <DestinationSuggestions
        items={[
          { id: 'a', title: 'Nearby', description: 'Around you', disabled: true },
          { id: 'b', title: 'Lisbon', description: 'Portugal', disabledReason: 'never drawn' },
        ]}
        onSelect={() => {}}
        testID="ds"
      />,
    );
    expect(byTestId('ds-0').getAttribute('aria-label')).toBe('Nearby, Around you');
    expect(byTestId('ds-1').getAttribute('aria-label')).toBe('Lisbon, Portugal');
    expect(byTestId('ds-1').getAttribute('aria-disabled')).toBeNull();
    expect(byTestId('ds-1').style.opacity).not.toBe(String(DISABLED_OPACITY));
  });
});

describe('GuestPicker — the stepper button names', () => {
  const value: GuestCounts = { adults: 2, children: 0, infants: 0, pets: 0 };

  it('are the English pair by default', () => {
    mount(<GuestPicker value={value} onChange={() => {}} kinds={['adults']} testID="gp" />);
    expect(byTestId('gp-adults-decrement').getAttribute('aria-label')).toBe('Decrease');
    expect(byTestId('gp-adults-increment').getAttribute('aria-label')).toBe('Increase');
  });

  it('are replaced on every row at once', () => {
    mount(
      <GuestPicker
        value={value}
        onChange={() => {}}
        decrementLabel="Quitar uno"
        incrementLabel="Añadir uno"
        testID="gp"
      />,
    );
    for (const kind of ['adults', 'children', 'infants', 'pets']) {
      expect(byTestId(`gp-${kind}-decrement`).getAttribute('aria-label')).toBe('Quitar uno');
      expect(byTestId(`gp-${kind}-increment`).getAttribute('aria-label')).toBe('Añadir uno');
    }
  });
});
