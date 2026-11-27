// Scopes TS has and 2.0 spells: a bare block, an optional unwrapped where its branch writes it,
// a `catch` beside an `error` state, a type predicate, and a local function of one object
// called with labelled arguments.
import { useState } from 'react';
import { Button, Text, VStack, view } from '@oxy.so/bloom-language';

interface Draft {
  name: string;
}

interface Options {
  title: string;
  loud?: boolean;
}

type Tone = 'calm' | 'loud';

function isTone(value: string): value is Tone {
  return value === 'calm' || value === 'loud';
}

function shout({ title, loud = false }: Options): string {
  {
    const mark = loud ? '!' : '';
    return `${title}${mark}`;
  }
}

async function load(): Promise<string> {
  return 'ok';
}

export const Editor = view(function Editor({ title }: { title: string }) {
  const [editing, setEditing] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reload = async () => {
    try {
      await load();
      setError(null);
    } catch {
      setError('failed');
    }
  };
  return VStack(
    Text(shout({ title, loud: isTone(title) })),
    Button('Edit').onPress(() => setEditing({ name: title })),
    editing && Button(editing.name).onPress(() => setEditing({ ...editing, name: 'b' })),
    Button('Reload').onPress(() => void reload()),
  );
});
