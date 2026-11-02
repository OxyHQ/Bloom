/**
 * A composite's keyboard on a native host that gives Bloom the window's keys
 * (`hooks/use-native-roving-group.ts`): a segmented control, a radio group and
 * a settings rail beside its page are ONE Tab stop (the chosen option is the
 * only `focusable` one), and while an option has the keyboard focus the arrows
 * choose the next option, the focus following once the choice lands.
 */
import { useState } from 'react';
import { AccessibilityInfo, Text as RNText } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import type { ReactTestInstance } from 'react-test-renderer';

import { RiSchoolLine, RiSettings6Line } from '../icons/remix';
import { PlatformSurfaceProvider } from '../platform-surface/context';
import type { PlatformKeyboard } from '../platform-surface/types';
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
});
