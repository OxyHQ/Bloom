import { act, fireEvent, render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ListingCardGrid } from '../listing-card';
import type { ListingCardGridDensity } from '../listing-card/types';
import { resolvedStyle } from './support/rendered-style';

/** Native sizes its cells from the grid's measured width, as the container queries did. */
function cellWidthAt(density: ListingCardGridDensity, width: number) {
  const api = render(
    <ListingCardGrid density={density} testID="g">
      <Text>a</Text>
    </ListingCardGrid>,
  );
  act(() => {
    fireEvent(api.getByTestId('g'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width, height: 100 } },
    });
  });
  const cell = api.UNSAFE_root.findAll(
    (node) => typeof node.type === 'string' && node.props.role === 'listitem',
  )[0]!;
  return resolvedStyle(cell.props.style).width;
}

it.each([
  ['results', 0, '100%'],
  ['results', 499, '100%'],
  ['results', 500, '50%'],
  ['results', 950, '33.3333%'],
  ['results', 1280, '25%'],
  ['compact', 0, '50%'],
  ['compact', 640, '33.3333%'],
  ['compact', 950, '25%'],
] as const)('%s at %ipx: cells %s wide', (density, width, cell) => {
  expect(cellWidthAt(density, width)).toBe(cell);
});
