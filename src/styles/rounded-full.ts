import type { ViewStyle } from 'react-native';
import { IS_WEB } from './platform';

/**
 * The radius `rounded-full` drew: an infinite radius on the web (Tailwind's
 * `calc(infinity * 1px)`), and the largest one react-native-css resolved that to
 * on native. A pill at any size, the same on both sides of the cut.
 */
export const ROUNDED_FULL = (IS_WEB
  ? 'calc(infinity * 1px)'
  : 9007199254740990) as unknown as ViewStyle['borderRadius'] & number;
