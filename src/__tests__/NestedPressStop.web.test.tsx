/** @jest-environment jsdom */
/**
 * An embedded control on WEB, against the DOM react-native-web produces: a
 * `Chip` or `CloseButton` hands its press handler the real click event, and
 * with `stopPropagation` the click does not reach the card it sits in.
 *
 * Measured while writing this: react-native-web's press responder already
 * stops a click at the first pressable ancestor, flag or no flag, so the flag
 * is not what isolates a react-native-web `Pressable` here. What the chip
 * lacked was the EVENT: its `onPress` was called with nothing, so a caller
 * could neither stop nor inspect it. The flag is `Button`'s, for parity, and
 * calls `stopPropagation()` on whatever event the platform delivered.
 */
import type React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { CloseButton } from '../button/CloseButton';
import { Chip } from '../chip';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function mount(ui: React.ReactElement, parent: () => void) {
  act(() =>
    root.render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: a click sink standing in for a pressable card */}
        <div onClick={parent}>{ui}</div>
      </BloomThemeProvider>,
    ),
  );
}

describe.each([false, true])('stopPropagation=%s', (stop) => {
  const isClick = expect.objectContaining({ type: 'click', stopPropagation: expect.any(Function) });

  it('Chip', () => {
    const parent = jest.fn();
    const onPress = jest.fn();
    mount(
      <Chip onPress={onPress} stopPropagation={stop}>
        Design
      </Chip>,
      parent,
    );
    const chip = container.querySelector('[role="button"]') as HTMLElement;
    act(() => chip.click());
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onPress).toHaveBeenCalledWith(isClick);
    expect(parent).not.toHaveBeenCalled();
  });

  it('CloseButton', () => {
    const parent = jest.fn();
    const onPress = jest.fn();
    mount(
      <CloseButton accessibilityLabel="Dismiss" onPress={onPress} stopPropagation={stop} />,
      parent,
    );
    const close = container.querySelector('[aria-label="Dismiss"]') as HTMLElement;
    act(() => close.click());
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onPress).toHaveBeenCalledWith(isClick);
    expect(parent).not.toHaveBeenCalled();
  });
});
