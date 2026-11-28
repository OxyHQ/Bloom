// `{c && xs?.map((x) => …)}` in JSX: the rows of an optional list, drawn when `c` holds.
import { Embed, RawText, VStack, toElement } from '@oxy.so/bloom-language';

export function Roster({ failed, names }: { failed: boolean; names?: string[] }) {
  return toElement(
    VStack(
      Embed(
        <>
          {failed && toElement(RawText('Could not load'))}
          {!failed && names?.map((name) => toElement(RawText(name), name))}
        </>,
      ),
    ),
  );
}
