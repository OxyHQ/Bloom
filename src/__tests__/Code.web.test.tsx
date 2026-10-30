/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { Code } from '../code/Code';
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

describe('Code on web', () => {
  it('renders a real <code> and turns React Native props into DOM attributes', () => {
    const errors = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    act(() => {
      root.render(
        <BloomThemeProvider mode="light">
          <Code testID="sign-in-code" accessibilityLabel="Sign-in code" numberOfLines={1}>
            ABCD-1234
          </Code>
        </BloomThemeProvider>,
      );
    });
    const code = container.querySelector('code');
    expect(code?.textContent).toBe('ABCD-1234');
    expect(code?.getAttribute('data-testid')).toBe('sign-in-code');
    expect(code?.getAttribute('aria-label')).toBe('Sign-in code');
    expect(code?.hasAttribute('testID')).toBe(false);
    expect(code?.hasAttribute('testid')).toBe(false);
    expect(errors).not.toHaveBeenCalled();
    errors.mockRestore();
  });

  it('applies every entry of a style array, not only an object', () => {
    act(() => {
      root.render(
        <BloomThemeProvider mode="light">
          <Code style={[{ fontSize: 28 }, { letterSpacing: 4 }]}>ABCD</Code>
        </BloomThemeProvider>,
      );
    });
    const code = container.querySelector('code');
    expect(code).not.toBeNull();
    const computed = window.getComputedStyle(code as HTMLElement);
    expect(computed.fontSize).toBe('28px');
    expect(computed.letterSpacing).toBe('4px');
  });
});
