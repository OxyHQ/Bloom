/**
 * @jest-environment jsdom
 */

/**
 * Dismissing the sidebar's search field (Escape or its clear button) hands
 * focus back to the search trigger, so the keyboard continues from where it
 * opened the field instead of from <body>.
 *
 * The trigger mounts in the commit that closes the field; focus moves in that
 * commit, not on a timer a frame later, so the assertions run with no frame
 * advanced. A press outside the field closes it without moving focus.
 */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { RiHomeLine } from '../icons/remix';
import { Sidebar } from '../sidebar';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  jest.useFakeTimers();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.useRealTimers();
});

const ITEMS = [{ key: 'home', label: 'Home', icon: RiHomeLine, href: '/home' }];

const byTestId = (id: string) => container.querySelector<HTMLElement>(`[data-testid="${id}"]`);

function openSearch() {
  act(() => {
    root.render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <Sidebar items={ITEMS} showSearch clearSearchLabel="Clear search" />
      </BloomThemeProvider>,
    );
  });
  act(() => byTestId('sidebar-search')?.click());
  expect(byTestId('sidebar-search-input')).not.toBeNull();
}

describe('Sidebar search (web) — dismissing restores focus to the trigger', () => {
  it('the clear button closes the field and focuses the trigger in the same commit', () => {
    openSearch();
    const clear = container.querySelector<HTMLElement>('[aria-label="Clear search"]');
    act(() => clear?.click());
    expect(byTestId('sidebar-search-input')).toBeNull();
    expect(document.activeElement).toBe(byTestId('sidebar-search'));
  });

  it('Escape in the field does the same', () => {
    openSearch();
    const input = byTestId('sidebar-search-input') as HTMLInputElement;
    act(() => input.focus());
    act(() => {
      input.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
      );
    });
    expect(byTestId('sidebar-search-input')).toBeNull();
    expect(document.activeElement).toBe(byTestId('sidebar-search'));
  });

  it('a press outside closes the field and leaves focus alone', () => {
    openSearch();
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    // The outside-press listener arms after the click that opened the field.
    act(() => {
      jest.runOnlyPendingTimers();
    });
    act(() => outside.focus());
    act(() => outside.click());
    expect(byTestId('sidebar-search-input')).toBeNull();
    expect(document.activeElement).toBe(outside);
    outside.remove();
  });
});
