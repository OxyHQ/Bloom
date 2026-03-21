import React, { memo, useMemo } from 'react';
import { View, Text, Pressable, Platform, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { borderRadius, space } from '../styles/tokens';
import type {
  CardProps,
  CardHeaderProps,
  CardBodyProps,
  CardFooterProps,
  CardTitleProps,
  CardDescriptionProps,
} from './types';

const CardRootComponent: React.FC<CardProps> = ({
  children,
  variant = 'elevated',
  style,
  onPress,
  disabled = false,
  accessibilityLabel,
  testID,
}) => {
  const theme = useTheme();

  const containerStyle = useMemo((): ViewStyle => {
    const base: ViewStyle = {
      borderRadius: borderRadius.md,
      overflow: 'hidden',
    };

    switch (variant) {
      case 'elevated':
        base.backgroundColor = theme.colors.card;
        if (Platform.OS === 'web') {
          base.boxShadow = `0px 1px 3px ${theme.colors.shadow}`;
        } else {
          base.shadowColor = theme.colors.shadow;
          base.shadowOffset = { width: 0, height: 1 };
          base.shadowOpacity = 0.2;
          base.shadowRadius = 3;
          base.elevation = 2;
        }
        break;
      case 'outlined':
        base.backgroundColor = theme.colors.card;
        base.borderWidth = 1;
        base.borderColor = theme.colors.border;
        break;
      case 'filled':
        base.backgroundColor = theme.colors.backgroundSecondary;
        break;
    }

    return base;
  }, [variant, theme]);

  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [
          containerStyle,
          pressed && { opacity: 0.85 },
          disabled && { opacity: 0.5 },
          style,
        ]}
        onPress={onPress}
        disabled={disabled}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        testID={testID}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View
      style={[containerStyle, disabled && { opacity: 0.5 }, style]}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      {children}
    </View>
  );
};

const CardHeaderComponent: React.FC<CardHeaderProps> = ({ children, style }) => (
  <View
    style={[
      {
        paddingHorizontal: space.lg,
        paddingTop: space.lg,
        paddingBottom: space.sm,
      },
      style,
    ]}
  >
    {children}
  </View>
);

const CardBodyComponent: React.FC<CardBodyProps> = ({ children, style }) => (
  <View
    style={[
      {
        paddingHorizontal: space.lg,
        paddingVertical: space.sm,
      },
      style,
    ]}
  >
    {children}
  </View>
);

const CardFooterComponent: React.FC<CardFooterProps> = ({ children, style }) => (
  <View
    style={[
      {
        paddingHorizontal: space.lg,
        paddingTop: space.sm,
        paddingBottom: space.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: space.sm,
      },
      style,
    ]}
  >
    {children}
  </View>
);

const CardTitleComponent: React.FC<CardTitleProps> = ({ children, style, numberOfLines }) => {
  const theme = useTheme();
  return (
    <Text
      style={[
        {
          fontSize: 17,
          fontWeight: '600',
          color: theme.colors.text,
          lineHeight: 22,
        },
        style,
      ]}
      numberOfLines={numberOfLines}
    >
      {children}
    </Text>
  );
};

const CardDescriptionComponent: React.FC<CardDescriptionProps> = ({
  children,
  style,
  numberOfLines,
}) => {
  const theme = useTheme();
  return (
    <Text
      style={[
        {
          fontSize: 14,
          color: theme.colors.textSecondary,
          lineHeight: 20,
        },
        style,
      ]}
      numberOfLines={numberOfLines}
    >
      {children}
    </Text>
  );
};

export const Card = memo(CardRootComponent);
Card.displayName = 'Card';

export const CardHeader = memo(CardHeaderComponent);
CardHeader.displayName = 'CardHeader';

export const CardBody = memo(CardBodyComponent);
CardBody.displayName = 'CardBody';

export const CardFooter = memo(CardFooterComponent);
CardFooter.displayName = 'CardFooter';

export const CardTitle = memo(CardTitleComponent);
CardTitle.displayName = 'CardTitle';

export const CardDescription = memo(CardDescriptionComponent);
CardDescription.displayName = 'CardDescription';
