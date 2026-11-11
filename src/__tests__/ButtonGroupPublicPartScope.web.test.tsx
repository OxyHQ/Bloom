/** @jest-environment jsdom */
import { act } from 'react';
import type { ComponentProps } from 'react';
import { createRoot } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { ButtonGroup, ButtonGroupItem } from '../button-group/ButtonGroup.web';
import { BloomScope } from '../appearance';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Text } from '../typography';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Subject({
  outerSize,
  groupSize,
  itemSize,
  nested,
}: {
  outerSize?: 'xs' | 'lg';
  groupSize?: 'xs' | 'md';
  itemSize?: 'xs';
  nested?: boolean;
}) {
  const group = (
    <ButtonGroup size={groupSize} accessibilityLabel="Actions">
      <ButtonGroupItem size={itemSize} testID="item">
        <Text>Select</Text>
      </ButtonGroupItem>
    </ButtonGroup>
  );
  return (
    <BloomThemeProvider fonts={false}>
      {nested ? (
        <BloomScope size="xs">
          <BloomScope size="lg">{group}</BloomScope>
        </BloomScope>
      ) : outerSize ? (
        <BloomScope size={outerSize}>{group}</BloomScope>
      ) : (
        group
      )}
    </BloomThemeProvider>
  );
}

it('resolves the public ButtonGroup and ButtonGroupItem size in the web DOM', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    const renderSubject = (props?: ComponentProps<typeof Subject>) =>
      act(() => root.render(<Subject {...props} />));
    const height = () => {
      const item = host.querySelector<HTMLButtonElement>('[data-testid="item"]');
      if (!item) throw new Error('ButtonGroupItem did not render');
      return item.style.height;
    };

    renderSubject();
    expect(height()).toBe('34px');
    renderSubject({ outerSize: 'xs' });
    expect(height()).toBe('24px');
    renderSubject({ outerSize: 'lg' });
    expect(height()).toBe('34px');
    renderSubject({ outerSize: 'xs', groupSize: 'md' });
    expect(height()).toBe('34px');
    renderSubject({ outerSize: 'lg', groupSize: 'xs' });
    expect(height()).toBe('24px');
    renderSubject({ outerSize: 'xs', groupSize: 'md', itemSize: 'xs' });
    expect(height()).toBe('24px');
    renderSubject({ nested: true });
    expect(height()).toBe('34px');
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
