import { createContext } from 'react';

/**
 * Whether a route is drawn inside Bloom's tab pager (Android, OxyOS). Its
 * pages are not fragments, and react-native-screens' native stack needs a
 * fragment parent: a native stack in a pager page throws ("Parent fragment
 * providing view returned nullish fragment", measured on a Pixel 8a).
 */
export const InPagerContext = createContext(false);
InPagerContext.displayName = 'BloomInPager';
