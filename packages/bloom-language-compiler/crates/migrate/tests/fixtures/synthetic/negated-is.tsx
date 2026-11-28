// `!Array.isArray(x)` is `!(x is [Foreign])`: `is` binds looser than `!`.
import { Text, view } from '@oxy.so/bloom-language';

export function count(media: unknown): number {
  if (!Array.isArray(media)) return 0;
  return 1;
}

export const Count = view(function Count({ media }: { media: unknown }) {
  return Text(`${count(media)}`);
});
