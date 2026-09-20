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
    <View testID="social-surface" style={{ padding: 16, maxWidth: '100%', gap: 24, backgroundColor: theme.colors.background }}>
      {children}
    </View>
  );
}

/** Sign in with Oxy: colorful (the primary button), white and black, plus icon-only. */
export const SignInWithOxy: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Surface>
      <View style={{ gap: 12, width: 300, maxWidth: '100%' }}>
        <SocialButton brand="oxy" action="signIn" />
        <SocialButton brand="oxy" action="signIn" appearance="white" />
        <SocialButton brand="oxy" action="signIn" appearance="black" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          <SocialButton brand="oxy" action="signIn" iconOnly />
          <SocialButton brand="oxy" action="signIn" appearance="white" iconOnly />
        </View>
      </View>
    </Surface>
  ),
};

/** A realistic sign-in stack: the three providers most screens offer. */
export const SignInStack: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Surface>
      <View style={{ gap: 12, width: 300, maxWidth: '100%' }}>
        <SocialButton brand="google" appearance="white" />
        <SocialButton brand="apple" appearance="black" />
        <SocialButton brand="github" appearance="white" href="https://github.com/login" />
      </View>
    </Surface>
  ),
};

/** Every provider in every appearance, medium. */
export const AllBrands: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Surface>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
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
  parameters: { controls: { disable: true } },
  render: () => (
    <Surface>
      {APPEARANCES.map((appearance) => (
        <View key={appearance} style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
            <SocialButton brand="google" appearance={appearance} size="md" />
            <SocialButton brand="google" appearance={appearance} size="sm" />
            <SocialButton brand="google" appearance={appearance} size="md" iconOnly />
            <SocialButton brand="google" appearance={appearance} size="sm" iconOnly />
            <SocialButton brand="slack" appearance={appearance} iconOnly />
            <SocialButton brand="apple" appearance={appearance} iconOnly />
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
            <SocialButton brand="figma" appearance={appearance} disabled />
            <SocialButton brand="google" appearance={appearance} disabled size="sm" />
            <SocialButton brand="discord" appearance={appearance}>
              Sign up with Discord
            </SocialButton>
          </View>
          <View style={{ width: 420, maxWidth: '100%' }}>
            <SocialButton brand="microsoft" appearance={appearance} fullWidth />
          </View>
        </View>
      ))}
    </Surface>
  ),
};

/** Small, every provider, icon-only rows. */
export const IconOnly: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Surface>
      {APPEARANCES.map((appearance) => (
        <View key={appearance} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {BRANDS.map((brand) => (
            <SocialButton key={brand} brand={brand} appearance={appearance} iconOnly size="sm" />
          ))}
        </View>
      ))}
    </Surface>
  ),
};

/** `brand="custom"` — your own identity provider. */
export const Custom: Story = {
  parameters: { controls: { disable: true } },
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

/** A single instance whose controls are applied directly to the rendered component. */
export const Playground: StoryObj<typeof SocialButton> = {
  args: { brand: 'google', appearance: 'white', action: 'continue', size: 'md', iconOnly: false, disabled: false, fullWidth: true },
  parameters: { controls: { disable: false, include: ['brand', 'appearance', 'action', 'size', 'iconOnly', 'disabled'] } },
  argTypes: { brand: { control: 'select', options: ['google', 'apple', 'github', 'oxy'] }, appearance: { control: 'select', options: ['colorful', 'black', 'white'] }, action: { control: 'select', options: ['continue', 'signIn', 'signUp'] }, size: { control: 'select', options: ['sm', 'md'] }, iconOnly: { control: 'boolean' }, disabled: { control: 'boolean' } },
  render: function Playground(args) {

    return <View style={{ width: 440, maxWidth: '100%' }}><SocialButton {...args} /></View>;
  },
};
