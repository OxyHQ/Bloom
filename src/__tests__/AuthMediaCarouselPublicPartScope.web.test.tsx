/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { BloomScope } from '../appearance';
import { AuthMediaCarousel } from '../auth-card';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const slides = [{ source: 'a.png' }, { source: 'b.png' }, { source: 'c.png' }];

it.each([undefined, 'xs', 'sm', 'md', 'lg'] as const)(
  'keeps AuthMediaCarousel artwork and dots fixed under %s scope',
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
                <AuthMediaCarousel testID="carousel" slides={slides} />
              </BloomScope>
            ) : (
              <AuthMediaCarousel testID="carousel" slides={slides} />
            )}
          </BloomThemeProvider>,
        ),
      );
      const dots = Array.from(host.querySelectorAll('[data-bloom-carousel-dot]'));
      expect(dots.map((dot) => getComputedStyle(dot).height)).toEqual(['6px', '6px', '6px']);
      expect(dots.map((dot) => getComputedStyle(dot).width)).toEqual(['20px', '6px', '6px']);
    } finally {
      act(() => root.unmount());
      host.remove();
    }
  },
);
