import type { ReactNode } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';

import type { SocialProvider } from './providers';

/** A built-in provider, or `custom` for anything else (see {@link SocialBrandConfig}). */
export type SocialBrand = SocialProvider | 'custom';

/** `medium` 36 tall × 300 wide, `small` 32 × 250 — `Button`'s medium and small heights. */
export type SocialButtonSize = 'medium' | 'small';

/**
 * - `colorful` (default) fills with the brand colour, a white glyph on it.
 * - `black` is the same shape in solid near-black.
 * - `white` is the outlined treatment (the secondary button) and the one that
 *   shows each provider's real multi-colour mark.
 */
export type SocialButtonAppearance = 'colorful' | 'black' | 'white';

/**
 * The verb of the default label: `continue` — "Continue with Google" (the
 * default), `signIn` — "Sign in with Google", `signUp` — "Sign up with Google".
 */
export type SocialButtonAction = 'continue' | 'signIn' | 'signUp';

/** Everything a brand needs, for providers that are not built in. */
export interface SocialBrandConfig {
  /** The logo, rendered inside the glyph box (18 / 16). */
  icon: ReactNode;
  /** Used in the label and as the accessible name. Defaults to `"SSO"`. */
  label?: string;
  /**
   * Fill for `colorful`, as `#rrggbb` or `rgb()`. Defaults to black. Any other
   * colour syntax paints flat, without the derived gradient stop.
   */
  color?: string;
}

export interface SocialButtonProps {
  /** The provider. Supplies the logo, the brand colour and the label together. */
  brand: SocialBrand;
  /** Required when `brand="custom"`; ignored otherwise. */
  config?: SocialBrandConfig;
  /** Defaults to `'medium'`. */
  size?: SocialButtonSize;
  /** Defaults to `'colorful'`. */
  appearance?: SocialButtonAppearance;
  /** Square (circular) button showing only the logo; the label becomes the accessible name. */
  iconOnly?: boolean;
  /** Drop the fixed width and fill the container instead. */
  fullWidth?: boolean;
  /** The verb of the default label and accessible name. Defaults to `'continue'`. */
  action?: SocialButtonAction;
  /** The label. Defaults to the `action` phrase, e.g. `"Continue with <Brand>"`. */
  children?: ReactNode;
  onPress?: () => void;
  /**
   * Makes the button a link — OAuth starts are navigations. On web it renders
   * a real `<a href>`; on native a press opens it with `Linking.openURL` after
   * `onPress` runs. Dropped while `disabled`.
   */
  href?: string;
  /** Dims to 60% and ignores presses. */
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Label text style override. */
  textStyle?: StyleProp<TextStyle>;
  className?: string;
  /**
   * Overrides the accessible name. Defaults to the visible label, or to the
   * `action` phrase (`"Continue with <Brand>"`) when `iconOnly`.
   */
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}
