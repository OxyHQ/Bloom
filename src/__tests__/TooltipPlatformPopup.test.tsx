/**
 * The native `Tooltip` on a platform with popups (a desktop: OxyOS's compositor popups): the
 * bubble is in the platform's popup, anchored to the trigger on the requested side, centred, as a
 * `tooltip` that takes no input — no backdrop catching presses. A dock's icon sits in a strip as
 * tall as the dock, which clips anything drawn above it; the platform's popup may extend past it.
 * Without popups, the portal's bubble as before.
 */
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';

import { BloomProvider } from '../provider';
import type { PlatformSurfaceAdapter, PopupSurfaceProps } from '../platform-surface/types';
import { Tooltip, TooltipTextBubble, TooltipTrigger } from '../tooltip';

function adapter(popup: (props: PopupSurfaceProps) => void): PlatformSurfaceAdapter {
  return {
    platform: 'test',
    capabilities: new Set(['popup-surface']),
    PopupSurface: (props) => {
      popup(props);
      return <View testID="platform-popup">{props.children}</View>;
    },
  };
}

function Hovered({ initial = false }: { initial?: boolean }) {
  const [visible, setVisible] = useState(initial);
  return (
    <Tooltip visible={visible} onVisibleChange={setVisible} position="top">
      <TooltipTrigger>
        <Pressable
          testID="icon"
          accessibilityLabel="Abrir Inbox"
          onHoverIn={() => setVisible(true)}
          onHoverOut={() => setVisible(false)}
        >
          <Text>icon</Text>
        </Pressable>
      </TooltipTrigger>
      <TooltipTextBubble>Inbox</TooltipTextBubble>
    </Tooltip>
  );
}

// Host views, as a renderer mounts them: a ref holds one.
const hostViews = { createNodeMock: () => ({}) };

it('shows the bubble in the platform popup anchored to the trigger, as a tooltip taking no input', () => {
  const popup = jest.fn();
  const screen = render(
    <BloomProvider mode="light" platform={adapter(popup)}>
      <Hovered />
    </BloomProvider>,
    hostViews,
  );
  expect(screen.queryByTestId('platform-popup')).toBeNull();
  // Placed by the platform against the trigger, it waits for no measurement: shown on the hover.
  fireEvent(screen.getByTestId('icon'), 'hoverIn');
  expect(screen.getByTestId('platform-popup')).toBeTruthy();
  expect(screen.getByText('Inbox')).toBeTruthy();
  const props = popup.mock.lastCall?.[0] as PopupSurfaceProps;
  expect(props.role).toBe('tooltip');
  expect(props.side).toBe('top');
  expect(props.align).toBe('center');
  expect(props.label).toBe('Inbox');
  expect(props.anchorRef.current).toBeTruthy();
  // No backdrop: nothing in the popup or the window takes a press for the tooltip.
  expect(screen.UNSAFE_queryAllByType(Pressable)).toHaveLength(1);
  // The pointer leaving closes it.
  fireEvent(screen.getByTestId('icon'), 'hoverOut');
  expect(screen.queryByTestId('platform-popup')).toBeNull();
});

it('closes when the platform closes the popup', () => {
  const popup = jest.fn();
  const screen = render(
    <BloomProvider mode="light" platform={adapter(popup)}>
      <Hovered initial />
    </BloomProvider>,
    hostViews,
  );
  const props = popup.mock.lastCall?.[0] as PopupSurfaceProps;
  act(() => props.onDismiss('closed'));
  expect(screen.queryByTestId('platform-popup')).toBeNull();
});
