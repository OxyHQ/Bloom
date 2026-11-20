/**
 * Android, OxyOS and the web: the shell's bottom bar is the language
 * `BottomBar` of the pager's pages, its FAB the primary action. Bloom draws it
 * (its capsule on the lens on Android and OxyOS, its floating material on the
 * web), with the pager's sliding selection and its presence as the pager
 * leaves its pages.
 */
import type { ReactNode } from 'react';
import { useTabPager } from '@oxy.so/bloom/tab-pager';

import { BottomBar, FAB, Icon, Tab } from '../primitives';
import { toElement } from '../render';
import { view } from '../view';
import type { PrimaryDestination } from './primary';

const DestinationBar = view(function DestinationBar(props: { primary: PrimaryDestination | null }) {
  const pager = useTabPager();
  const pages = pager.pages.filter((page) => page.bar && page.icon);
  // A route that is not one of the bar's pages selects no tab.
  const selection = pages.some((page) => page.name === pager.activePage) ? pager.activePage : null;
  const { primary } = props;
  return BottomBar(
    pages.map((page) => {
      const tab = Tab(page.label ?? '', page.icon as NonNullable<typeof page.icon>)
        .id(page.name)
        .badge(page.badge);
      return page.activeIcon ? tab.activeIcon(page.activeIcon) : tab;
    }),
  )
    .selection(selection ?? '')
    .onSelect(pager.selectDestination)
    .progress(pager.progress)
    .hide(pager.chromeProgress)
    .action(
      primary &&
        FAB(Icon(primary.icon))
          .label(primary.label)
          .onPress(() => pager.selectDestination(primary.destination)),
    );
});

/** The shell's `bottomBar`: the bar when it shows on this route, else none. */
export function destinationBar(shown: boolean, primary: PrimaryDestination | null): ReactNode {
  return shown ? toElement(DestinationBar({ primary })) : null;
}
