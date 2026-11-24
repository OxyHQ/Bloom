/**
 * @jest-environment jsdom
 */

/**
 * The multi-agent chat's Marketplace, on WEB: leaving an item's detail with the
 * back button returns to the browse view with focus in its search field, so the
 * keyboard continues where the person was looking instead of from <body>.
 *
 * The search field mounts in the commit that closes the detail; focus moves in
 * that commit, not on a timer a frame later, so the assertion runs with no
 * frame advanced. `?marketplace=<id>` opens the chat on that item's detail.
 */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));
jest.mock('../bottom-sheet', () => jest.requireActual('../bottom-sheet/index.web'));

import { MultiAgentChat } from '../multi-agent-chat/index.web';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  jest.useFakeTimers();
  window.history.replaceState(null, '', '/?marketplace=notion');
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  window.history.replaceState(null, '', '/');
  jest.useRealTimers();
});

const byLabel = (label: string) => document.querySelector<HTMLElement>(`[aria-label="${label}"]`);

describe('Marketplace (web) — back from a detail focuses the search', () => {
  it('moves focus to the search field in the commit that shows it', () => {
    act(() => {
      root.render(
        <BloomThemeProvider mode="light" colorPreset="oxy">
          <MultiAgentChat storageKey={null} />
        </BloomThemeProvider>,
      );
    });
    for (let i = 0; i < 4; i++)
      act(() => {
        jest.advanceTimersByTime(50);
      });
    const back = byLabel('Back to marketplace');
    expect(back).not.toBeNull();
    expect(byLabel('Search marketplace')).toBeNull();
    act(() => back?.click());
    const search = byLabel('Search marketplace');
    expect(search).not.toBeNull();
    expect(document.activeElement).toBe(search);
  });
});
