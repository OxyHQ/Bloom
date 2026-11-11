import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { BloomScope } from '../appearance';
import type { BloomSize } from '../appearance';
import { Button } from '../button';
import { Divider } from '../divider';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';

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
    <BloomThemeProvider mode="light" colorPreset="teal">
      <BloomScope size={scope}>
        {nestedScope ? <BloomScope size={nestedScope}>{content}</BloomScope> : content}
      </BloomScope>
    </BloomThemeProvider>
  );
}

it('keeps divider weight independent and preserves the caller action scope', () => {
  const screen = render(<Subject />);
  const dividerHeight = () => resolvedStyle(screen.getByTestId('rule').props.style).height;
  const actionHeight = () => resolvedStyle(screen.getByTestId('caller-action').props.style).height;

  expect(dividerHeight()).toBe(2);
  expect(actionHeight()).toBe(36);
  screen.rerender(<Subject scope="xs" />);
  expect(dividerHeight()).toBe(2);
  expect(actionHeight()).toBe(24);
  screen.rerender(<Subject scope="lg" />);
  expect(dividerHeight()).toBe(2);
  expect(actionHeight()).toBe(44);
  screen.rerender(<Subject scope="xs" nestedScope="lg" />);
  expect(dividerHeight()).toBe(2);
  expect(actionHeight()).toBe(44);
  screen.rerender(<Subject scope="xs" actionSize="md" />);
  expect(dividerHeight()).toBe(2);
  expect(actionHeight()).toBe(36);
});
