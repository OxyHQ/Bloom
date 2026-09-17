import React, { memo, useCallback, useMemo, useState, type ReactNode } from 'react';
import {
  Platform,
  Pressable,
  View,
  useWindowDimensions,
  type GestureResponderEvent,
  type TextInputProps,
  type TextStyle,
} from 'react-native';

import { Button } from '../button';
import { BUTTON_SHADOW, resolveButtonRamps } from '../button/shared';
import { Checkbox } from '../checkbox';
import { Divider } from '../divider';
import { useInteractionStates } from '../hooks/use-interaction-state';
import { RiMailCheckLine } from '../icons/remix';
import { InputOtp } from '../input-otp';
import { SocialButton } from '../social-button';
import { BREAKPOINTS } from '../styles/breakpoints';
import { useInteractiveWebCss } from '../styles/interactive-web-css';
import type { WebCssStyle } from '../styles/web-view-style';
import { TextField, TextFieldHint, TextFieldInput, TextFieldLabel } from '../text-field';
import type { Theme } from '../theme/types';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import type { AuthCardProps, AuthCardValues, AuthMode } from './types';

/**
 * `AuthCard`: sign-in, sign-up and one-time-code cards built on the provider
 * buttons.
 *
 *   card        max 400 (split: 880), radius 24, 1px border-button-default,
 *               surface primary (dark: background-secondary), shadow-xs,
 *               padding 24, 32 from the `sm` breakpoint (640)
 *   split       two equal columns from `md` (768): form | media on the
 *               secondary surface; below `md` the media is dropped, not stacked
 *   mark        20 below it; `verify` defaults to a 32px mail-check glyph
 *   heading     title-2-medium / body-regular text-secondary, 6 apart
 *   form        24 below the heading, fields 16 apart
 *   remember    small checkbox · "Forgot password?" link, space-between
 *   CTA         primary medium, full width
 *   terms       caption-1-regular text-tertiary (sign-up without footnote)
 *   providers   "or continue with" divider 20 above and below, then the
 *               buttons — stacked gap 10, inline wrap gap 8, grid equal cols 10
 *   footer      24 below, centred body-regular text-secondary + link
 *   footnote    16 below the card, caption-1-regular text-tertiary, max 520
 *
 * Links use `LinkButton` (primary, medium): body-medium accent-600,
 * accent-800 while pressed, underlined on hover, accent focus ring.
 *
 * The form is uncontrolled from the outside: the card holds the field values
 * and hands them to `onSubmit` as a typed object.
 */

const COPY: Record<
  AuthMode,
  { title: string; description: string; cta: string; switchLead: string; switchAction: string }
> = {
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
};

const IS_WEB = Platform.OS === 'web';

/**
 * The text links' transition and keyboard ring. They are react-native-web
 * `Pressable`s, so the rules hang off a `dataSet` attribute (a class never
 * reaches the DOM — see `chip/Chip.tsx`); hover and press paint come from state
 * so native matches.
 */
const STYLE_ID = 'bloom-auth-card-web-css';
const LINK_SELECTOR = '[data-bloom-auth-link]';
export const AUTH_CARD_WEB_CSS = `
${LINK_SELECTOR} {
  cursor: pointer;
  outline: none;
  user-select: none;
}
${LINK_SELECTOR} * {
  transition: color 150ms ease;
}
${LINK_SELECTOR}:focus-visible {
  outline: 2px solid var(--bloom-auth-ring);
  outline-offset: 2px;
}
`;

/** The `dataSet` hook for {@link AUTH_CARD_WEB_CSS}; nothing on native. */
const LINK_DATASET: Record<string, unknown> = IS_WEB ? { dataSet: { bloomAuthLink: '' } } : {};

interface AuthPalette {
  surface: string;
  border: string;
  mediaSurface: string;
  shadow: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  icon: string;
  link: string;
  linkPressed: string;
  ring: string;
}

/**
 * Palette tokens, mapped onto Bloom's ramps:
 *
 *                               light         dark
 *   card surface                card          neutral-900 (background-secondary)
 *   border-button-default       neutral-200   neutral-700
 *   media panel                 neutral-100   neutral-900
 *   text-secondary              neutral-500   neutral-500
 *   text-tertiary               neutral-400   neutral-600
 *   foreground-icon-primary     text          text
 *   link / pressed              accent-600 / accent-800
 */
