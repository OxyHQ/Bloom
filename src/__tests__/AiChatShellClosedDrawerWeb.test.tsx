/**
 * @jest-environment jsdom
 *
 * A closed drawer stays mounted offscreen, so on web it has to leave the tab
 * order as well as the accessibility tree: `inert` while closed, nothing once
 * open. Rendered through react-native-web so the attribute is the real DOM one.
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => {
  // Narrower than `lg`, before the first `Dimensions.get` caches it.
  Object.defineProperty(document.documentElement, 'clientWidth', {
    value: 800,
    configurable: true,
  });
  Object.defineProperty(document.documentElement, 'clientHeight', {
    value: 900,
    configurable: true,
  });
  return jest.requireActual('react-native-web');
});

// Exercise a real RNW host for Animated.View as well as plain View.
jest.mock('react-native-reanimated', () => {
  const animation = jest.requireActual('../../__mocks__/react-native-reanimated');
  return {
    __esModule: true,
    ...animation,
    default: { ...animation.default, View: jest.requireActual('react-native-web').View },
  };
});

import { Pressable, Text, TextInput, View } from 'react-native';

import { AiChatShell } from '../ai-chat';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resetOverlayStack } from '../overlay/stack';

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

function render(navOpen: boolean, onNavOpenChange: (open: boolean) => void = () => undefined) {
  act(() => {
    root.render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <AiChatShell
          sidebar={null}
          mobileSidebar={
            <View>
              <Pressable testID="row" accessibilityRole="button">
                <Text>Chats</Text>
              </Pressable>
              <TextInput testID="filter" accessibilityLabel="Filter" />
            </View>
          }
          navOpen={navOpen}
          onNavOpenChange={onNavOpenChange}
        >
          <View />
        </AiChatShell>
      </BloomThemeProvider>,
    );
  });
  const row = container.querySelector('[data-testid="row"]');
  if (!row) throw new Error('the drawer did not render');
  return row;
}

describe('AiChatShell closed drawer (web)', () => {
  it('makes the closed nav drawer inert and hidden', () => {
    const drawer = render(false).closest('[inert]');
    expect(drawer).not.toBeNull();
    expect(drawer?.getAttribute('aria-hidden')).toBe('true');
  });

  it('lifts both once the drawer opens', () => {
    const row = render(true);
    expect(row.closest('[inert]')).toBeNull();
    expect(row.closest('[aria-hidden="true"]')).toBeNull();
  });
});

describe('AiChatShell nav drawer keyboard (web)', () => {
  let opener: HTMLButtonElement;
  beforeEach(() => {
    jest.useFakeTimers();
    resetOverlayStack();
    opener = document.createElement('button');
    document.body.appendChild(opener);
  });
  afterEach(() => {
    opener.remove();
    jest.useRealTimers();
  });

  const byTestId = (id: string) => container.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;
  const veil = () => container.querySelector<HTMLElement>('[aria-label="Close navigation"]')!;
  function press(key: string, init: KeyboardEventInit = {}) {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
    act(() => {
      (document.activeElement ?? document.body).dispatchEvent(event);
    });
    act(() => jest.runOnlyPendingTimers());
    return event;
  }

  it("keeps the closed drawer's veil out of the tab order and the accessibility tree", () => {
    render(false);
    expect(veil().getAttribute('tabindex')).toBe('-1');
    expect(veil().closest('[inert]')).not.toBeNull();
    expect(veil().closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it("is never a Tab stop while open either: Escape and the drawer's rows are the way out", () => {
    render(true);
    expect(veil().getAttribute('tabindex')).toBe('-1');
    expect(veil().closest('[inert]')).toBeNull();
  });

  it('moves focus in on open, keeps Tab inside, and hands it back on close', () => {
    const change = jest.fn();
    render(false, change);
    opener.focus();
    render(true, change);
    expect(document.activeElement).toBe(byTestId('row'));
    // jsdom does not move focus on Tab by itself, so only the wraps show.
    expect(press('Tab', { shiftKey: true }).defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(byTestId('filter'));
    // From the text field too, whose keydowns never bubble out of it.
    expect(press('Tab').defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(byTestId('row'));
    render(false, change);
    expect(document.activeElement).toBe(opener);
  });

  it('closes on Escape, from a row and from a text field inside it', () => {
    const change = jest.fn();
    render(false, change);
    opener.focus();
    render(true, change);
    press('Escape');
    expect(change).toHaveBeenLastCalledWith(false);
    expect(change).toHaveBeenCalledTimes(1);
    act(() => byTestId('filter').focus());
    press('Escape');
    expect(change).toHaveBeenCalledTimes(2);
  });

  it('ignores Escape while closed', () => {
    const change = jest.fn();
    render(false, change);
    press('Escape');
    expect(change).not.toHaveBeenCalled();
  });
});

describe('focusable shell panel owners', () => {
  it('focuses empty navigation and retains both Tab directions until it closes', () => {
    const opener = document.createElement('button');
    document.body.append(opener);
    opener.focus();
    function EmptyNavigation() {
      const [open, setOpen] = React.useState(true);
      return (
        <BloomThemeProvider mode="light">
          <AiChatShell
            sidebar={null}
            mobileSidebar={<Text testID="empty-nav">Loading</Text>}
            navOpen={open}
            onNavOpenChange={setOpen}
          >
            <View />
          </AiChatShell>
        </BloomThemeProvider>
      );
    }
    act(() => root.render(<EmptyNavigation />));
    const content = container.querySelector('[data-testid="empty-nav"]')!;
    const panel = content.closest<HTMLElement>('[tabindex="-1"]')!;
    expect(panel).not.toBeNull();
    expect(document.activeElement).toBe(panel);
    for (const shiftKey of [false, true]) {
      const event = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey,
        bubbles: true,
        cancelable: true,
      });
      act(() => panel.dispatchEvent(event));
      expect(event.defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(panel);
    }
    act(() =>
      panel.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
      ),
    );
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });

  it('makes the detail drawer a programmatic focus destination without a new Tab stop', () => {
    act(() =>
      root.render(
        <BloomThemeProvider mode="light">
          <AiChatShell
            sidebar={null}
            panel={() => <Text>Details</Text>}
            panelLabel="Details"
            panelOpen
            onPanelOpenChange={() => {}}
          >
            <View />
          </AiChatShell>
        </BloomThemeProvider>,
      ),
    );
    const panel = container.querySelector<HTMLElement>('[role="dialog"][aria-label="Details"]')!;
    expect(panel.tabIndex).toBe(-1);
    act(() => panel.focus());
    expect(document.activeElement).toBe(panel);
  });
});
