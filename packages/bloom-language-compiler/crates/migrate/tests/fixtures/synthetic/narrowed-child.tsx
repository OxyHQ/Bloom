// An optional child inside a branch that tested it (`tabBar ? <Card>{tabBar}</Card> : null`) is
// the child itself: bloomc has narrowed it, so the codemod's `if let tabBar = tabBar` goes.
import type React from 'react';
import { Text, toElement } from '@oxy.so/bloom-language';
import { Card } from './card';

interface TabsProps {
  tabBar: React.ReactElement | null;
}

export function Tabs({ tabBar, depth }: TabsProps & { depth: number }) {
  const sticky = tabBar ? (
    <Card
      // The strip's title.
      title={`tabs ${depth}`}
    >
      {tabBar}
    </Card>
  ) : null;
  return (
    <Card title="page">
      {sticky}
      {toElement(Text('end'))}
    </Card>
  );
}
