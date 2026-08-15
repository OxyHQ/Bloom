/**
 * The react-native primitives wired for `className`, built ONCE at module scope.
 *
 * `className` is not a prop react-native understands. Under NativeWind v5 a
 * consumer's babel/css-interop rewrites the `style` prop of JSX elements it sees
 * in the CONSUMER's own source — which is why passing `className` as a bare prop
 * (`{...({ className } as Record<string, string>)}`, the cast this module
 * replaces) appeared to work: it works only under NW5, only for a primitive
 * Bloom did not wrap, and it drops silently the moment either changes. Nothing
 * errors; the class simply never resolves to a style.
 *
 * `styled()` from Bloom's own `react-native-css` dependency makes the mapping
 * explicit and independent of the consumer's interop. Same reasoning, and the
 * same silent failure if skipped, as `button/Button.tsx` and `Typography`.
 *
 * Built at module scope, not per render: an element type constructed during
 * render is a new type every time, so React unmounts and remounts the whole
 * subtree on each render.
 *
 * A component that also needs an animated value wraps ITS OWN
 * `Animated.createAnimatedComponent(...)` around one of these — the shared
 * versions stay unanimated so an element type is not created twice for the same
 * primitive. `button/Button.tsx` is the reference.
 */
import type { ComponentType, Ref } from 'react';
import {
  Image,
  Pressable,
  Text,
  View,
  type ImageProps,
  type PressableProps,
  type StyleProp,
  type TextProps,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import { styled } from 'react-native-css';

/**
 * `styled()` derives its mapping type from a dot-path union over the wrapped
 * component's ENTIRE prop type, and the one over `PressableProps` overflows the
 * checker (`TS2590: union type that is too complex to represent`). Narrowing is
 * also honest: the function form of `style` is deliberately excluded, since
 * NativeWind's css-interop swallows it and Bloom never uses it.
 */
type StyledPressableBase = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
};

/**
 * The ARIA PROPERTIES react-native-web forwards to the DOM and React Native does
 * not type at all.
 *
 * React Native types exactly five boolean `aria-*` STATES plus the four
 * `aria-value*`, and folds them back into `accessibilityState`
 * (`ViewAccessibility.d.ts` calls them "alias for accessibilityState"). A
 * PROPERTY like `aria-haspopup` has no state to fold into and no native
 * counterpart, so it is absent from RN's types — while react-native-web lists it
 * in `forwardedProps` and `createDOMProps` writes it straight onto the element.
 *
 * Declared here rather than cast at the call site for the reason
 * `styles/web-view-style.ts` spells out for its own RN/RNW gap: `as` only
 * requires the two types to be COMPARABLE, so a cast accepts a typo'd attribute
 * name and ships it as a prop nothing reads. An annotation keeps the key checked.
 *
 * Native ignores it — an unrecognised prop never reaches a native view config —
 * so this needs no `Platform.OS` branch.
 */
export interface WebAriaProps {
  /**
   * What kind of surface this control opens. `menu` is the only value Bloom
   * currently needs; the union is the ARIA one, narrowed to what is spellable.
   */
  'aria-haspopup'?: 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
}

/**
 * `ref` is on the PUBLISHED type and deliberately not on the one handed to
 * `styled()`: adding it to the argument widens that dot-path union past the
 * checker's limit again, and the mapping only ever names `className`. The same
 * goes for {@link WebAriaProps}.
 */
export type StyledPressableProps = StyledPressableBase &
  WebAriaProps & {
    ref?: Ref<View>;
  };

/**
 * `styled()` is declared as returning `any`, so these annotations are the whole
 * type contract — including `ref`, which under React 19 is an ordinary prop that
 * `useCssElement` spreads onto the wrapped primitive. Leaving it out made a
 * measured node (a flyout's scroll box, a select option) a compile error while
 * the runtime forwarded it fine.
 */
export const StyledView: ComponentType<ViewProps & { ref?: Ref<View> }> = styled(View, {
  className: 'style',
});

export const StyledText: ComponentType<TextProps & { ref?: Ref<Text> }> = styled(Text, {
  className: 'style',
});

export const StyledImage: ComponentType<ImageProps & { ref?: Ref<Image> }> = styled(Image, {
  className: 'style',
});

export const StyledPressable: ComponentType<StyledPressableProps> = styled(
  Pressable as ComponentType<StyledPressableBase>,
  { className: 'style' },
);
