import React from 'react';
import { Platform } from 'react-native';
import { render, act } from '@testing-library/react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import { PanelReorderHandle } from '../app-shell/PanelReorderHandle';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { panelReorderPreview } from '../app-shell/panel-reorder';
import { animatePanelLayout } from '../app-shell/panel-motion';
import * as Reanimated from 'react-native-reanimated';
import type { MockGesture } from '../../__mocks__/react-native-gesture-handler';

it('uses one Pan gesture on native with shared-value pointer frames and JS only at gesture boundaries', () => {
  const previous = Platform.OS;
  Platform.OS = 'ios';
  try {
    const onStart = jest.fn(),
      onUpdate = jest.fn(),
      onFinish = jest.fn();
    const pointer = { value: { x: 0, y: 0 } } as Reanimated.SharedValue<{ x: number; y: number }>;
    const view = render(
      <BloomThemeProvider>
        <PanelReorderHandle
          id="a"
          label="Inbox"
          onStart={onStart}
          onUpdate={onUpdate}
          onFinish={onFinish}
          onMove={() => {}}
          pointer={pointer}
        />
      </BloomThemeProvider>,
    );
    const gesture = view.UNSAFE_getByType(GestureDetector).props.gesture as MockGesture;
    const event = { absoluteX: 110, absoluteY: 80, translationX: 10, translationY: 0 };
    act(() => gesture.__handlers.onStart?.(event as never));
    expect(onStart).toHaveBeenCalledWith('a', 100, 80);
    act(() => gesture.__handlers.onUpdate?.({ ...event, absoluteX: 320 } as never));
    expect(pointer.value).toEqual({ x: 320, y: 80 });
    expect(onUpdate).not.toHaveBeenCalled();
    const finalize = gesture.__handlers.onFinalize as unknown as (
      payload: typeof event,
      success: boolean,
    ) => void;
    act(() => finalize({ ...event, absoluteX: 320 }, true));
    expect(onFinish).toHaveBeenCalledWith(true, 320, 80);
  } finally {
    Platform.OS = previous;
  }
});
it('shares preview geometry for variable-width native/web panels and fixed slots', () => {
  const items = [
    { id: 'main', start: 0, size: 300 },
    { id: 'a', start: 308, size: 200 },
    { id: 'b', start: 516, size: 400 },
  ];
  expect(panelReorderPreview(['main', 'a', 'b'], ['a', 'b'], items, 'a', 320, 1)).toEqual({
    target: 'b',
    shifts: [
      { id: 'main', delta: 0 },
      { id: 'b', delta: -208 },
      { id: 'a', delta: 320 },
    ],
  });
  const rtl = [
    { id: 'main', start: 616, size: 300 },
    { id: 'a', start: 408, size: 200 },
    { id: 'b', start: 0, size: 400 },
  ];
  const preview = panelReorderPreview(['main', 'a', 'b'], ['a', 'b'], rtl, 'a', -320, -1);
  expect(preview.target).toBe('b');
  expect(preview.shifts).toEqual([
    { id: 'main', delta: 0 },
    { id: 'b', delta: 208 },
    { id: 'a', delta: -320 },
  ]);
});
it('orders native exit, geometry and incoming disclosure, with immediate reduced motion', () => {
  const delay = jest.spyOn(Reanimated, 'withDelay');
  const values = {
    width: { value: 0 },
    gap: { value: 0 },
    opacity: { value: 0 },
    scale: { value: 1 },
  } as Parameters<typeof animatePanelLayout>[0];
  animatePanelLayout(values, { width: 390, gap: 8, visible: true }, true, false);
  expect(delay.mock.calls.map(([ms]) => ms)).toEqual([150, 150, 530, 530]);
  delay.mockClear();
  animatePanelLayout(values, { width: 0, gap: 0, visible: false }, true, false);
  expect(delay.mock.calls.map(([ms]) => ms)).toEqual([150, 150, 0, 0]);
  delay.mockClear();
  animatePanelLayout(values, { width: 620, gap: 0, visible: true }, true, true);
  expect(delay).not.toHaveBeenCalled();
  expect(values.width.value).toBe(620);
  expect(values.opacity.value).toBe(1);
  delay.mockRestore();
});
