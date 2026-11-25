// A zero-size marker out of the flow that takes no pointer and reports its
// first layout (an app's splash release).
import { StyleSheet, View } from 'react-native';

export function LayoutMarker({ onLayout }: { onLayout: () => void }) {
  return <View pointerEvents="none" style={styles.marker} onLayout={onLayout} />;
}

const styles = StyleSheet.create({ marker: { position: 'absolute', width: 0, height: 0 } });
