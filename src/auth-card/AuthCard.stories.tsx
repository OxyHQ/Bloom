import type React from 'react';
import { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Text } from '../typography';
import { AuthCard, AuthMediaCarousel } from './index';
import type { AuthCardProps, AuthMediaSlide } from './types';

const meta: Meta<typeof AuthCard> = {
  argTypes: {
    mode: { control: 'select', options: ['signin', 'signup', 'verify'] },
    email: { control: 'text' },
    codeLength: { control: 'number' },
    layout: { control: 'select', options: ['stacked', 'inline', 'grid'] },
    centered: { control: 'boolean' },
    confirmPassword: { control: 'boolean' },
    switchHref: { control: 'text' },
    forgotPasswordHref: { control: 'text' },
  },
  id: 'blocks-auth-card',
  title: 'Patterns/Account/Auth Card',
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
  return <View style={{ alignItems: 'center', width: '100%', minWidth: 0 }}>{children}</View>;
}

/** Sign in, stacked providers — the default. */
function AuthDemo(props: AuthCardProps) {
  const [mode, setMode] = useState<AuthCardProps['mode']>();
  const [result, setResult] = useState('');
  const currentMode = mode ?? props.mode ?? 'signin';
  return (
    <View style={{ width: '100%', gap: 16 }}>
      <AuthCard
        {...props}
        mode={currentMode}
        onSubmit={() =>
          setResult(currentMode === 'signup' ? 'Demo account created.' : 'Demo form submitted.')
        }
        onProvider={(provider) =>
          setResult(`${provider} sign-in selected. No account connection is made in this demo.`)
        }
        onSwitch={() => {
          setMode(currentMode === 'signup' ? 'signin' : 'signup');
          setResult('');
        }}
        onForgotPassword={() => {
          setMode('verify');
          setResult('Enter a demo verification code.');
        }}
        onComplete={() => setResult('Demo code complete.')}
        onResend={() => setResult('A new code was requested in this demo.')}
      />
      {result ? <Text accessibilityRole="alert">{result}</Text> : null}
    </View>
  );
}

export const SignIn: Story = {
  args: { headingLevel: 2 },
  parameters: {
    controls: {
      include: [
        'headingLevel',
        'mode',
        'email',
        'codeLength',
        'layout',
        'centered',
        'confirmPassword',
        'switchHref',
        'forgotPasswordHref',
      ],
    },
  },
  render: (args) => (
    <Page>
      <AuthDemo {...args} testID="auth" />
    </Page>
  ),
};

/** Icon-only providers side by side, wrapping. */
export const Inline: Story = {
  args: { layout: 'inline', headingLevel: 2 },
  parameters: {
    controls: {
      include: [
        'layout',
        'headingLevel',
        'mode',
        'email',
        'codeLength',
        'centered',
        'confirmPassword',
        'switchHref',
        'forgotPasswordHref',
      ],
    },
  },
  render: (args) => (
    <Page>
      <AuthDemo {...args} testID="auth" providers={['google', 'apple', 'github', 'x']} />
    </Page>
  ),
};

/** Icon-only providers across equal columns. */
export const Grid: Story = {
  args: { layout: 'grid', headingLevel: 2 },
  parameters: {
    controls: {
      include: [
        'layout',
        'headingLevel',
        'mode',
        'email',
        'codeLength',
        'centered',
        'confirmPassword',
        'switchHref',
        'forgotPasswordHref',
      ],
    },
  },
  render: (args) => (
    <Page>
      <AuthDemo {...args} testID="auth" />
    </Page>
  ),
};

export const SignUp: Story = {
  args: { mode: 'signup', headingLevel: 2 },
  parameters: {
    controls: {
      include: [
        'mode',
        'headingLevel',
        'email',
        'codeLength',
        'layout',
        'centered',
        'confirmPassword',
        'switchHref',
        'forgotPasswordHref',
      ],
    },
  },
  render: (args) => (
    <Page>
      <AuthDemo {...args} testID="auth" />
    </Page>
  ),
};

/** Stacked password pair, terms moved under the card through `footnote`. */
export const SignUpConfirmPassword: Story = {
  args: {
    mode: 'signup',
    confirmPassword: true,
    layout: 'grid',
    headingLevel: 2,
    footnote: 'By creating an account you agree to our Terms of Service and Privacy Policy.',
  },
  parameters: {
    controls: {
      include: [
        'mode',
        'confirmPassword',
        'layout',
        'headingLevel',
        'footnote',
        'email',
        'codeLength',
        'centered',
        'switchHref',
        'forgotPasswordHref',
      ],
    },
  },
  render: (args) => (
    <Page>
      <AuthDemo {...args} testID="auth" />
    </Page>
  ),
};

export const Verify: Story = {
  args: { mode: 'verify', email: 'ada@company.com', headingLevel: 2 },
  parameters: {
    controls: {
      include: [
        'mode',
        'email',
        'headingLevel',
        'codeLength',
        'layout',
        'centered',
        'confirmPassword',
        'switchHref',
        'forgotPasswordHref',
      ],
    },
  },
  render: (args) => (
    <Page>
      <AuthDemo {...args} testID="auth" />
    </Page>
  ),
};

export const CenteredWithLogo: Story = {
  args: { centered: true, headingLevel: 2 },
  parameters: {
    controls: {
      include: [
        'centered',
        'headingLevel',
        'mode',
        'email',
        'codeLength',
        'layout',
        'confirmPassword',
        'switchHref',
        'forgotPasswordHref',
      ],
    },
  },
  render: (args) => (
    <Page>
      <AuthDemo
        {...args}
        testID="auth"
        logo={
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: '#111',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
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
  args: {
    centered: true,
    headingLevel: 2,
    footnote: 'By continuing you agree to our Terms of Service and Privacy Policy.',
  },
  parameters: {
    controls: {
      include: [
        'centered',
        'headingLevel',
        'footnote',
        'mode',
        'email',
        'codeLength',
        'layout',
        'confirmPassword',
        'switchHref',
        'forgotPasswordHref',
      ],
    },
  },
  render: (args) => (
    <Page>
      <AuthDemo {...args} testID="auth" media={<AuthMediaCarousel slides={SLIDES} />} />
    </Page>
  ),
};

/** Every provider the card knows. */
export const AllProviders: Story = {
  args: { layout: 'inline', headingLevel: 2 },
  parameters: {
    controls: {
      include: [
        'layout',
        'headingLevel',
        'mode',
        'email',
        'codeLength',
        'centered',
        'confirmPassword',
        'switchHref',
        'forgotPasswordHref',
      ],
    },
  },
  render: (args) => (
    <Page>
      <AuthDemo
        {...args}
        testID="auth"
        providers={[
          'google',
          'apple',
          'github',
          'gitlab',
          'microsoft',
          'x',
          'facebook',
          'linkedin',
          'discord',
        ]}
      />
    </Page>
  ),
};
