/** @jest-environment jsdom */
import { act, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { Text } from 'react-native';
import { BloomScope } from '../../appearance';
import { Button } from '../../button';
import { BloomThemeProvider } from '../../theme/BloomThemeProvider';
import { AvatarAnchor } from '../AvatarAnchor';
import { useAvatarFlights } from '../use-avatar-flights';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Subject({ scopes }: { scopes: Array<'xs' | 'sm' | 'md' | 'lg'> }) {
  const flights = useAvatarFlights();
  const child = (
    <AvatarAnchor flights={flights} anchor="a">
      <Button testID="anchor-button">
        <Text>Open</Text>
      </Button>
    </AvatarAnchor>
  );
  return (
    <BloomThemeProvider fonts={false}>
      {scopes.reduceRight<ReactNode>(
        (node, size) => (
          <BloomScope key={size} size={size}>
            {node}
          </BloomScope>
        ),
        child,
      )}
    </BloomThemeProvider>
  );
}

it.each([
  [[], '36px'],
  [['xs'], '24px'],
  [['sm'], '32px'],
  [['md'], '36px'],
  [['lg'], '44px'],
  [['xs', 'lg'], '44px'],
] as const)('preserves a child Button through scopes %j on web', (scopes, expected) => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    act(() => root.render(<Subject scopes={[...scopes]} />));
    const button = host.querySelector('[data-testid="anchor-button"]');
    if (!button) throw new Error('Missing child Button');
    expect(getComputedStyle(button).height).toBe(expected);
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
