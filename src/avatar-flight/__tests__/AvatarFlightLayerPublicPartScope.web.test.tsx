/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { BloomScope } from '../../appearance';
import { BloomThemeProvider } from '../../theme/BloomThemeProvider';
import { AvatarFlightLayer } from '../AvatarFlightLayer.web';
import type { AvatarFlights } from '../use-avatar-flights';
import type { AvatarFlightSpec } from '../types';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const character = { shape: 'blob' } as unknown as AvatarFlightSpec['character'];
const layer = {
  flights: [
    {
      spec: { key: 'moving', from: 'from', to: 'to', character },
      from: { x: 12, y: 18, width: 48, height: 40 },
      snapshot: { uri: 'https://example.test/avatar.png' },
    },
  ],
  arrived: [],
  node: () => undefined,
  arrive: () => {},
  finish: () => {},
} as unknown as AvatarFlights['layer'];

it.each([undefined, 'xs', 'sm', 'md', 'lg'] as const)(
  'keeps measured flight artwork geometry fixed under %s scope',
  async (size) => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    const originalRequest = window.requestAnimationFrame;
    const originalCancel = window.cancelAnimationFrame;
    window.requestAnimationFrame = (callback) => window.setTimeout(() => callback(0), 0);
    window.cancelAnimationFrame = (handle) => window.clearTimeout(handle);
    try {
      await act(async () => {
        root.render(
          <BloomThemeProvider fonts={false}>
            {size ? (
              <BloomScope size={size}>
                <AvatarFlightLayer flights={{ layer } as AvatarFlights} />
              </BloomScope>
            ) : (
              <AvatarFlightLayer flights={{ layer } as AvatarFlights} />
            )}
          </BloomThemeProvider>,
        );
        await new Promise((resolve) => setTimeout(resolve, 10));
      });
      const image = document.querySelector('#bloom-portal-root img');
      if (!image) throw new Error('Missing portalled avatar snapshot');
      const artwork = image.parentElement?.parentElement;
      if (!artwork) throw new Error('Missing avatar artwork wrapper');
      expect(getComputedStyle(artwork).width).toBe('48px');
      expect(getComputedStyle(artwork).height).toBe('40px');
    } finally {
      act(() => root.unmount());
      host.remove();
      window.requestAnimationFrame = originalRequest;
      window.cancelAnimationFrame = originalCancel;
    }
  },
);
