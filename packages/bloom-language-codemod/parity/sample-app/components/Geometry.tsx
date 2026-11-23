// Geometry an app's views compute as they render: a cell's side from its props,
// a badge pinned below the inset, a stacking order, a circle of half its side.
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DOT = { sm: 8, md: 12 } as const;

export function MediaCell({ itemSize, columns }: { itemSize: number; columns: number }) {
  return (
    <View className="flex-row flex-wrap">
      <View style={{ width: itemSize, height: itemSize }} />
      <View className="w-12" style={{ height: itemSize / columns }} />
      <View style={{ maxWidth: itemSize * 2, minHeight: itemSize - 4 }} />
    </View>
  );
}

export function PinnedBadge({ count, index }: { count: number; index: number }) {
  const insets = useSafeAreaInsets();
  return (
    <View className="relative h-24">
      <View
        className="absolute right-4 p-1"
        style={{ top: insets.top + 8, zIndex: count - index }}
      />
    </View>
  );
}

export function PresenceDot({ size }: { size: keyof typeof DOT }) {
  const side = DOT[size];
  return <View style={{ width: side, height: side, borderRadius: side / 2 }} />;
}
