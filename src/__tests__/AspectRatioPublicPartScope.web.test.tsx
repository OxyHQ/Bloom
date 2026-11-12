/** @jest-environment jsdom */
import { act, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));
jest.mock('../button', () => jest.requireActual('../button/index.web'));

import { BloomScope, type BloomSize } from '../appearance';
import { AspectRatio } from '../aspect-ratio';
import { Button } from '../button';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Fixture({ scopes }: { scopes: BloomSize[] }) {
  const subject = (
    <AspectRatio testID="scoped-box" ratio={2}>
      <Button testID="scoped-child">Continue</Button>
    </AspectRatio>
  );
  const scoped = scopes.reduceRight<ReactNode>(
    (children, size) => (
      <BloomScope key={size} size={size}>
        {children}
      </BloomScope>
    ),
    subject,
  );
  return <BloomThemeProvider fonts={false}>{scoped}</BloomThemeProvider>;
}

it.each([
  { name: 'default md', scopes: [], height: '36px' },
  { name: 'xs', scopes: ['xs'], height: '24px' },
  { name: 'sm', scopes: ['sm'], height: '32px' },
  { name: 'md', scopes: ['md'], height: '36px' },
  { name: 'lg', scopes: ['lg'], height: '44px' },
  { name: 'nested lg over xs', scopes: ['xs', 'lg'], height: '44px' },
] as const)(
  'keeps ratio geometry and delegates child size on web under $name',
  ({ scopes, height }) => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    try {
      act(() => root.render(<Fixture scopes={[...scopes]} />));
      const box = host.querySelector<HTMLElement>('[data-testid="scoped-box"]');
      const child = host.querySelector<HTMLElement>('[data-testid="scoped-child"]');
      expect(box?.style.aspectRatio).toContain('2');
      expect(box?.style.width).toBe('100%');
      expect(child?.style.getPropertyValue('--bloom-btn-height')).toBe(height);
    } finally {
      act(() => root.unmount());
      host.remove();
    }
  },
);
