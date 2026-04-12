import React, { createContext, useContext } from 'react';
import { StyleSheet, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { Text as BaseText } from '../typography';
import { Button as BaseButton, type ButtonProps } from '../button';
import { CircleInfo_Stroke2_Corner0_Rounded as CircleInfoIcon } from '../icons/CircleInfo';
import { CircleX_Stroke2_Corner0_Rounded as CircleXIcon } from '../icons/CircleX';
import { Warning_Stroke2_Corner0_Rounded as WarningIcon } from '../icons/Warning';
import { EmojiSad_Stroke2_Corner0_Rounded as EmojiSadIcon } from '../icons/Emoji';

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
  tip: CircleInfoIcon,
  warning: WarningIcon,
  error: CircleXIcon,
  apology: EmojiSadIcon,
} as const;

export function Icon() {
  const theme = useTheme();
  const { type } = useContext(AdmonitionContext);

  const IconComponent = ICON_MAP[type];

  const fillMap: Record<AdmonitionType, string> = {
    info: theme.colors.textSecondary,
    tip: theme.colors.primary,
    warning: theme.colors.warning,
    error: theme.colors.error,
    apology: theme.colors.textSecondary,
  };

  return <IconComponent fill={fillMap[type]} size="md" />;
}
Icon.displayName = 'Admonition.Icon';

export function Content({
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
Content.displayName = 'Admonition.Content';

export function Text({
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
Text.displayName = 'Admonition.Text';

export function Button({
  children,
  ...props
}: Omit<ButtonProps, 'size' | 'variant'>) {
  return (
    <BaseButton size="small" {...props}>
      {children}
    </BaseButton>
  );
}
Button.displayName = 'Admonition.Button';

export function Row({
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
Row.displayName = 'Admonition.Row';

export function Outer({
  children,
  type = 'info',
  style,
}: {
  children: React.ReactNode;
  type?: AdmonitionType;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();

  const borderColorMap: Record<AdmonitionType, string> = {
    info: theme.colors.border,
    tip: theme.colors.primary,
    warning: theme.colors.warning,
    error: theme.colors.error,
    apology: theme.colors.border,
  };

  return (
    <AdmonitionContext.Provider value={{ type }}>
      <View
        style={[
          styles.outer,
          {
            borderColor: borderColorMap[type],
            backgroundColor: theme.colors.background,
          },
          style,
        ]}
      >
        {children}
      </View>
    </AdmonitionContext.Provider>
  );
}
Outer.displayName = 'Admonition.Outer';

/**
 * Simple all-in-one Admonition component for common use cases.
 * For more control, compose with Outer, Row, Icon, Content, Text, and Button.
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
    <Outer type={type} style={style}>
      <Row>
        <Icon />
        <Content>
          <Text>{children}</Text>
        </Content>
      </Row>
    </Outer>
  );
}
Admonition.displayName = 'Admonition';

const styles = StyleSheet.create({
  outer: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  row: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  content: {
    gap: 8,
    flex: 1,
    minHeight: 20,
    justifyContent: 'center',
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    paddingRight: 12,
  },
});
