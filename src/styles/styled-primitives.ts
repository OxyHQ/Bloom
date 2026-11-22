/**
 * React Native's primitives typed with the web props react-native-web forwards
 * (a `listbox` role, `aria-*` on a pressable), for Bloom's own hosts. They are
 * React Native's components themselves: Bloom styles through `style` alone
 * (`docs/no-nativewind.mdx`).
 */
import type { ComponentRef, ComponentType, Ref } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
  type PressableProps,
  type ScrollViewProps,
  type StyleProp,
  type TextProps,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import { BloomImage, type BloomImageProps } from '../image';

type StyledPressableBase = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
};

export interface WebAriaProps {
  /**
   * What kind of surface this control opens. `menu` is the only value Bloom
   * currently needs; the union is the ARIA one, narrowed to what is spellable.
   */
  'aria-haspopup'?: 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
  /**
   * The id list of the elements that DESCRIBE this control — a field's hint or
   * its error message (`field/context.ts`).
   *
   * Here for the same reason as `aria-haspopup`: React Native types no such prop
   * (there is no `accessibilityState` entry for it to fold into) while
   * react-native-web forwards it, so web gets the association and native is
   * unaffected. A control that needs the description READ on native carries it
   * in its accessible name instead.
   */
  'aria-describedby'?: string;
  /**
   * Whether the control's current value is invalid. Same platform split as
   * `aria-describedby`.
   */
  'aria-invalid'?: boolean;
}

/**
 * `ref` is on the PUBLISHED type and deliberately not on the one handed to
 * `styled()`: adding it to the argument widens that dot-path union past the
 * checker's limit again, and the mapping only ever names `className`. The same
 * goes for {@link WebAriaProps}.
 */
export type StyledPressableProps = Omit<StyledPressableBase, 'role'> &
  WebAriaProps & {
    /** RNW supports these menu roles; native callers retain checkbox/radio. */
    role?: PressableProps['role'] | 'menuitemcheckbox' | 'menuitemradio';
    ref?: Ref<ComponentRef<typeof View>>;
  };

/**
 * `styled()` is declared as returning `any`, so these annotations are the whole
 * type contract — including `ref`, which under React 19 is an ordinary prop that
 * `useCssElement` spreads onto the wrapped primitive. Leaving it out made a
 * measured node (a flyout's scroll box, a select option) a compile error while
 * the runtime forwarded it fine.
 */
export const StyledView = View as ComponentType<
  Omit<ViewProps, 'role'> & {
    /** Web-only listbox semantics; RN's Role type does not include this role. */
    role?: ViewProps['role'] | 'listbox';
    ref?: Ref<ComponentRef<typeof View>>;
  }
>;

export const StyledText: ComponentType<TextProps & { ref?: Ref<ComponentRef<typeof Text>> }> = Text;

/** Bloom's one raster renderer (expo-image on a device), never react-native's `Image`. */
export const StyledImage: ComponentType<BloomImageProps> = BloomImage;

export const StyledPressable = Pressable as ComponentType<StyledPressableProps>;

export const StyledScrollView: ComponentType<
  ScrollViewProps & { ref?: Ref<ComponentRef<typeof ScrollView>> }
> = ScrollView;
