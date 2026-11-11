import { render } from '@testing-library/react-native';
import { BloomScope } from '../appearance';
import type { BloomSize } from '../appearance';
import { Avatar } from '../avatar';
import type { AvatarSizeToken } from '../avatar';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';

function Subject({
  scope,
  nestedScope,
  size,
}: {
  scope?: BloomSize;
  nestedScope?: BloomSize;
  size?: number | AvatarSizeToken;
}) {
  const avatar = <Avatar name="Ada Lovelace" size={size} testID="avatar" />;
  return (
    <BloomThemeProvider fonts={false} mode="light" colorPreset="teal">
      <BloomScope size={scope}>
        {nestedScope ? <BloomScope size={nestedScope}>{avatar}</BloomScope> : avatar}
      </BloomScope>
    </BloomThemeProvider>
  );
}

it('maps Bloom control scopes onto Avatar size rungs', () => {
  const screen = render(<Subject />);
  const dimensions = () => {
    const style = resolvedStyle(screen.getByTestId('avatar').props.style);
    return [style.width, style.height];
  };

  expect(dimensions()).toEqual([40, 40]);
  screen.rerender(<Subject scope="xs" />);
  expect(dimensions()).toEqual([20, 20]);
  screen.rerender(<Subject scope="sm" />);
  expect(dimensions()).toEqual([24, 24]);
  screen.rerender(<Subject scope="md" />);
  expect(dimensions()).toEqual([32, 32]);
  screen.rerender(<Subject scope="lg" />);
  expect(dimensions()).toEqual([36, 36]);
  screen.rerender(<Subject scope="xs" nestedScope="lg" />);
  expect(dimensions()).toEqual([36, 36]);
});

it('keeps explicit named and numeric Avatar sizes above scope', () => {
  const screen = render(<Subject scope="xs" size="md" />);
  const dimensions = () => {
    const style = resolvedStyle(screen.getByTestId('avatar').props.style);
    return [style.width, style.height];
  };
  expect(dimensions()).toEqual([32, 32]);
  screen.rerender(<Subject scope="lg" size={48} />);
  expect(dimensions()).toEqual([48, 48]);
});
