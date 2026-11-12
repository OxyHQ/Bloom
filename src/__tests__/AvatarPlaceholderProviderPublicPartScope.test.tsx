import { render } from '@testing-library/react-native';
import { View } from 'react-native';
import { BloomScope } from '../appearance';
import { Avatar, AvatarPlaceholderProvider } from '../avatar';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';

it.each([
  ['default', undefined, 24],
  ['xs', 'xs', 12],
  ['sm', 'sm', 14.4],
  ['md', 'md', 19.2],
  ['lg', 'lg', 21.6],
] as const)(
  'passes the scoped Avatar size to its placeholder icon (%s)',
  (_name, size, iconSize) => {
    const avatar = (
      <AvatarPlaceholderProvider
        value={{
          icon: (diameter) => <View testID="placeholder-icon" style={{ width: diameter }} />,
        }}
      >
        <View>
          <Avatar testID="avatar" />
        </View>
      </AvatarPlaceholderProvider>
    );
    const tree = render(
      <BloomThemeProvider fonts={false}>
        {size ? <BloomScope size={size}>{avatar}</BloomScope> : avatar}
      </BloomThemeProvider>,
    );
    expect(resolvedStyle(tree.getByTestId('placeholder-icon').props.style).width).toBeCloseTo(
      iconSize,
      4,
    );
  },
);

it('lets an explicit Avatar size win over the surrounding scope', () => {
  const tree = render(
    <BloomThemeProvider fonts={false}>
      <BloomScope size="xs">
        <AvatarPlaceholderProvider
          value={{
            icon: (diameter) => <View testID="placeholder-icon" style={{ width: diameter }} />,
          }}
        >
          <View>
            <Avatar size="lg" />
          </View>
        </AvatarPlaceholderProvider>
      </BloomScope>
    </BloomThemeProvider>,
  );
  expect(resolvedStyle(tree.getByTestId('placeholder-icon').props.style).width).toBeCloseTo(
    21.6,
    4,
  );
});
