// A pill outlined in the platform's default colour (a border width and no colour),
// a rule along one edge, and a border the codemod reads with no class of its own.
import { Text } from '@oxy.so/bloom/typography';
import { View } from 'react-native';

export function SubscribePill() {
  return (
    <View style={{ flexDirection: 'row' }}>
      <View
        style={{
          borderWidth: 1,
          borderRadius: 20,
          paddingHorizontal: 12,
          paddingVertical: 6,
          alignItems: 'center',
        }}
      >
        <Text>Subscribe</Text>
      </View>
      <View className="border rounded-full px-3">
        <Text>Class</Text>
      </View>
      <View style={{ borderBottomWidth: 2 }}>
        <Text>Rule</Text>
      </View>
    </View>
  );
}
