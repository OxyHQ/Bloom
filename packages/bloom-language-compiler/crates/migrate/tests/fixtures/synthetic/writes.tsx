// A TS value's fields are TS's to write; a test that is always true folds to
// its branch.
import { Button, Text, VStack, view } from '@oxy.so/bloom-language';
import { useEffect } from 'react';
import { usePlayer } from './player';

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
