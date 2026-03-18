import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

export function Fill({
  children,
  style,
}: {
  children?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}) {
  return (
    <View style={[fillStyles.base, style]}>
      {children}
    </View>
  );
}

const fillStyles = StyleSheet.create({
  base: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
});
