import {
  SocialButton as BloomSocialButton,
  type SocialBrand,
  type SocialBrandConfig,
} from '@oxy.so/bloom/social-button';

import { ENUMS } from '../generated/spec.generated';
import { Node, type ViewModifiers } from '../node';
import type { ControlRenderer } from './draw';

/** A sign-in button for an identity provider (Bloom `social-button`). */
export type SocialButtonKind = 'socialButton';

/** `colorful` (the brand's fill, default), `black`, or `white` (outlined, the real multi-colour mark). */
export type SocialButtonStyle = (typeof ENUMS.socialButtonStyle)[number];
/** The verb of its default title: "Continue with…" (default), "Sign in with…", "Sign up with…". */
export type SocialIntent = (typeof ENUMS.socialIntent)[number];

/** Bloom `SocialButton`: the provider's logo, colour and title together. */
export interface SocialButtonView extends ViewModifiers<SocialButtonView> {
  /** `md` (36 × 300, default) or `sm` (32 × 250). */
  size(value: 'md' | 'sm'): SocialButtonView;
  style(value: SocialButtonStyle): SocialButtonView;
  /** A circle with the logo alone; its title becomes its name. */
  iconOnly(): SocialButtonView;
  /** It fills its container instead of its fixed width. */
  fullWidth(): SocialButtonView;
  intent(value: SocialIntent): SocialButtonView;
  /** A link: an OAuth start is a navigation (an anchor on the web). */
  link(href: string): SocialButtonView;
  disabled(value?: boolean): SocialButtonView;
}

/**
 * Bloom `SocialButton`: a built-in provider (`'google'`, `'apple'`…), or a
 * brand of your own (its icon, name and colour); `title` replaces the
 * default ("Continue with Google", in the app's language).
 */
export function SocialButton(
  brand: Exclude<SocialBrand, 'custom'> | SocialBrandConfig,
  title?: string,
): SocialButtonView {
  return new Node('socialButton', { brand, title }, []);
}

export const SOCIAL_BUTTONS: Record<SocialButtonKind, ControlRenderer> = {
  socialButton: (d) => {
    const { brand, title } = d.node.props as {
      brand: Exclude<SocialBrand, 'custom'> | SocialBrandConfig;
      title?: string;
    };
    const props = d.props();
    Object.assign(props, {
      brand: typeof brand === 'string' ? brand : 'custom',
      config: typeof brand === 'string' ? undefined : brand,
      size: d.own('size')?.value,
      appearance: d.own('style')?.value,
      iconOnly: d.own('iconOnly') === undefined ? undefined : true,
      fullWidth: d.own('fullWidth') === undefined ? undefined : true,
      action: d.own('intent')?.value,
      href: d.own('link')?.value,
      disabled: d.own('disabled')?.value,
      accessibilityHint: d.hint,
      testID: d.testID,
    });
    return d.component(BloomSocialButton, props, title);
  },
};
