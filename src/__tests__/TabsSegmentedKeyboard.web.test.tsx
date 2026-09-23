/**
 * @jest-environment jsdom
 */

/**
 * `Tabs` and `SegmentedControl` on WEB, from the keyboard — the ARIA tabs and
 * radio-group patterns, against the DOM react-native-web really produces.
 *
 * What shipped: `Tabs` rendered no `tablist` at all; in both, every option was
 * its own tab stop (react-native-web gives each `Pressable` `tabIndex=0`), the
 * arrow keys did nothing, and Space did nothing either — react-native-web
 * presses on Space only for `role="button"`, and these are `tab` and `radio`.
 * The markup carried the right roles and states throughout, so a DOM snapshot
 * looked correct while the widgets could not be operated.
 *
 * Keys are dispatched on `document.activeElement`, so a handler that forgot to
 * move focus leaves the next key on the wrong option and the next assertion
 * fails.
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Tabs, TabsTrigger } from '../tabs';
import {
  SegmentedControl,
  SegmentedControlItem,
  SegmentedControlItemText,
} from '../segmented-control';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function mount(ui: React.ReactElement) {
  act(() => {
    root.render(
      <BloomThemeProvider mode="light" colorPreset="oxy">
        {ui}
      </BloomThemeProvider>,
    );
  });
}

function press(key: string) {
  const target = (document.activeElement ?? document.body) as HTMLElement;
  act(() => {
    target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
  });
  act(() => {
    (document.activeElement ?? document.body).dispatchEvent(
      new KeyboardEvent('keyup', { key, bubbles: true, cancelable: true }),
    );
  });
}

const byRole = (role: string) =>
  Array.from(container.querySelectorAll<HTMLElement>(`[role="${role}"]`));
const tabStops = (role: string) => byRole(role).filter((el) => el.tabIndex === 0);
const focusedName = () => document.activeElement?.getAttribute('aria-label') ?? null;
const named = (role: string, name: string) =>
  byRole(role).find((el) => el.getAttribute('aria-label') === name) as HTMLElement;

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

function ControlledTabs({
  initial = 'overview',
  onChange,
  fullWidth,
}: {
  initial?: string;
  onChange?: (value: string) => void;
  fullWidth?: boolean;
}) {
  const [value, setValue] = React.useState(initial);
  return (
    <Tabs
      label="Project sections"
      value={value}
      fullWidth={fullWidth}
      onValueChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}>
      <TabsTrigger value="overview" label="Overview" />
      <TabsTrigger value="activity" label="Activity" />
      <TabsTrigger value="billing" label="Billing" disabled />
      <TabsTrigger value="settings" label="Settings" />
    </Tabs>
  );
}

describe('Tabs (web) — keyboard', () => {
  it.each([false, true])('renders a named tablist (fullWidth=%s)', (fullWidth) => {
    mount(<ControlledTabs fullWidth={fullWidth} />);
    const [list] = byRole('tablist');
    expect(list).toBeDefined();
    expect(list?.getAttribute('aria-label')).toBe('Project sections');
    expect(list?.querySelectorAll('[role="tab"]')).toHaveLength(4);
  });

  it('has exactly one tab stop, and it follows the selection', () => {
    mount(<ControlledTabs initial="activity" />);
    expect(tabStops('tab').map((el) => el.getAttribute('aria-label'))).toEqual(['Activity']);
    act(() => named('tab', 'Settings').click());
    expect(tabStops('tab').map((el) => el.getAttribute('aria-label'))).toEqual(['Settings']);
  });

  it('keeps the strip reachable when no tab is selected', () => {
    mount(<ControlledTabs initial="nothing-matches" />);
    expect(tabStops('tab').map((el) => el.getAttribute('aria-label'))).toEqual(['Overview']);
  });

  it('ArrowRight/ArrowLeft move AND select (automatic activation), skipping disabled, wrapping', () => {
    const onChange = jest.fn();
    mount(<ControlledTabs onChange={onChange} />);
    act(() => named('tab', 'Overview').focus());
    press('ArrowRight');
    expect(focusedName()).toBe('Activity');
    expect(onChange).toHaveBeenLastCalledWith('activity');
    press('ArrowRight');
    expect(focusedName()).toBe('Settings');
    expect(onChange).toHaveBeenLastCalledWith('settings');
    press('ArrowRight');
    expect(focusedName()).toBe('Overview');
    press('ArrowLeft');
    expect(focusedName()).toBe('Settings');
    expect(named('tab', 'Settings').getAttribute('aria-selected')).toBe('true');
  });

  it('Home/End jump to the first and last enabled tab', () => {
    mount(<ControlledTabs initial="activity" />);
    act(() => named('tab', 'Activity').focus());
    press('End');
    expect(focusedName()).toBe('Settings');
    press('Home');
    expect(focusedName()).toBe('Overview');
  });

  it('ArrowUp/ArrowDown are not the strip’s — a horizontal tablist leaves them alone', () => {
    const onChange = jest.fn();
    mount(<ControlledTabs onChange={onChange} />);
    act(() => named('tab', 'Overview').focus());
    press('ArrowDown');
    expect(focusedName()).toBe('Overview');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('focus-driven (router) strips move focus only; Space or Enter activates', () => {
    const pressed = jest.fn();
    mount(
      <Tabs label="Profile">
        <TabsTrigger value="posts" label="Posts" isFocused onPress={() => pressed('posts')} />
        <TabsTrigger value="likes" label="Likes" isFocused={false} onPress={() => pressed('likes')} />
      </Tabs>,
    );
    act(() => named('tab', 'Posts').focus());
    press('ArrowRight');
    expect(focusedName()).toBe('Likes');
    expect(pressed).not.toHaveBeenCalled();
    press(' ');
    expect(pressed).toHaveBeenCalledWith('likes');
  });
});

// ---------------------------------------------------------------------------
// SegmentedControl
// ---------------------------------------------------------------------------

function Segmented({
  type,
  onChange,
  initial = 'day',
}: {
  type: 'radio' | 'tabs';
  onChange?: (value: string) => void;
  initial?: string;
}) {
  const [value, setValue] = React.useState(initial);
  return (
    <SegmentedControl
      label="Range"
      type={type}
      value={value}
      onValueChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}>
      {['day', 'week', 'month', 'year'].map((v) => (
        <SegmentedControlItem key={v} value={v} accessibilityLabel={v} disabled={v === 'month'}>
          <SegmentedControlItemText>{v}</SegmentedControlItemText>
        </SegmentedControlItem>
      ))}
    </SegmentedControl>
  );
}

describe('SegmentedControl (web) — keyboard', () => {
  it.each([
    ['radio', 'radio'],
    ['tabs', 'tab'],
  ] as const)('type="%s" has exactly one tab stop, on the chosen segment', (type, role) => {
    mount(<Segmented type={type} initial="week" />);
    expect(tabStops(role).map((el) => el.getAttribute('aria-label'))).toEqual(['week']);
  });

  it('radio: all four arrows move and select, skipping disabled and wrapping', () => {
    const onChange = jest.fn();
    mount(<Segmented type="radio" onChange={onChange} />);
    act(() => named('radio', 'day').focus());
    press('ArrowRight');
    expect(focusedName()).toBe('week');
    expect(onChange).toHaveBeenLastCalledWith('week');
    press('ArrowDown');
    expect(focusedName()).toBe('year');
    press('ArrowDown');
    expect(focusedName()).toBe('day');
    press('ArrowUp');
    expect(focusedName()).toBe('year');
    press('ArrowLeft');
    expect(focusedName()).toBe('week');
    expect(named('radio', 'week').getAttribute('aria-checked')).toBe('true');
    expect(tabStops('radio').map((el) => el.getAttribute('aria-label'))).toEqual(['week']);
  });

  it.each([
    ['radio', 'radio'],
    ['tabs', 'tab'],
  ] as const)('type="%s": Space selects the focused segment', (type, role) => {
    const onChange = jest.fn();
    mount(<Segmented type={type} onChange={onChange} />);
    // Focus a segment that is NOT chosen (as a pointer or screen reader can).
    act(() => named(role, 'year').focus());
    press(' ');
    expect(onChange).toHaveBeenCalledWith('year');
  });

  it('tabs: Left/Right and Home/End, not Up/Down', () => {
    const onChange = jest.fn();
    mount(<Segmented type="tabs" onChange={onChange} />);
    act(() => named('tab', 'day').focus());
    press('ArrowDown');
    expect(focusedName()).toBe('day');
    expect(onChange).not.toHaveBeenCalled();
    press('End');
    expect(focusedName()).toBe('year');
    expect(onChange).toHaveBeenLastCalledWith('year');
    press('Home');
    expect(focusedName()).toBe('day');
    press('ArrowRight');
    expect(focusedName()).toBe('week');
    expect(onChange).toHaveBeenLastCalledWith('week');
  });

  it('a disabled group offers no tab stop and ignores keys', () => {
    const onChange = jest.fn();
    mount(
      <SegmentedControl label="Range" type="radio" value="a" disabled onValueChange={onChange}>
        <SegmentedControlItem value="a" accessibilityLabel="a">
          <SegmentedControlItemText>a</SegmentedControlItemText>
        </SegmentedControlItem>
        <SegmentedControlItem value="b" accessibilityLabel="b">
          <SegmentedControlItemText>b</SegmentedControlItemText>
        </SegmentedControlItem>
      </SegmentedControl>,
    );
    expect(tabStops('radio')).toHaveLength(0);
    act(() => named('radio', 'a').focus());
    press('ArrowRight');
    press(' ');
    expect(onChange).not.toHaveBeenCalled();
  });
});
