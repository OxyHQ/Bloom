/**
 * The native `ContextMenuTrigger` opens on a hold WITHOUT holding the touch
 * responder.
 *
 * On Android the responder's view intercepts every later move of its touch, so
 * a trigger built on `Pressable` kept a horizontal `ScrollView` inside it — a
 * code block in a chat turn — from scrolling sideways (Pixel 8a, Bloom 4.23.0).
 * The trigger now times the hold off raw touch events. What is pinned: no
 * responder handler anywhere between the trigger and its content, the hold
 * opens the menu, and a drag, an early lift or a cancel (a scroller taking the
 * touch) does not.
 */
import React from 'react';
import { ScrollView, Text } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import type { ReactTestInstance } from 'react-test-renderer';

import { ContextMenu, ContextMenuTrigger } from '../context-menu';
import { LONG_PRESS_MS } from '../floating/LongPressArea';

const RESPONDER_PROPS = ['onStartShouldSetResponder', 'onResponderGrant', 'onMoveShouldSetResponder', 'onPress', 'onLongPress'];

function mount() {
  const onOpenChange = jest.fn();
  const screen = render(
    <ContextMenu onOpenChange={onOpenChange}>
      <ContextMenuTrigger label="Message actions" testID="trigger">
        <ScrollView horizontal testID="code">
          <Text>const aVeryLongLineThatOverflowsTheCard = true;</Text>
        </ScrollView>
      </ContextMenuTrigger>
    </ContextMenu>,
  );
  const area = screen.getByLabelText('Message actions');
  return { screen, area, onOpenChange };
}

const at = (pageX: number, pageY = 0) => ({ nativeEvent: { pageX, pageY, touches: [{}] } });

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

it('claims no touch responder between the trigger and the content', () => {
  const { screen, area } = mount();
  const chain: ReactTestInstance[] = [];
  for (let node: ReactTestInstance | null = screen.getByTestId('code'); node; node = node.parent) {
    chain.push(node);
    if (node === screen.getByTestId('trigger')) break;
  }
  expect(chain).toContain(area);
  for (const node of chain.filter((n) => typeof n.type === 'string')) {
    for (const prop of RESPONDER_PROPS) expect([node.type, prop, node.props[prop]]).toEqual([node.type, prop, undefined]);
  }
});

it('opens the menu after a hold', () => {
  const { area, onOpenChange } = mount();
  fireEvent(area, 'touchStart', at(100));
  act(() => { jest.advanceTimersByTime(LONG_PRESS_MS - 1); });
  expect(onOpenChange).not.toHaveBeenCalled();
  act(() => { jest.advanceTimersByTime(1); });
  expect(onOpenChange).toHaveBeenCalledWith(true);
});

it('does not open when the finger drags, lifts early, or a scroller takes the touch', () => {
  const { area, onOpenChange } = mount();

  fireEvent(area, 'touchStart', at(100));
  fireEvent(area, 'touchMove', at(104));
  fireEvent(area, 'touchMove', at(130));
  act(() => { jest.advanceTimersByTime(LONG_PRESS_MS * 2); });

  fireEvent(area, 'touchStart', at(100));
  fireEvent(area, 'touchEnd', at(100));
  act(() => { jest.advanceTimersByTime(LONG_PRESS_MS * 2); });

  fireEvent(area, 'touchStart', at(100));
  fireEvent(area, 'touchCancel', at(100));
  act(() => { jest.advanceTimersByTime(LONG_PRESS_MS * 2); });

  expect(onOpenChange).not.toHaveBeenCalled();
});

it('offers the hold to assistive tech as the longpress action', () => {
  const { area, onOpenChange } = mount();
  expect(area.props.accessibilityActions).toEqual([{ name: 'longpress', label: 'Message actions' }]);
  fireEvent(area, 'accessibilityAction', { nativeEvent: { actionName: 'longpress' } });
  expect(onOpenChange).toHaveBeenCalledWith(true);
});
