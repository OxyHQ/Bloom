/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { BloomScope } from '../appearance';
import { AuthCard } from '../auth-card';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function measuredHeight(host: HTMLElement, testID: string) {
  const element = host.querySelector(`[data-testid="${testID}"]`);
  if (!element) throw new Error(`Missing AuthCard element: ${testID}`);
  return getComputedStyle(element).height;
}

it.each([
  ['default', undefined, '36px'],
  ['xs', 'xs', '28px'],
  ['sm', 'sm', '32px'],
  ['md', 'md', '36px'],
  ['lg', 'lg', '44px'],
] as const)('AuthCard fields inherit %s while the CTA stays medium', (_name, size, expected) => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    act(() =>
      root.render(
        <BloomThemeProvider fonts={false}>
          {size ? (
            <BloomScope size={size}>
              <AuthCard testID="auth" providers={[]} />
            </BloomScope>
          ) : (
            <AuthCard testID="auth" providers={[]} />
          )}
        </BloomThemeProvider>,
      ),
    );
    expect(measuredHeight(host, 'auth-email')).toBe(expected);
    expect(measuredHeight(host, 'auth-submit')).toBe('36px');
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});

it('AuthCard fields use the nearest nested size scope on web', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    act(() =>
      root.render(
        <BloomThemeProvider fonts={false}>
          <BloomScope size="xs">
            <BloomScope size="lg">
              <AuthCard testID="auth" providers={[]} />
            </BloomScope>
          </BloomScope>
        </BloomThemeProvider>,
      ),
    );
    expect(measuredHeight(host, 'auth-email')).toBe('44px');
    expect(measuredHeight(host, 'auth-submit')).toBe('36px');
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
