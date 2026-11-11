/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Text } from 'react-native';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { BloomScope } from '../appearance';
import type { BloomSize } from '../appearance';
import { Button } from '../button/Button.web';
import { ContactProfileCard } from '../contact-card';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Subject({
  scope,
  nestedScope,
  explicitActionSize,
}: {
  scope?: BloomSize;
  nestedScope?: BloomSize;
  explicitActionSize?: BloomSize;
}) {
  const card = (
    <ContactProfileCard
      name="Ada Lovelace"
      density="compact"
      channels={[{ kind: 'email', onPress: () => undefined }]}
      actions={
        <Button testID="external-action" size={explicitActionSize}>
          <Text>Assign</Text>
        </Button>
      }
      testID="contact"
    />
  );
  return (
    <BloomThemeProvider fonts={false} mode="light" colorPreset="teal">
      <BloomScope size={scope}>
        {nestedScope ? <BloomScope size={nestedScope}>{card}</BloomScope> : card}
      </BloomScope>
    </BloomThemeProvider>
  );
}

it('keeps channel controls delegated to Button and preserves scope for caller actions', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root: Root = createRoot(host);
  const renderSubject = (props?: {
    scope?: BloomSize;
    nestedScope?: BloomSize;
    explicitActionSize?: BloomSize;
  }) => act(() => root.render(<Subject {...props} />));
  const node = (id: string) => host.querySelector<HTMLElement>(`[data-testid="${id}"]`);
  const height = (id: string) => {
    const element = node(id);
    if (!element) throw new Error(`ContactProfileCard did not render ${id}`);
    return element.style.height;
  };
  try {
    renderSubject();
    expect(height('contact-channel-email')).toBe('32px');
    expect(height('external-action')).toBe('36px');
    expect(node('contact-channel-email')?.getAttribute('aria-label')).toBe('Email Ada Lovelace');

    renderSubject({ scope: 'xs' });
    expect(height('contact-channel-email')).toBe('32px');
    expect(height('external-action')).toBe('24px');
    renderSubject({ scope: 'lg' });
    expect(height('contact-channel-email')).toBe('32px');
    expect(height('external-action')).toBe('44px');
    renderSubject({ scope: 'xs', nestedScope: 'lg' });
    expect(height('external-action')).toBe('44px');
    renderSubject({ scope: 'xs', explicitActionSize: 'md' });
    expect(height('external-action')).toBe('36px');
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
