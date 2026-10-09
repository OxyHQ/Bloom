import React, { createContext, useContext } from 'react';
import { StyleSheet, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { Text as BaseText } from '../typography';
import { Button as BaseButton, type ButtonProps } from '../button';
import { RiInformationLine as CircleInfoIcon } from '../icons/remix/RiInformationLine';
import { RiForbidLine as ForbidIcon } from '../icons/remix/RiForbidLine';
import { RiLightbulbLine as LightbulbIcon } from '../icons/remix/RiLightbulbLine';
import { resolveAccentColors, type AccentTone } from '../theme/accent-colors';
import { RiAlertLine as WarningIcon } from '../icons/remix/RiAlertLine';
import { RiEmotionUnhappyLine as EmojiSadIcon } from '../icons/remix/RiEmotionUnhappyLine';

type AdmonitionType = 'info' | 'tip' | 'warning' | 'error' | 'apology';

type AdmonitionContextValue = {
  type: AdmonitionType;
};

const AdmonitionContext = createContext<AdmonitionContextValue>({
  type: 'info',
});
AdmonitionContext.displayName = 'AdmonitionContext';

const ICON_MAP = {
  info: CircleInfoIcon,
  tip: LightbulbIcon,
  warning: WarningIcon,
  error: ForbidIcon,
  apology: EmojiSadIcon,
} as const;

const TONE_MAP: Record<AdmonitionType, AccentTone> = {
  info: 'info',
  tip: 'success',
  warning: 'warning',
  error: 'error',
  apology: 'default',
};

export function AdmonitionIcon() {
  const theme = useTheme();
  const { type } = useContext(AdmonitionContext);
  const IconComponent = ICON_MAP[type];
  const colors = resolveAccentColors(theme.colors, TONE_MAP[type], 'subtle');

  return (
    <View aria-hidden style={styles.icon}>
      <IconComponent fill={colors.foreground} width={20} height={20} />
    </View>
  );
}
AdmonitionIcon.displayName = 'AdmonitionIcon';

export function AdmonitionContent({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.content, style]}>
      {children}
    </View>
  );
}
AdmonitionContent.displayName = 'AdmonitionContent';

export function AdmonitionText({
  children,
  style,
}: {
  children?: React.ReactNode;
  style?: TextStyle;
}) {
  return (
    <BaseText style={style ? [styles.text, style] : styles.text}>
      {children}
    </BaseText>
  );
}
AdmonitionText.displayName = 'AdmonitionText';

export function AdmonitionButton({
  children,
  ...props
}: Omit<ButtonProps, 'size'>) {
  return (
    <BaseButton size="sm" {...props}>
      {children}
    </BaseButton>
  );
}
AdmonitionButton.displayName = 'AdmonitionButton';

export function AdmonitionRow({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.row, style]}>
      {children}
    </View>
  );
}
AdmonitionRow.displayName = 'AdmonitionRow';

export function AdmonitionRoot({
  children,
  type = 'info',
  style,
}: {
  children: React.ReactNode;
  type?: AdmonitionType;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();

  const tone = TONE_MAP[type];
  const colors = resolveAccentColors(theme.colors, tone, 'subtle');
  const border = resolveAccentColors(theme.colors, tone, 'solid').border;

  return (
    <AdmonitionContext.Provider value={{ type }}>
      <View
        style={[
          styles.outer,
          {
            backgroundColor: colors.background,
          },
          style,
        ]}
      >
        {/* Separate opacity preserves the token's native colour syntax and
            keeps the content fully opaque on both native and web. */}
        <View
          pointerEvents="none"
          aria-hidden
          style={[styles.border, { borderColor: border }]}
        />
        {children}
      </View>
    </AdmonitionContext.Provider>
  );
}
AdmonitionRoot.displayName = 'AdmonitionRoot';

/**
 * Simple all-in-one Admonition component for common use cases.
 * For more control, compose with AdmonitionRoot, AdmonitionRow, AdmonitionIcon,
 * AdmonitionContent, AdmonitionText, and AdmonitionButton.
 */
export function Admonition({
  children,
  type,
  style,
}: {
  children?: React.ReactNode;
  type?: AdmonitionType;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <AdmonitionRoot type={type} style={style}>
      <AdmonitionRow>
        <AdmonitionIcon />
        <AdmonitionContent>
          <AdmonitionText>{children}</AdmonitionText>
        </AdmonitionContent>
      </AdmonitionRow>
    </AdmonitionRoot>
  );
}
Admonition.displayName = 'Admonition';

const styles = StyleSheet.create({
  outer: {
    padding: 16,
    borderRadius: 16,
    position: 'relative',
  },
  border: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 16,
    borderWidth: 1,
    opacity: 0.3,
  },
  icon: {
    flexShrink: 0,
  },
  row: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  content: {
    gap: 4,
    flex: 1,
    minWidth: 0,
    minHeight: 20,
    justifyContent: 'center',
  },
  text: {
    fontSize: 14,
    lineHeight: 22,
  },
});
