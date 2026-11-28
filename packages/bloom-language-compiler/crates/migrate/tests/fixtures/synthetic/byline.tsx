// A list of a string and nodes spread into a text (PostItem's collaborators' byline): its
// strings are text nodes. Props destructured from `props` are field reads, not the whole value.
import { HStack, RawText, Text, view } from '@oxy.so/bloom-language';

interface Author {
  firstName: string;
  href?: string;
}

interface BylineProps {
  authors: Author[];
  joiner: string;
}

export const Byline = view(function Byline(props: BylineProps) {
  const { joiner } = props;
  return HStack(
    RawText(
      ...props.authors.flatMap((a, i) => {
        const separator = i === 0 ? '' : joiner;
        return [separator, a.href ? Text(a.firstName).weight('semibold') : RawText(a.firstName)];
      }),
    ),
  );
});

interface Variant {
  label: string;
  rendered: boolean;
}

// A ternary item: of two strings, its text; of a string and a node, the string branch's.
export const Variants = view(function Variants({ variants }: { variants: Variant[] }) {
  return RawText(
    ...variants.flatMap((variant, index) => [
      index > 0 ? ' · ' : '',
      variant.rendered ? variant.label : Text(variant.label).foreground('muted'),
    ]),
  );
});

// A spread of a name (PostItem's context line) is the text's runs, not a builder line.
export function runsText(...runs: (string | undefined)[]) {
  return Text(...runs).weight('semibold');
}
