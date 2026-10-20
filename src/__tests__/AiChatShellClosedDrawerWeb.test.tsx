/**
 * @jest-environment jsdom
 *
 * A presented panel stays mounted when hidden, so on web it has to leave the tab
 * order as well as the accessibility tree: `inert` while closed, nothing once
 * open. Rendered through react-native-web so the attribute is the real DOM one.
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => {
  // Narrower than `lg`, before the first `Dimensions.get` caches it.
  Object.defineProperty(document.documentElement, 'clientWidth', {
    value: 400,
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

import { AiChatShell } from '../ai-chat/index.web';
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
  if (!row && navOpen) throw new Error('the navigation panel did not render');
  return row;
}

describe('AiChatShell retained panel (web)', () => {
  it('makes retained navigation inert and hidden after closing', () => {
    render(true);
    const drawer = render(false)!.closest('[inert]');
    expect(drawer).not.toBeNull();
    expect(drawer?.getAttribute('aria-hidden')).toBe('true');
  });

  it('lifts both once navigation is selected', () => {
    const row = render(true)!;
    expect(row.closest('[inert]')).toBeNull();
    expect(row.closest('[aria-hidden="true"]')).toBeNull();
  });
});

describe('AiChatShell compact panel keyboard (web)', () => {
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
  const closeVeil = () => container.querySelector<HTMLElement>('[aria-label="Close navigation"]')!;
  function press(key: string, init: KeyboardEventInit = {}) {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
    act(() => {
      (document.activeElement ?? document.body).dispatchEvent(event);
    });
    act(() => jest.runOnlyPendingTimers());
    return event;
  }

  it('retains hidden navigation controls outside the tab order and accessibility tree', () => {
    render(true);
    const row = byTestId('row');
    render(false);
    expect(byTestId('row')).toBe(row);
    expect(row.closest('[inert]')).not.toBeNull();
    expect(row.closest('[aria-hidden="true"]')).not.toBeNull();
    // RNW Pressable once retained a Tab stop despite focusable=false.
    // The shared reveal veil remains mounted but must leave the tab order.
    expect(closeVeil().tabIndex).toBe(-1);
    expect(closeVeil().closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('uses the shared closing veil while the conversation is inert', () => {
    const change = jest.fn();
    render(false, change);
    render(true, change);
    expect(closeVeil()).not.toBeNull();
    expect(closeVeil().closest('[inert]')).toBeNull();
    const conversation = byTestId('ai-chat-shell-panels-conversation');
    expect(conversation.closest('[inert]')).not.toBeNull();
    expect(conversation.closest('[aria-hidden="true"]')).not.toBeNull();
    act(() => closeVeil().dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(change).toHaveBeenLastCalledWith(false);
    render(false, change);
    expect(conversation.closest('[inert]')).toBeNull();
    expect(closeVeil().tabIndex).toBe(-1);
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
    act(() => byTestId('row').focus());
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

  it('makes the context panel a programmatic focus destination without a new Tab stop', () => {
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
    // Inline when the row is wide enough, otherwise a floating side sheet
    // portaled to the document (jsdom measures no width, so it floats here).
    const panel = document.querySelector<HTMLElement>(
      '[data-testid^="ai-chat-shell-panels-context"][tabindex="-1"], [data-testid="ai-chat-shell-panels-context"] [tabindex="-1"]',
    )!;
    expect(panel.tabIndex).toBe(-1);
    act(() => panel.focus());
    expect(document.activeElement).toBe(panel);
  });
});
