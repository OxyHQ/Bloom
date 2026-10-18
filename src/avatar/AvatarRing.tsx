import { pointerEventsStyles } from '../styles/pointer-events';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Border } from '../shapes';
import type { BorderProps } from '../shapes';
import { Z_INDEX } from '../styles/z-index';

/** Avatar placement only. Shared Shapes.Border owns all outline geometry. */
export function AvatarRing(props: BorderProps) {
  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: Z_INDEX.raised }, pointerEventsStyles.none]}>
      <Border {...props} />
    </View>
  );
}
