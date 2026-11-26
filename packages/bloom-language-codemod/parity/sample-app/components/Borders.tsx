// A pill outlined in the platform's default colour (a border width and no colour),
// a rule along one edge, a border the codemod reads with no class of its own, and one
// border colour on every edge with widths on some (Mention's reply elbow and notification row).
import { useTheme } from '@oxy.so/bloom/theme';
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

export function ReplyElbow() {
  const theme = useTheme();
  return (
    <View
      style={{
        width: 24,
        height: 60,
        borderLeftWidth: 2,
        borderBottomWidth: 2,
        borderBottomLeftRadius: 8,
        borderColor: theme.colors.border,
      }}
    />
  );
}

export function NotificationRow() {
  const theme = useTheme();
  return (
    <View style={{ width: '100%', borderBottomWidth: 1, borderColor: theme.colors.border }}>
      <Text>Liked your post</Text>
    </View>
  );
}
