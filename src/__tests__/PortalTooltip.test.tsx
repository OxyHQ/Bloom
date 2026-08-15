/**
 * `Portal` and the native `Tooltip`, tested together because the tooltip is the
 * portal's most demanding caller and both fail the same silent way: content
 * that renders somewhere the user is not looking.
 *
 * The `Portal` properties worth pinning are the ones an outlet-less app hits:
 * a portalled child appears at the OUTLET rather than in place, several
 * children coexist rather than overwriting one another by id, and unmounting
 * one removes only that one.
 *
 * The `Tooltip` property is the deferred open. `visible` is a REQUEST, not the
 * state: the bubble is positioned from a `measure()` of its trigger, so
 * rendering it before that measurement arrives would flash it at the top-left
 * corner on every open. It stays closed until the measurement exists.
 */
import React, { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { PortalProvider, PortalOutlet, Portal } from '../portal';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipTextBubble } from '../tooltip';
import { findHost } from './support/rendered-style';

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="oxy">
      {ui}
    </BloomThemeProvider>,
  );
}

describe('Portal', () => {
  it('renders a portalled child at the outlet, not where it was written', () => {
    const { toJSON } = renderWithTheme(
      <PortalProvider>
        <Text testID="in-place">in place</Text>
        <Portal>
          <Text testID="portalled">portalled</Text>
        </Portal>
        <Pressable testID="outlet">
          <PortalOutlet />
        </Pressable>
      </PortalProvider>,
    );
    const outlet = findHost(toJSON(), 'outlet');
    expect(outlet).not.toBeNull();
    // The portalled node is a descendant of the outlet; the sibling written
    // beside it is not.
    expect(findHost(outlet?.children, 'portalled')).not.toBeNull();
    expect(findHost(outlet?.children, 'in-place')).toBeNull();
    expect(findHost(toJSON(), 'in-place')).not.toBeNull();
  });

  it('keeps several portalled children rather than one overwriting another', () => {
    const { getByText } = renderWithTheme(
      <PortalProvider>
        <Portal>
          <Text>first</Text>
        </Portal>
        <Portal>
          <Text>second</Text>
        </Portal>
        <PortalOutlet />
      </PortalProvider>,
    );
    expect(getByText('first')).toBeTruthy();
    expect(getByText('second')).toBeTruthy();
  });

  it('removes only the portal that unmounted', () => {
    function Harness() {
      const [showFirst, setShowFirst] = useState(true);
      return (
        <PortalProvider>
          {showFirst ? (
            <Portal>
              <Text>first</Text>
            </Portal>
          ) : null}
          <Portal>
            <Text>second</Text>
          </Portal>
          <Pressable testID="drop" onPress={() => setShowFirst(false)}>
            <Text>drop</Text>
          </Pressable>
          <PortalOutlet />
        </PortalProvider>
      );
    }
    const { getByTestId, getByText, queryByText } = renderWithTheme(<Harness />);
    expect(getByText('first')).toBeTruthy();
    fireEvent.press(getByTestId('drop'));
    expect(queryByText('first')).toBeNull();
    expect(getByText('second')).toBeTruthy();
  });

  it('renders nothing at an outlet nobody portalled into', () => {
    const { queryByText } = renderWithTheme(
      <PortalProvider>
        <PortalOutlet />
      </PortalProvider>,
    );
    expect(queryByText('anything')).toBeNull();
  });
});

describe('Tooltip', () => {
  function Harness({ visible }: { visible: boolean }) {
    return (
      <PortalProvider>
        <Tooltip visible={visible} onVisibleChange={() => {}}>
          <TooltipTrigger>
            <Text>Trigger</Text>
          </TooltipTrigger>
          {/* `TooltipTextBubble` renders its own `TooltipContent`, deriving the
              accessible label from the children — so it is a sibling of the
              trigger, not something wrapped in a `TooltipContent`. */}
          <TooltipTextBubble>Copy link</TooltipTextBubble>
        </Tooltip>
        <PortalOutlet />
      </PortalProvider>
    );
  }

  it('always renders its trigger', () => {
    const { getByText } = renderWithTheme(<Harness visible={false} />);
    expect(getByText('Trigger')).toBeTruthy();
  });

  it('renders no bubble while closed', () => {
    const { queryByText } = renderWithTheme(<Harness visible={false} />);
    expect(queryByText('Copy link')).toBeNull();
  });

  it('stays closed on a visible request until the trigger has been measured', () => {
    // `measure()` never resolves in this environment, which is exactly the
    // "asked to open, position not known yet" state. Rendering the bubble here
    // would flash it at the top-left corner on every real open.
    //
    // POSITIVE CONTROL for the query itself: a label portalled into the same
    // outlet IS found, so the null above is the tooltip staying closed and not
    // this suite being unable to see through a portal at all. What it does NOT
    // establish is that the bubble opens once measured — `measure()` cannot be
    // driven from react-test-renderer, so that half belongs to a device build.
    const control = renderWithTheme(
      <PortalProvider>
        <Portal>
          <Text>Copy link</Text>
        </Portal>
        <PortalOutlet />
      </PortalProvider>,
    );
    expect(control.getByText('Copy link')).toBeTruthy();

    const { queryByText } = renderWithTheme(<Harness visible />);
    expect(queryByText('Copy link')).toBeNull();
  });
});
