/**
 * @jest-environment jsdom
 */
// The sidebar binds the shortcuts it displays: a mode's or an item's `shortcut`
// does what pressing it does, once per key press however many sidebars render
// the navigation, and never while the user is typing.
import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('../styles/platform', () => ({
  ...jest.requireActual('../styles/platform'),
  IS_WEB: true,
}));

import { RiComputerLine, RiHomeLine, RiSearchLine, RiSettings4Line } from '../icons/remix';
import { Sidebar } from '../sidebar';
import { matchesShortcut, parseShortcut } from '../sidebar/shortcuts';
import type { SidebarMode, SidebarNavItem } from '../sidebar';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

const MODES: SidebarMode[] = [
  { key: 'search', label: 'Search', icon: RiSearchLine, shortcut: '⌥⌃1' },
  { key: 'computer', label: 'Computer', icon: RiComputerLine, shortcut: '⌥⌃2' },
];

function press(init: KeyboardEventInit, target: EventTarget = window) {
  const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(event);
  return event;
}

function renderIn(ui: React.ReactElement) {
  return render(<BloomThemeProvider fonts={false}>{ui}</BloomThemeProvider>);
}

describe('parseShortcut / matchesShortcut', () => {
  it('reads glyph and word modifiers', () => {
    expect(parseShortcut('⌥⌃1')).toEqual({
      key: '1',
      meta: false,
      ctrl: true,
      alt: true,
      shift: false,
    });
    expect(parseShortcut('Ctrl+Shift+P')).toEqual({
      key: 'p',
      meta: false,
      ctrl: true,
      alt: false,
      shift: true,
    });
    expect(parseShortcut('⌘K')).toEqual({
      key: 'k',
      meta: true,
      ctrl: false,
      alt: false,
      shift: false,
    });
    expect(parseShortcut('Hyper+K')).toBeUndefined();
  });
  it('matches by code, so Option+1 is not read as the character it types', () => {
    const shortcut = parseShortcut('⌥⌃1')!;
    const event = new KeyboardEvent('keydown', {
      key: '¡',
      code: 'Digit1',
      altKey: true,
      ctrlKey: true,
    });
    expect(matchesShortcut(event, shortcut)).toBe(true);
    // Every modifier must agree — an extra Shift is a different shortcut.
    const shifted = new KeyboardEvent('keydown', {
      key: '¡',
      code: 'Digit1',
      altKey: true,
      ctrlKey: true,
      shiftKey: true,
    });
    expect(matchesShortcut(shifted, shortcut)).toBe(false);
  });
});

describe('Sidebar shortcut binding (web)', () => {
  it("calls onModeChange for a mode's shortcut and marks the key handled", () => {
    const onModeChange = jest.fn();
    renderIn(<Sidebar modes={MODES} onModeChange={onModeChange} showThemeToggle={false} />);
    const event = press({ key: '™', code: 'Digit2', altKey: true, ctrlKey: true });
    expect(onModeChange).toHaveBeenCalledWith('computer');
    expect(event.defaultPrevented).toBe(true);
    press({ key: '2', code: 'Digit2' });
    expect(onModeChange).toHaveBeenCalledTimes(1);
  });

  it('does what pressing an item does: its onPress, else onNavigate — in the rail too', () => {
    const onNavigate = jest.fn();
    const onPress = jest.fn();
    const items: SidebarNavItem[] = [
      { key: 'home', label: 'Home', icon: RiHomeLine, href: '/', shortcut: 'Ctrl+Shift+H' },
    ];
    const secondary: SidebarNavItem[] = [
      { key: 'settings', label: 'Settings', icon: RiSettings4Line, onPress, shortcut: '⌘,' },
    ];
    const tree = renderIn(
      <Sidebar
        items={items}
        secondaryItems={secondary}
        onNavigate={onNavigate}
        showThemeToggle={false}
      />,
    );
    press({ key: 'H', code: 'KeyH', ctrlKey: true, shiftKey: true });
    expect(onNavigate).toHaveBeenCalledWith(expect.objectContaining({ key: 'home' }));
    press({ key: ',', code: 'Comma', metaKey: true });
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onNavigate).toHaveBeenCalledTimes(1);
    tree.rerender(
      <BloomThemeProvider fonts={false}>
        <Sidebar variant="rail" items={items} onNavigate={onNavigate} />
      </BloomThemeProvider>,
    );
    press({ key: 'H', code: 'KeyH', ctrlKey: true, shiftKey: true });
    expect(onNavigate).toHaveBeenCalledTimes(2);
  });

  it('acts once when the navigation is mounted twice (in flow and in a drawer)', () => {
    const onModeChange = jest.fn();
    renderIn(
      <>
        <Sidebar modes={MODES} onModeChange={onModeChange} showThemeToggle={false} />
        <Sidebar mobile modes={MODES} onModeChange={onModeChange} showThemeToggle={false} />
      </>,
    );
    press({ key: '¡', code: 'Digit1', altKey: true, ctrlKey: true });
    expect(onModeChange).toHaveBeenCalledTimes(1);
  });

  it('ignores keys typed into a field, and keys an app already handled', () => {
    const onModeChange = jest.fn();
    renderIn(<Sidebar modes={MODES} onModeChange={onModeChange} showThemeToggle={false} />);
    const input = document.createElement('input');
    document.body.appendChild(input);
    press({ key: '¡', code: 'Digit1', altKey: true, ctrlKey: true }, input);
    expect(onModeChange).toHaveBeenCalledTimes(0);
    const editable = document.createElement('div');
    editable.setAttribute('contenteditable', 'true');
    document.body.appendChild(editable);
    press({ key: '¡', code: 'Digit1', altKey: true, ctrlKey: true }, editable);
    expect(onModeChange).toHaveBeenCalledTimes(0);
    const handled = new KeyboardEvent('keydown', {
      code: 'Digit1',
      altKey: true,
      ctrlKey: true,
      cancelable: true,
    });
    handled.preventDefault();
    window.dispatchEvent(handled);
    expect(onModeChange).not.toHaveBeenCalled();
    input.remove();
    editable.remove();
  });

  it('stops listening on unmount', () => {
    const onModeChange = jest.fn();
    const tree = renderIn(
      <Sidebar modes={MODES} onModeChange={onModeChange} showThemeToggle={false} />,
    );
    tree.unmount();
    press({ key: '¡', code: 'Digit1', altKey: true, ctrlKey: true });
    expect(onModeChange).not.toHaveBeenCalled();
  });
});
