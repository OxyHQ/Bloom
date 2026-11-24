import { useLayoutEffect, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { ScreenActivity } from '../../screen/ScreenActivity';
import { ScreenEnteredContext } from '../../screen/use-screen-entered';
import { useSurfaceFill } from '../../styles/surface-levels';
import { useIsFocused } from './PanelRouterAdapter';

/** The slice of a stack screen's navigation a scene listens to. */
interface SceneNavigation {
  getState(): { index: number; routes: readonly { key: string }[] };
  addListener(
    type: 'transitionEnd',
    listener: (event: { data?: { closing?: boolean } }) => void,
  ): () => void;
}

export interface StackSceneProps {
  children: ReactNode;
  /** The scene's route navigation and key, as the stack's `screenLayout` receives them. */
  navigation?: SceneNavigation;
  routeKey?: string;
}

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
 *
 * A pushed scene tells its screens when the push transition has ended
 * (`useScreenEntered`), so what can wait mounts after the slide rather than on
 * its frames.
 */
export function StackScene({ children, navigation, routeKey }: StackSceneProps) {
  const fill = useSurfaceFill();
  const focused = useIsFocused();
  const entered = useSceneEntered(navigation, routeKey);
  return (
    <View
      // Always its own native parent. Fabric mounts the children of a view that
      // only paints (a fill, no stacking context) straight into the view above
      // it, and the accessibility props below make it a stacking context while
      // the scene is covered: a push then moved the whole covered screen from
      // the native screen into this view, and Back moved it out again, each a
      // detach and an attach of every view in it, which draws it all again
      // (Mention's Home, about a thousand views: some 50 ms of a push's mount
      // frame on a Pixel 8a). Unflattened, a push only updates these props.
      collapsable={false}
      style={[styles.scene, { backgroundColor: fill }]}
      importantForAccessibility={focused ? 'auto' : 'no-hide-descendants'}
      accessibilityElementsHidden={!focused}
    >
      <ScreenActivity active={focused}>
        <ScreenEnteredContext.Provider value={entered}>{children}</ScreenEnteredContext.Provider>
      </ScreenActivity>
    </View>
  );
}

/**
 * False from the render that pushes the scene until the stack reports its
 * transition over (`transitionEnd`, from the native screen's appearance);
 * true for a scene the stack started with or that a push did not bring in.
 *
 * The pushing render reads the navigator's last committed state, which does
 * not hold the pushed route yet: a route missing from a stack that has routes
 * is the one being pushed.
 */
function useSceneEntered(navigation: SceneNavigation | undefined, routeKey: string | undefined) {
  const [entered, setEntered] = useState(() => {
    if (!navigation || !routeKey) return true;
    const state = navigation.getState();
    if (!state.routes.some((route) => route.key === routeKey)) return state.routes.length === 0;
    return state.routes.length < 2 || state.routes[state.index]?.key !== routeKey;
  });
  // Subscribed in the commit that mounts the native screen, before it can appear.
  useLayoutEffect(() => {
    if (entered || !navigation) return;
    return navigation.addListener('transitionEnd', (event) => {
      if (!event.data?.closing) setEntered(true);
    });
  }, [entered, navigation]);
  return entered;
}

export function stackSceneLayout({
  children,
  navigation,
  route,
}: {
  children: ReactNode;
  navigation?: SceneNavigation;
  route?: { key: string };
}) {
  return (
    <StackScene navigation={navigation} routeKey={route?.key}>
      {children}
    </StackScene>
  );
}

const styles = StyleSheet.create({
  scene: { flex: 1 },
});
