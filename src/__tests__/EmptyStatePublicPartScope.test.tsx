import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { BloomScope } from '../appearance';
import type { BloomSize } from '../appearance';
import { Button } from '../button';
import { EmptyState } from '../empty-state';
import type { EmptyStateVariant } from '../empty-state';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';

function Subject({
  scope,
  nestedScope,
  variant = 'comfortable',
  callerSize,
}: {
  scope?: BloomSize;
  nestedScope?: BloomSize;
  variant?: EmptyStateVariant;
  callerSize?: BloomSize;
}) {
  const emptyState = (
    <EmptyState
      title="Nothing here"
      variant={variant}
      action={{ label: 'Retry', testID: 'built-in-action' }}
      suggestions={[{ id: 'hint', label: 'More tips', onPress: () => undefined }]}
      testID="empty"
    >
      <Button testID="caller-action" size={callerSize}>
        <Text>Configure</Text>
      </Button>
    </EmptyState>
  );
  return (
    <BloomThemeProvider mode="light" colorPreset="teal">
      <BloomScope size={scope}>
        {nestedScope ? <BloomScope size={nestedScope}>{emptyState}</BloomScope> : emptyState}
      </BloomScope>
    </BloomThemeProvider>
  );
}

it('keeps variant-owned actions fixed and caller content scoped', () => {
  const screen = render(<Subject />);
  const height = (id: string) => resolvedStyle(screen.getByTestId(id).props.style).height;
  const internalPillHeight = () => height('empty-suggestion-hint');

  expect(height('built-in-action')).toBe(36);
  expect(internalPillHeight()).toBe(24);
  expect(height('caller-action')).toBe(36);
  screen.rerender(<Subject scope="xs" />);
  expect(height('built-in-action')).toBe(36);
  expect(internalPillHeight()).toBe(24);
  expect(height('caller-action')).toBe(24);
  screen.rerender(<Subject scope="lg" />);
  expect(height('built-in-action')).toBe(36);
  expect(internalPillHeight()).toBe(24);
  expect(height('caller-action')).toBe(44);
  screen.rerender(<Subject scope="xs" nestedScope="lg" />);
  expect(height('built-in-action')).toBe(36);
  expect(internalPillHeight()).toBe(24);
  expect(height('caller-action')).toBe(44);
  screen.rerender(<Subject scope="xs" callerSize="md" />);
  expect(height('built-in-action')).toBe(36);
  expect(internalPillHeight()).toBe(24);
  expect(height('caller-action')).toBe(36);
  screen.rerender(<Subject variant="compact" />);
  expect(height('built-in-action')).toBe(32);
  expect(internalPillHeight()).toBe(24);
  expect(height('caller-action')).toBe(36);
  screen.rerender(<Subject variant="compact" scope="lg" />);
  expect(height('built-in-action')).toBe(32);
  expect(internalPillHeight()).toBe(24);
  expect(height('caller-action')).toBe(44);
});
