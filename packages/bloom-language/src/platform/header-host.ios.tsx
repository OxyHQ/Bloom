/**
 * iOS: the system navigation bar. The header sets its screen's options in
 * expo-router's native `Stack`, so UIKit draws the bar: the large title that
 * folds into the inline one as the page scrolls, the bar items on Liquid
 * Glass on iOS 26, and the system back button (which pops the stack: a custom
 * `onBack` is not called). The screen must be one of a native `Stack`'s, with
 * its header shown. Without expo-router, Bloom's PageHeader.
 *
 * NOT VERIFIED: written without an iOS build (no Mac on this machine).
 */
import type { ComponentType } from 'react';

import { PageHeaderHost, readHeader } from './header-page';
import type { NodeHostProps } from './host.types';

type StackScreen = ComponentType<{ options: Record<string, unknown> }>;

let screen: StackScreen | null | undefined;

function loadStackScreen(): StackScreen | null {
  if (screen !== undefined) return screen;
  screen = null;
  try {
    const router = require('expo-router') as { Stack?: { Screen?: StackScreen } };
    screen = router.Stack?.Screen ?? null;
  } catch {
    screen = null;
  }
  return screen;
}

export function HeaderHost(props: NodeHostProps) {
  const StackScreen = loadStackScreen();
  if (!StackScreen) return <PageHeaderHost {...props} />;
  const header = readHeader(props.node);
  return (
    <StackScreen
      options={{
        headerShown: true,
        title: header.title,
        headerLargeTitle: header.display === 'large',
        headerTransparent: true,
        headerShadowVisible: header.scrollEdge !== 'none',
        headerBackVisible: header.onBack !== null,
        headerRight: header.toolbar.length > 0 ? () => props.render(header.toolbar) : undefined,
        headerLeft: header.leading.length > 0 ? () => props.render(header.leading) : undefined,
      }}
    />
  );
}
