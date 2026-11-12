import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { BloomScope } from '../appearance';
import { BookingCard, TripCard } from '../booking';
import { Button } from '../button';
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
  'BookingCard footer controls inherit %s while Reserve remains large',
  (_name, size, height) => {
    const card = (
      <BookingCard
        testID="booking"
        price="$120"
        footer={
          <Button testID="booking-footer-action">
            <Text>Details</Text>
          </Button>
        }
      />
    );
    const tree = render(
      <BloomThemeProvider fonts={false}>
        {size ? <BloomScope size={size}>{card}</BloomScope> : card}
      </BloomThemeProvider>,
    );
    expect(resolvedStyle(tree.getByTestId('booking-footer-action').props.style).height).toBe(
      height,
    );
    expect(resolvedStyle(tree.getByTestId('booking-reserve').props.style).height).toBe(44);
  },
);

it('BookingCard footer controls inherit the nearest nested scope', () => {
  const tree = render(
    <BloomThemeProvider fonts={false}>
      <BloomScope size="xs">
        <BloomScope size="lg">
          <BookingCard
            testID="booking"
            price="$120"
            footer={
              <Button testID="booking-footer-action">
                <Text>Details</Text>
              </Button>
            }
          />
        </BloomScope>
      </BloomScope>
    </BloomThemeProvider>,
  );
  expect(resolvedStyle(tree.getByTestId('booking-footer-action').props.style).height).toBe(44);
  expect(resolvedStyle(tree.getByTestId('booking-reserve').props.style).height).toBe(44);
});

it.each(sizes)('TripCard actions inherit %s scope', (_name, size, height) => {
  const card = (
    <TripCard
      testID="trip"
      title="Stay"
      orientation="horizontal"
      actions={
        <Button testID="trip-action">
          <Text>Details</Text>
        </Button>
      }
    />
  );
  const tree = render(
    <BloomThemeProvider fonts={false}>
      {size ? <BloomScope size={size}>{card}</BloomScope> : card}
    </BloomThemeProvider>,
  );
  expect(resolvedStyle(tree.getByTestId('trip-action').props.style).height).toBe(height);
});

it('TripCard actions inherit the nearest nested scope', () => {
  const tree = render(
    <BloomThemeProvider fonts={false}>
      <BloomScope size="xs">
        <BloomScope size="lg">
          <TripCard
            testID="trip"
            title="Stay"
            orientation="horizontal"
            actions={
              <Button testID="trip-action">
                <Text>Details</Text>
              </Button>
            }
          />
        </BloomScope>
      </BloomScope>
    </BloomThemeProvider>,
  );
  expect(resolvedStyle(tree.getByTestId('trip-action').props.style).height).toBe(44);
});
