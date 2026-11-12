import { render } from '@testing-library/react-native';
import { BloomScope } from '../appearance';
import { Button } from '../button';
import { ComposerLoader } from '../composer-loader';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Text } from '../typography';
import { resolvedStyle } from './support/rendered-style';

const sizes = [
  [undefined, 36],
  ['xs', 24],
  ['sm', 32],
  ['md', 36],
  ['lg', 44],
] as const;

it.each(sizes)('ComposerLoader preserves its child control scope at %s', (size, height) => {
  const child = (
    <ComposerLoader surface={false} testID="loader">
      <Button testID="loader-action">
        <Text>Send</Text>
      </Button>
    </ComposerLoader>
  );
  const tree = render(
    <BloomThemeProvider fonts={false}>
      {size ? <BloomScope size={size}>{child}</BloomScope> : child}
    </BloomThemeProvider>,
  );
  expect(resolvedStyle(tree.getByTestId('loader-action').props.style).height).toBe(height);
});

it('ComposerLoader preserves nested child scope through a wrapper', () => {
  const tree = render(
    <BloomThemeProvider fonts={false}>
      <BloomScope size="xs">
        <ComposerLoader surface={false} testID="loader">
          <BloomScope size="lg">
            <Button testID="loader-action">
              <Text>Send</Text>
            </Button>
          </BloomScope>
        </ComposerLoader>
      </BloomScope>
    </BloomThemeProvider>,
  );
  expect(resolvedStyle(tree.getByTestId('loader-action').props.style).height).toBe(44);
});
