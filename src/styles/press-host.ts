import { IS_WEB } from './platform';

/**
 * The class a Bloom pressable that react-native-web draws (its `Pressable`)
 * carries on the web. react-native-web keeps a hover or a press inside a
 * pressable from the pressables around it; a CSS state that answers a view's
 * own hover or press (the Bloom language's `hovered` and `pressed` variants)
 * reads this class to do the same. It has no rules of its own, and native has
 * none (its responders already give a touch to the innermost pressable).
 */
export const PRESS_HOST_CLASS = 'blsp';

/** The class as a style entry, for a pressable's `style`; `undefined` on native. */
export const PRESS_HOST_STYLE: object | undefined = IS_WEB
  ? Object.freeze({ $$css: true, bloomPressHost: PRESS_HOST_CLASS })
  : undefined;
