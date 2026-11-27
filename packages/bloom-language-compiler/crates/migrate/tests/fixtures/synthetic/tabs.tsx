// TS's `as const` tab lists: written inline in a view, a module constant of its own, which
// keeps the literals' union; a module constant written `as const` stays itself.
import { HStack, Text, view } from '@oxy.so/bloom-language';

type Tab = 'videos' | 'following';

const SIZES = ['sm', 'md'] as const;

export const Tabs = view(function Tabs({ value, onChange }: { value: Tab; onChange: (tab: Tab) => void }) {
  return HStack(
    (['videos', 'following'] as const).map((tab) =>
      Text(tab)
        .accessibilityState({ selected: tab === value })
        .onPress(() => onChange(tab))
        .id(tab),
    ),
    SIZES.map((size) => Text(size).id(size)),
    (['videos', 'following'] as const).map((tab) => Text(tab).id(`again-${tab}`)),
  );
});
