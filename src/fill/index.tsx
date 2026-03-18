import React from 'react';
import { View, type ViewStyle } from 'react-native';

export function Fill({
  children,
  style,
}: {
  children?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}) {
  return (
    <View style={[{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }, style]}>
      {children}
    </View>
  );
}
