import { Button } from '../button/index.web';
import { createSocialButton } from './SocialButtonBase';
export { socialButtonLabel, SOCIAL_BUTTON_GEOMETRY } from './SocialButtonBase';
export const SocialButton = createSocialButton(Button);
