import { render } from '@testing-library/react-native';
import { BloomScope } from '../appearance';
import { ChartCenterReadout } from '../chart-cards/primitives/ChartCenterReadout';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';

const sizes = [undefined, 'xs', 'sm', 'md', 'lg'] as const;

it.each(sizes)('ChartCenterReadout keeps its explicit chart recipe at %s scope', (scopeSize) => {
  const tree = render(
    <BloomThemeProvider fonts={false}>
      {scopeSize ? (
        <BloomScope size={scopeSize}>
          <ChartCenterReadout value={42} format={() => '42'} testID="readout" />
        </BloomScope>
      ) : (
        <ChartCenterReadout value={42} format={() => '42'} testID="readout" />
      )}
    </BloomThemeProvider>,
  );
  const readout = tree.getByTestId('readout');
  expect(readout.props.pointerEvents).toBe('none');
  expect(resolvedStyle(readout.props.style)).toMatchObject({
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });
  expect(resolvedStyle(tree.getByText('42').props.style).fontSize).toBe(32);
});
