// `Omit`/`Pick` of an object type: its fields but those, or those. Of a local type in a type
// alias (`Omit<P, 'k'> & { … }`) or as the whole props type; of an imported one as an
// interface's base (`interface C extends Omit<Q, 'k'>`), also when C is part of the props.
import { Text, view } from '@oxy.so/bloom-language';
import type { CellProps } from './grid.types';

interface PlayerProps {
  src: string;
  player: string;
  loop?: boolean;
}

type SurfaceProps = Omit<PlayerProps, 'player'> & { player: string | null };

export const Surface = view(function Surface({ src, player }: SurfaceProps) {
  return Text(`${src} ${player ?? ''}`);
});

export const Owned = view(function Owned({ src, loop = false }: Omit<PlayerProps, 'player'>) {
  return Text(`${src} ${loop}`);
});

interface ChromeProps extends Omit<CellProps, 'onOpen'> {
  live: boolean;
}

export const Chrome = view(function Chrome({ title, live, depth }: ChromeProps & { depth: number }) {
  return Text(`${title} ${live} ${depth}`);
});
