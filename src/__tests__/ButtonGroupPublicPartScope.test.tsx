import { render } from '@testing-library/react-native';
import { ButtonGroup, ButtonGroupItem } from '../button-group';
import { BloomScope } from '../appearance';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Text } from '../typography';
import { Portal, PortalOutlet, PortalProvider } from '../portal/Portal';
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
  const makeGroup = (id: string, size?: 'xs' | 'md', item?: 'xs') => (
    <ButtonGroup size={size} accessibilityLabel="Actions">
      <ButtonGroupItem size={item} testID={id}>
        <Text>Select</Text>
      </ButtonGroupItem>
    </ButtonGroup>
  );
  const group = makeGroup('item', groupSize, itemSize);
  const portalGroup = makeGroup('portalled-item');
  return (
    <BloomThemeProvider>
      <PortalProvider>
        {nested ? (
          <BloomScope size="xs">
            <BloomScope size="lg">
              {group}
              <Portal>{portalGroup}</Portal>
            </BloomScope>
          </BloomScope>
        ) : outerSize ? (
          <BloomScope size={outerSize}>
            {group}
            <Portal>{portalGroup}</Portal>
          </BloomScope>
        ) : (
          <>
            {group}
            <Portal>{portalGroup}</Portal>
          </>
        )}
        <PortalOutlet />
      </PortalProvider>
    </BloomThemeProvider>
  );
}

it('resolves the public ButtonGroup and ButtonGroupItem size on the native route', () => {
  const screen = render(<Subject />);
  const height = (id: string) => resolvedStyle(screen.getByTestId(id).props.style).height;

  expect(height('item')).toBe(34);
  expect(height('portalled-item')).toBe(34);
  screen.rerender(<Subject outerSize="xs" />);
  expect(height('item')).toBe(24);
  expect(height('portalled-item')).toBe(24);
  screen.rerender(<Subject outerSize="lg" />);
  expect(height('item')).toBe(34);
  expect(height('portalled-item')).toBe(34);
  screen.rerender(<Subject outerSize="xs" groupSize="md" />);
  expect(height('item')).toBe(34);
  expect(height('portalled-item')).toBe(24);
  screen.rerender(<Subject outerSize="lg" groupSize="xs" />);
  expect(height('item')).toBe(24);
  expect(height('portalled-item')).toBe(34);
  screen.rerender(<Subject outerSize="xs" groupSize="md" itemSize="xs" />);
  expect(height('item')).toBe(24);
  expect(height('portalled-item')).toBe(24);
  screen.rerender(<Subject nested />);
  expect(height('item')).toBe(34);
  expect(height('portalled-item')).toBe(34);
  screen.unmount();
});
