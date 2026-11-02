/**
 * The native `Popover` on a platform with popups (a desktop: OxyOS, ADR 0039): its panel opens
 * beside its trigger in the platform's popup, as a Mac's popover, a `dialog` named by its label;
 * Escape closes it, as does the platform's dismissal; without popups, a phone's sheet as before.
 */
import React from 'react';
import { Text, View } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';

import { Popover, PopoverContent, PopoverTrigger } from '../popover';
import { Button } from '../button';
import { BloomProvider } from '../provider';
import type { PlatformSurfaceAdapter, PopupSurfaceProps } from '../platform-surface/types';

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

/** What the platform's popup was last rendered with. */
const last = (popup: jest.Mock) =>
  popup.mock.calls[popup.mock.calls.length - 1]?.[0] as PopupSurfaceProps;

function Probe() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button testID="options">Options</Button>
      </PopoverTrigger>
      <PopoverContent label="Profile options" testID="panel">
        <Text>Name</Text>
      </PopoverContent>
    </Popover>
  );
}

it('opens beside its trigger in the platform popup, a dialog named by its label', () => {
  const popup = jest.fn();
  const screen = render(
    <BloomProvider mode="light" platform={adapter(popup)}>
      <Probe />
    </BloomProvider>,
    { createNodeMock: () => ({}) },
  );
  expect(screen.queryByTestId('platform-popup')).toBeNull();
  fireEvent.press(screen.getByTestId('options'));
  expect(screen.getByTestId('platform-popup')).toBeTruthy();
  expect(screen.getByText('Name')).toBeTruthy();
  const props = last(popup);
  expect(props.role).toBe('dialog');
  expect(props.label).toBe('Profile options');
  expect(props.side).toBe('bottom');
  expect(props.align).toBe('center');
  expect(props.anchorRef.current).toBeTruthy();
});

it('closes on Escape and on the platform dismissing it', () => {
  const popup = jest.fn();
  const screen = render(
    <BloomProvider mode="light" platform={adapter(popup)}>
      <Probe />
    </BloomProvider>,
  );
  fireEvent.press(screen.getByTestId('options'));
  act(() => last(popup).onKey?.('Escape'));
  expect(screen.queryByTestId('platform-popup')).toBeNull();
  fireEvent.press(screen.getByTestId('options'));
  // Other keys are the platform's (Tab goes round the popover's controls) and close nothing.
  act(() => last(popup).onKey?.('Tab'));
  expect(screen.getByTestId('platform-popup')).toBeTruthy();
  act(() => last(popup).onDismiss('outside-press'));
  expect(screen.queryByTestId('platform-popup')).toBeNull();
});

it('keeps the sheet where the platform has no popups', () => {
  const screen = render(
    <BloomProvider mode="light">
      <Probe />
    </BloomProvider>,
  );
  fireEvent.press(screen.getByTestId('options'));
  expect(screen.queryByTestId('platform-popup')).toBeNull();
});
