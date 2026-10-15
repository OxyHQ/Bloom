import { Platform } from 'react-native';

/** What `svgA11yProps` returns: ARIA on web, React Native's props on native. */
export type SvgA11yProps =
  | { role: 'img'; 'aria-label': string }
  | { 'aria-hidden': true }
  | { accessible: true; accessibilityRole: 'image'; accessibilityLabel: string }
  | { accessible: false; 'aria-hidden': true };

/**
 * The accessibility props of a react-native-svg `<Svg>`: named by `label`, or
 * hidden when there is none.
 *
 * On web react-native-svg renders a DOM `<svg>` and spreads every prop it does
 * not consume onto it, so React Native's `accessible`, `accessibilityRole` and
 * `accessibilityLabel` reach the DOM as invalid attributes — React logs
 * "Received `false` for a non-boolean attribute `accessible`" from every app
 * that draws one, and the role and name never reach the accessibility tree.
 * Web gets ARIA (`role="img"` + `aria-label`, or `aria-hidden`); native keeps
 * the React Native props. Spread it on every `<Svg>`; never pass those props
 * directly (`svg-a11y-census.test.ts`). Public from `@oxy.so/bloom/styles`, so
 * an app's own `<Svg>` (a logo, an illustration) gets the same treatment.
 */
export function svgA11yProps(label?: string): SvgA11yProps {
  if (Platform.OS === 'web') {
    return label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true };
  }
  return label
    ? { accessible: true, accessibilityRole: 'image', accessibilityLabel: label }
    : { accessible: false, 'aria-hidden': true };
}
