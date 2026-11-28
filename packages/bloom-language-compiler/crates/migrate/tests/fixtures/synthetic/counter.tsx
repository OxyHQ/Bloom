// A view with state, a handler, a functional update and a binding.
import { useCallback, useMemo, useState } from 'react';
import { Button, HStack, Text, Toggle, VStack, view } from '@oxy.so/bloom-language';

interface CounterProps {
  /** Where the count starts. */
  start: number;
  label?: string;
}

export const Counter = view(function Counter({ start, label }: CounterProps) {
  const [count, setCount] = useState(start);
  const [loud, setLoud] = useState(false);
  const shown = useMemo(() => `${label ?? 'Count'}: ${count}`, [label, count]);

  const increment = useCallback(() => {
    setCount((n) => n + 1);
  }, []);

  return VStack(
    Text(shown).foreground(loud ? 'primary' : 'muted'),
    HStack(
      Button(Text('+')).onPress(increment),
      Button(Text('reset')).onPress(() => setCount(start)),
    ).spacing('sm'),
    Toggle([loud, setLoud]).label('Loud'),
  ).spacing('md');
});
