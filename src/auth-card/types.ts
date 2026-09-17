import type { ReactNode } from 'react';
import type { ImageSourcePropType, StyleProp, ViewStyle } from 'react-native';

import type { SocialProvider } from '../social-button';

/** A built-in sign-in provider — `SocialButton`'s set. */
export type AuthProvider = SocialProvider;

/**
 * How the provider buttons are arranged.
 *
 *   `stacked`  full-width buttons with labels, one per row.
 *   `inline`   icon-only 36px squares side by side, wrapping, centred.
 *   `grid`     icon-only across equal columns sharing the full width.
 */
export type AuthLayout = 'stacked' | 'inline' | 'grid';

/** `signin` (default), `signup`, or `verify` for the one-time-code step. */
export type AuthMode = 'signin' | 'signup' | 'verify';

/**
 * What the form holds when it is submitted — the browser's `onSubmit` hands a
 * form's `FormData`; React Native has no form element, so the same named fields
 * arrive as a typed object. Only the fields the mode renders are present.
 */
export interface AuthCardValues {
  /** `signup` without `confirmPassword`. */
  name?: string;
  /** `signin` and `signup`. */
  email?: string;
  /** `signin` and `signup`. */
  password?: string;
  /** `signup` with `confirmPassword`. */
  confirmPassword?: string;
  /** `signin`: the "Remember me" checkbox. */
  remember?: boolean;
  /** `verify`: the digits typed so far. */
  code?: string;
}

export interface AuthCardProps {
  /**
   * `signin` (default), `signup`, or `verify`. `verify` swaps the email fields
   * for OTP boxes and drops the providers: the visitor has already chosen how
   * they are signing in.
   */
  mode?: AuthMode;
  /** `verify` only: the address the code went to, shown in the description. */
  email?: string;
  /** `verify` only: how many digits. Defaults to 6. */
  codeLength?: number;
  /** `verify` only: fires once the last box is filled. */
  onComplete?: (code: string) => void;
  /** `verify` only: the resend action. */
  onResend?: () => void;
  /** How the provider buttons are arranged. Defaults to `stacked`. */
  layout?: AuthLayout;
  /** Defaults to Google, Apple, GitHub. An empty array hides the section. */
  providers?: AuthProvider[];
  title?: ReactNode;
  description?: ReactNode;
  /**
   * Artwork for the right half. Passing it turns the card into the split
   * layout — form left, media right — which drops to the form alone below the
   * `md` breakpoint (768) rather than stacking a tall image above the fields.
   * `AuthMediaCarousel` is the batteries-included option.
   */
  media?: ReactNode;
  /** Mark above the title. `verify` shows a mail-check glyph when omitted. */
  logo?: ReactNode;
  /** Centre the heading and the mark. */
  centered?: boolean;
  /** Sign-up only: adds a stacked confirm-password field. */
  confirmPassword?: boolean;
  /** Small print under the card, outside its border. */
  footnote?: ReactNode;
  /** Fires with the form's values when the CTA is pressed (or Enter on web). */
  onSubmit?: (values: AuthCardValues) => void;
  /** A provider button was pressed. */
  onProvider?: (provider: AuthProvider) => void;
  /**
   * Footer link target, e.g. the opposite mode. Rendered as a real `<a href>`
   * on web; routed through `onNavigate` when that is given.
   */
  switchHref?: string;
  /** The footer link was pressed ("Create an account" / "Sign in"). */
  onSwitch?: () => void;
  /** "Forgot password?" target on web. */
  forgotPasswordHref?: string;
  /** "Forgot password?" was pressed. */
  onForgotPassword?: () => void;
  /**
   * Client-side routing for the card's links: called with the `href` instead
   * of letting the browser navigate. Without it a web link is a plain anchor.
   */
  onNavigate?: (href: string) => void;
  /**
   * Heading level for the title. Defaults to `1`, because on a real sign-in
   * screen the card IS the page; drop it to `2`+ where the card is embedded.
   */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface AuthMediaSlide {
  /** A URL string or any React Native image source. */
  source: string | ImageSourcePropType;
  /** Decorative by default: the artwork carries no information the form needs. */
  alt?: string;
}

export interface AuthMediaCarouselProps {
  slides: AuthMediaSlide[];
  /** Milliseconds a slide rests at full bleed before the transition begins. */
  interval?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
