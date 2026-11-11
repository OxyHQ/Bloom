/** @jest-environment jsdom */
import { act } from 'react';
import type { ComponentProps } from 'react';
import { createRoot } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { ButtonGroup, ButtonGroupItem } from '../button-group/ButtonGroup.web';
import { BloomScope } from '../appearance';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Text } from '../typography';
import { Portal } from '../portal/Portal.web';

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
  const makeGroup = (id: string, size?: 'xs' | 'md', item?: 'xs') => (
    <ButtonGroup size={size} accessibilityLabel="Actions">
      <ButtonGroupItem size={item} testID={id}>
        <Text>Select</Text>
      </ButtonGroupItem>
    </ButtonGroup>
  );
  const group = makeGroup('item', groupSize, itemSize);
  const portalGroup = makeGroup('portalled-item');
  return (
    <BloomThemeProvider fonts={false}>
      {nested ? (
        <BloomScope size="xs">
          <BloomScope size="lg">
            {group}
            <Portal>{portalGroup}</Portal>
          </BloomScope>
        </BloomScope>
      ) : outerSize ? (
        <BloomScope size={outerSize}>
          {group}
          <Portal>{portalGroup}</Portal>
        </BloomScope>
      ) : (
        <>
          {group}
          <Portal>{portalGroup}</Portal>
        </>
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
    const height = (id: string) => {
      const item = document.body.querySelector<HTMLButtonElement>(`[data-testid="${id}"]`);
      if (!item) throw new Error(`ButtonGroupItem ${id} did not render`);
      return item.style.height;
    };

    renderSubject();
    expect(height('item')).toBe('34px');
    expect(height('portalled-item')).toBe('34px');
    renderSubject({ outerSize: 'xs' });
    expect(height('item')).toBe('24px');
    expect(height('portalled-item')).toBe('24px');
    renderSubject({ outerSize: 'lg' });
    expect(height('item')).toBe('34px');
    expect(height('portalled-item')).toBe('34px');
    renderSubject({ outerSize: 'xs', groupSize: 'md' });
    expect(height('item')).toBe('34px');
    expect(height('portalled-item')).toBe('24px');
    renderSubject({ outerSize: 'lg', groupSize: 'xs' });
    expect(height('item')).toBe('24px');
    expect(height('portalled-item')).toBe('34px');
    renderSubject({ outerSize: 'xs', groupSize: 'md', itemSize: 'xs' });
    expect(height('item')).toBe('24px');
    expect(height('portalled-item')).toBe('24px');
    renderSubject({ nested: true });
    expect(height('item')).toBe('34px');
    expect(height('portalled-item')).toBe('34px');
  } finally {
    act(() => root.unmount());
    host.remove();
    document.getElementById('bloom-portal-root')?.remove();
  }
});
