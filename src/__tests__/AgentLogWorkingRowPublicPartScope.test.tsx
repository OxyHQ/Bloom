import { render } from '@testing-library/react-native';
import { AgentLogWorkingRow } from '../agent-log';
import { BloomScope } from '../appearance';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';

function Subject({ size }: { size?: 'xs' | 'lg' }) {
  const row = <AgentLogWorkingRow label="Working" reduce testID="working-row" />;
  return (
    <BloomThemeProvider>
      {size ? <BloomScope size={size}>{row}</BloomScope> : row}
    </BloomThemeProvider>
  );
}

it('keeps the working indicator geometry and label recipe stable across control scopes', () => {
  const screen = render(<Subject />);
  const style = (testID: string) =>
    resolvedStyle(screen.getByTestId(testID, { includeHiddenElements: true }).props.style);
  const labelFontSize = () => resolvedStyle(screen.getByText('Working').props.style).fontSize;
  const assertRecipe = () => {
    expect(style('agent-thinking-stars')).toMatchObject({ width: 21, height: 21 });
    expect(labelFontSize()).toBe(14);
  };

  assertRecipe();
  screen.rerender(<Subject size="xs" />);
  assertRecipe();
  screen.rerender(<Subject size="lg" />);
  assertRecipe();
});
