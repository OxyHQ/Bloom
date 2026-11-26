// A TS value's fields are TS's to write; a test that is always true folds to
// its branch. In an async closure TS calls, a rejection (or a throw) rejects it.
import { Button, Text, VStack, view } from '@oxy.so/bloom-language';
import { useEffect } from 'react';
import { load } from './api';
import { usePlayer, useTask } from './player';

interface Track {
  id: string;
  title: string;
}

function labelOf(track: Track): string {
  const id = typeof track.id === 'string' ? track.id : '';
  return id + track.title;
}

export const Deck = view(function Deck({ track }: { track: Track }) {
  const player = usePlayer();
  useTask(async () => {
    if (!track.id) throw new Error('No track');
    const loaded = await load(track.id);
    return loaded.data.url;
  });
  useEffect(() => {
    player.loop = true;
  }, [player]);
  return VStack(
    Text(labelOf(track)),
    Button('Skip').onPress(() => {
      player.time += 5;
      player.time++;
    }),
  );
});
