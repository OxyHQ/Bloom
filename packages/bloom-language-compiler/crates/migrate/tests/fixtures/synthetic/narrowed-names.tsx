// A string or number name TS narrowed to present (the `else` of `!name || …`), passed where a
// Bloom view requires it, is `name!` where bloomc does not narrow it.
import { Text, view } from '@oxy.so/bloom-language';

const Live = view(function Live({ username }: { username: string }) {
  return Text(username);
});

export const Card = view(function Card({ username, disable }: { username?: string; disable?: boolean }) {
  if (!username || disable) {
    return Text('nobody');
  }
  return Live({ username });
});
