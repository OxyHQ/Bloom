/**
 * The two composition holes in `asChild`, and the group control that now fits
 * through it.
 *
 * ## 1. A child handler that decides the surface should not open
 *
 * `cloneTrigger` runs the child's `onPress` and then the family's. Until now
 * there was no way for the first to stop the second, so a trigger that has just
 * found the form dirty — or the row it belongs to gone — had to stop using
 * `asChild` and rebuild the control. `preventDefault()` on the press event is
 * the answer, and it is the event's own vocabulary rather than a Bloom
 * invention: both platforms hand `onPress` a React synthetic event.
 *
 * ## 2. A fragment child
 *
 * `<PopoverTrigger asChild><>{control}</></PopoverTrigger>` passes every check
 * `cloneTrigger` used to make. `Children.only` sees one child, `isValidElement`
 * says yes, `cloneElement` succeeds — and React then drops every prop, because
 * a fragment has no host node to put them on. Nothing throws and the trigger is
 * simply dead. It throws now, by name.
 *
 * ## 3. A `ButtonGroupItem` as the trigger
 *
 * A menu button inside a header island should be an item of that island, not a
 * second control that looks like one. That needs the item to carry the props
 * the trigger merges onto it — and a component whose props are a closed list
 * DROPS the ones it does not declare, silently, since all of them are optional.
 * So the item declares them, and this measures that they reach the rendered
 * node.
 */
import React from 'react';
import { Pressable, Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { ButtonGroup, ButtonGroupItem } from '../button-group';
import { PortalOutlet, PortalProvider } from '../portal';
import { Popover, PopoverContent, PopoverTrigger } from '../popover';

function wrap(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="oxy">
      <PortalProvider>
        {ui}
        <PortalOutlet />
      </PortalProvider>
    </BloomThemeProvider>,
  );
}

describe('asChild composition', () => {
  it('opens after running the child handler (control)', () => {
    const onPress = jest.fn();
    const utils = wrap(
      <Popover>
        <PopoverTrigger asChild label="Apps">
          <Pressable onPress={onPress}>
            <Text>Open</Text>
          </Pressable>
        </PopoverTrigger>
        <PopoverContent label="Apps">
          <Text>Mention</Text>
        </PopoverContent>
      </Popover>,
    );
    fireEvent.press(utils.getByText('Open'), { defaultPrevented: false });
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(utils.queryByText('Mention')).not.toBeNull();
  });

  it('does NOT open when the child handler prevents the default', () => {
    const onPress = jest.fn((event: { preventDefault: () => void }) => {
      event.preventDefault();
    });
    const utils = wrap(
      <Popover>
        <PopoverTrigger asChild label="Apps">
          <Pressable onPress={onPress}>
            <Text>Open</Text>
          </Pressable>
        </PopoverTrigger>
        <PopoverContent label="Apps">
          <Text>Mention</Text>
        </PopoverContent>
      </Popover>,
    );
    // A real press event carries `defaultPrevented` and a `preventDefault` that
    // sets it; the fixture is that pair, so the assertion measures the branch
    // rather than the platform.
    const event = {
      defaultPrevented: false,
      preventDefault() {
        this.defaultPrevented = true;
      },
    };
    fireEvent.press(utils.getByText('Open'), event);
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(utils.queryByText('Mention')).toBeNull();
  });

  it('refuses a fragment child instead of rendering a dead trigger', () => {
    const boom = () =>
      wrap(
        <Popover>
          <PopoverTrigger asChild label="Apps">
            <>
              <Pressable>
                <Text>Open</Text>
              </Pressable>
            </>
          </PopoverTrigger>
          <PopoverContent label="Apps">
            <Text>Mention</Text>
          </PopoverContent>
        </Popover>,
      );
    expect(boom).toThrow(/fragment/i);
  });
});

describe('a ButtonGroupItem as a trigger', () => {
  it('carries the trigger contract onto the rendered control', () => {
    const utils = wrap(
      <ButtonGroup variant="glass" accessibilityLabel="Page actions">
        <Popover>
          <PopoverTrigger asChild label="More">
            <ButtonGroupItem testID="more" iconOnly accessibilityLabel="More" />
          </PopoverTrigger>
          <PopoverContent label="More">
            <Text>Duplicate</Text>
          </PopoverContent>
        </Popover>
      </ButtonGroup>,
    );
    const item = utils.getByTestId('more');
    // Closed: the state is announced, not merely held.
    expect(item.props['aria-expanded']).toBe(false);
    expect(item.props.accessibilityState.expanded).toBe(false);
    expect(item.props['aria-haspopup']).toBeDefined();
    // The caller's own label survives the merge.
    expect(item.props.accessibilityLabel).toBe('More');

    fireEvent.press(item, { defaultPrevented: false });
    expect(utils.queryByText('Duplicate')).not.toBeNull();
    expect(utils.getByTestId('more').props['aria-expanded']).toBe(true);
  });
});
