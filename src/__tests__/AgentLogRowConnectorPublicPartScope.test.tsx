import { render } from '@testing-library/react-native';
import { AgentLogRowConnector } from '../agent-log';
import { BloomScope } from '../appearance';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';

function Subject({ size }: { size?: 'xs' | 'lg' }) {
  const connector = <AgentLogRowConnector first last={false} reduce />;
  return (
    <BloomThemeProvider>
      {size ? <BloomScope size={size}>{connector}</BloomScope> : connector}
    </BloomThemeProvider>
  );
}

it('keeps structural connector geometry fixed across control scopes', () => {
  const screen = render(<Subject />);
  const style = (testID: string) =>
    resolvedStyle(screen.getByTestId(testID, { includeHiddenElements: true }).props.style);
  const assertGeometry = () => {
    expect(style('agent-log-row-connector')).toMatchObject({
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      width: 12,
    });
    expect(style('agent-log-row-trunk')).toMatchObject({
      position: 'absolute',
      left: 0,
      width: 1,
      top: 8,
      bottom: 0,
    });
  };

  assertGeometry();
  screen.rerender(<Subject size="xs" />);
  assertGeometry();
  screen.rerender(<Subject size="lg" />);
  assertGeometry();
});
