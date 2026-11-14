import { render } from '@testing-library/react-native';
import { AgentLogReveal } from '../agent-log';
import { BloomScope } from '../appearance';
import { Button } from '../button';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Text } from '../typography';
import { resolvedStyle } from './support/rendered-style';

function Subject({ size, nested }: { size?: 'xs' | 'lg'; nested?: boolean }) {
  const reveal = (
    <AgentLogReveal reduce>
      <Button testID="action">
        <Text>Reveal action</Text>
      </Button>
    </AgentLogReveal>
  );
  return (
    <BloomThemeProvider>
      {nested ? (
        <BloomScope size="xs">
          <BloomScope size="lg">{reveal}</BloomScope>
        </BloomScope>
      ) : size ? (
        <BloomScope size={size}>{reveal}</BloomScope>
      ) : (
        reveal
      )}
    </BloomThemeProvider>
  );
}

it('passes inherited control size through the animated reveal wrapper', () => {
  const screen = render(<Subject />);
  const height = () => resolvedStyle(screen.getByTestId('action').props.style).height;

  const defaultHeight = height();
  screen.rerender(<Subject size="xs" />);
  const xsHeight = height();
  expect(xsHeight).not.toBe(defaultHeight);
  screen.rerender(<Subject size="lg" />);
  const lgHeight = height();
  expect(lgHeight).not.toBe(xsHeight);
  screen.rerender(<Subject nested />);
  expect(height()).toBe(lgHeight);
});
