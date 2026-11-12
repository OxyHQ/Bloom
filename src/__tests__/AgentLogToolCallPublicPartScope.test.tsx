import { render } from '@testing-library/react-native';
import { AgentLogToolCall } from '../agent-log';
import { BloomScope } from '../appearance';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';
import type { ReactTestInstance } from 'react-test-renderer';

function Subject({ size }: { size?: 'xs' | 'lg' }) {
  const call = <AgentLogToolCall name="search" label="Searching" status="done" testID="call" />;
  return (
    <BloomThemeProvider>
      {size ? <BloomScope size={size}>{call}</BloomScope> : call}
    </BloomThemeProvider>
  );
}

it('keeps tool call typography and row spacing fixed across control scopes', () => {
  const screen = render(<Subject />);
  const title = () => resolvedStyle(screen.getByText('Searching').props.style);
  const row = () => screen.getByTestId('call-row', { includeHiddenElements: true });
  const recipe = () => {
    expect(title().fontSize).toBe(14);
    const content = row().children.find(
      (child): child is ReactTestInstance => typeof child !== 'string',
    );
    if (!content) throw new Error('AgentLogToolCall did not render row content');
    expect(resolvedStyle(content.props.style)).toMatchObject({
      gap: 6,
      paddingVertical: 4,
    });
  };
  recipe();
  screen.rerender(<Subject size="xs" />);
  recipe();
  screen.rerender(<Subject size="lg" />);
  recipe();
});
