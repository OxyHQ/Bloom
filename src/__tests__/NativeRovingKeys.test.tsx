/**
 * A composite's keyboard on a native host that gives Bloom the window's keys
 * (`hooks/use-native-roving-group.ts`): a segmented control, a radio group, a
 * tab strip, a category bar and a settings rail beside its page are ONE Tab
 * stop (the chosen option is the only `focusable` one), and while an option has
 * the keyboard focus the arrows choose the next option, the focus following
 * once the choice lands.
 */
import { useState } from 'react';
import { AccessibilityInfo, Text as RNText } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import type { ReactTestInstance } from 'react-test-renderer';

import { RiSchoolLine, RiSettings6Line } from '../icons/remix';
import { CategoryBar } from '../category-bar';
import { Tabs, TabsTrigger } from '../tabs';
import { PlatformSurfaceProvider } from '../platform-surface/context';
import type { PlatformKeyboard } from '../platform-surface/types';
import { ChoiceList } from '../choice-list';
import { RadioGroup } from '../radio';
import {
  SegmentedControl,
  SegmentedControlItem,
  SegmentedControlItemText,
} from '../segmented-control';
import { SettingsLayout, type SettingsNavGroup } from '../settings-modal';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { fakeKeyboard, menuBarAdapter } from './support/fake-menu-bar';
import { mockWindowSize } from './support/window-size';

const send = AccessibilityInfo.sendAccessibilityEvent as jest.Mock;

beforeEach(() => send.mockClear());

function wrap(ui: React.ReactElement, keyboard: PlatformKeyboard | undefined) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      <PlatformSurfaceProvider value={keyboard ? menuBarAdapter(undefined, keyboard) : null}>
        {ui}
      </PlatformSurfaceProvider>
    </BloomThemeProvider>,
    // Host views have instances, as on a device: the focus event is sent to one.
    { createNodeMock: () => ({}) },
  );
}

/** The host view a testID names (the Pressable's own). */
function host(screen: ReturnType<typeof render>, id: string): ReactTestInstance {
  const all = screen.getAllByTestId(id);
  const found = all.find((node) => typeof node.type === 'string') ?? all[0];
  if (!found) throw new Error(`no view ${id}`);
  return found;
}

function press(keyboard: ReturnType<typeof fakeKeyboard>, key: string, shiftKey = false) {
  let taken = false;
  act(() => {
    taken = keyboard.press({ key, shiftKey });
  });
  return taken;
}

function focus(node: ReactTestInstance) {
  act(() => {
    (node.props.onFocus as () => void)();
  });
}

const MODES = ['light', 'dark', 'auto'] as const;

function Modes({
  initial = 'light',
  follow = true,
  onChange,
}: {
  initial?: (typeof MODES)[number];
  follow?: boolean;
  onChange?: (value: string) => void;
}) {
  const [value, setValue] = useState<string>(initial);
  return (
    <>
      <SegmentedControl
        label="Mode"
        type="radio"
        value={value}
        onValueChange={(next) => {
          onChange?.(next);
          if (follow) setValue(next);
        }}
      >
        {MODES.map((mode) => (
          <SegmentedControlItem key={mode} value={mode} testID={`mode-${mode}`}>
            <SegmentedControlItemText>{mode}</SegmentedControlItemText>
          </SegmentedControlItem>
        ))}
      </SegmentedControl>
      <RNText testID="land" onPress={() => setValue('dark')}>
        land
      </RNText>
    </>
  );
}

/** Lays the segments out left to right, as the host does. */
function layOutSegments(screen: ReturnType<typeof render>) {
  MODES.forEach((mode, index) => {
    act(() => {
      fireEvent(host(screen, `mode-${mode}`), 'layout', {
        nativeEvent: { layout: { x: index * 60, y: 0, width: 56, height: 28 } },
      });
    });
  });
}

const focusable = (screen: ReturnType<typeof render>) =>
  MODES.filter((mode) => host(screen, `mode-${mode}`).props.focusable === true);

