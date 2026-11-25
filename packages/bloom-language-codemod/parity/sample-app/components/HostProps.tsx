// What a view or a pressable hands React Native itself: an element that is no
// accessibility element, a press out of the focus order, a native view kept,
// a long press's hold, a web sticky bar, a caption's shadow, inline insets.
import { Text } from '@oxy.so/bloom/typography';
import { Pressable, Text as RNText, View } from 'react-native';

export function NotificationRow({ open, expand }: { open: () => void; expand: () => void }) {
  return (
    <View collapsable={false}>
      <Pressable onPress={open} accessible={false} tabIndex={-1}>
        <Text>Ana liked your post</Text>
      </Pressable>
      <Pressable onPress={expand} onLongPress={expand} delayLongPress={500}>
        <Text>Show all</Text>
      </Pressable>
    </View>
  );
}

export function StickySearch() {
  return (
    <View className="w-full z-10 web:sticky web:top-0">
      <Text>Search</Text>
    </View>
  );
}

export function VideoCaption() {
  return (
    <View>
      <RNText
        style={{
          position: 'absolute',
          insetInline: 0,
          textShadowColor: 'rgba(0, 0, 0, 0.8)',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 2,
        }}
      >
        Caption
      </RNText>
    </View>
  );
}
