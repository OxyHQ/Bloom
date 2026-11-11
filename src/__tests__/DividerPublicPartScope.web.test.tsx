/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Text } from 'react-native';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { BloomScope } from '../appearance';
import type { BloomSize } from '../appearance';
import { Button } from '../button/Button.web';
import { Divider } from '../divider';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Subject({
  scope,
  nestedScope,
  actionSize,
}: {
  scope?: BloomSize;
  nestedScope?: BloomSize;
  actionSize?: BloomSize;
}) {
  const content = (
    <>
      <Divider testID="rule" thickness={2} />
      <Divider testID="with-action">
        <Button testID="caller-action" size={actionSize}>
          <Text>Continue</Text>
        </Button>
      </Divider>
    </>
  );
  return (
    <BloomThemeProvider fonts={false} mode="light" colorPreset="teal">
      <BloomScope size={scope}>
        {nestedScope ? <BloomScope size={nestedScope}>{content}</BloomScope> : content}
      </BloomScope>
    </BloomThemeProvider>
  );
}

it('keeps divider weight independent and preserves the caller action scope in DOM web', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root: Root = createRoot(host);
  const renderSubject = (props?: {
    scope?: BloomSize;
    nestedScope?: BloomSize;
    actionSize?: BloomSize;
  }) => act(() => root.render(<Subject {...props} />));
  const height = (testID: string) => {
    const element = host.querySelector<HTMLElement>(`[data-testid="${testID}"]`);
    if (!element) throw new Error(`Divider fixture did not render ${testID}`);
    return getComputedStyle(element).height;
  };
  try {
    renderSubject();
    expect(height('rule')).toBe('2px');
    expect(height('caller-action')).toBe('36px');
    renderSubject({ scope: 'xs' });
    expect(height('rule')).toBe('2px');
    expect(height('caller-action')).toBe('24px');
    renderSubject({ scope: 'lg' });
    expect(height('rule')).toBe('2px');
    expect(height('caller-action')).toBe('44px');
    renderSubject({ scope: 'xs', nestedScope: 'lg' });
    expect(height('rule')).toBe('2px');
    expect(height('caller-action')).toBe('44px');
    renderSubject({ scope: 'xs', actionSize: 'md' });
    expect(height('rule')).toBe('2px');
    expect(height('caller-action')).toBe('36px');
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
