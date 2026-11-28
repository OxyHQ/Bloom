// `xs.forEach((x, i) => { if (…) return; … })` is a `for` whose bare `return`s are `continue`s
// (Swift's form). A callback that returns inside a loop of its own stays a closure call.
import { Text, view } from '@oxy.so/bloom-language';

export function keys(items: { id?: string; url?: string }[]): string[] {
  const out: string[] = [];
  items.forEach((item, i) => {
    const key = item.id || item.url;
    if (!key) return;
    out.push(`${i}:${key}`);
  });
  return out;
}

export const Keys = view(function Keys({ items }: { items: { id?: string; url?: string }[] }) {
  return Text(keys(items).join(', '));
});
