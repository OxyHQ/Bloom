import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { BloomScope } from '../appearance';
import type { BloomSize } from '../appearance';
import { Button } from '../button';
import { ContactProfileCard } from '../contact-card';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';

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
    <BloomThemeProvider mode="light" colorPreset="teal">
      <BloomScope size={scope}>
        {nestedScope ? <BloomScope size={nestedScope}>{card}</BloomScope> : card}
      </BloomScope>
    </BloomThemeProvider>
  );
}

it('keeps channel controls delegated to Button and preserves scope for caller actions', () => {
  const screen = render(<Subject />);
  const channel = () => screen.getByTestId('contact-channel-email');
  const action = () => screen.getByTestId('external-action');
  const height = (element: ReturnType<typeof channel>) => resolvedStyle(element.props.style).height;

  expect(height(channel())).toBe(32);
  expect(channel().props.hitSlop).toEqual({ top: 6, bottom: 6, left: 6, right: 6 });
  expect(height(action())).toBe(36);
  screen.rerender(<Subject scope="xs" />);
  expect(height(channel())).toBe(32);
  expect(height(action())).toBe(24);
  screen.rerender(<Subject scope="lg" />);
  expect(height(channel())).toBe(32);
  expect(height(action())).toBe(44);
  screen.rerender(<Subject scope="xs" nestedScope="lg" />);
  expect(height(action())).toBe(44);
  screen.rerender(<Subject scope="xs" explicitActionSize="md" />);
  expect(height(action())).toBe(36);
});
