/** @jest-environment jsdom */
// Checks native responder ownership at the adapter boundary. Device tests cover
// keyboard, long press, selection dragging and parent scroll termination.
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { Platform, type GestureResponderEvent } from 'react-native';
import type { EnrichedTextInputProps } from 'react-native-enriched-html';
import { RichTextInput } from '../RichTextInput';

jest.mock('react-native', () => require('react-native-web'));
let mockProps: EnrichedTextInputProps;
const mockFocus = jest.fn();
jest.mock('react-native-enriched-html', () => {
  const React = require('react');
  return {
    EnrichedTextInput: React.forwardRef((props: EnrichedTextInputProps, ref: unknown) => {
      mockProps = props;
      React.useImperativeHandle(ref, () => ({ focus: mockFocus }));
      return null;
    }),
  };
});
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

it.each(['android', 'ios', 'web'] as const)(
  'claims editable native taps without taking focus and yields to parent scrolling (%s)',
  (platform) => {
    const os = jest.replaceProperty(Platform, 'OS', platform);
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    const value = [{ text: 'Editable paragraph' }];
    const onFocus = jest.fn();
    const render = (editable: boolean) =>
      act(() =>
        root.render(
          createElement(RichTextInput, {
            value,
            onChange: () => {},
            onFocus,
            editable,
          }),
        ),
      );
    try {
      mockFocus.mockClear();
      render(true);
      const event = {} as GestureResponderEvent;
      if (platform === 'web') {
        expect(mockProps.onStartShouldSetResponder).toBeUndefined();
        expect(mockProps.onResponderTerminationRequest).toBeUndefined();
      } else {
        expect(mockProps.onStartShouldSetResponder?.(event)).toBe(true);
        expect(mockProps.onResponderTerminationRequest?.(event)).toBe(true);
        expect(mockFocus).not.toHaveBeenCalled();
        expect(onFocus).not.toHaveBeenCalled();
        render(false);
        expect(mockProps.onStartShouldSetResponder?.(event)).toBe(false);
        expect(mockProps.onResponderTerminationRequest?.(event)).toBe(true);
      }
    } finally {
      act(() => root.unmount());
      host.remove();
      os.restore();
    }
  },
);
