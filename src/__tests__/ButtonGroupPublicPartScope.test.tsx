import { render } from '@testing-library/react-native';
import { ButtonGroup, ButtonGroupItem } from '../button-group';
import { BloomScope } from '../appearance';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Text } from '../typography';
import { resolvedStyle } from './support/rendered-style';

function Subject({
  outerSize,
  groupSize,
  itemSize,
  nested,
}: {
  outerSize?: 'xs' | 'lg';
  groupSize?: 'xs' | 'md';
  itemSize?: 'xs';
  nested?: boolean;
}) {
  const group = (
    <ButtonGroup size={groupSize} accessibilityLabel="Actions">
      <ButtonGroupItem size={itemSize} testID="item">
        <Text>Select</Text>
      </ButtonGroupItem>
    </ButtonGroup>
  );
  return (
    <BloomThemeProvider>
      {nested ? (
        <BloomScope size="xs">
          <BloomScope size="lg">{group}</BloomScope>
        </BloomScope>
      ) : outerSize ? (
        <BloomScope size={outerSize}>{group}</BloomScope>
      ) : (
        group
      )}
    </BloomThemeProvider>
  );
}

it('resolves the public ButtonGroup and ButtonGroupItem size on the native route', () => {
  const screen = render(<Subject />);
  const height = () => resolvedStyle(screen.getByTestId('item').props.style).height;

  expect(height()).toBe(34);
  screen.rerender(<Subject outerSize="xs" />);
  expect(height()).toBe(24);
  screen.rerender(<Subject outerSize="lg" />);
  expect(height()).toBe(34);
  screen.rerender(<Subject outerSize="xs" groupSize="md" />);
  expect(height()).toBe(34);
  screen.rerender(<Subject outerSize="lg" groupSize="xs" />);
  expect(height()).toBe(24);
  screen.rerender(<Subject outerSize="xs" groupSize="md" itemSize="xs" />);
  expect(height()).toBe(24);
  screen.rerender(<Subject nested />);
  expect(height()).toBe(34);
  screen.unmount();
});
