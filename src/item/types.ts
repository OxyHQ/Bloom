import type { BloomSize } from '../appearance';
import type {
  AccessibilityRole,
  MouseEvent as NativeMouseEvent,
  StyleProp,
  TextStyle,
  ViewStyle,
} from 'react-native';

export interface ItemProps {
  /** Inherits BloomScope; md is the normal row. */
  size?: BloomSize;
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
  /**
   * The pointer came to rest on a pressable row. A keyboard-driven list (a
   * command palette, a combobox) moves its `highlighted` row here, so pointer
   * and keyboard share one cursor. Only a platform with a real pointer calls
   * it, and a disabled row does not.
   */
  onHoverIn?: (event: NativeMouseEvent) => void;
  /** The pointer left a pressable row. See {@link ItemProps.onHoverIn}. */
  onHoverOut?: (event: NativeMouseEvent) => void;
  disabled?: boolean;
  /** Render the title in the theme's negative/error color. */
  destructive?: boolean;
  /**
   * Selected state — applies a subtle highlighted background. Useful when
   * `Item` is used as an option inside an overlay (combobox, command, menu).
   */
  selected?: boolean;
  /** The "you are here" state: the current route in a navigation list. */
  active?: boolean;
  /**
   * The keyboard's cursor in a list the field above it drives (arrow keys over
   * a combobox or a composer's suggestions). Paints the hover wash, since it
   * is the same claim as the pointer resting on the row, and announces
   * nothing: the row is neither chosen (`selected`) nor current (`active`).
   */
  highlighted?: boolean;
  /** Legacy explicit geometry. Prefer size for new composition; omitted density inherits BloomScope. */
  density?: 'comfortable' | 'compact';
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  subtitleStyle?: StyleProp<TextStyle>;
  /**
   * Lines a string `title` may take before it truncates. Default `1`; `0` never
   * truncates. For a row whose title is long in some languages, where cutting
   * it off loses what the row is.
   */
  titleNumberOfLines?: number;
  /**
   * Lines a string `subtitle` may take before it truncates. Default `2`; `0`
   * never truncates: an explanatory row whose sentence must be read whole.
   */
  subtitleNumberOfLines?: number;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: AccessibilityRole;
  /**
   * Web ARIA role override. Use `'option'` for combobox/listbox items (RN's
   * `accessibilityRole` has no `'option'`), and `'radio'` / `'checkbox'` for a
   * single- or multi-choice list. Each role scopes which state ARIA allows, and
   * `Item` spells the matching one — see the `selectedAria` branch in
   * `Item.tsx`.
   */
  role?: 'option' | 'radio' | 'checkbox' | 'menuitem' | 'listitem';
  /**
   * Whether the row DISCLOSES something (a sub-menu, an accordion section).
   * Emitted as `aria-expanded`, which React Native folds back into
   * `accessibilityState` — so, unlike `accessibilityState.expanded` alone, it
   * reaches web as well.
   */
  expanded?: boolean;
  testID?: string;
}
