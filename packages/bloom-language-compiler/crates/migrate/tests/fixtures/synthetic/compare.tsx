// A memo comparator is the view's `equal` member.
import { memo } from 'react';
import { Text } from '@oxy.so/bloom-language';

interface RowProps {
  id: string;
  title: string;
}

export const Row = memo(
  function Row({ title }: RowProps) {
    return <>{Text(title)}</>;
  },
  (prev, next) => prev.id === next.id,
);
