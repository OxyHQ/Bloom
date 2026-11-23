/**
 * `AppLayout`: Bloom's `AppShell` around the app's navigator. The shell draws
 * its navigation from the `TabPagerProvider` above it (the sidebar's rows and
 * selection, the drawer), the primary action is its sidebar's first row, and
 * the bottom bar is each platform's (`bar.*.tsx`). The shell's own options
 * (layout mode, panels, error boundaries) stay the app's: `.shell(navigator =>
 * options)` places the navigator in the panel it names. `.shellLayout`,
 * `.shellPresentation` and `.panels(...)` say the same in the language (see
 * shell-panels.ts), and `.destinations(...)` puts Bloom's pager above the shell.
 *
 * The app runs edge to edge on a device: the shell draws no safe-area frame,
 * because the pages own the device's edges. Each screen's `PageHeader` (or the
 * system navigation bar) keeps its controls below the status bar while its
 * paint and the scrolling content reach behind it; the bottom bar, the FAB and
 * the reveal drawer clear their own insets. A semantic `layout` would otherwise
 * frame the top and paint a band behind the status bar. An app that wants the
 * frame says so: `.shell(() => ({ safeArea: true }))`.
 */
import { AppShell } from '@oxy.so/bloom/app-shell';
import { useTabPager } from '@oxy.so/bloom/tab-pager';
import { TabPagerProvider } from '@oxy.so/bloom/tab-pager/expo-router';

import type { Child, IconComponent, Modifier, Node, ShellOptions } from '../node';
import { valuesOf } from '../platform/values';
import { destinationBar } from './bar';
import { drawNavigation } from './navigators';
import { PrimaryDestinationContext, type PrimaryDestination } from './primary';
import { destinationsOf, shellLayoutOf } from './shell-panels';

function primaryOf(node: Node): PrimaryDestination | null {
  for (let i = node.modifiers.length - 1; i >= 0; i--) {
    const modifier = node.modifiers[i] as Modifier;
    if (modifier.kind === 'primaryAction') {
      return { icon: modifier.icon, label: modifier.label, destination: modifier.destination };
    }
  }
  return null;
}

/**
 * With destinations, Bloom's `TabPagerProvider` above the shell (the shell
 * draws its navigation from it); without, the app's own provider is above.
 */
export function AppLayoutHost({ node }: { node: Node }) {
  const destinations = destinationsOf(node);
  if (destinations.length === 0) return <ShellHost node={node} />;
  return (
    <TabPagerProvider
      destinations={destinations}
      onReselect={valuesOf(node).onReselect as ((name: string) => void) | undefined}
    >
      <ShellHost node={node} />
    </TabPagerProvider>
  );
}

function ShellHost({ node }: { node: Node }) {
  const values = valuesOf(node);
  const pager = useTabPager();
  const primary = primaryOf(node);
  const navigator = drawNavigation((node.props as { navigator: Child }).navigator);
  const options = (values.shell as ShellOptions | undefined)?.(navigator);
  const semantic = shellLayoutOf(node, navigator, options);
  // The navigator is a panel's content when the shell has panels, the shell's child otherwise.
  const placed = options !== undefined || semantic.panelLayout !== undefined;
  const shell = { ...options, ...semantic };
  return (
    <PrimaryDestinationContext.Provider value={primary}>
      <AppShell
        {...shell}
        safeArea={shell?.safeArea ?? false}
        testID={(values.testID as string | undefined) ?? shell?.testID}
        primaryAction={primary ? primaryAction(primary, pager.selectDestination) : undefined}
        bottomBar={destinationBar(values.bottomBar !== false, primary)}
      >
        {placed ? undefined : navigator}
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
