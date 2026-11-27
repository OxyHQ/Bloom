// Guards the source had are kept, even where TS types the value present: JS reads them at run
// time (a cache, a test's `as never`). A field the codemod declares from TS's type and the source
// guards is written optional; its own fallbacks for a narrowed value are dropped.
import { Text, VStack, view } from '@oxy.so/bloom-language';
import { pathOf, type GuardPost } from './guards';

interface GuardsProps {
  post: GuardPost;
  engagement: { likes: number };
  views?: number;
  onRate?: (n: number) => void;
}

export const Guards = view(function Guards({ post, engagement, views, onRate }: GuardsProps) {
  const ids = post?.authors?.map((a) => a.id) ?? [];
  const first = post?.tags?.[0] ?? '';
  const path = pathOf();
  const about = path?.endsWith('/about') ?? false;
  const likes = engagement?.likes ?? 0;
  const viewsLabel = typeof views === 'number' && views > 0 ? `${views}` : '';
  return VStack(
    Text(`${ids.length} ${first} ${about} ${likes} ${viewsLabel}`),
    onRate ? Text('rate').onPress(() => onRate?.(1)) : null,
  );
});
