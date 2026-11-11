/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { Text } from 'react-native';
import { BloomScope } from '../appearance';
import type { BloomSize } from '../appearance';
import { Button } from '../button/Button.web';
import { EmptyState } from '../empty-state';
import type { EmptyStateVariant } from '../empty-state';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

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
    <BloomThemeProvider fonts={false} mode="light" colorPreset="teal">
      <BloomScope size={scope}>
        {nestedScope ? <BloomScope size={nestedScope}>{emptyState}</BloomScope> : emptyState}
      </BloomScope>
    </BloomThemeProvider>
  );
}

it('keeps variant-owned actions fixed and caller content scoped in DOM web', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root: Root = createRoot(host);
  const renderSubject = (props?: {
    scope?: BloomSize;
    nestedScope?: BloomSize;
    variant?: EmptyStateVariant;
    callerSize?: BloomSize;
  }) => act(() => root.render(<Subject {...props} />));
  const height = (id: string) => {
    const element = host.querySelector<HTMLElement>(`[data-testid="${id}"]`);
    if (!element) throw new Error(`EmptyState did not render ${id}`);
    return getComputedStyle(element).height;
  };
  try {
    renderSubject();
    expect(height('built-in-action')).toBe('36px');
    expect(height('empty-suggestion-hint')).toBe('24px');
    expect(height('caller-action')).toBe('36px');
    renderSubject({ scope: 'xs' });
    expect(height('built-in-action')).toBe('36px');
    expect(height('empty-suggestion-hint')).toBe('24px');
    expect(height('caller-action')).toBe('24px');
    renderSubject({ scope: 'lg' });
    expect(height('built-in-action')).toBe('36px');
    expect(height('empty-suggestion-hint')).toBe('24px');
    expect(height('caller-action')).toBe('44px');
    renderSubject({ scope: 'xs', nestedScope: 'lg' });
    expect(height('built-in-action')).toBe('36px');
    expect(height('empty-suggestion-hint')).toBe('24px');
    expect(height('caller-action')).toBe('44px');
    renderSubject({ scope: 'xs', callerSize: 'md' });
    expect(height('built-in-action')).toBe('36px');
    expect(height('empty-suggestion-hint')).toBe('24px');
    expect(height('caller-action')).toBe('36px');
    renderSubject({ variant: 'compact' });
    expect(height('built-in-action')).toBe('32px');
    expect(height('empty-suggestion-hint')).toBe('24px');
    expect(height('caller-action')).toBe('36px');
    renderSubject({ variant: 'compact', scope: 'lg' });
    expect(height('built-in-action')).toBe('32px');
    expect(height('empty-suggestion-hint')).toBe('24px');
    expect(height('caller-action')).toBe('44px');
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
