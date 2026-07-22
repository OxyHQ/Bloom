/**
 * `className` support for React Native core components in Bloom.
 *
 * Bloom styles some primitives with NativeWind/`react-native-css` utility
 * classes (`className="..."`). react-native-css applies them at runtime — on web
 * as real CSS classes emitted by the consumer's Tailwind pipeline (`@source`-
 * scanning Bloom's lib), on native as compiled styles. This ambient augmentation
 * makes `className` type-valid on the RN primitives we set it on.
 *
 * Heritage-free (a plain interface-merge `declare module`, no `extends` / import
 * of RN's own module graph) so it never drags a second `@types/react` copy into
 * the RN 0.85 / React 19 tree — the same hazard the `mergeRefs` note calls out.
 */
// `export {}` makes this file a MODULE, so the `declare module` below MERGES
// with react-native's real types (an augmentation) instead of replacing the
// module and hiding its exports.
export {};

declare module 'react-native' {
  interface ViewProps {
    className?: string;
  }
  interface TextProps {
    className?: string;
  }
  interface ImageProps {
    className?: string;
  }
  interface PressableProps {
    className?: string;
  }
  interface ScrollViewProps {
    className?: string;
  }
  interface TextInputProps {
    className?: string;
  }
}
