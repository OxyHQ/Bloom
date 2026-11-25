// A thread row's indent and a screen's bar clearance, computed as it renders;
// a picker pinned above its input; a label that gives way first.
import { useContentSafeAreaInsets } from '@oxy.so/bloom/layout';
import { Text } from '@oxy.so/bloom/typography';
import { View } from 'react-native';

export function ThreadIndent({ depth, bar }: { depth: number; bar: number }) {
  const insets = useContentSafeAreaInsets();
  return (
    <View style={{ paddingTop: insets.top + 60 }}>
      <View style={{ paddingLeft: depth * 12, paddingBottom: bar + 20 }}>
        <Text>Reply</Text>
      </View>
      <View style={{ position: 'absolute', bottom: '100%', left: 0 }}>
        <Text>Suggestions</Text>
      </View>
      <View style={{ flexDirection: 'row' }}>
        <View style={{ flexShrink: 20 }}>
          <Text>Lane</Text>
        </View>
        <Text>Meta</Text>
      </View>
    </View>
  );
}
