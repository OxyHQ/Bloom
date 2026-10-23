import { Slot } from '../../panel-routing/expo-router';

/**
 * Web has no pager, deliberately. Pages side by side would each be a
 * viewport-height box clipped inside a horizontal scroller, while the web shell
 * scrolls the DOCUMENT — window virtualizers, `window.scrollY` restoration and
 * sticky chrome all measure against it. The route renders in place; the
 * provider still moves the highlight on press and warms every page's chunk.
 *
 * Being a separate file is also what keeps `react-native-pager-view`, which
 * has no web implementation, out of the web graph.
 */
export function TabPagerLayout() {
  return <Slot />;
}
