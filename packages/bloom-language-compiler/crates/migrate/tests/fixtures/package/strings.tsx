// A string's JS `length`, `slice` and `padStart` are UTF-16 units: in 2.0 they read the string's
// `utf16` view (Swift's), since a Bloom `String` counts user-perceived characters. A debounce, a
// `setTimeout` its cleanup clears, is a `.task(id:)` that sleeps (cancelled by a new id) before
// the work, and the "js" timers leave the imports.
import { useEffect, useState } from 'react';
import { Text, VStack, view } from '@oxy.so/bloom-language';

const MAX = 80;

function clip(s: string): string {
  return s.length > MAX ? `${s.slice(0, MAX)}…` : s;
}

export const Search = view(function Search({ query }: { query: string }) {
  const [term, setTerm] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setTerm(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);
  return VStack(Text(clip(term)), Text(String(term.length).padStart(3, '0')));
});
