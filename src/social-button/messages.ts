import { defineMessages, type MessageCatalog } from '../locale/messages';
import type { SocialButtonAction } from './types';

/**
 * Every fixed string the social-button family draws or announces, in each
 * Bloom language. A button's `children` and `accessibilityLabel` still win.
 */
export interface SocialButtonMessages {
  /**
   * The default label and icon-only name, given the brand: a whole phrase per
   * language, since the brand sits before the verb in some ("Google ile giriş yap").
   */
  actions: Record<SocialButtonAction, (brand: string) => string>;
}

export const SOCIAL_BUTTON_MESSAGES: MessageCatalog<SocialButtonMessages> =
  defineMessages<SocialButtonMessages>('SOCIAL_BUTTON_MESSAGES', {
    actions: {
      continue: (b) => `Continue with ${b}`,
      signIn: (b) => `Sign in with ${b}`,
      signUp: (b) => `Sign up with ${b}`,
    },
  });
