/**
 * @jest-environment jsdom
 */

// The bug these tests exist for: `Backdrop`'s dismiss target carries
// `accessibilityRole="button"`, which react-native-web renders as a real
// `<button>`. While that target WRAPPED `children`, every control inside a
// Bloom surface became a nested `<button>` — invalid HTML, reported by React as
// a hydration error, and with activation behaviour the spec leaves undefined.
// It reproduced on any dialog with a button in it (Mention's post-options menu:
// "Dismiss Post options" containing "Insights").
//
// The fix makes the hit box a SIBLING behind `children`. These tests pin both
// halves of that: no nesting, and the dismiss press still works.

import { createElement } from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

// The whole point is what react-native-web puts in the DOM, so this suite runs
// against the REAL RNW — the repo-wide `react-native` mock emits no host
// elements and would make every assertion below vacuous.
jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { Pressable, Text } from 'react-native';

import { Backdrop } from '../overlay';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function render(node: ReturnType<typeof createElement>): { root: Root; container: HTMLElement } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(node);
  });
  return { root, container };
}

describe('Backdrop DOM nesting (web)', () => {
  it('does not make a pressable child a nested <button>', () => {
    const { root, container } = render(
      createElement(Backdrop, {
        onPress: () => {},
        accessibilityLabel: 'Dismiss Post options',
        testID: 'backdrop',
        children: createElement(
          Pressable,
          { accessibilityRole: 'button', accessibilityLabel: 'Insights', onPress: () => {} },
          createElement(Text, null, 'Insights'),
        ),
      }),
    );

    // Vacuity floor: the child button must actually be in the DOM, otherwise
    // "no nesting" would pass on an empty tree.
    const inner = container.querySelector('[aria-label="Insights"]');
    expect(inner?.tagName).toBe('BUTTON');
    expect(container.querySelector('[aria-label="Dismiss Post options"]')?.tagName).toBe('BUTTON');

    expect(container.querySelectorAll('button button')).toHaveLength(0);

    act(() => root.unmount());
    container.remove();
  });

  it('still dismisses when the backdrop itself is pressed', () => {
    const onPress = jest.fn();
    const { root, container } = render(
      createElement(Backdrop, { onPress, accessibilityLabel: 'Dismiss dialog', children: null }),
    );

    const hitBox = container.querySelector<HTMLElement>('[aria-label="Dismiss dialog"]');
    expect(hitBox).not.toBeNull();
    act(() => {
      hitBox?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onPress).toHaveBeenCalledTimes(1);

    act(() => root.unmount());
    container.remove();
  });

  it('emits no dismiss affordance at all when inert', () => {
    const { root, container } = render(
      createElement(Backdrop, { disabled: true, onPress: () => {}, children: null }),
    );

    expect(container.querySelectorAll('button')).toHaveLength(0);

    act(() => root.unmount());
    container.remove();
  });
});
