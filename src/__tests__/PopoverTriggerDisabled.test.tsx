/**
 * `disabled` on an `asChild` trigger must keep the panel CLOSED, whatever element
 * the caller passed.
 *
 * `floating/TriggerSlot.tsx`'s `cloneTrigger` composes the family's open handler
 * with the child's own `onPress`; composed unconditionally, a disabled trigger
 * still opens unless the child happens to swallow the press itself. The guard
 * therefore lives in `cloneTrigger` (AGENTS.md, "Overlay surfaces").
 *
 * Jest is the SHARPER instrument here: its `Pressable` mock ignores `disabled`,
 * so the composed handler runs and a missing guard goes red — the case a real
 * browser masks (`scripts/verify-trigger-disabled.mjs` measures both). This
 * suite used to live on `Combobox`, whose trigger is exactly that shape; it now
 * pins the mechanism on `Popover` directly.
 */
import React from 'react';
import { Pressable, Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { PortalOutlet, PortalProvider } from '../portal';
import { Popover, PopoverContent, PopoverTrigger } from '../popover';

function renderPopover(disabled: boolean) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="oxy">
      <PortalProvider>
        <Popover>
          <PopoverTrigger asChild disabled={disabled} label="Pick an app">
            <Pressable disabled={disabled}>
              <Text>Pick an app</Text>
            </Pressable>
          </PopoverTrigger>
          <PopoverContent label="Apps">
            <Text>Mention</Text>
          </PopoverContent>
        </Popover>
        <PortalOutlet />
      </PortalProvider>
    </BloomThemeProvider>,
  );
}

describe('Popover asChild trigger — disabled', () => {
  it('opens when enabled (control: the press reaches the trigger)', () => {
    const utils = renderPopover(false);
    fireEvent.press(utils.getByText('Pick an app'));
    expect(utils.queryByText('Mention')).not.toBeNull();
  });

  it('does not open when disabled, even with a Pressable child that the mock lets through', () => {
    const utils = renderPopover(true);
    fireEvent.press(utils.getByText('Pick an app'));
    expect(utils.queryByText('Mention')).toBeNull();
  });
});
