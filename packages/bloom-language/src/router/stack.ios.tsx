/**
 * iOS: expo-router's native `Stack` (a UINavigationController), so a screen's
 * header is the system navigation bar (see platform/header-host.ios.tsx), its
 * back is the system's, with its edge swipe, and a `Sheet` is the system's page
 * sheet. A screen without a header of its own shows no bar.
 *
 * NOT VERIFIED: written without an iOS build (no Mac on this machine).
 */
import { Stack } from 'expo-router';
import { stackSceneLayout } from '@oxy.so/bloom/panel-routing/expo-router';

import type { Node } from '../node';
import { routesOf } from './routes';

const OPTIONS = { headerShown: false } as const;
const SHEET = { presentation: 'modal' } as const;

export function StackHost({ node }: { node: Node }) {
  return (
    <Stack screenOptions={OPTIONS} screenLayout={stackSceneLayout}>
      {routesOf(node).map((route) => (
        <Stack.Screen
          key={route.name}
          name={route.name}
          options={route.presentation === 'sheet' ? SHEET : undefined}
        />
      ))}
    </Stack>
  );
}
