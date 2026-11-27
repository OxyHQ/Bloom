// JS members on a value Bloom types `Foreign` stay TS's own (`length`, `trim()`, `join`);
// on a Bloom list they are Bloom's (`count`, `joined`).
import { Text } from '@oxy.so/bloom-language';
import { thing } from './untyped';

export function label(): string {
  const x = thing();
  const s = x.name.trim();
  const xs: string[] = ['a'];
  return `${x.items.length} ${s} ${xs.length} ${xs.join(',')} ${x.tags.join(',')}`;
}

export const Label = function Label() {
  return Text(label());
};
