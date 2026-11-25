// An attachment's move row over its media: what is inside takes touches, the row
// itself natively only (an inline style), and a badge that passes them through
// everywhere (a StyleSheet's style).
import { Text } from '@oxy.so/bloom/typography';
import { StyleSheet, View } from 'react-native';

const MOVE_ROW = {
  position: 'absolute',
  left: 8,
  right: 8,
  bottom: 8,
  flexDirection: 'row',
  justifyContent: 'space-between',
  pointerEvents: 'box-none',
} as const;

export function MoveRow() {
  return (
    <View style={MOVE_ROW}>
      <Text>Left</Text>
      <Text>Right</Text>
    </View>
  );
}

export function PassThroughBadge() {
  return (
    <View style={styles.badge}>
      <Text>New</Text>
    </View>
  );
}

const styles = StyleSheet.create({ badge: { pointerEvents: 'box-none' } });
