/**
 * React Native's `View` and `Pressable` typed with the web props
 * react-native-web forwards (a `listbox` role, `aria-*` on a pressable), for
 * Bloom's own hosts. They are React Native's components themselves, only
 * widened types: Bloom styles through `style` alone (`docs/no-nativewind.mdx`).
 */
import type { ComponentRef, ComponentType, Ref } from 'react';
import {
  Pressable,
  View,
  type PressableProps,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';

type AriaPressableBase = Omit<PressableProps, 'style'> & {
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

export type AriaPressableProps = Omit<AriaPressableBase, 'role'> &
  WebAriaProps & {
    /** RNW supports these menu roles; native callers retain checkbox/radio. */
    role?: PressableProps['role'] | 'menuitemcheckbox' | 'menuitemradio';
    ref?: Ref<ComponentRef<typeof View>>;
  };

/** `View` with the web-only `listbox` role React Native's `Role` lacks. */
export const AriaView = View as ComponentType<
  Omit<ViewProps, 'role'> & {
    /** Web-only listbox semantics; RN's Role type does not include this role. */
    role?: ViewProps['role'] | 'listbox';
    ref?: Ref<ComponentRef<typeof View>>;
  }
>;

/** `Pressable` with the web ARIA props and menu roles react-native-web forwards. */
export const AriaPressable = Pressable as ComponentType<AriaPressableProps>;
