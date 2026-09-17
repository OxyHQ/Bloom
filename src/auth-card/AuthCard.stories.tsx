import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Text } from '../typography';
import { AuthCard, AuthMediaCarousel } from './index';
import type { AuthMediaSlide } from './types';

const meta: Meta<typeof AuthCard> = {
  title: 'Blocks/Auth Card',
  component: AuthCard,
};

export default meta;

type Story = StoryObj<typeof AuthCard>;

/** Demo artwork — remote placeholders, so the story ships no binary assets. */
const SLIDES: AuthMediaSlide[] = [
  { source: 'https://picsum.photos/seed/bloom-auth-floral/900/1000' },
  { source: 'https://picsum.photos/seed/bloom-auth-sunrise/900/1000' },
  { source: 'https://picsum.photos/seed/bloom-auth-kitchen/900/1000' },
];

function Page({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ padding: 40, alignItems: 'center', width: '100%' }}>{children}</View>
  );
}

/** Sign in, stacked providers — the default. */
export const SignIn: Story = {
  render: () => (
    <Page>
      <AuthCard testID="auth" headingLevel={2} onSubmit={(values) => console.log(values)} />
    </Page>
  ),
};

/** Icon-only providers side by side, wrapping. */
export const Inline: Story = {
  render: () => (
    <Page>
      <AuthCard testID="auth" layout="inline" providers={['google', 'apple', 'github', 'x']} headingLevel={2} />
    </Page>
  ),
};

/** Icon-only providers across equal columns. */
export const Grid: Story = {
  render: () => (
    <Page>
      <AuthCard testID="auth" layout="grid" headingLevel={2} />
    </Page>
  ),
};

export const SignUp: Story = {
  render: () => (
    <Page>
      <AuthCard testID="auth" mode="signup" headingLevel={2} />
    </Page>
  ),
};

/** Stacked password pair, terms moved under the card through `footnote`. */
export const SignUpConfirmPassword: Story = {
  render: () => (
    <Page>
      <AuthCard
        testID="auth"
        mode="signup"
        confirmPassword
        layout="grid"
        headingLevel={2}
        footnote="By creating an account you agree to our Terms of Service and Privacy Policy."
      />
    </Page>
  ),
};

export const Verify: Story = {
  render: () => (
    <Page>
      <AuthCard testID="auth" mode="verify" email="ada@company.com" headingLevel={2} />
    </Page>
  ),
};

export const CenteredWithLogo: Story = {
  render: () => (
    <Page>
      <AuthCard
        testID="auth"
        centered
        headingLevel={2}
        logo={
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: '#111',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text variant="headline-semibold" style={{ color: '#fff' }}>
              B
            </Text>
          </View>
        }
      />
    </Page>
  ),
};

/** Two columns from `md`; the carousel cycles shrink → hold → slide → grow. */
export const SplitWithCarousel: Story = {
  render: () => (
    <Page>
      <AuthCard
        testID="auth"
        centered
        headingLevel={2}
        media={<AuthMediaCarousel slides={SLIDES} />}
        footnote="By continuing you agree to our Terms of Service and Privacy Policy."
      />
    </Page>
  ),
};

/** Every provider the card knows. */
export const AllProviders: Story = {
  render: () => (
    <Page>
      <AuthCard
        testID="auth"
        layout="inline"
        headingLevel={2}
        providers={['google', 'apple', 'github', 'gitlab', 'microsoft', 'x', 'facebook', 'linkedin', 'discord']}
      />
    </Page>
  ),
};
