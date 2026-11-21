import { SocialButton } from '@oxy.so/bloom/social-button';
import { RiKey2Line } from '@oxy.so/bloom/icons';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const press = () => {};
const SSO = {
  icon: <RiKey2Line width={18} height={18} fill="#fff" />,
  label: 'Acme SSO',
  color: '#0f766e',
};

export const SOCIAL_BUTTON_CASES: readonly ParityCase[] = [
  ...(['oxy', 'google', 'apple', 'github'] as const).flatMap((brand) =>
    ENUMS.socialButtonStyle.map((style) => ({
      name: `a ${style} ${brand} button`,
      language: () => toElement(L.SocialButton(brand).style(style).onPress(press)),
      bloom: () => <SocialButton brand={brand} appearance={style} onPress={press} />,
    })),
  ),
  ...ENUMS.socialIntent.map((intent) => ({
    name: `a small button to ${intent}`,
    language: () => toElement(L.SocialButton('oxy').intent(intent).size('sm')),
    bloom: () => <SocialButton brand="oxy" action={intent} size="sm" />,
  })),
  {
    name: 'an icon-only button, named',
    language: () =>
      toElement(L.SocialButton('google').iconOnly().style('white').label('Google').testID('g')),
    bloom: () => (
      <SocialButton
        brand="google"
        iconOnly
        appearance="white"
        accessibilityLabel="Google"
        testID="g"
      />
    ),
  },
  {
    name: 'a full-width link with a title of its own',
    language: () =>
      toElement(
        L.SocialButton('apple', 'Use Apple')
          .fullWidth()
          .link('https://example.com/oauth/apple')
          .hint('Opens Apple'),
      ),
    bloom: () => (
      <SocialButton
        brand="apple"
        fullWidth
        href="https://example.com/oauth/apple"
        accessibilityHint="Opens Apple"
      >
        Use Apple
      </SocialButton>
    ),
  },
  {
    name: 'a brand of its own, disabled, padded',
    language: () => toElement(L.SocialButton(SSO).disabled().padding('sm')),
    bloom: () => (
      <SocialButton
        brand="custom"
        config={SSO}
        disabled
        style={{ paddingTop: 8, paddingBottom: 8, paddingStart: 8, paddingEnd: 8 }}
      />
    ),
  },
];
