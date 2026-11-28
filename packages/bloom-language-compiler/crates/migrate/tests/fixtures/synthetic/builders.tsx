// A value built by a local closure (`const push = (…) => { xs.push(…) }`, then its calls) is one
// member computed in place; the closure's optional parameters are `T?`, and a call that leaves
// them out passes `none`. A modifier constant used inside another is inlined there too.
import { Text, VStack, defineModifier, view } from '@oxy.so/bloom-language';

const detailRow = defineModifier((v) => v.padding('horizontal', 'md').padding('top', 'md'));
const likersRow = defineModifier((v) => v.padding('bottom', 'md').modifier(detailRow));

export const Stats = view(function Stats({
  likes,
  boosts,
  onLikesPress,
}: {
  likes: number;
  boosts: number;
  onLikesPress: () => void;
}) {
  const entries: { key: string; count: number; onPress?: () => void }[] = [];
  const push = (key: string, count: number, onPress?: () => void) => {
    if (count < 0) return;
    entries.push({ key, count, onPress });
  };
  push('likes', likes, onLikesPress);
  push('boosts', boosts);
  return VStack(...entries.map((e) => Text(e.key).modifier(likersRow)));
});
