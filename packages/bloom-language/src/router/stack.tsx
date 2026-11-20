/**
 * Android and OxyOS: expo-router's `ExperimentalStack`, the stack whose back
 * consumes Android's predictive gesture (the standard stack lets the Activity
 * close; every native stack of an app must be this one). A `Sheet` is pushed,
 * as every route is. The scenes are Bloom's (`stackSceneLayout`): the panel's
 * fill, and every covered scene inactive and out of the accessibility tree.
 */
import { ExperimentalStack } from 'expo-router';
import { stackSceneLayout } from '@oxy.so/bloom/panel-routing/expo-router';

import type { Node } from '../node';
import { routesOf } from './routes';

const OPTIONS = { headerShown: false } as const;

export function StackHost({ node }: { node: Node }) {
  return (
    <ExperimentalStack screenOptions={OPTIONS} screenLayout={stackSceneLayout}>
      {routesOf(node).map((route) => (
        <ExperimentalStack.Screen key={route.name} name={route.name} />
      ))}
    </ExperimentalStack>
  );
}
