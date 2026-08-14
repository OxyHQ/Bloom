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
import type { ComponentType } from 'react';
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
export type StyledPressableProps = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
};

export const StyledView: ComponentType<ViewProps> = styled(View, { className: 'style' });

export const StyledText: ComponentType<TextProps> = styled(Text, { className: 'style' });

export const StyledImage: ComponentType<ImageProps> = styled(Image, { className: 'style' });

export const StyledPressable: ComponentType<StyledPressableProps> = styled(
  Pressable as ComponentType<StyledPressableProps>,
  { className: 'style' },
);
