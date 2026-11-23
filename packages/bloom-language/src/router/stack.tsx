/**
 * Android and OxyOS: expo-router's `ExperimentalStack`, the stack whose back
 * consumes Android's predictive gesture (the standard stack lets the Activity
 * close; every native stack of an app must be this one). A `Sheet` is pushed,
 * as every route is. The scenes are Bloom's (`stackSceneLayout`): the panel's
 * fill, and every covered scene inactive and out of the accessibility tree.
 *
 * Inside a page of Bloom's tab pager, a stack is the page in place (`Slot`):
 * the pager's pages are not fragments, which a native stack needs (see
 * pager.ts). A page's stack holds the page alone (what opens from it is pushed
 * over the tabs, in the app's stack), so nothing is lost.
 */
import { useContext } from 'react';
import { ExperimentalStack } from 'expo-router';
import { Slot, stackSceneLayout } from '@oxy.so/bloom/panel-routing/expo-router';

import type { Node } from '../node';
import { InPagerContext } from './pager';
import { routesOf } from './routes';

const OPTIONS = { headerShown: false } as const;

export function StackHost({ node }: { node: Node }) {
  if (useContext(InPagerContext)) return <Slot />;
  return (
    <ExperimentalStack screenOptions={OPTIONS} screenLayout={stackSceneLayout}>
      {routesOf(node).map((route) => (
        <ExperimentalStack.Screen key={route.name} name={route.name} />
      ))}
    </ExperimentalStack>
  );
}
