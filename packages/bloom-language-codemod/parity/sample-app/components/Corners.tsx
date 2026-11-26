// A box whose corners round on their own sides, as an app's style writes them.
import { View } from 'react-native';

export function Bubble() {
  return (
    <View
      style={{
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        borderBottomEndRadius: 4,
        padding: 8,
      }}
    />
  );
}
