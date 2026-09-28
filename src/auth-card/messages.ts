import { defineMessages, type MessageCatalog } from '../locale/messages';
import type { AuthMode } from './types';

/** The heading, call to action and footer link of one `AuthCard` mode. */
export interface AuthModeMessages {
  title: string;
  description: string;
  cta: string;
  /** The footer's lead-in ("New here?"). */
  switchLead: string;
  /** The footer's link ("Create an account"). */
  switchAction: string;
}

/**
 * Every fixed string `AuthCard` draws or announces, in each Bloom language.
 * `title` and `description` props still win over the mode's entries.
 */
export interface AuthCardMessages {
  modes: Record<AuthMode, AuthModeMessages>;
  /**
   * `verify`'s description when `email` is given. The address sits wherever
   * the language puts it; the card draws it in a heavier weight.
   */
  codeSentTo: (email: string) => string;
  verificationCode: string;
  fullName: string;
  /** An example full name, in the language's own naming. */
  namePlaceholder: string;
  email: string;
  emailPlaceholder: string;
  /** Sign-up's hint under the email field. */
  emailHint: string;
  password: string;
  /** Sign-in's password placeholder. */
  passwordPlaceholder: string;
  /** Sign-up's password placeholder. */
  newPasswordPlaceholder: string;
  confirmPassword: string;
  confirmPasswordPlaceholder: string;
  rememberMe: string;
  forgotPassword: string;
  /** Sign-up's small print when no `footnote` is given. */
  terms: string;
  /** The divider above the provider buttons. */
  orContinueWith: string;
}

export const AUTH_CARD_MESSAGES: MessageCatalog<AuthCardMessages> = defineMessages<AuthCardMessages>('AUTH_CARD_MESSAGES', {
  modes: {
    signin: {
      title: 'Welcome back',
      description: 'Sign in to pick up where you left off.',
      cta: 'Sign in',
      switchLead: 'New here?',
      switchAction: 'Create an account',
    },
    signup: {
      title: 'Create your account',
      description: 'Start building in a couple of minutes.',
      cta: 'Create account',
      switchLead: 'Already have an account?',
      switchAction: 'Sign in',
    },
    verify: {
      title: 'Check your inbox',
      description: 'Enter the code we sent to finish signing in.',
      cta: 'Verify and continue',
      switchLead: 'Code not arriving?',
      switchAction: 'Send a new one',
    },
  },
  codeSentTo: (email) => `Enter the code we sent to ${email} to finish signing in.`,
  verificationCode: 'Verification code',
  fullName: 'Full name',
  namePlaceholder: 'Ada Lovelace',
  email: 'Email',
  emailPlaceholder: 'you@company.com',
  emailHint: 'We use this to contact you, and never share it.',
  password: 'Password',
  passwordPlaceholder: 'Enter your password',
  newPasswordPlaceholder: 'At least 8 characters',
  confirmPassword: 'Confirm password',
  confirmPasswordPlaceholder: 'Repeat your password',
  rememberMe: 'Remember me',
  forgotPassword: 'Forgot password?',
  terms: 'By creating an account you agree to our Terms of Service and Privacy Policy.',
  orContinueWith: 'or continue with',
});
