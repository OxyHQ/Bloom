// A TS component's hyphenated prop (`aria-pressed`) is passed as JSX passes it, a spread of a
// one-entry dictionary. A `ReadonlySet<T>` is a `Set<T>`, and `new Set(s).add(x)` (a copy, then
// an add) is `s.inserting(x)`.
import { useState } from 'react';
import { Embed, VStack, view } from '@oxy.so/bloom-language';
import { Chip } from './chip';

export const Chips = view(function Chips({ slugs }: { slugs: string[] }) {
  const [chosen, setChosen] = useState<ReadonlySet<string>>(new Set());
  const choose = (slug: string) =>
    setChosen((current) => (current.has(slug) ? current : new Set(current).add(slug)));
  return VStack(
    ...slugs.map((slug) =>
      Embed(<Chip label={slug} onPress={() => choose(slug)} aria-pressed={chosen.has(slug)} />),
    ),
  );
});
