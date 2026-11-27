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
