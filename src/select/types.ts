import type { StyleProp, TextStyle, View, ViewStyle } from 'react-native';

import type { Props as SVGIconProps } from '../icons/shared';

/** Two select densities: `md` (38px trigger) and `sm` (28px). */
export type SelectSize = 'sm' | 'md';

export type SelectProps = {
  children?: React.ReactNode;
  /**
   * `md` (default) or `sm` for compact contexts — the trigger's padding, type
   * and chevron, and the option rows' padding and type.
   */
  size?: SelectSize;
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
};

export type SelectTriggerProps = {
  children?: React.ReactNode;
  /**
   * Render the single element child AS the trigger, merging the open handler
   * and a11y props into it. Without it the children render inside Bloom's own
   * pressable. The same escape hatch every anchored Bloom family offers.
   */
  asChild?: boolean;
  disabled?: boolean;
  label: string;
  /**
   * Utility classes APPENDED to the part's own — never substituted for them, so
   * a single layout class cannot strip the chrome.
   */
  className?: string;
  /**
   * Style for the TRIGGER BOX (the slot around the field). To restyle the
   * bordered field itself, use `fieldStyle`.
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Inline style on the bordered field itself, applied after its own — the
   * unambiguous override for a trigger embedded in another control (the
   * phone input's country code uses `rounded-lg px-1.5 py-1`). Use longhands
   * (`paddingLeft`, not `paddingHorizontal`), which is what outranks the
   * field's own padding classes on web.
   */
  fieldStyle?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * Shows the currently selected value inside a `SelectTrigger`.
 *
 * Pass a `children` function to extract a display string from the selected
 * item when items are not plain `{ value, label }` objects.
 */
export type SelectValueProps = {
  /**
   * Extracts the display text from the currently-selected item.
   * Defaults to `item => item.label`.
   */
  children?: (value: unknown) => React.ReactNode;
  /**
   * A node before the value — a status dot, an icon — laid out `gap-[5px]`
   * (`gap-1` on `sm`), the way the trigger shows an option whose content
   * leads with one. A function receives the selected item (`undefined` while
   * nothing is chosen), so the mark can follow the value.
   */
  leading?: React.ReactNode | ((item: unknown) => React.ReactNode);
  placeholder?: string;
  className?: string;
  style?: TextStyle;
};

export type SelectIconProps = {
  style?: TextStyle;
};

export type SelectContentProps<T> = {
  /**
   * Label displayed at the top of the selection sheet (native) or
   * used as an ARIA label (web).
   *
   * @default "Select an option"
   */
  label?: string;
  /** The array of items to choose from. */
  items: readonly T[];
  /** Renders a single item. Use `SelectItem` inside this callback. */
  renderItem: (
    item: T,
    index: number,
    selectedValue?: string | null,
  ) => React.ReactElement;
  /**
   * Extracts a unique string key from an item.
   * Defaults to `item => item.value`.
   */
  valueExtractor?: (item: T) => string;
  /**
   * Tallest the anchored dropdown grows before its options scroll (web only —
   * the native sheet sizes itself). Defaults to 240.
   */
  maxHeight?: number;
  /**
   * A FIXED width for the web dropdown (`popoverClassName="w-[220px]"`). By
   * default the panel is at least 266px and at least the trigger's width.
   * The native sheet sizes itself and ignores it.
   */
  width?: number;
  /** Appended to the dropdown panel's own chrome. */
  className?: string;
};

export type SelectGroupProps = {
  children?: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

export type SelectLabelProps = {
  children?: React.ReactNode;
  className?: string;
  style?: StyleProp<TextStyle>;
};

export type SelectScrollButtonProps = {
  direction: 'up' | 'down';
  className?: string;
  style?: StyleProp<ViewStyle>;
};

export type SelectItemProps = {
  ref?: React.Ref<View>;
  value: string;
  label: string;
  /** Not choosable: `text-disabled`, `cursor-not-allowed`, no press. */
  disabled?: boolean;
  /** A node before the option's content — a status dot, an icon — 8px from it. */
  leading?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

export type SelectItemTextProps = {
  children: React.ReactNode;
  className?: string;
  style?: TextStyle;
};

export type SelectItemIndicatorProps = {
  icon?: React.ComponentType<SVGIconProps>;
};

/**
 * What a row publishes to `SelectItemText` and `SelectItemIndicator`.
 *
 * `selected` and `disabled` — both computed from props, both read by a part
 * (`SelectItemIndicator`, `SelectItemText`). It used to carry `hovered`, `focused` and
 * `pressed` as well — three members no part in the library ever read, two of
 * which were hardcoded literals (`hovered: false` on native, `pressed: false` on
 * web) rather than computed at all. A context member that is a literal is worse
 * than an absent one: it answers the question wrongly instead of not answering.
 */
export type SelectItemContextValue = {
  selected: boolean;
  /** Read by `SelectItemText`, which paints `text-disabled`. */
  disabled: boolean;
};
