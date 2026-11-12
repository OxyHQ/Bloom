import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { UsageCard } from '../usage-card';
import { AgentLimitsCard } from '../agent-limits-card';
import { BloomScope } from '../appearance';
import { cardLayout } from './support/card-surface';
import { pressHost } from './support/press-host';
import { resolvedStyle } from './support/rendered-style';

function UsageScopeSubject({ size }: { size?: 'xs' | 'lg' }) {
  const cards = (
    <>
      <UsageCard
        testID="usage"
        title="Usage"
        usage={{ max: 100, segments: [{ label: 'Used', value: 25 }] }}
      />
      <AgentLimitsCard
        testID="limits"
        context={{ max: 100, segments: [{ label: 'Used', tokens: 25 }] }}
      />
    </>
  );
  return (
    <BloomThemeProvider mode="light">
      {size ? <BloomScope size={size}>{cards}</BloomScope> : cards}
    </BloomThemeProvider>
  );
}

it('renders neutral values, expands a used/free breakdown, and hosts actions', () => {
  const screen = render(
    <BloomThemeProvider>
      <UsageCard
        title="Storage"
        testID="storage"
        usage={{ max: 100, segments: [{ label: 'Used', value: 25 }] }}
        formatValue={(value) => `${value} GB`}
        footer={<Text>Manage storage</Text>}
      />
    </BloomThemeProvider>,
  );
  expect(cardLayout(screen.getByTestId('storage')).borderRadius).toBe(28);
  expect(screen.getByLabelText('Storage, 25 GB / 100 GB (25%)')).toBeTruthy();
  expect(screen.getByText('Manage storage')).toBeTruthy();
  expect(screen.queryByText('Free space')).toBeNull();
  pressHost(screen.getByTestId('storage-context-toggle'));
  expect(screen.getByText('Used')).toBeTruthy();
  expect(screen.getByText('Free space')).toBeTruthy();
  expect(screen.getByText('75 GB')).toBeTruthy();
});

it('keeps unavailable usage honest with a heading, fallback, and actions but no meter', () => {
  const screen = render(
    <BloomThemeProvider>
      <UsageCard
        title="Storage"
        radius="radius-16"
        testID="storage"
        fallback={<Text>Unavailable</Text>}
        footer={<Text>Retry</Text>}
      />
    </BloomThemeProvider>,
  );
  expect(cardLayout(screen.getByTestId('storage')).borderRadius).toBe(16);
  expect(screen.getByText('Storage')).toBeTruthy();
  expect(screen.getByText('Unavailable')).toBeTruthy();
  expect(screen.getByText('Retry')).toBeTruthy();
  expect(screen.queryByRole('progressbar')).toBeNull();
  expect(screen.queryByRole('button')).toBeNull();
});

it('uses neutral default copy and omits deferred values from totals', () => {
  const screen = render(
    <BloomThemeProvider>
      <UsageCard
        usage={{
          max: 100,
          segments: [
            { label: 'Used', value: 25 },
            { label: 'Pending', value: 50, deferred: true },
          ],
        }}
      />
    </BloomThemeProvider>,
  );
  expect(screen.getByLabelText('Usage, 25 / 100 (25%)')).toBeTruthy();
});

it('keeps UsageCard and its deprecated AgentLimitsCard adapter geometry fixed under BloomScope', () => {
  const screen = render(<UsageScopeSubject />);
  const geometry = () => {
    const usage = screen.getByTestId('usage');
    const limits = screen.getByTestId('limits');
    const bars = [
      screen.getByTestId('usage-context-bar'),
      screen.getByTestId('limits-context-bar'),
    ];
    return {
      usageCard: cardLayout(usage),
      limitsCard: cardLayout(limits),
      bars: bars.map((bar) => resolvedStyle(bar.props.style).height),
      usageTitle: resolvedStyle(screen.getByText('Usage').props.style),
    };
  };
  const initial = geometry();
  expect(initial.usageCard.borderRadius).toBe(28);
  expect(initial.limitsCard.borderRadius).toBe(16);
  expect(initial.bars).toEqual([6, 6]);
  expect(initial.usageTitle.fontSize).toBe(14);
  screen.rerender(<UsageScopeSubject size="xs" />);
  expect(geometry()).toEqual(initial);
  screen.rerender(<UsageScopeSubject size="lg" />);
  expect(geometry()).toEqual(initial);
});
