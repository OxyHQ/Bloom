import type { StyleProp, TextStyle } from 'react-native';
import { Text } from '../typography';

/** The animated label and its measuring copy share one typography owner. */
export function FollowLabel({
  children,
  style,
  numberOfLines,
}: {
  children: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}) {
  return (
    <Text variant="body-semibold" style={style} numberOfLines={numberOfLines}>
      {children}
    </Text>
  );
}
