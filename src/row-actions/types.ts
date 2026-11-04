import type { StyleProp, ViewStyle } from 'react-native';

import type { ButtonProps } from '../button/types';
import type { BloomIconComponent } from '../icons/icon-component';

/** The two looks of a row action: borderless (default) or a bordered button. */
export type RowActionAppearance = 'plain' | 'outline';

export interface RowActionButtonProps
  extends Omit<
    ButtonProps,
    | 'children'
    | 'variant'
    | 'size'
    | 'iconOnly'
    | 'icon'
    | 'leadingIcon'
    | 'trailingIcon'
    | 'appearance'
  > {
  /** The glyph, drawn at 16px. */
  icon: BloomIconComponent;
  /** Accessible name, and the tooltip's text. */
  label: string;
  /** Paints the pressed state while a menu this button opened is showing. */
  active?: boolean;
  /** Show the hover/focus tooltip (web). Defaults to `true`. */
  tooltip?: boolean;
  /** Defaults to `'plain'`. */
  appearance?: RowActionAppearance;
}

/** One icon button of a row. */
export interface RowActionItem {
  icon: BloomIconComponent;
  /** The button's tooltip, and its name unless `accessibilityLabel` says more. */
  label: string;
  /** A fuller name than the tooltip, e.g. naming the row: "Delete Invoice.pdf". */
  accessibilityLabel?: string;
  onPress?: () => void;
}

/** One entry of the row's "⋮" menu. */
export interface RowActionMenuItem extends Omit<RowActionItem, 'icon'> {
  /** Leading 18px glyph. */
  icon?: BloomIconComponent;
}

export interface RowActionsProps {
  /** Names the row in the menu's accessible name: `` `More actions for ${name}` ``. */
  name: string;
  /** The icon buttons before the menu, in order — e.g. Delete, Edit. */
  actions?: readonly RowActionItem[];
  /** The "⋮" menu's entries. Without any, no menu button is drawn. */
  menu?: readonly RowActionMenuItem[];
  /** The menu button's tooltip (`"More actions"` in English). */
  menuLabel?: string;
  /** The menu button's look. Defaults to `'plain'`, like the icon buttons. */
  menuAppearance?: RowActionAppearance;
  /** The menu's width in px. Defaults to `220`. */
  menuWidth?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
