import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { UsageCard } from '../usage-card';
import { cardLayout } from './support/card-surface';
import { pressHost } from './support/press-host';

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
