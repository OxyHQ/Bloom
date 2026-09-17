/**
 * `HoverCard` on NATIVE: a long press opens it and a plain press stays with the
 * child. That split is what makes the card safe on a link or an avatar that
 * already navigates — and it only holds if `TriggerSlot` COMPOSES the long
 * press into an `asChild` child rather than wrapping it, since a wrapping
 * `Pressable` never receives a gesture its pressable child claims.
 */
import React from 'react';
import { Pressable, Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { PortalOutlet, PortalProvider } from '../portal';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '../hover-card';

function renderCard({ disabled = false, onPress = () => {} } = {}) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="oxy">
      <PortalProvider>
        <HoverCard>
          <HoverCardTrigger asChild disabled={disabled}>
            <Pressable onPress={onPress}>
              <Text>@nate</Text>
            </Pressable>
          </HoverCardTrigger>
          <HoverCardContent label="Nate">
            <Text>Profile card</Text>
          </HoverCardContent>
        </HoverCard>
        <PortalOutlet />
      </PortalProvider>
    </BloomThemeProvider>,
  );
}

describe('HoverCard (native)', () => {
  it('opens on long press', () => {
    const utils = renderCard();
    expect(utils.queryByText('Profile card')).toBeNull();
    fireEvent(utils.getByText('@nate'), 'longPress');
    expect(utils.queryByText('Profile card')).not.toBeNull();
  });

  it("leaves a plain press to the child, and does not open", () => {
    const onPress = jest.fn();
    const utils = renderCard({ onPress });
    fireEvent.press(utils.getByText('@nate'));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(utils.queryByText('Profile card')).toBeNull();
  });

  it('does not open when disabled', () => {
    const utils = renderCard({ disabled: true });
    fireEvent(utils.getByText('@nate'), 'longPress');
    expect(utils.queryByText('Profile card')).toBeNull();
  });
});
