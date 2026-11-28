// A list TS types present but the source tests (`!communities`) is declared optional, and its test
// is whether it is there (an empty JS array is truthy). A number after a string's `||` in a key is
// its text.
import { Text, VStack, view } from '@oxy.so/bloom-language';

interface Community {
  id?: string;
  name: string;
}

export const Communities = view(function Communities({ communities }: { communities: Community[] }) {
  if (!communities || communities.length === 0) {
    return null;
  }
  return VStack(...communities.map((c, index) => Text(c.name).id(c.id || index)));
});
