/**
 * The hand-written embedded-language equivalents of the `.bloom` fixtures:
 * what a careful author writes in TypeScript, for the cost gate to compare.
 */
import { useState } from 'react';
import { Button, HStack, Text, VStack, view } from '@oxy.so/bloom-language';

export const Counter = view(function Counter({ step = 1 }: { step?: number }) {
  const [count, setCount] = useState(0);
  const label = `Count ${count}`;
  const add = () => setCount((current) => current + step);
  return VStack(Text(label), Button(Text('Add')).onPress(add)).spacing('md');
});

export const Row = view(function Row({
  title,
  pinned = false,
}: {
  title: string;
  pinned?: boolean;
}) {
  return HStack(Text(title).font('headline'), pinned ? Text('Pinned').foreground('muted') : null)
    .spacing('sm')
    .padding('md');
});

export const Banner = view(function Banner() {
  return VStack(Text('Welcome').font('title-3'), Text('Nothing to do yet').foreground('muted'))
    .spacing('sm')
    .padding('lg');
});
