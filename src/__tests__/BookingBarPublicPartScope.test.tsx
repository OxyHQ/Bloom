import { render } from '@testing-library/react-native';
import { BloomScope } from '../appearance';
import { BookingBar } from '../booking';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';

it.each([undefined, 'xs', 'sm', 'md', 'lg'] as const)(
  'keeps BookingBar reserve control at its large recipe under %s scope',
  (size) => {
    const bar = <BookingBar testID="booking" price="$120" dates="Aug 1–5" />;
    const tree = render(
      <BloomThemeProvider fonts={false}>
        {size ? <BloomScope size={size}>{bar}</BloomScope> : bar}
      </BloomThemeProvider>,
    );
    expect(resolvedStyle(tree.getByTestId('booking-reserve').props.style).height).toBe(44);
  },
);

it('keeps BookingBar reserve control fixed at the nearest nested scope', () => {
  const tree = render(
    <BloomThemeProvider fonts={false}>
      <BloomScope size="xs">
        <BloomScope size="lg">
          <BookingBar testID="booking" price="$120" dates="Aug 1–5" />
        </BloomScope>
      </BloomScope>
    </BloomThemeProvider>,
  );
  expect(resolvedStyle(tree.getByTestId('booking-reserve').props.style).height).toBe(44);
});
