import { render } from '@testing-library/react-native';
import { BloomScope } from '../appearance';
import { Button } from '../button';
import { CallHistoryList, CallHistoryRow } from '../call-ui';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Text } from '../typography';
import { resolvedStyle } from './support/rendered-style';

const sizes = [
  [undefined, 36],
  ['xs', 24],
  ['sm', 32],
  ['md', 36],
  ['lg', 44],
] as const;
const sections = [
  {
    title: 'Today',
    items: [{ id: '1', name: 'Ana', direction: 'incoming' as const, meta: '09:14' }],
  },
];

it.each(sizes)('CallHistoryList delegates its header control at %s scope', (size, height) => {
  const tree = render(
    <BloomThemeProvider fonts={false}>
      {size ? (
        <BloomScope size={size}>
          <CallHistoryList
            sections={sections}
            header={
              <Button testID="header-action">
                <Text>Filter</Text>
              </Button>
            }
          />
        </BloomScope>
      ) : (
        <CallHistoryList
          sections={sections}
          header={
            <Button testID="header-action">
              <Text>Filter</Text>
            </Button>
          }
        />
      )}
    </BloomThemeProvider>,
  );
  expect(resolvedStyle(tree.getByTestId('header-action').props.style).height).toBe(height);
});

it.each(sizes)('CallHistoryRow keeps its callback target independent of %s scope', (size) => {
  const row = (
    <CallHistoryRow
      name="Ana"
      direction="incoming"
      meta="09:14"
      onPress={() => {}}
      onCallBack={() => {}}
      testID="row"
    />
  );
  const tree = render(
    <BloomThemeProvider fonts={false}>
      {size ? <BloomScope size={size}>{row}</BloomScope> : row}
    </BloomThemeProvider>,
  );
  expect(resolvedStyle(tree.getByTestId('row-callback').props.style)).toMatchObject({
    width: 36,
    height: 36,
    borderRadius: 18,
  });
  expect(tree.getByTestId('row-open').props.accessibilityLabel).toBe('Ana, incoming, 09:14');
});
