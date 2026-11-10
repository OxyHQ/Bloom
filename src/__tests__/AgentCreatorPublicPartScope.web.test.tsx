/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { AgentCreatorField, AgentCreatorSection } from '../agent-creator';
import { BloomScope } from '../appearance';
import { Button } from '../button';
import { Portal } from '../portal/Portal.web';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function hostNode(testID: string): Element {
  const node = document.body.querySelector(`[data-testid="${testID}"]`);
  if (!node) throw new Error(`Missing test host ${testID}`);
  return node;
}

function Subject({ scope }: { scope?: 'sm' | 'md' }) {
  return (
    <BloomThemeProvider fonts={false}>
      <BloomScope size={scope}>
        <AgentCreatorField label="Name" divider={false}>
          <Button testID="field-child" accessibilityLabel="Field child" />
        </AgentCreatorField>
        <AgentCreatorSection title="Details">
          <Button testID="section-child" accessibilityLabel="Section child" />
          <BloomScope size="lg">
            <Button testID="nested-child" accessibilityLabel="Nested child" />
          </BloomScope>
          <Portal>
            <Button testID="portalled-child" accessibilityLabel="Portalled child" />
            <Button testID="explicit-child" accessibilityLabel="Explicit child" size="md" />
          </Portal>
        </AgentCreatorSection>
      </BloomScope>
    </BloomThemeProvider>
  );
}

it('preserves default, inherited, nested and explicit child size through public creator parts and a body portal', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    const assertHeights = (inherited: string) => {
      expect(getComputedStyle(hostNode('field-child')).height).toBe(inherited);
      expect(getComputedStyle(hostNode('section-child')).height).toBe(inherited);
      expect(getComputedStyle(hostNode('portalled-child')).height).toBe(inherited);
      expect(getComputedStyle(hostNode('nested-child')).height).toBe('44px');
      expect(getComputedStyle(hostNode('explicit-child')).height).toBe('36px');
    };
    act(() => root.render(<Subject />));
    assertHeights('36px');
    act(() => root.render(<Subject scope="sm" />));
    assertHeights('32px');
  } finally {
    act(() => root.unmount());
    host.remove();
    document.getElementById('bloom-portal-root')?.remove();
  }
});
