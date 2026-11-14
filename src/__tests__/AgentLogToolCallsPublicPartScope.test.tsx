import { render } from '@testing-library/react-native';
import { AgentLogToolCalls } from '../agent-log';
import { BloomScope } from '../appearance';
import { Button } from '../button';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Text } from '../typography';
import { resolvedStyle } from './support/rendered-style';

function Subject({ size }: { size?: 'xs' | 'lg' }) {
  const list = (
    <AgentLogToolCalls reduce testID="calls" accessibilityLabel="Tool calls">
      <Button testID="action">
        <Text>Open result</Text>
      </Button>
    </AgentLogToolCalls>
  );
  return (
    <BloomThemeProvider>
      {size ? <BloomScope size={size}>{list}</BloomScope> : list}
    </BloomThemeProvider>
  );
}

it('delegates caller control scope through its guide rows', () => {
  const screen = render(<Subject />);
  const height = () => resolvedStyle(screen.getByTestId('action').props.style).height;
  expect(
    screen.getByTestId('calls', { includeHiddenElements: true }).props.accessibilityLabel,
  ).toBe('Tool calls');
  const md = height();
  screen.rerender(<Subject size="xs" />);
  const xs = height();
  expect(xs).not.toBe(md);
  screen.rerender(<Subject size="lg" />);
  expect(height()).not.toBe(xs);
});
