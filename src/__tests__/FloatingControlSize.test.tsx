/**
 * Every floating (glass) control is one size: Bloom's floating size (44), decided by the control and
 * never by its caller. A Button or Button.Group on the lens, said by its prop or by its region, is 44
 * whatever `size` it is given, and so is every member of such a group. Elsewhere `size` holds.
 * (On a Pixel 8a, Mention's home menu toggle said `size="md"` and sat at 36 beside 44pt glass.)
 */
import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { Button } from '../button';
import { BUTTON_GEOMETRY } from '../button/shared';
import { LensMaterialProvider } from '../floating/lens/lens-material';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

const heightOf = (screen: ReturnType<typeof render>, testID: string) =>
  StyleSheet.flatten(screen.getByTestId(testID).props.style)?.height;

it('a floating region’s Button is 44 whatever size its caller says', () => {
  const screen = render(
    <BloomThemeProvider mode="light">
      <LensMaterialProvider value="lens">
        <Button size="sm" testID="floating">
          Menu
        </Button>
      </LensMaterialProvider>
      <Button size="sm" testID="content">
        Menu
      </Button>
    </BloomThemeProvider>,
  );
  expect(heightOf(screen, 'floating')).toBe(BUTTON_GEOMETRY.lg.height);
  expect(BUTTON_GEOMETRY.lg.height).toBe(44);
  expect(heightOf(screen, 'content')).toBe(BUTTON_GEOMETRY.sm.height);
});

it('a Button on the lens by its own prop is 44', () => {
  const screen = render(
    <BloomThemeProvider mode="light">
      <Button material="lens" size="xs" testID="lens">
        Share
      </Button>
    </BloomThemeProvider>,
  );
  expect(heightOf(screen, 'lens')).toBe(44);
});

it('a floating group and every member are 44, whatever size the group or a member says', () => {
  const screen = render(
    <BloomThemeProvider mode="light">
      <LensMaterialProvider value="lens">
        <Button.Group size="sm">
          <Button size="xs" testID="member-a">
            Share
          </Button>
          <Button testID="member-b">More</Button>
        </Button.Group>
      </LensMaterialProvider>
    </BloomThemeProvider>,
  );
  expect(heightOf(screen, 'member-a')).toBe(44);
  expect(heightOf(screen, 'member-b')).toBe(44);
});
