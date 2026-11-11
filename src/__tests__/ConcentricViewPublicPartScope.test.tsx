import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Button } from '../button';
import { ConcentricView } from '../concentric';
import { BloomScope } from '../appearance';
import type { BloomSize } from '../appearance';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';

type SubjectProps = {
  scope?: BloomSize;
  nestedScope?: BloomSize;
  explicitSize?: BloomSize;
};

function Subject({ scope, nestedScope, explicitSize }: SubjectProps) {
  const control = (
    <Button testID="action" size={explicitSize}>
      <Text>Action</Text>
    </Button>
  );
  return (
    <BloomThemeProvider mode="light" colorPreset="teal">
      <BloomScope size={scope}>
        <ConcentricView radius={32} style={{ padding: 8 }} testID="outer">
          <ConcentricView style={{ padding: 4 }} testID="inner">
            {nestedScope ? <BloomScope size={nestedScope}>{control}</BloomScope> : control}
          </ConcentricView>
        </ConcentricView>
      </BloomScope>
    </BloomThemeProvider>
  );
}

it('keeps corner geometry independent while nested wrappers preserve control-size scope', () => {
  const screen = render(<Subject />);
  const height = () => resolvedStyle(screen.getByTestId('action').props.style).height;

  expect(resolvedStyle(screen.getByTestId('outer').props.style).borderTopLeftRadius).toBe(32);
  expect(height()).toBe(36);

  screen.rerender(<Subject scope="xs" />);
  expect(height()).toBe(24);
  screen.rerender(<Subject scope="lg" />);
  expect(height()).toBe(44);
  screen.rerender(<Subject scope="xs" nestedScope="lg" />);
  expect(height()).toBe(44);
  screen.rerender(<Subject scope="xs" explicitSize="md" />);
  expect(height()).toBe(36);
});
