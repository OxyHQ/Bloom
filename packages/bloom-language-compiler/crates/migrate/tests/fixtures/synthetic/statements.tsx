// Statements with a `.bloom` form: a `switch` is a `match`, `continue` a guard,
// a local object or list built in place a `var` its writes reassign, a computed
// key a dictionary, and a value `||` chain spelled from the types.
import { useState } from 'react';
import { Text, VStack, view, toElement } from '@oxy.so/bloom-language';

type Tab = 'all' | 'mentions' | 'likes';
type Profile = { name?: string; handle?: string };

function label(tab: Tab): string {
  switch (tab) {
    case 'all':
      return 'All';
    case 'mentions':
    case 'likes':
      return 'Activity';
    default:
      return 'Other';
  }
}

function count(tags: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  const seen: string[] = [];
  for (const tag of tags) {
    if (tag === '') continue;
    counts[tag] = (counts[tag] ?? 0) + 1;
    seen.push(tag);
  }
  return { ...counts, [seen.length > 0 ? 'last' : 'none']: seen.length };
}

export const Header = view(function Header({
  profile,
  title,
}: {
  profile?: Profile;
  title: string;
}) {
  const [shown, setShown] = useState(title);
  const [synced, setSynced] = useState(title);
  if (synced !== title) {
    setSynced(title);
    setShown(title);
  }
  const name = profile?.name || profile?.handle || title;
  return toElement(VStack(Text(name), Text(shown), Text(label('all'))));
});
