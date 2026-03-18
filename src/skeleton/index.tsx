import React from 'react';
import { View, type ViewStyle, type TextStyle, StyleSheet } from 'react-native';

import { useTheme } from '../theme/use-theme';

type SkeletonProps = {
  blend?: boolean;
};

export function Text({
  blend,
  style,
}: {
  style?: TextStyle | TextStyle[];
  blend?: boolean;
}) {
  const { colors } = useTheme();
  const flattened = StyleSheet.flatten(style);
  const width = (flattened as ViewStyle)?.width;
  const lineHeight = (flattened?.lineHeight as number) || 14;

  return (
    <View
      style={[
        styles.textOuter,
        { maxWidth: width as number },
        { paddingVertical: lineHeight * 0.15 },
      ]}>
      <View
        style={[
          styles.textInner,
          {
            backgroundColor: colors.contrast50,
            height: lineHeight * 0.7,
            opacity: blend ? 0.6 : 1,
          },
        ]}
      />
    </View>
  );
}

export function Circle({
  children,
  size,
  blend,
  style,
}: {
  children?: React.ReactNode;
  size: number;
  blend?: boolean;
  style?: ViewStyle | ViewStyle[];
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.circle,
        {
          backgroundColor: colors.contrast50,
          width: size,
          height: size,
          opacity: blend ? 0.6 : 1,
        },
        style,
      ]}>
      {children}
    </View>
  );
}

export function Pill({
  size,
  blend,
  style,
}: {
  size: number;
  blend?: boolean;
  style?: ViewStyle | ViewStyle[];
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: colors.contrast50,
          width: size * 1.618,
          height: size,
          opacity: blend ? 0.6 : 1,
        },
        style,
      ]}
    />
  );
}

export function Col({
  children,
  style,
}: {
  children?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}) {
  return <View style={[styles.col, style]}>{children}</View>;
}

export function Row({
  children,
  style,
}: {
  children?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}) {
  return <View style={[styles.row, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  textOuter: {
    flex: 1,
  },
  textInner: {
    borderRadius: 8,
  },
  circle: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 999,
  },
  pill: {
    borderRadius: 999,
  },
  col: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
  },
});
