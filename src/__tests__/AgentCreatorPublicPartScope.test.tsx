import { render } from '@testing-library/react-native';
import { AgentCreatorField, AgentCreatorSection } from '../agent-creator';
import { BloomScope } from '../appearance';
import { Button } from '../button';
import { Portal, PortalOutlet, PortalProvider } from '../portal/Portal';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';

function Subject({ scope }: { scope?: 'sm' | 'md' }) {
  return (
    <BloomThemeProvider>
      <PortalProvider>
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
        <PortalOutlet />
      </PortalProvider>
    </BloomThemeProvider>
  );
}

it('preserves default, inherited, nested and explicit child size through public creator parts and a portal', () => {
  const screen = render(<Subject />);
  const assertHeights = (inherited: number) => {
    expect(resolvedStyle(screen.getByTestId('field-child').props.style).height).toBe(inherited);
    expect(resolvedStyle(screen.getByTestId('section-child').props.style).height).toBe(inherited);
    expect(resolvedStyle(screen.getByTestId('portalled-child').props.style).height).toBe(inherited);
    expect(resolvedStyle(screen.getByTestId('nested-child').props.style).height).toBe(44);
    expect(resolvedStyle(screen.getByTestId('explicit-child').props.style).height).toBe(36);
  };

  assertHeights(36);
  screen.rerender(<Subject scope="sm" />);
  assertHeights(32);
});
