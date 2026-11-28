// Collections: Map/Set values, list spread, enumerated maps, forEach, indexOf,
// some/every, a ref, and a value's `||` spelled from its type.
import { useRef, useState } from 'react';
import { Button, Text, VStack, view } from '@oxy.so/bloom-language';

export const Picker = view(function Picker(props: {
  ids: string[];
  extra: string;
  title?: string;
}) {
  const [picked, setPicked] = useState(new Set<string>());
  const taps = useRef(0);
  const byId = new Map(props.ids.map((id) => [id, id.length]));
  const all = [...props.ids, props.extra];
  const missing = all.indexOf('x') === -1;
  const long = all.some((id) => id.length > 3);

  const toggle = (id: string) => {
    taps.current = taps.current + 1;
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const logAll = () => {
    all.forEach((id, index) => {
      toggle(`${index}:${id}`);
    });
  };

  return VStack(
    Text(props.title || 'Pick'),
    Text(`${byId.size} ${picked.size} ${missing} ${long}`),
    ...all.map((id, index) => Text(`${index}. ${id}`)),
    Button(Text('All')).onPress(() => logAll()),
  );
});
