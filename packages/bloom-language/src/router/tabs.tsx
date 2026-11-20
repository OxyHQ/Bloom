/**
 * Android, OxyOS and the web: Bloom's tab pager over the provider's pages, the
 * pages side by side under the shell's bottom bar (swiped between on native,
 * routed in place on the web). A stack inside a page is the page in place
 * (see stack.tsx).
 */
import { TabPagerLayout } from '@oxy.so/bloom/tab-pager/expo-router';

import { InPagerContext } from './pager';

export function TabViewHost() {
  return (
    <InPagerContext.Provider value>
      <TabPagerLayout />
    </InPagerContext.Provider>
  );
}
