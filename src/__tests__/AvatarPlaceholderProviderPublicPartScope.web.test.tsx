/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { View } from 'react-native';
import { BloomScope } from '../appearance';
import { Avatar, AvatarPlaceholderProvider } from '../avatar';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

it.each([
  [undefined, '24px'],
  ['xs', '12px'],
  ['sm', '14.4px'],
  ['md', '19.2px'],
  ['lg', '21.6px'],
] as const)('passes %s scope geometry to the placeholder icon on web', (size, expected) => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    act(() =>
      root.render(
        <BloomThemeProvider fonts={false}>
          {size ? (
            <BloomScope size={size}>
              <AvatarPlaceholderProvider
                value={{
                  icon: (diameter) => (
                    <View testID="placeholder-icon" style={{ width: diameter }} />
                  ),
                }}
              >
                <View>
                  <Avatar />
                </View>
              </AvatarPlaceholderProvider>
            </BloomScope>
          ) : (
            <AvatarPlaceholderProvider
              value={{
                icon: (diameter) => <View testID="placeholder-icon" style={{ width: diameter }} />,
              }}
            >
              <View>
                <Avatar />
              </View>
            </AvatarPlaceholderProvider>
          )}
        </BloomThemeProvider>,
      ),
    );
    const icon = host.querySelector('[data-testid="placeholder-icon"]');
    if (!icon) throw new Error('Missing provider placeholder icon');
    expect(Number.parseFloat(getComputedStyle(icon).width)).toBeCloseTo(
      Number.parseFloat(expected),
      4,
    );
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
