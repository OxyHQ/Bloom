import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { BloomScope } from '../appearance';
import { BottomSheet } from '../bottom-sheet';
import { Button } from '../button';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';

it.each([
  [undefined, 36],
  ['xs', 24],
  ['sm', 32],
  ['md', 36],
  ['lg', 44],
] as const)('preserves sheet child Button size for %s scope', (size, height) => {
  const sheet = (
    <BottomSheet
      open
      showHandle={false}
      scrollable={false}
      footer={
        <Button testID="sheet-footer-action">
          <Text>Footer</Text>
        </Button>
      }
      headerOverlay={
        <Button testID="sheet-header-action" size="lg">
          <Text>Header</Text>
        </Button>
      }
    >
      <Button testID="sheet-action">
        <Text>Save</Text>
      </Button>
    </BottomSheet>
  );
  const tree = render(
    <BloomThemeProvider fonts={false}>
      {size ? <BloomScope size={size}>{sheet}</BloomScope> : sheet}
    </BloomThemeProvider>,
  );
  expect(resolvedStyle(tree.getByTestId('sheet-action').props.style).height).toBe(height);
  expect(resolvedStyle(tree.getByTestId('sheet-footer-action').props.style).height).toBe(height);
  expect(resolvedStyle(tree.getByTestId('sheet-header-action').props.style).height).toBe(44);
});

it('preserves the nearest nested scope for controls inside the sheet', () => {
  const tree = render(
    <BloomThemeProvider fonts={false}>
      <BloomScope size="xs">
        <BloomScope size="lg">
          <BottomSheet
            open
            showHandle={false}
            scrollable={false}
            footer={
              <Button testID="sheet-footer-action">
                <Text>Footer</Text>
              </Button>
            }
            headerOverlay={
              <Button testID="sheet-header-action" size="lg">
                <Text>Header</Text>
              </Button>
            }
          >
            <Button testID="sheet-action">
              <Text>Save</Text>
            </Button>
          </BottomSheet>
        </BloomScope>
      </BloomScope>
    </BloomThemeProvider>,
  );
  expect(resolvedStyle(tree.getByTestId('sheet-action').props.style).height).toBe(44);
  expect(resolvedStyle(tree.getByTestId('sheet-footer-action').props.style).height).toBe(44);
  expect(resolvedStyle(tree.getByTestId('sheet-header-action').props.style).height).toBe(44);
});
