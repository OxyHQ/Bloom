import { fireEvent, render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { BloomScope } from '../appearance';
import { PriceBreakdown } from '../booking';
import { Button } from '../button';
import { PortalOutlet, PortalProvider } from '../portal';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';

const sizes = [
  ['default', undefined, 36],
  ['xs', 'xs', 24],
  ['sm', 'sm', 32],
  ['md', 'md', 36],
  ['lg', 'lg', 44],
] as const;

it.each(sizes)(
  'PriceBreakdown details inherit %s through the popover portal',
  (_name, size, height) => {
    const breakdown = (
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
    );
    const tree = render(
      <BloomThemeProvider fonts={false}>
        <PortalProvider>
          {size ? <BloomScope size={size}>{breakdown}</BloomScope> : breakdown}
          <PortalOutlet />
        </PortalProvider>
      </BloomThemeProvider>,
    );
    fireEvent.press(tree.getByText('Taxes'));
    expect(resolvedStyle(tree.getByTestId('details-action').props.style).height).toBe(height);
  },
);

it('PriceBreakdown details inherit the nearest nested scope through the portal', () => {
  const tree = render(
    <BloomThemeProvider fonts={false}>
      <PortalProvider>
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
        <PortalOutlet />
      </PortalProvider>
    </BloomThemeProvider>,
  );
  fireEvent.press(tree.getByText('Taxes'));
  expect(resolvedStyle(tree.getByTestId('details-action').props.style).height).toBe(44);
});
