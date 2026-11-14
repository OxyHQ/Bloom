import { render } from '@testing-library/react-native';
import { AgentAvatar } from '../agent-avatar/AgentAvatar';
import { BloomScope } from '../appearance';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';

function Subject({ size, avatarSize }: { size?: 'xs' | 'lg'; avatarSize?: number }) {
  const avatar = (
    <AgentAvatar character={{ preset: 'blue_beret' }} size={avatarSize} paused testID="avatar" />
  );
  return (
    <BloomThemeProvider>
      {size ? <BloomScope size={size}>{avatar}</BloomScope> : avatar}
    </BloomThemeProvider>
  );
}

it('preserves numeric character artwork geometry across control scopes', () => {
  const screen = render(<Subject />);
  const dimensions = () => resolvedStyle(screen.getByTestId('avatar').props.style);

  expect(dimensions()).toMatchObject({ width: 64, height: 64 });
  screen.rerender(<Subject size="xs" />);
  expect(dimensions()).toMatchObject({ width: 64, height: 64 });
  screen.rerender(<Subject size="lg" />);
  expect(dimensions()).toMatchObject({ width: 64, height: 64 });

  screen.rerender(<Subject avatarSize={48} size="xs" />);
  expect(dimensions()).toMatchObject({ width: 48, height: 48 });
  screen.rerender(<Subject avatarSize={48} size="lg" />);
  expect(dimensions()).toMatchObject({ width: 48, height: 48 });
});
