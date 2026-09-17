import React from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Text } from '../typography';
import { useTheme } from '../theme/use-theme';
import { SocialButton, SOCIAL_PROVIDERS, type SocialButtonAppearance, type SocialProvider } from './index';

const meta: Meta<typeof SocialButton> = {
  title: 'Base/Social Button',
  component: SocialButton,
};

export default meta;

type Story = StoryObj<typeof SocialButton>;

const BRANDS = Object.keys(SOCIAL_PROVIDERS) as SocialProvider[];
const APPEARANCES: SocialButtonAppearance[] = ['colorful', 'black', 'white'];

function Surface({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View testID="social-surface" style={{ padding: 24, gap: 24, backgroundColor: theme.colors.background }}>
      {children}
    </View>
  );
}

/** A realistic sign-in stack: the three providers most screens offer. */
export const SignInStack: Story = {
  render: () => (
    <Surface>
      <View style={{ gap: 12, width: 300 }}>
        <SocialButton brand="google" appearance="white" />
        <SocialButton brand="apple" appearance="black" />
        <SocialButton brand="github" appearance="white" href="https://github.com/login" />
      </View>
    </Surface>
  ),
};

/** Every provider in every appearance, medium. */
export const AllBrands: Story = {
  render: () => (
    <Surface>
      <View style={{ flexDirection: 'row', gap: 16 }}>
        {APPEARANCES.map((appearance) => (
          <View key={appearance} style={{ gap: 8 }}>
            <Text variant="body-medium">{appearance}</Text>
            {BRANDS.map((brand) => (
              <SocialButton key={brand} testID={`${appearance}-${brand}`} brand={brand} appearance={appearance} />
            ))}
          </View>
        ))}
      </View>
    </Surface>
  ),
};

/** Sizes, icon-only, full width and disabled, per appearance. */
export const Variants: Story = {
  render: () => (
    <Surface>
      {APPEARANCES.map((appearance) => (
        <View key={appearance} style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <SocialButton brand="google" appearance={appearance} size="medium" />
            <SocialButton brand="google" appearance={appearance} size="small" />
            <SocialButton brand="google" appearance={appearance} size="medium" iconOnly />
            <SocialButton brand="google" appearance={appearance} size="small" iconOnly />
            <SocialButton brand="slack" appearance={appearance} iconOnly />
            <SocialButton brand="apple" appearance={appearance} iconOnly />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <SocialButton brand="figma" appearance={appearance} disabled />
            <SocialButton brand="google" appearance={appearance} disabled size="small" />
            <SocialButton brand="discord" appearance={appearance}>
              Sign up with Discord
            </SocialButton>
          </View>
          <View style={{ width: 420 }}>
            <SocialButton brand="microsoft" appearance={appearance} fullWidth />
          </View>
        </View>
      ))}
    </Surface>
  ),
};

/** Small, every provider, icon-only rows. */
export const IconOnly: Story = {
  render: () => (
    <Surface>
      {APPEARANCES.map((appearance) => (
        <View key={appearance} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {BRANDS.map((brand) => (
            <SocialButton key={brand} brand={brand} appearance={appearance} iconOnly size="small" />
          ))}
        </View>
      ))}
    </Surface>
  ),
};

/** `brand="custom"` — your own identity provider. */
export const Custom: Story = {
  render: () => (
    <Surface>
      <View style={{ gap: 8 }}>
        {APPEARANCES.map((appearance) => (
          <SocialButton
            key={appearance}
            brand="custom"
            appearance={appearance}
            config={{
              label: 'Acme SSO',
              color: '#7C3AED',
              icon: (
                <Svg width={18} height={18} viewBox="0 0 24 24">
                  <Path
                    d="M12 2 3 7v10l9 5 9-5V7l-9-5Z"
                    fill={appearance === 'white' ? '#7C3AED' : '#FFFFFF'}
                  />
                </Svg>
              ),
            }}
          />
        ))}
      </View>
    </Surface>
  ),
};