function resolveAuthPalette(theme: Theme): AuthPalette {
  const { accent, neutral: n } = resolveButtonRamps(theme);
  const shared = {
    text: theme.colors.text,
    textSecondary: n[500],
    icon: theme.colors.text,
    link: accent[600],
    linkPressed: accent[800],
    ring: accent[500],
  };
  return theme.isDark
    ? {
        ...shared,
        surface: n[900],
        border: n[700],
        mediaSurface: n[900],
        shadow: BUTTON_SHADOW.dark,
        textTertiary: n[600],
      }
    : {
        ...shared,
        surface: theme.colors.card,
        border: n[200],
        mediaSurface: n[100],
        shadow: BUTTON_SHADOW.light,
        textTertiary: n[400],
      };
}

// ---------------------------------------------------------------------------
//  Link — `LinkButton`
// ---------------------------------------------------------------------------

function AuthLink({
  children,
  href,
  onPress,
  onNavigate,
  palette,
  testID,
}: {
  children: string;
  href?: string;
  onPress?: () => void;
  onNavigate?: (href: string) => void;
  palette: AuthPalette;
  testID?: string;
}) {
  const isLink = href !== undefined;
  const { hovered, pressed, hoverHandlers, pressHandlers } = useInteractionStates();
  // react-native-web renders a `Pressable` with `href` as a real `<a>`; neither
  // prop exists on native.
  const webProps: Record<string, unknown> = IS_WEB
    ? { ...LINK_DATASET, ...(isLink ? { href } : null) }
    : {};
  // `rounded-sm` for the focus ring; the ring colour is read by the adopted sheet.
  const linkStyle: WebCssStyle = { borderRadius: 4, '--bloom-auth-ring': palette.ring };
  const handlePress = useCallback(
    (event: GestureResponderEvent) => {
      // A web anchor navigates by itself unless something takes over routing.
      if (isLink && (onNavigate || onPress)) event.preventDefault?.();
      onPress?.();
      if (href !== undefined) onNavigate?.(href);
    },
    [isLink, href, onNavigate, onPress],
  );

  return (
    <Pressable
      {...webProps}
      testID={testID}
      onPress={handlePress}
      accessibilityRole={isLink ? 'link' : 'button'}
      accessibilityLabel={children}
      {...hoverHandlers}
      {...pressHandlers}
      style={linkStyle}>
      <Text
        variant="body-medium"
        style={{
          color: pressed ? palette.linkPressed : palette.link,
          textDecorationLine: hovered ? 'underline' : 'none',
          // `underline-offset-3`.
          ...(IS_WEB ? ({ textUnderlineOffset: 3 } as TextStyle) : null),
        }}>
        {children}
      </Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
//  Field — label, field, hint
// ---------------------------------------------------------------------------

function AuthField({
  label,
  hint,
  value,
  onChangeText,
  placeholder,
  secure,
  autoComplete,
  keyboardType,
  onSubmitEditing,
  testID,
}: {
  label: string;
  hint?: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  secure?: boolean;
  autoComplete?: TextInputProps['autoComplete'];
  keyboardType?: TextInputProps['keyboardType'];
  onSubmitEditing?: () => void;
  testID?: string;
}) {
  return (
    <View style={{ width: '100%' }}>
      <TextFieldLabel required>{label}</TextFieldLabel>
      <TextField>
        <TextFieldInput
          testID={testID}
          label={label}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          secureTextEntry={secure}
          autoComplete={autoComplete}
          autoCapitalize={secure || keyboardType === 'email-address' ? 'none' : undefined}
          keyboardType={keyboardType}
          aria-required
          onSubmitEditing={onSubmitEditing}
        />
      </TextField>
      {hint ? <TextFieldHint>{hint}</TextFieldHint> : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
//  Card
// ---------------------------------------------------------------------------

function renderCopy(node: ReactNode, style: TextStyle, variant: 'title-2-medium' | 'body-regular') {
  return typeof node === 'string' || typeof node === 'number' ? (
    <Text variant={variant} style={style}>
      {node}
    </Text>
  ) : (
    node
  );
}

function AuthCardComponent({
  mode = 'signin',
  email,
  codeLength = 6,
  onComplete,
  onResend,
  layout = 'stacked',
  providers = ['google', 'apple', 'github'],
  title,
  description,
  media,
  logo,
  centered = false,
  confirmPassword = false,
  footnote,
  onSubmit,
  onProvider,
  switchHref = '#',
  onSwitch,
  forgotPasswordHref = '#',
  onForgotPassword,
  onNavigate,
  headingLevel = 1,
  style,
  testID,
}: AuthCardProps) {
  const theme = useTheme();
  useInteractiveWebCss(STYLE_ID, AUTH_CARD_WEB_CSS);
  const palette = useMemo(() => resolveAuthPalette(theme), [theme]);
  const { width: viewport } = useWindowDimensions();
  const wide = viewport >= BREAKPOINTS.sm;
  const split = media != null && viewport >= BREAKPOINTS.md;

  const copy = COPY[mode];
  const signup = mode === 'signup';
  const verify = mode === 'verify';

  const [values, setValues] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [remember, setRemember] = useState(true);
  const [code, setCode] = useState('');
  const set = (key: keyof typeof values) => (next: string) =>
    setValues((current) => ({ ...current, [key]: next }));

  const submit = () => {
    if (!onSubmit) return;
    const out: AuthCardValues = {};
    if (verify) {
      out.code = code;
    } else {
      if (signup && !confirmPassword) out.name = values.name;
      out.email = values.email;
      out.password = values.password;
      if (signup && confirmPassword) out.confirmPassword = values.confirmPassword;
      if (!signup) out.remember = remember;
    }
    onSubmit(out);
  };

  const mark =
    logo ?? (verify ? <RiMailCheckLine width={32} height={32} fill={palette.icon} /> : null);

  const headingProps: Record<string, unknown> = IS_WEB
    ? { role: 'heading', 'aria-level': headingLevel }
    : { accessibilityRole: 'header' };

  const textAlign: TextStyle['textAlign'] = centered ? 'center' : undefined;

  const descriptionNode =
    description ??
    (verify && email ? (
      <Text variant="body-regular" style={{ color: palette.textSecondary, textAlign }}>
        {'Enter the code we sent to '}
        <Text variant="body-medium" style={{ color: palette.text }}>
          {email}
        </Text>
        {' to finish signing in.'}
      </Text>
    ) : (
      copy.description
    ));

  const social = (
    <View
      testID={testID ? `${testID}-providers` : undefined}
      style={
        layout === 'stacked'
          ? { flexDirection: 'column', gap: 10 }
          : layout === 'inline'
            ? { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }
            : { flexDirection: 'row', gap: 10 }
      }>
      {providers.map((provider) => (
        <SocialButton
          key={provider}
          brand={provider}
          appearance="white"
          testID={testID ? `${testID}-provider-${provider}` : undefined}
          iconOnly={layout !== 'stacked'}
          fullWidth={layout === 'stacked'}
          // `iconOnly` fixes a square; the grid stretches it across equal columns.
          style={layout === 'grid' ? { width: undefined, flexGrow: 1, flexBasis: 0 } : undefined}
          onPress={() => onProvider?.(provider)}
        />
      ))}
    </View>
  );

  const body = (
    <>
      {mark ? (
        <View
          style={{
            marginBottom: 20,
            flexDirection: 'row',
            justifyContent: centered ? 'center' : 'flex-start',
          }}>
          {mark}
        </View>
      ) : null}

      <View style={{ gap: 6 }}>
        <View {...headingProps}>
          {renderCopy(title ?? copy.title, { color: palette.text, textAlign }, 'title-2-medium')}
        </View>
        {renderCopy(descriptionNode, { color: palette.textSecondary, textAlign }, 'body-regular')}
      </View>

      <View style={{ marginTop: 24, gap: 16 }}>
        {verify ? (
          <View style={{ gap: 6 }}>
            <Text variant="body-medium" style={{ color: palette.textSecondary }}>
              Verification code
            </Text>
            <InputOtp
              testID={testID ? `${testID}-code` : undefined}
              value={code}
              onChange={setCode}
              onComplete={onComplete}
              length={codeLength}
              groupEvery={codeLength % 2 === 0 ? codeLength / 2 : undefined}
              accessibilityLabel="Verification code"
              style={{ justifyContent: 'flex-start' }}
            />
          </View>
        ) : null}

        {signup && !confirmPassword ? (
          <AuthField
            label="Full name"
            placeholder="Ada Lovelace"
            value={values.name}
            onChangeText={set('name')}
            autoComplete="name"
          />
        ) : null}

        {verify ? null : (
          <AuthField
            testID={testID ? `${testID}-email` : undefined}
            label="Email"
            placeholder="you@company.com"
            value={values.email}
            onChangeText={set('email')}
            autoComplete="email"
            keyboardType="email-address"
            hint={signup ? 'We use this to contact you, and never share it.' : undefined}
          />
        )}

        {verify ? null : signup && confirmPassword ? (
          <>
            <AuthField
              label="Password"
              placeholder="At least 8 characters"
              value={values.password}
              onChangeText={set('password')}
              secure
              autoComplete="new-password"
            />
            <AuthField
              label="Confirm password"
              placeholder="Repeat your password"
              value={values.confirmPassword}
              onChangeText={set('confirmPassword')}
              secure
              autoComplete="new-password"
              onSubmitEditing={submit}
            />
          </>
        ) : (
          <AuthField
            testID={testID ? `${testID}-password` : undefined}
            label="Password"
            placeholder={signup ? 'At least 8 characters' : 'Enter your password'}
            value={values.password}
            onChangeText={set('password')}
            secure
            autoComplete={signup ? 'new-password' : 'current-password'}
            onSubmitEditing={submit}
          />
        )}

        {signup || verify ? null : (
          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Checkbox
              size="small"
              label="Remember me"
              checked={remember}
              onCheckedChange={setRemember}
            />
            <AuthLink
              href={forgotPasswordHref}
              onPress={onForgotPassword}
              onNavigate={onNavigate}
              palette={palette}>
              Forgot password?
            </AuthLink>
          </View>
        )}

        <Button
          testID={testID ? `${testID}-submit` : undefined}
          variant="primary"
          size="medium"
          fullWidth
          style={{ alignSelf: 'stretch' }}
          onPress={submit}>
          {copy.cta}
        </Button>

        {signup && !footnote ? (
          <Text variant="caption-1-regular" style={{ color: palette.textTertiary }}>
            By creating an account you agree to our Terms of Service and Privacy Policy.
          </Text>
        ) : null}
      </View>

      {!verify && providers.length > 0 ? (
        <>
          <View style={{ marginVertical: 20 }}>
            <Divider>or continue with</Divider>
          </View>
          {social}
        </>
      ) : null}

      <View
        style={{
          marginTop: 24,
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <Text variant="body-regular" style={{ color: palette.textSecondary }}>
          {`${copy.switchLead} `}
        </Text>
        {verify ? (
          <AuthLink onPress={onResend} palette={palette} testID={testID ? `${testID}-resend` : undefined}>
            {copy.switchAction}
          </AuthLink>
        ) : (
          <AuthLink
            href={switchHref}
            onPress={onSwitch}
            onNavigate={onNavigate}
            palette={palette}
            testID={testID ? `${testID}-switch` : undefined}>
            {copy.switchAction}
          </AuthLink>
        )}
      </View>
    </>
  );

  const padding = wide ? 32 : 24;
  const shell: WebCssStyle = {
    width: '100%',
    maxWidth: media != null ? 880 : 400,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    boxShadow: palette.shadow,
  };

  const card =
    media != null ? (
      <View
        testID={testID}
        style={[shell, { flexDirection: 'row', overflow: 'hidden' }, footnote ? null : style]}>
        {/* Padding on an inner box: a padded flex item cannot shrink its base
            size below its padding, which made the form column 64px wider than
            the media column instead of the grid's two equal tracks. */}
        <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0 }}>
          <View style={{ padding }}>{body}</View>
        </View>
        {split ? (
          <View
            testID={testID ? `${testID}-media` : undefined}
            style={{ flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0, position: 'relative', backgroundColor: palette.mediaSurface }}>
            {media}
          </View>
        ) : null}
      </View>
    ) : (
      <View testID={testID} style={[shell, { padding }, footnote ? null : style]}>
        {body}
      </View>
    );

  if (!footnote) return card;

  return (
    <View style={[{ width: '100%', alignItems: 'center', gap: 16 }, style]}>
      {card}
      <View style={{ maxWidth: 520 }}>
        {typeof footnote === 'string' || typeof footnote === 'number' ? (
          <Text variant="caption-1-regular" style={{ color: palette.textTertiary, textAlign: 'center' }}>
            {footnote}
          </Text>
        ) : (
          footnote
        )}
      </View>
    </View>
  );
}

export const AuthCard = memo(AuthCardComponent);
