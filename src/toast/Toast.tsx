import React, { createContext, useContext, useMemo } from 'react';
import {
  View,
  Text as RNText,
  Pressable,
  StyleSheet,
  type GestureResponderEvent,
} from 'react-native';

import { useTheme } from '../theme/use-theme';
import type { ThemeColors } from '../theme/types';
import { dismiss } from './sonner';
import type { ToastType } from './types';

const ToastConfigContext = createContext<{
  id: string;
  type: ToastType;
}>({
  id: '',
  type: 'default',
});
ToastConfigContext.displayName = 'ToastConfigContext';

export function ToastConfigProvider({
  children,
  id,
  type,
}: {
  children: React.ReactNode;
  id: string;
  type: ToastType;
}) {
  return (
    <ToastConfigContext.Provider
      value={useMemo(() => ({ id, type }), [id, type])}>
      {children}
    </ToastConfigContext.Provider>
  );
}

export function Outer({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const { type } = useContext(ToastConfigContext);
  const toastColors = useToastColors({ type, colors });

  return (
    <View
      style={[
        styles.outer,
        {
          backgroundColor: toastColors.backgroundColor,
          borderColor: toastColors.borderColor,
        },
      ]}>
      {children}
    </View>
  );
}

export function Icon({ icon }: { icon?: React.ReactNode }) {
  const { colors } = useTheme();
  const { type } = useContext(ToastConfigContext);
  const toastColors = useToastColors({ type, colors });

  if (!icon) {
    return null;
  }

  if (React.isValidElement(icon)) {
    return React.cloneElement(icon as React.ReactElement<{ color?: string }>, {
      color: toastColors.iconColor,
    });
  }

  return <>{icon}</>;
}

export function Text({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const { type } = useContext(ToastConfigContext);
  const toastColors = useToastColors({ type, colors });

  return (
    <View style={styles.textContainer}>
      <RNText
        selectable={false}
        style={[
          styles.text,
          { color: toastColors.textColor },
        ]}>
        {children}
      </RNText>
    </View>
  );
}

export function Action({
  children,
  onPress,
  ...rest
}: {
  children: React.ReactNode;
  onPress?: (e: GestureResponderEvent) => void;
  label?: string;
}) {
  const { colors } = useTheme();
  const { type, id } = useContext(ToastConfigContext);
  const actionColors = useActionColors({ type, colors });

  const handlePress = (e: GestureResponderEvent) => {
    dismiss(id);
    onPress?.(e);
  };

  return (
    <Pressable
      {...rest}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.actionButton,
        {
          backgroundColor: pressed
            ? actionColors.interacted.backgroundColor
            : actionColors.base.backgroundColor,
        },
      ]}>
      {({ pressed }) => (
        <RNText
          style={[
            styles.actionText,
            {
              color: pressed
                ? actionColors.interacted.textColor
                : actionColors.base.textColor,
            },
          ]}>
          {children}
        </RNText>
      )}
    </Pressable>
  );
}

function useToastColors({ type, colors }: { type: ToastType; colors: ThemeColors }) {
  return useMemo(() => {
    const colorMap: Record<ToastType, {
      backgroundColor: string;
      borderColor: string;
      iconColor: string;
      textColor: string;
    }> = {
      default: {
        backgroundColor: colors.backgroundSecondary,
        borderColor: colors.border,
        iconColor: colors.text,
        textColor: colors.text,
      },
      success: {
        backgroundColor: colors.primarySubtle,
        borderColor: colors.primary,
        iconColor: colors.primarySubtleForeground,
        textColor: colors.primarySubtleForeground,
      },
      error: {
        backgroundColor: colors.negativeSubtle,
        borderColor: colors.negative,
        iconColor: colors.negativeSubtleForeground,
        textColor: colors.negativeSubtleForeground,
      },
      warning: {
        backgroundColor: colors.backgroundSecondary,
        borderColor: colors.border,
        iconColor: colors.warning,
        textColor: colors.text,
      },
      info: {
        backgroundColor: colors.backgroundSecondary,
        borderColor: colors.border,
        iconColor: colors.info,
        textColor: colors.text,
      },
    };
    return colorMap[type];
  }, [type, colors]);
}

function useActionColors({ type, colors }: { type: ToastType; colors: ThemeColors }) {
  return useMemo(() => {
    const base = {
      base: {
        textColor: colors.textSecondary,
        backgroundColor: colors.backgroundTertiary,
      },
      interacted: {
        textColor: colors.text,
        backgroundColor: colors.contrast50,
      },
    };

    const colorMap: Record<ToastType, typeof base> = {
      default: base,
      warning: base,
      info: base,
      success: {
        base: {
          textColor: colors.primarySubtleForeground,
          backgroundColor: colors.primarySubtle,
        },
        interacted: {
          textColor: colors.primaryDark,
          backgroundColor: colors.primaryLight,
        },
      },
      error: {
        base: {
          textColor: colors.negativeSubtleForeground,
          backgroundColor: colors.negativeSubtle,
        },
        interacted: {
          textColor: colors.negativeForeground,
          backgroundColor: colors.negative,
        },
      },
    };

    return colorMap[type];
  }, [type, colors]);
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  textContainer: {
    flex: 1,
    paddingRight: 16,
  },
  text: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
  },
  actionButton: {
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 6,
    alignSelf: 'center',
  },
  actionText: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
  },
});
