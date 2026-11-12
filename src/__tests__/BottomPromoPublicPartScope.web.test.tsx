/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { BloomScope } from '../appearance';
import { BottomPromo } from '../bottom-promo';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

it.each([undefined, 'xs', 'sm', 'md', 'lg'] as const)(
  'keeps BottomPromo action geometry fixed under %s scope on web',
  (size) => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    try {
      act(() =>
        root.render(
          <BloomThemeProvider fonts={false}>
            {size ? (
              <BloomScope size={size}>
                <BottomPromo title="Find a place" actionLabel="Explore" onAction={() => {}} />
              </BloomScope>
            ) : (
              <BottomPromo title="Find a place" actionLabel="Explore" onAction={() => {}} />
            )}
          </BloomThemeProvider>,
        ),
      );
      const button = host.querySelector('button');
      if (!button) throw new Error('Missing BottomPromo action');
      expect(getComputedStyle(button).height).toBe('44px');
    } finally {
      act(() => root.unmount());
      host.remove();
    }
  },
);
