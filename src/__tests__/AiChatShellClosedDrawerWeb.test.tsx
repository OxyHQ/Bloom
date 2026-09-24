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
  Object.defineProperty(document.documentElement, 'clientWidth', { value: 800, configurable: true });
  Object.defineProperty(document.documentElement, 'clientHeight', { value: 900, configurable: true });
  return jest.requireActual('react-native-web');
});

import { Pressable, Text, View } from 'react-native';

import { AiChatShell } from '../ai-chat';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

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

function render(navOpen: boolean) {
  act(() => {
    root.render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <AiChatShell
          sidebar={null}
          mobileSidebar={
            <Pressable testID="row" accessibilityRole="button">
              <Text>Chats</Text>
            </Pressable>
          }
          navOpen={navOpen}
          onNavOpenChange={() => undefined}>
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
