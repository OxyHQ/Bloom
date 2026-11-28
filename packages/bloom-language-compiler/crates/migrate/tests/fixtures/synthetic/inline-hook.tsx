// A private hook with an effect, used by one view, is the view's own code: its effect is the
// view's `.task(id:)`, and a name the view already uses is renamed after the hook. A closure that
// reads a name declared below it moves below that name. An indexed `every` takes the pairs, and
// an async call a `then` callback ends with is a task.
import { useEffect, useState } from 'react';
import { Text, VStack, view } from '@oxy.so/bloom-language';
import { prefetch, revalidate } from './prefetch';

/** Starts the replies' read as soon as the screen knows its post. */
function usePrefetch(postId: string, depth: number) {
  const ready = postId.length > 0;
  useEffect(() => {
    if (!ready) return;
    prefetch(postId, depth);
  }, [postId, ready, depth]);
}

export const Thread = view(function Thread({ postId: id, ids }: { postId: string; ids: string[] }) {
  const [parents, setParents] = useState<string[]>([]);
  usePrefetch(id ? `${id}` : '', 2);
  const loadParent = async (parentId: string) => {
    const fresh = await revalidate(parentId);
    setParents([...parents, fresh?.parentId ?? parentId]);
  };
  const title = () => `${heading} (${parents.length})`;
  const heading = ids.every((part, index) => part.length > index) ? 'Thread' : 'Replies';
  return VStack(Text(title())).onPress(() => {
    revalidate(id).then((fresh) => {
      if (!fresh) return;
      loadParent(fresh.parentId ?? id);
    });
  });
});
