import { render } from '@testing-library/react-native';
import { AgentProgress, AgentProgressLoadingText, AgentProgressPlan } from '../agent-progress';
import { BloomScope } from '../appearance';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';

function Subject({ size }: { size?: 'xs' | 'lg' }) {
  const parts = (
    <>
      <AgentProgress steps={['One']} defaultMinimized paused testID="progress" />
      <AgentProgressPlan title="Plan" steps={['One']} testID="plan" />
      {/* biome-ignore lint/correctness/noReactNativeRawText: The component requires a plain string for its shimmer. */}
      <AgentProgressLoadingText testID="loading">Working</AgentProgressLoadingText>
    </>
  );
  return (
    <BloomThemeProvider>
      {size ? <BloomScope size={size}>{parts}</BloomScope> : parts}
    </BloomThemeProvider>
  );
}

it('keeps progress cards and loading typography independent from control scope', () => {
  const screen = render(<Subject />);
  const recipe = () => {
    expect(resolvedStyle(screen.getByTestId('progress').props.style).width).toBe(341);
    expect(resolvedStyle(screen.getByTestId('plan').props.style).width).toBe(341);
    expect(resolvedStyle(screen.getByTestId('plan-approve').props.style).height).toBe(32);
    expect(resolvedStyle(screen.getByTestId('loading').props.style).fontSize).toBe(14);
  };
  recipe();
  screen.rerender(<Subject size="xs" />);
  recipe();
  screen.rerender(<Subject size="lg" />);
  recipe();
});
