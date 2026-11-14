import type React from 'react';
import { render } from '@testing-library/react-native';
import { BloomScope } from '../appearance';
import { Loading } from '../loading';
import { SpinnerIcon } from '../loading/SpinnerIcon';
import { StatusRing } from '../loading/StatusRing';
import { Text } from 'react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

function mount(ui: React.ReactElement) {
  return render(<BloomThemeProvider mode="light">{ui}</BloomThemeProvider>);
}

it('Loading defaults to md, inherits the nearest scope and explicit size wins', () => {
  const defaultView = mount(<Loading />);
  expect(defaultView.UNSAFE_getByType(SpinnerIcon).props.size).toBe(24);
  defaultView.unmount();
  for (const [scope, expected] of [
    ['xs', 16],
    ['sm', 20],
    ['md', 24],
    ['lg', 44],
  ] as const) {
    const view = mount(
      <BloomScope size={scope}>
        <Loading />
      </BloomScope>,
    );
    expect(view.UNSAFE_getByType(SpinnerIcon).props.size).toBe(expected);
    view.unmount();
  }
  const view = mount(
    <BloomScope size="xs">
      <Loading size="lg" />
    </BloomScope>,
  );
  expect(view.UNSAFE_getByType(SpinnerIcon).props.size).toBe(44);
});

it('numeric spinner art size and StatusRing geometry ignore BloomScope', () => {
  const view = mount(
    <BloomScope size="lg">
      <SpinnerIcon size={31} />
      <StatusRing state="idle" accessibilityLabel="Ready" size={52} testID="ring">
        <Text>Logo</Text>
      </StatusRing>
    </BloomScope>,
  );
  expect(view.UNSAFE_getByType(SpinnerIcon).props.size).toBe(31);
  expect(view.getByTestId('ring').props.style).toEqual(
    expect.arrayContaining([expect.objectContaining({ width: 52, height: 52 })]),
  );
});
