/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
jest.mock('../styles/pointer', () => {
  const actual = jest.requireActual('../styles/pointer');
  return { ...actual, useTouchInput: () => true };
});
import { BloomScope } from '../appearance';
import { CarouselDots } from '../carousel';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const sizes = [undefined, 'xs', 'sm', 'md', 'lg'] as const;

it.each(sizes)(
  'CarouselDots gives each interactive dot a 44px target under %s scope on web',
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
                <CarouselDots
                  testID="dots"
                  count={3}
                  index={1}
                  onIndexChange={() => {}}
                  duration={0}
                />
              </BloomScope>
            ) : (
              <CarouselDots
                testID="dots"
                count={3}
                index={1}
                onIndexChange={() => {}}
                duration={0}
              />
            )}
          </BloomThemeProvider>,
        ),
      );
      const row = host.querySelector<HTMLElement>('[data-testid="dots"]');
      if (!row) throw new Error('Missing CarouselDots row');
      expect(getComputedStyle(row).minHeight).toBe('44px');
      const targets = Array.from(host.querySelectorAll<HTMLElement>('[data-bloom-carousel-dot]'));
      expect(targets).toHaveLength(3);
      for (const target of targets) {
        expect(getComputedStyle(target).width).toBe('44px');
        expect(getComputedStyle(target).height).toBe('44px');
        const artwork = target.firstElementChild;
        if (!artwork) throw new Error('Missing dot artwork');
        expect(getComputedStyle(artwork).height).toBe('6px');
      }
      const activeTarget = targets[1];
      const activeArtwork = activeTarget?.firstElementChild;
      if (!activeArtwork) throw new Error('Missing active dot artwork');
      expect(getComputedStyle(activeArtwork).width).toBe('16px');
    } finally {
      act(() => root.unmount());
      host.remove();
    }
  },
);

it('nested lg scope does not change CarouselDots artwork or touch targets on web', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    act(() =>
      root.render(
        <BloomThemeProvider fonts={false}>
          <BloomScope size="xs">
            <BloomScope size="lg">
              <CarouselDots
                testID="dots"
                count={3}
                index={1}
                onIndexChange={() => {}}
                duration={0}
              />
            </BloomScope>
          </BloomScope>
        </BloomThemeProvider>,
      ),
    );
    const target = host.querySelector<HTMLElement>('[data-bloom-carousel-dot="active"]');
    if (!target) throw new Error('Missing active carousel dot');
    expect(getComputedStyle(target).width).toBe('44px');
    expect(getComputedStyle(target).height).toBe('44px');
    const artwork = target.firstElementChild;
    if (!artwork) throw new Error('Missing active dot artwork');
    expect(getComputedStyle(artwork).width).toBe('16px');
    expect(getComputedStyle(artwork).height).toBe('6px');
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
