/**
 * A chat row's swipe face is the colour of the surface it sits on.
 *
 * Measured on Android (Allo, Bloom 15.50.1, light "Raspberry" theme): on a phone
 * the list sits in a `card` panel (#fff8f8) and every swipeable row was a
 * tinted slab (#ffe8ed), indistinguishable from a selected one. The face is
 * opaque so the panes cannot read through it, and it was painted
 * `theme.colors.background` — the PAGE, not the panel. It now takes
 * `useSurfaceFill()`, as `mail-list` already did.
 *
 * Rendered through the `react-native` mock so the face's style is readable;
 * jsdom drops the animated layer's style.
 */
import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { ChatListItem } from '../chat-list';
import { RiDeleteBinLine } from '../icons/remix/RiDeleteBinLine';
import { SurfaceLevelProvider } from '../styles/surface-levels';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

const PANEL = '#fff8f8';

function fills(ui: React.ReactElement): unknown[] {
  const screen = render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
  // Every element, not only `View`: the face is reanimated's `Animated.View`.
  return screen.UNSAFE_root.findAll(
    (node) => node.props.style !== undefined && typeof node.props.style !== 'function',
  )
    .map((node) => StyleSheet.flatten(node.props.style)?.backgroundColor)
    .filter((fill) => fill !== undefined);
}

const row = (
  <ChatListItem
    name="Ana"
    swipeActions={{ right: [{ key: 'delete', label: 'Delete', icon: RiDeleteBinLine }] }}
    swipeEnabled
    testID="row"
  />
);

describe('chat row swipe face', () => {
  it('takes the fill of the panel it sits on', () => {
    expect(
      fills(
        <SurfaceLevelProvider level={1} fill={PANEL}>
          {row}
        </SurfaceLevelProvider>,
      ),
    ).toContain(PANEL);
  });

  it('is the page colour only where nothing published a surface', () => {
    expect(fills(row)).not.toContain(PANEL);
  });
});
