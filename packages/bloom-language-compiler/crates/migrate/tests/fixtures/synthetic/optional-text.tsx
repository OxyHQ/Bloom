// An optional string drawn among a text's runs draws nothing when absent, `!!x?.trim()` is its
// truthiness, and a `Record<K, V>` read destructured is a `V` (every key is present).
import { RawText, Text, VStack, view } from '@oxy.so/bloom-language';

type Size = 'sm' | 'md';
interface SizeSpec {
  font: 'sm' | 'md';
  gap: number;
}

const SIZES: Record<Size, SizeSpec> = {
  sm: { font: 'sm', gap: 2 },
  md: { font: 'md', gap: 4 },
};

export const Handle = view(function Handle({ handle, name, size }: { handle?: string; name?: string; size: Size }) {
  const { font, gap } = SIZES[size];
  const hasName = !!name?.trim();
  return VStack(
    RawText('@', handle).foreground('muted'),
    Text(hasName ? 'named' : 'anonymous').font(font).padding('top', gap > 2 ? 'sm' : 'xs'),
  );
});
