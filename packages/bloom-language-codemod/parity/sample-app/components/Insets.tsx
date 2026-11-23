// Views padded by the device's insets, as apps read them from useSafeAreaInsets().
import { Text } from '@oxy.so/bloom/typography';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ROOT = { flexGrow: 1, flexShrink: 1, flexBasis: '0%' } as const;

export function ComposeRoot() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[ROOT, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Text>Compose</Text>
    </View>
  );
}

export function SignIn() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 }}>
      <Text>Welcome</Text>
    </View>
  );
}
