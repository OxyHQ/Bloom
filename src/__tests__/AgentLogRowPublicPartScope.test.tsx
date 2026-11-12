import { render } from '@testing-library/react-native';
import { AgentLogRow } from '../agent-log';
import { BloomScope } from '../appearance';
import { Button } from '../button';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Text } from '../typography';
import { resolvedStyle } from './support/rendered-style';
import type { ReactTestInstance } from 'react-test-renderer';

function Subject({ size, nested }: { size?: 'xs' | 'lg'; nested?: boolean }) {
  const row = (
    <AgentLogRow first last reduce testID="row">
      <Button testID="action">
        <Text>Row action</Text>
      </Button>
    </AgentLogRow>
  );
  return (
    <BloomThemeProvider>
      {nested ? (
        <BloomScope size="xs">
          <BloomScope size="lg">{row}</BloomScope>
        </BloomScope>
      ) : size ? (
        <BloomScope size={size}>{row}</BloomScope>
      ) : (
        row
      )}
    </BloomThemeProvider>
  );
}

it('passes scope to caller controls while preserving the row guide inset', () => {
  const screen = render(<Subject />);
  const actionHeight = () => resolvedStyle(screen.getByTestId('action').props.style).height;
  const row = () => screen.getByTestId('row', { includeHiddenElements: true });
  const inset = () =>
    resolvedStyle((row().children[0] as ReactTestInstance).props.style).paddingLeft;

  const defaultHeight = actionHeight();
  expect(inset()).toBe(16);
  screen.rerender(<Subject size="xs" />);
  const xsHeight = actionHeight();
  expect(xsHeight).not.toBe(defaultHeight);
  expect(inset()).toBe(16);
  screen.rerender(<Subject size="lg" />);
  const lgHeight = actionHeight();
  expect(lgHeight).not.toBe(xsHeight);
  expect(inset()).toBe(16);
  screen.rerender(<Subject nested />);
  expect(actionHeight()).toBe(lgHeight);
  expect(inset()).toBe(16);
});
