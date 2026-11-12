import { render } from '@testing-library/react-native';
import { BloomScope } from '../appearance';
import { Button } from '../button';
import { CallMinimisedPill, CallScreen } from '../call-ui';
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

it.each(sizes)('CallScreen delegates caller slots at %s scope', (size, height) => {
  const screen = (
    <CallScreen
      name="Ana"
      status="active"
      topBarSlot={
        <Button testID="top-action">
          <Text>Top</Text>
        </Button>
      }
      controlsSlot={
        <Button testID="controls-action">
          <Text>Custom controls</Text>
        </Button>
      }
    />
  );
  const tree = render(
    <BloomThemeProvider fonts={false}>
      {size ? <BloomScope size={size}>{screen}</BloomScope> : screen}
    </BloomThemeProvider>,
  );
  for (const id of ['top-action', 'controls-action']) {
    expect(resolvedStyle(tree.getByTestId(id).props.style).height).toBe(height);
  }
});

it.each(sizes)('CallMinimisedPill keeps its shell independent of %s scope', (size) => {
  const pill = (
    <CallMinimisedPill
      name="Ana"
      duration="01:02"
      onExpand={() => {}}
      onMutedChange={() => {}}
      onEndCall={() => {}}
      testID="pill"
    />
  );
  const tree = render(
    <BloomThemeProvider fonts={false}>
      {size ? <BloomScope size={size}>{pill}</BloomScope> : pill}
    </BloomThemeProvider>,
  );
  expect(resolvedStyle(tree.getByTestId('pill-expand').props.style).minHeight).toBe(48);
});
