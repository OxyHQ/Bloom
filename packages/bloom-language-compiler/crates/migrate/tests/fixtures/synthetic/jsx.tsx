// A React component that draws JSX is a view: TS components are nodes with
// their props by name, a `key` is `.id(…)`, `memo` goes (a view is memoised)
// and `toElement` disappears.
import { memo, type ReactNode } from 'react';
import { Text, VStack, toElement } from '@oxy.so/bloom-language';
import { Card } from './card';

interface ListProps {
  names: string[];
  footer?: ReactNode;
}

export const NameList = memo(function NameList({ names, footer }: ListProps) {
  if (names.length === 0) {
    return <Card title="Nobody" />;
  }
  return (
    <Card title="People">
      {toElement(VStack(...names.map((n) => toElement(Text(n), n))))}
      {names.map((n) => (
        <Card key={n} title={n} />
      ))}
      {footer}
    </Card>
  );
});