describe('SegmentedControl on a native host with the window keys', () => {
  it('is one Tab stop, the chosen segment', () => {
    const screen = wrap(<Modes initial="dark" />, fakeKeyboard());
    layOutSegments(screen);
    expect(focusable(screen)).toEqual(['dark']);
  });

  it('takes no arrow while no segment has the keyboard focus', () => {
    const keyboard = fakeKeyboard();
    const onChange = jest.fn();
    const screen = wrap(<Modes onChange={onChange} />, keyboard);
    layOutSegments(screen);
    expect(press(keyboard, 'ArrowRight')).toBe(false);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('chooses the next segment with the arrows, round the ends, and the focus follows it', () => {
    const keyboard = fakeKeyboard();
    const onChange = jest.fn();
    const screen = wrap(<Modes onChange={onChange} />, keyboard);
    layOutSegments(screen);
    focus(host(screen, 'mode-light'));
    expect(press(keyboard, 'ArrowRight')).toBe(true);
    expect(onChange).toHaveBeenLastCalledWith('dark');
    expect(focusable(screen)).toEqual(['dark']);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0]?.[1]).toBe('focus');
    // A radio group's arrows go round its ends; ↑ is ←.
    focus(host(screen, 'mode-dark'));
    press(keyboard, 'ArrowRight');
    focus(host(screen, 'mode-auto'));
    press(keyboard, 'ArrowDown');
    expect(onChange).toHaveBeenLastCalledWith('light');
    focus(host(screen, 'mode-light'));
    press(keyboard, 'ArrowUp');
    expect(onChange).toHaveBeenLastCalledWith('auto');
    // Shift and the command keys are not the group's.
    expect(press(keyboard, 'ArrowLeft', true)).toBe(false);
  });

  it('moves the focus only once the owner takes the value, and never if it does not', () => {
    const keyboard = fakeKeyboard();
    const onChange = jest.fn();
    const screen = wrap(<Modes follow={false} onChange={onChange} />, keyboard);
    layOutSegments(screen);
    focus(host(screen, 'mode-light'));
    press(keyboard, 'ArrowRight');
    expect(onChange).toHaveBeenLastCalledWith('dark');
    expect(send).not.toHaveBeenCalled();
    expect(focusable(screen)).toEqual(['light']);
    // The platform answers: the value lands, and the focus goes with it.
    fireEvent.press(screen.getByTestId('land'));
    expect(focusable(screen)).toEqual(['dark']);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('leaves every segment focusable without the window keys (iOS, Android)', () => {
    const screen = wrap(<Modes />, undefined);
    layOutSegments(screen);
    for (const mode of MODES) expect(host(screen, `mode-${mode}`).props.focusable).not.toBe(false);
  });
});

describe('RadioGroup on a native host with the window keys', () => {
  const OPTIONS = [
    { value: 'a', label: 'A', testID: 'radio-a' },
    { value: 'b', label: 'B', testID: 'radio-b', disabled: true },
    { value: 'c', label: 'C', testID: 'radio-c' },
  ];

  it('is one Tab stop; the arrows skip a disabled option and choose the next', () => {
    const keyboard = fakeKeyboard();
    const onValueChange = jest.fn();
    const screen = wrap(
      <RadioGroup
        label="Letters"
        defaultValue="a"
        options={OPTIONS}
        onValueChange={onValueChange}
      />,
      keyboard,
    );
    const stops = () =>
      OPTIONS.filter((option) => host(screen, option.testID).props.focusable === true).map(
        (option) => option.value,
      );
    expect(stops()).toEqual(['a']);
    focus(host(screen, 'radio-a'));
    expect(press(keyboard, 'ArrowDown')).toBe(true);
    expect(onValueChange).toHaveBeenLastCalledWith('c');
    expect(stops()).toEqual(['c']);
    expect(send).toHaveBeenCalledTimes(1);
  });
});

describe('A swatch RadioGroup on a native host with the window keys', () => {
  const ACCENTS = [
    { value: 'blue', label: 'Blue', color: '#2563EB', testID: 'accent-blue' },
    { value: 'teal', label: 'Teal', color: '#0D9488', testID: 'accent-teal' },
    { value: 'rose', label: 'Rose', color: '#E11D48', testID: 'accent-rose' },
  ];

  /** The accent a platform keeps: a choice lands only once the platform answers. */
  function Accents({ onAsk }: { onAsk: (value: string) => void }) {
    const [value, setValue] = useState('teal');
    return (
      <>
        <RadioGroup
          label="Accent"
          variant="swatch"
          value={value}
          onValueChange={onAsk}
          options={ACCENTS}
        />
        <RNText testID="land" onPress={() => setValue('rose')}>
          land
        </RNText>
      </>
    );
  }

  it('is one Tab stop on the chosen swatch, each a named radio, the arrows choosing the next', () => {
    const keyboard = fakeKeyboard();
    const onAsk = jest.fn();
    const screen = wrap(<Accents onAsk={onAsk} />, keyboard);
    const swatch = (value: string) => host(screen, `accent-${value}`);
    expect(ACCENTS.map((accent) => swatch(accent.value).props.accessibilityRole)).toEqual([
      'radio',
      'radio',
      'radio',
    ]);
    expect(swatch('teal').props.accessibilityLabel).toBe('Teal');
    expect(swatch('teal').props['aria-checked']).toBe(true);
    const stops = () =>
      ACCENTS.filter((accent) => swatch(accent.value).props.focusable === true).map(
        (accent) => accent.value,
      );
    expect(stops()).toEqual(['teal']);
    focus(swatch('teal'));
    expect(press(keyboard, 'ArrowRight')).toBe(true);
    expect(onAsk).toHaveBeenLastCalledWith('rose');
    // Not chosen until the platform says so: neither the stop nor the focus moves.
    expect(stops()).toEqual(['teal']);
    expect(send).not.toHaveBeenCalled();
    fireEvent.press(screen.getByTestId('land'));
    expect(stops()).toEqual(['rose']);
    expect(swatch('rose').props['aria-checked']).toBe(true);
    expect(send).toHaveBeenCalledTimes(1);
  });
});

describe('The settings rail beside its page on a native host with the window keys', () => {
  const GROUPS: SettingsNavGroup[] = [
    {
      label: 'Personal',
      items: [
        { key: 'general', label: 'General', icon: RiSettings6Line, page: 'general' },
        { key: 'profile', label: 'Profile', icon: RiSchoolLine, page: 'profile' },
      ],
    },
    {
      label: 'System',
      items: [{ key: 'about', label: 'About', icon: RiSchoolLine, page: 'about' }],
    },
  ];
  const PAGES = {
    general: { title: 'General', content: <RNText>general body</RNText> },
    profile: { title: 'Profile', content: <RNText>profile body</RNText> },
    about: { title: 'About', content: <RNText>about body</RNText> },
  };

  function rail(keyboard: ReturnType<typeof fakeKeyboard>) {
    mockWindowSize({ width: 1280, height: 800, scale: 1, fontScale: 1 });
    return wrap(<SettingsLayout groups={GROUPS} pages={PAGES} testID="settings" />, keyboard);
  }

  it('is one list of items under its group headings, one Tab stop, ↑ ↓ showing each page', () => {
    const keyboard = fakeKeyboard();
    const screen = rail(keyboard);
    const row = (key: string) => host(screen, `settings-nav-${key}`);
    expect(['general', 'profile', 'about'].map((key) => row(key).props.role)).toEqual([
      'listitem',
      'listitem',
      'listitem',
    ]);
    expect(screen.getByText('Personal').props.role).toBe('heading');
    expect(screen.getByText('System').props.role).toBe('heading');
    const stops = () =>
      ['general', 'profile', 'about'].filter((key) => row(key).props.focusable === true);
    expect(stops()).toEqual(['general']);
    focus(row('general'));
    expect(press(keyboard, 'ArrowDown')).toBe(true);
    expect(screen.getByText('profile body')).toBeTruthy();
    expect(stops()).toEqual(['profile']);
    focus(row('profile'));
    press(keyboard, 'ArrowDown');
    expect(screen.getByText('about body')).toBeTruthy();
    // A list stops at its ends.
    focus(row('about'));
    expect(press(keyboard, 'ArrowDown')).toBe(true);
    expect(screen.getByText('about body')).toBeTruthy();
    press(keyboard, 'Home');
    expect(screen.getByText('general body')).toBeTruthy();
    expect(send).toHaveBeenCalledTimes(3);
  });

  it('moves one row per ↓ even when the keys come before the host says where its focus went', () => {
    // A loaded host reads the keys pressed while the first one's page renders in the turn that
    // moved its focus, before JavaScript hears that move: each still goes one row further.
    const keyboard = fakeKeyboard();
    const screen = rail(keyboard);
    const row = (key: string) => host(screen, `settings-nav-${key}`);
    focus(row('general'));
    expect(press(keyboard, 'ArrowDown')).toBe(true);
    expect(press(keyboard, 'ArrowDown')).toBe(true);
    expect(screen.getByText('about body')).toBeTruthy();
    // The host's focus catches up, through the row the first ↓ chose: the keys go on from the
    // last row chosen, which stops a list at its end.
    focus(row('profile'));
    focus(row('about'));
    expect(press(keyboard, 'ArrowDown')).toBe(true);
    expect(screen.getByText('about body')).toBeTruthy();
    expect(press(keyboard, 'ArrowUp')).toBe(true);
    expect(screen.getByText('profile body')).toBeTruthy();
  });
});

describe('A ChoiceList on a native host with the window keys', () => {
  const ACCOUNTS = [
    { value: 'ada', label: 'Ada', testID: 'account-ada' },
    { value: 'bea', label: 'Bea', testID: 'account-bea' },
    { value: 'cy', label: 'Cy', testID: 'account-cy', disabled: true },
    { value: 'dee', label: 'Dee', testID: 'account-dee' },
  ];

  function Accounts({ onChange }: { onChange: (value: string) => void }) {
    const [value, setValue] = useState('ada');
    return (
      <ChoiceList
        label="Accounts"
        value={value}
        onValueChange={(next) => {
          onChange(next);
          setValue(next);
        }}
        options={ACCOUNTS}
        renderContent={(option) => <RNText>{option.label}</RNText>}
        testID="accounts"
      />
    );
  }

  it('is one list, one Tab stop; the arrows move the focus alone, a press chooses', () => {
    const keyboard = fakeKeyboard();
    const onChange = jest.fn();
    const screen = wrap(<Accounts onChange={onChange} />, keyboard);
    const item = (value: string) => host(screen, `account-${value}`);
    expect(host(screen, 'accounts').props.role).toBe('list');
    expect(host(screen, 'accounts').props.accessibilityLabel).toBe('Accounts');
    expect(ACCOUNTS.map((account) => item(account.value).props.role)).toEqual([
      'listitem',
      'listitem',
      'listitem',
      'listitem',
    ]);
    expect(item('ada').props.accessibilityState).toEqual({ selected: true, disabled: false });
    expect(item('ada').props.accessibilityLabel).toBe('Ada');
    const stops = () =>
      ACCOUNTS.filter((account) => item(account.value).props.focusable === true).map(
        (account) => account.value,
      );
    expect(stops()).toEqual(['ada']);
    // No arrow is the list's while it has no focus.
    expect(press(keyboard, 'ArrowRight')).toBe(false);
    focus(item('ada'));
    expect(press(keyboard, 'ArrowRight')).toBe(true);
    // Not chosen: the option moved to is the stop, and the focus goes there.
    expect(onChange).not.toHaveBeenCalled();
    expect(stops()).toEqual(['bea']);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0]?.[1]).toBe('focus');
    // The host's focus lands: the one left blurs first, which leaves the stop where it is.
    act(() => (item('ada').props.onBlur as () => void)());
    focus(item('bea'));
    expect(stops()).toEqual(['bea']);
    // The disabled option is skipped; a list stops at its end; ↓ is not a row's.
    press(keyboard, 'ArrowRight');
    expect(stops()).toEqual(['dee']);
    act(() => (item('bea').props.onBlur as () => void)());
    focus(item('dee'));
    expect(press(keyboard, 'ArrowRight')).toBe(true);
    expect(press(keyboard, 'ArrowDown')).toBe(false);
    expect(send).toHaveBeenCalledTimes(2);
    press(keyboard, 'Home');
    expect(stops()).toEqual(['ada']);
    act(() => (item('dee').props.onBlur as () => void)());
    focus(item('ada'));
    press(keyboard, 'End');
    act(() => (item('ada').props.onBlur as () => void)());
    focus(item('dee'));
    expect(onChange).not.toHaveBeenCalled();
    // Space or Return is the host's press of the focused option: it chooses it.
    fireEvent.press(item('dee'));
    expect(onChange).toHaveBeenLastCalledWith('dee');
    expect(item('dee').props.accessibilityState).toEqual({ selected: true, disabled: false });
    expect(stops()).toEqual(['dee']);
    // Pressed again, the chosen one is chosen again: going on with it.
    fireEvent.press(item('dee'));
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('gives the stop back to the chosen option when the keyboard leaves from another', () => {
    const keyboard = fakeKeyboard();
    const screen = wrap(<Accounts onChange={jest.fn()} />, keyboard);
    const item = (value: string) => host(screen, `account-${value}`);
    focus(item('ada'));
    press(keyboard, 'ArrowRight');
    act(() => (item('ada').props.onBlur as () => void)());
    focus(item('bea'));
    // Tab on: the option moved to blurs, and the chosen one is the list's stop again.
    act(() => (item('bea').props.onBlur as () => void)());
    expect(
      ACCOUNTS.filter((account) => item(account.value).props.focusable === true).map(
        (account) => account.value,
      ),
    ).toEqual(['ada']);
    expect(press(keyboard, 'ArrowRight')).toBe(false);
  });
});

describe('Tabs on a native host with the window keys', () => {
  const TABS = ['general', 'advanced', 'about', 'legal'] as const;

  function Strip({
    onChange,
    follow = true,
  }: {
    onChange: (value: string) => void;
    follow?: boolean;
  }) {
    const [value, setValue] = useState<string>('general');
    return (
      <>
        <Tabs
          label="Sections"
          value={value}
          onValueChange={(next) => {
            onChange(next);
            if (follow) setValue(next);
          }}
          testID="strip"
        >
          {TABS.map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              label={tab}
              disabled={tab === 'about'}
              testID={`tab-${tab}`}
            />
          ))}
        </Tabs>
        <RNText testID="land" onPress={() => setValue('advanced')}>
          land
        </RNText>
      </>
    );
  }

  function mount(ui: React.ReactElement, keyboard: PlatformKeyboard | undefined) {
    return render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <PlatformSurfaceProvider value={keyboard ? menuBarAdapter(undefined, keyboard) : null}>
          {ui}
        </PlatformSurfaceProvider>
      </BloomThemeProvider>,
      // A host view the strip can measure, and send the focus event to.
      { createNodeMock: () => ({ measure: () => {}, scrollTo: () => {} }) },
    );
  }

  const stops = (screen: ReturnType<typeof render>) =>
    TABS.filter((tab) => host(screen, `tab-${tab}`).props.focusable === true);

  it('is a named tab list of tabs, one Tab stop on the selected tab', () => {
    const screen = mount(<Strip onChange={jest.fn()} />, fakeKeyboard());
    const strip = host(screen, 'strip');
    expect(strip.props.role).toBe('tablist');
    expect(strip.props.accessibilityLabel).toBe('Sections');
    expect(TABS.map((tab) => host(screen, `tab-${tab}`).props.accessibilityRole)).toEqual([
      'tab',
      'tab',
      'tab',
      'tab',
    ]);
    expect(host(screen, 'tab-general').props['aria-selected']).toBe(true);
    expect(stops(screen)).toEqual(['general']);
  });

  it('selects the tab an arrow reaches, skipping a disabled one, round the ends, Home and End', () => {
    const keyboard = fakeKeyboard();
    const onChange = jest.fn();
    const screen = mount(<Strip onChange={onChange} />, keyboard);
    expect(press(keyboard, 'ArrowRight')).toBe(false);
    focus(host(screen, 'tab-general'));
    expect(press(keyboard, 'ArrowRight')).toBe(true);
    expect(onChange).toHaveBeenLastCalledWith('advanced');
    expect(stops(screen)).toEqual(['advanced']);
    expect(host(screen, 'tab-advanced').props['aria-selected']).toBe(true);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0]?.[1]).toBe('focus');
    focus(host(screen, 'tab-advanced'));
    press(keyboard, 'ArrowRight');
    expect(onChange).toHaveBeenLastCalledWith('legal');
    focus(host(screen, 'tab-legal'));
    press(keyboard, 'ArrowRight');
    expect(onChange).toHaveBeenLastCalledWith('general');
    focus(host(screen, 'tab-general'));
    press(keyboard, 'End');
    expect(onChange).toHaveBeenLastCalledWith('legal');
    focus(host(screen, 'tab-legal'));
    press(keyboard, 'Home');
    expect(onChange).toHaveBeenLastCalledWith('general');
    // A tab strip is a row: ↓ is not its key.
    focus(host(screen, 'tab-general'));
    expect(press(keyboard, 'ArrowDown')).toBe(false);
    expect(send).toHaveBeenCalledTimes(5);
  });

  it('moves the keyboard only once the value lands', () => {
    const keyboard = fakeKeyboard();
    const onChange = jest.fn();
    const screen = mount(<Strip onChange={onChange} follow={false} />, keyboard);
    focus(host(screen, 'tab-general'));
    press(keyboard, 'ArrowRight');
    expect(onChange).toHaveBeenLastCalledWith('advanced');
    expect(stops(screen)).toEqual(['general']);
    expect(send).not.toHaveBeenCalled();
    fireEvent.press(screen.getByTestId('land'));
    expect(stops(screen)).toEqual(['advanced']);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('leaves every tab focusable without the window keys (iOS, Android)', () => {
    const screen = mount(<Strip onChange={jest.fn()} />, undefined);
    for (const tab of TABS) expect(host(screen, `tab-${tab}`).props.focusable).not.toBe(false);
  });
});

