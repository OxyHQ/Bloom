/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { Text } from 'react-native';
import { BloomScope } from '../appearance';
import { PriceBreakdown } from '../booking/PriceBreakdown';
import { Button } from '../button';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const sizes = [
  ['default', undefined, '36px'],
  ['xs', 'xs', '24px'],
  ['sm', 'sm', '32px'],
  ['md', 'md', '36px'],
  ['lg', 'lg', '44px'],
] as const;

it.each(sizes)(
  'PriceBreakdown detail controls inherit %s through the web portal',
  (_name, size, height) => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    try {
      act(() =>
        root.render(
          <BloomThemeProvider fonts={false}>
            {size ? (
              <BloomScope size={size}>
                <PriceBreakdown
                  rows={[
                    {
                      label: 'Taxes',
                      amount: '$10',
                      details: (
                        <Button testID="details-action">
                          <Text>More</Text>
                        </Button>
                      ),
                    },
                  ]}
                />
              </BloomScope>
            ) : (
              <PriceBreakdown
                rows={[
                  {
                    label: 'Taxes',
                    amount: '$10',
                    details: (
                      <Button testID="details-action">
                        <Text>More</Text>
                      </Button>
                    ),
                  },
                ]}
              />
            )}
          </BloomThemeProvider>,
        ),
      );
      const trigger = document.querySelector('button[aria-label="Taxes"]');
      if (!trigger) throw new Error('Missing PriceBreakdown details trigger');
      act(() => trigger.click());
      const button = document.querySelector('[data-testid="details-action"]');
      if (!button) throw new Error('Missing control inside price details');
      expect(getComputedStyle(button).height).toBe(height);
    } finally {
      act(() => root.unmount());
      host.remove();
    }
  },
);

it('PriceBreakdown detail controls inherit the nearest nested scope through the portal', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    act(() =>
      root.render(
        <BloomThemeProvider fonts={false}>
          <BloomScope size="xs">
            <BloomScope size="lg">
              <PriceBreakdown
                rows={[
                  {
                    label: 'Taxes',
                    amount: '$10',
                    details: (
                      <Button testID="details-action">
                        <Text>More</Text>
                      </Button>
                    ),
                  },
                ]}
              />
            </BloomScope>
          </BloomScope>
        </BloomThemeProvider>,
      ),
    );
    const trigger = document.querySelector('button[aria-label="Taxes"]');
    if (!trigger) throw new Error('Missing PriceBreakdown details trigger');
    act(() => trigger.click());
    const button = document.querySelector('[data-testid="details-action"]');
    if (!button) throw new Error('Missing control inside price details');
    expect(getComputedStyle(button).height).toBe('44px');
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
