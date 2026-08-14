import type { AccessibilityRole, StyleProp, TextStyle, ViewStyle } from 'react-native';

export interface ItemProps {
  /** Primary title text. */
  title?: React.ReactNode;
  /** Secondary text rendered below the title. */
  subtitle?: React.ReactNode;
  /**
   * Arbitrary body content. When provided it replaces the
   * `title`/`subtitle` text column — use it for fully custom rows.
   */
  children?: React.ReactNode;
  /** Leading slot (icon, avatar, radio, etc.). */
  leading?: React.ReactNode;
  /** Trailing slot (chevron, switch, badge, value text, etc.). */
  trailing?: React.ReactNode;
  /** Makes the row pressable. */
  onPress?: () => void;
  /** Long-press handler. Only honored when the row is pressable. */
  onLongPress?: () => void;
  disabled?: boolean;
  /** Render the title in the theme's negative/error color. */
  destructive?: boolean;
  /**
   * Selected state — applies a subtle highlighted background. Useful when
   * `Item` is used as an option inside an overlay (combobox, command, menu).
   */
  selected?: boolean;
  /** Highlighted (keyboard-focused) state for overlay lists. */
  active?: boolean;
  /** Vertical density. Defaults to `'comfortable'`. */
  density?: 'comfortable' | 'compact';
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  subtitleStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: AccessibilityRole;
  /**
   * Web ARIA role override. Use `'option'` for combobox/listbox items (RN's
   * `accessibilityRole` has no `'option'`) and `'radio'` for a single-choice
   * list. Each role scopes which state ARIA allows, and `Item` spells the
   * matching one — see the `selectedAria` branch in `Item.tsx`.
   */
  role?: 'option' | 'radio' | 'menuitem' | 'listitem';
  testID?: string;
}
