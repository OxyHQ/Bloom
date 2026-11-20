/**
 * `AppLayout`: Bloom's `AppShell` around the app's navigator. The shell draws
 * its navigation from the `TabPagerProvider` above it (the sidebar's rows and
 * selection, the drawer), the primary action is its sidebar's first row, and
 * the bottom bar is each platform's (`bar.*.tsx`). The shell's own options
 * (layout mode, panels, error boundaries) stay the app's: `.shell(navigator =>
 * options)` places the navigator in the panel it names.
 */
import { AppShell } from '@oxy.so/bloom/app-shell';
import { useTabPager } from '@oxy.so/bloom/tab-pager';

import type { Child, IconComponent, Modifier, Node, ShellOptions } from '../node';
import { valuesOf } from '../platform/values';
import { destinationBar } from './bar';
import { drawNavigation } from './navigators';
import { PrimaryDestinationContext, type PrimaryDestination } from './primary';

function primaryOf(node: Node): PrimaryDestination | null {
  for (let i = node.modifiers.length - 1; i >= 0; i--) {
    const modifier = node.modifiers[i] as Modifier;
    if (modifier.kind === 'primaryAction') {
      return { icon: modifier.icon, label: modifier.label, destination: modifier.destination };
    }
  }
  return null;
}

export function AppLayoutHost({ node }: { node: Node }) {
  const values = valuesOf(node);
  const pager = useTabPager();
  const primary = primaryOf(node);
  const navigator = drawNavigation((node.props as { navigator: Child }).navigator);
  const shell = (values.shell as ShellOptions | undefined)?.(navigator);
  return (
    <PrimaryDestinationContext.Provider value={primary}>
      <AppShell
        {...shell}
        testID={(values.testID as string | undefined) ?? shell?.testID}
        primaryAction={primary ? primaryAction(primary, pager.selectDestination) : undefined}
        bottomBar={destinationBar(values.bottomBar !== false, primary)}
      >
        {shell ? undefined : navigator}
      </AppShell>
    </PrimaryDestinationContext.Provider>
  );
}

function primaryAction(
  primary: PrimaryDestination,
  select: (name: string) => void,
): { icon: IconComponent; accessibilityLabel: string; onPress: () => void } {
  return {
    icon: primary.icon,
    accessibilityLabel: primary.label,
    onPress: () => select(primary.destination),
  };
}