describe('A CategoryBar on a native host with the window keys', () => {
  const ITEMS = [
    { key: 'rooms', label: 'Rooms', icon: RiSchoolLine },
    { key: 'homes', label: 'Homes', icon: RiSettings6Line },
    { key: 'views', label: 'Views', icon: RiSchoolLine },
  ];

  function Bar({ onChange }: { onChange: (value: string) => void }) {
    const [value, setValue] = useState('rooms');
    return (
      <CategoryBar
        accessibilityLabel="Categories"
        items={ITEMS}
        value={value}
        onValueChange={(next) => {
          onChange(next);
          setValue(next);
        }}
        testID="bar"
      />
    );
  }

  it('is one Tab stop, the arrows selecting the item they reach, stopping at the ends', () => {
    const keyboard = fakeKeyboard();
    const onChange = jest.fn();
    const screen = render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <PlatformSurfaceProvider value={menuBarAdapter(undefined, keyboard)}>
          <Bar onChange={onChange} />
        </PlatformSurfaceProvider>
      </BloomThemeProvider>,
      { createNodeMock: () => ({ scrollTo: () => {} }) },
    );
    const item = (key: string) => host(screen, `bar-item-${key}`);
    expect(host(screen, 'bar-track').props.role).toBe('tablist');
    expect(ITEMS.map((entry) => item(entry.key).props.role)).toEqual(['tab', 'tab', 'tab']);
    const stops = () => ITEMS.filter((entry) => item(entry.key).props.focusable === true);
    expect(stops().map((entry) => entry.key)).toEqual(['rooms']);
    focus(item('rooms'));
    expect(press(keyboard, 'ArrowRight')).toBe(true);
    expect(onChange).toHaveBeenLastCalledWith('homes');
    expect(stops().map((entry) => entry.key)).toEqual(['homes']);
    expect(item('homes').props['aria-selected']).toBe(true);
    focus(item('homes'));
    press(keyboard, 'End');
    expect(onChange).toHaveBeenLastCalledWith('views');
    // The end stops the arrows: the key is the bar's, and nothing changes.
    focus(item('views'));
    expect(press(keyboard, 'ArrowRight')).toBe(true);
    expect(onChange).toHaveBeenCalledTimes(2);
    press(keyboard, 'Home');
    expect(onChange).toHaveBeenLastCalledWith('rooms');
    expect(send).toHaveBeenCalledTimes(3);
  });
});
