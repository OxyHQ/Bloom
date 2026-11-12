import { render } from '@testing-library/react-native';
import { BloomScope } from '../appearance';
import { ChartRangePill } from '../chart-cards/primitives/ChartRangePill';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';

const sizes = [undefined, 'xs', 'sm', 'md', 'lg'] as const;

it.each(sizes)('ChartRangePill keeps chart geometry under %s scope', (size) => {
  const tree = render(
    <BloomThemeProvider fonts={false}>
      {size ? (
        <BloomScope size={size}>
          <ChartRangePill label="Jan – Jun 2026" testID="range" />
        </BloomScope>
      ) : (
        <ChartRangePill label="Jan – Jun 2026" testID="range" />
      )}
    </BloomThemeProvider>,
  );
  const style = resolvedStyle(tree.getByTestId('range').props.style);
  expect(style.height).toBe(32);
  expect(style.gap).toBe(6);
});
