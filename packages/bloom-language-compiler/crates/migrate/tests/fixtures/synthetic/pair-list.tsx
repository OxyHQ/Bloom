// `([['owned', 'Owned'], ['joined', 'Joined']] as const).map(([key, label]) => …)`: TS's readonly
// tuples are Bloom tuples.
import { Text, VStack, view } from '@oxy.so/bloom-language';

export const Sections = view(function Sections({ counts }: { counts: Record<string, number> }) {
  return VStack(
    (
      [
        ['owned', 'Owned'],
        ['joined', 'Joined'],
      ] as const
    ).map(([key, label]) => Text(`${label}: ${counts[key] ?? 0}`).id(key)),
  );
});
