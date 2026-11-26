// A React component that only returns `toElement(tree)` is a view; the
// `Embed` render prop is the TS component with its builder.
import React from 'react';
import { Embed, HStack, Text, toElement } from '@oxy.so/bloom-language';
import { Link } from 'expo-router';

interface RowProps {
  label: string;
  href?: string;
}

const LinkRow: React.FC<RowProps> = ({ label, href }) => {
  const text = Text(label).lines(1);
  return toElement(
    HStack(
      href
        ? Embed((render) => (
            <Link href={href} push asChild>
              {render(text)}
            </Link>
          ))
        : text,
    ).align('center'),
  );
};

export default React.memo(LinkRow);
