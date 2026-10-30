/**
 * @jest-environment jsdom
 *
 * `Lockup` and `LockupSkeleton` through the REAL react-native-web, so the
 * assertions read the emitted DOM: the link is an anchor named by its text,
 * the action is its sibling (never inside it), and the large size is a
 * heading. The divider inside a paged shelf is `ShelfPaged.test.tsx`'s.
 */
import type React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { Lockup, LockupSkeleton } from '../lockup';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

function mount(ui: React.ReactElement) {
  act(() => {
    root.render(<BloomThemeProvider mode="light">{ui}</BloomThemeProvider>);
  });
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

const query = (id: string) => container.querySelector(`[data-testid="${id}"]`);

describe('Lockup', () => {
  it('is one link holding the icon and text, with the action beside it', () => {
    const onPress = jest.fn();
    const action = jest.fn();
    mount(
      <Lockup
        testID="l"
        title="Tidewater"
        subtitle="Plan the week"
        caption="Productivity"
        href="/app/tidewater"
        onPress={onPress}
        action={
          <button type="button" data-testid="get" onClick={action}>
            Get
          </button>
        }
      />,
    );
    const link = byTestId('l-link');
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('/app/tidewater');
    // The icon's initial is aria-hidden; the rest of the link's text is its name.
    const initial = byTestId('l-icon').textContent ?? '';
    expect(link.textContent?.slice(initial.length)).toBe('TidewaterPlan the weekProductivity');
    expect(link.contains(byTestId('l-icon'))).toBe(true);
    expect(link.contains(byTestId('get'))).toBe(false);
    expect(byTestId('l-icon').getAttribute('aria-hidden')).toBe('true');
    act(() => link.click());
    expect(onPress).toHaveBeenCalledTimes(1);
    act(() => byTestId('get').click());
    expect(action).toHaveBeenCalledTimes(1);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('without a press target is not a link, and draws only the lines it is given', () => {
    mount(<Lockup testID="l" title="Copperleaf" />);
    expect(query('l-link')).toBeNull();
    expect(query('l-subtitle')).toBeNull();
    expect(query('l-caption')).toBeNull();
    expect(byTestId('l-title').textContent).toBe('Copperleaf');
  });

  it('lg: the title is a heading and the action sits in the text column', () => {
    mount(
      <Lockup
        testID="l"
        size="lg"
        title="Harbor Mail"
        headingLevel={1}
        onPress={() => {}}
        action={<span data-testid="open">Open</span>}
      />,
    );
    const title = byTestId('l-title');
    expect(title.getAttribute('role')).toBe('heading');
    expect(title.getAttribute('aria-level')).toBe('1');
    // Never a link as a whole: the action would be inside it.
    expect(query('l-link')).toBeNull();
    expect(byTestId('l-action').contains(byTestId('open'))).toBe(true);
  });

  it('draws a rank and a divider when asked', () => {
    mount(<Lockup testID="l" title="Keystone" rank={3} divider />);
    expect(byTestId('l-rank').textContent).toBe('3');
    expect(query('l-divider')).not.toBeNull();
  });

  it('LockupSkeleton is one busy group named Loading', () => {
    mount(<LockupSkeleton testID="k" caption />);
    const group = byTestId('k');
    expect(group.getAttribute('aria-busy')).toBe('true');
    expect(group.getAttribute('aria-label')).toBe('Loading');
  });
});
