import { render } from '@testing-library/react-native';
import { AgentLogGuideBridge } from '../agent-log';
import { BloomScope } from '../appearance';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';

function Subject({ size }: { size?: 'xs' | 'lg' }) {
  const bridge = <AgentLogGuideBridge height={6} offset={7} reduce />;
  return (
    <BloomThemeProvider>
      {size ? <BloomScope size={size}>{bridge}</BloomScope> : bridge}
    </BloomThemeProvider>
  );
}

it('keeps numeric tree-guide geometry independent of BloomScope', () => {
  const screen = render(<Subject />);
  const geometry = () =>
    resolvedStyle(
      screen.getByTestId('agent-log-guide-bridge', { includeHiddenElements: true }).props.style,
    );

  expect(geometry()).toMatchObject({ width: 1, height: 6, top: -6, left: 7 });
  screen.rerender(<Subject size="xs" />);
  expect(geometry()).toMatchObject({ width: 1, height: 6, top: -6, left: 7 });
  screen.rerender(<Subject size="lg" />);
  expect(geometry()).toMatchObject({ width: 1, height: 6, top: -6, left: 7 });
});
