import { SocialButton } from '@bloom/social-button';
import type { Cases } from '../support/cases';

export const CASES: Cases = {
  'SocialButton plain': () => <SocialButton brand="google" onPress={() => {}} />,
  'SocialButton icon only, full width, disabled': () => (
    <>
      <SocialButton brand="github" iconOnly onPress={() => {}} />
      <SocialButton
        brand="apple"
        fullWidth
        disabled
        action="signIn"
        appearance="black"
        size="sm"
        onPress={() => {}}
      />
    </>
  ),
};
