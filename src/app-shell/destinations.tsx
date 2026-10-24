import { useContext, type ComponentType, type ReactNode } from 'react';
import type { BottomBarProps } from '../bottom-bar/types';
import type { FabProps } from '../fab/types';
import {
  TabPagerActiveContext,
  TabPagerChromeContext,
  TabPagerContext,
} from '../tab-pager/context';
import { useTabPagerBottomBar } from '../tab-pager/TabPagerBottomBar';
import type { AppShellProps } from './types';
import { useScreenActionClaimed } from './screen-action';

/** The platform's `BottomBar`, bound to the pager, for the shell's own bar. */
export function createDestinationBottomBar(BottomBar: ComponentType<BottomBarProps>) {
  return function DestinationBottomBar({ action }: { action?: ReactNode }) {
    const claimed = useScreenActionClaimed();
    return <BottomBar {...useTabPagerBottomBar()} action={claimed ? undefined : action} />;
  };
}

/**
 * The shell's navigation, composed from the destinations of the
 * `TabPagerProvider` above it: the app declares each place once and the shell
 * draws it wherever the width puts navigation — sidebar rows (or the drawer's)
 * with their selection, badges and `primaryAction` as the compose row, or the
 * bottom bar with `primaryAction` as its FAB.
 *
 * What the app passes itself wins: `sidebar.items`, a `bottomBar` (`null` for
 * none on this route), or the `navigation` model. Without a provider the props
 * are returned untouched.
 */
export function useDestinationNavigation(
  props: AppShellProps,
  Bar: ComponentType<{ action?: ReactNode }>,
  Fab: ComponentType<FabProps>,
): AppShellProps {
  const pager = useContext(TabPagerContext);
  const { activeDestination } = useContext(TabPagerActiveContext);
  const { barItems, sidebarItems } = useContext(TabPagerChromeContext);
  if (!pager || props.navigation !== undefined) return props;
  const { primaryAction, sidebar: given } = props;
  const composeSidebar = !given?.items && sidebarItems.length > 0;
  const composeBar = props.bottomBar === undefined && barItems.length > 0;
  if (!composeSidebar && !composeBar) return props;
  return {
    ...props,
    primaryAction: undefined,
    sidebar: composeSidebar
      ? {
          ...given,
          items: sidebarItems,
          selected: given?.selected ?? activeDestination ?? undefined,
          onNavigate: (item) => pager.selectDestination(item.key),
          primaryAction:
            given?.primaryAction ??
            (primaryAction?.icon && primaryAction.onPress
              ? {
                  label: primaryAction.label ?? primaryAction.accessibilityLabel ?? '',
                  icon: primaryAction.icon,
                  onPress: primaryAction.onPress,
                }
              : undefined),
        }
      : given,
    bottomBar: composeBar ? (
      <Bar action={primaryAction ? <Fab {...primaryAction} /> : undefined} />
    ) : (
      props.bottomBar
    ),
  };
}
