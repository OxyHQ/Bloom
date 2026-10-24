import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { ScreenActivity } from '../../screen/ScreenActivity';
import { useSurfaceFill } from '../../styles/surface-levels';
import { useIsFocused } from './PanelRouterAdapter';

/**
 * One native stack scene: pass `stackSceneLayout` as the stack's `screenLayout`.
 *
 * It paints the panel's own fill. Inside an AppShell panel the panel owns the
 * surface, so the stack's own scene must be transparent (a white one covers the
 * panel's scoped colour), and then a screen that paints no background of its
 * own lets the screen under it show through. `useSurfaceFill` is the colour the
 * panel paints there, a scoped colour included, so a screen looks as it did,
 * only opaque.
 *
 * It also takes every scene but the top one out of the accessibility tree. A
 * push leaves the scenes under it mounted, and TalkBack otherwise walks straight
 * into the feed behind a post.
 *
 * And it makes the screens of a covered scene inactive, as the pager does for
 * its pages: their videos stop, their scroll stops driving the chrome, and their
 * reselect, status bar and floating action yield to the screen on top — without
 * every route passing `active={isFocused}` to its `Screen`.
 */
export function StackScene({ children }: { children: ReactNode }) {
  const fill = useSurfaceFill();
  const focused = useIsFocused();
  return (
    <View
      style={[styles.scene, { backgroundColor: fill }]}
      importantForAccessibility={focused ? 'auto' : 'no-hide-descendants'}
      accessibilityElementsHidden={!focused}
    >
      <ScreenActivity active={focused}>{children}</ScreenActivity>
    </View>
  );
}

export function stackSceneLayout({ children }: { children: ReactNode }) {
  return <StackScene>{children}</StackScene>;
}

const styles = StyleSheet.create({
  scene: { flex: 1 },
});
