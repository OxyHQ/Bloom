// A React component is a view when each return is an element: JSX, `toElement(…)`, `null`, a
// body constant that is one (`const empty = … ? <A/> : null; … return empty`), or an arrow's
// expression body (`(p) => p.ok ? <A/> : <B/>`).
import type React from 'react';
import { Text, toElement } from '@oxy.so/bloom-language';
import { Card } from './card';

interface ListProps {
  title: string;
  count: number;
}

const List: React.FC<ListProps> = ({ title, count }) => {
  const empty = count === 0 ? <Card title="Nothing yet" /> : null;
  if (empty) {
    return empty;
  }
  return toElement(Text(`${title}: ${count}`));
};

const Status: React.FC<{ ok: boolean }> = ({ ok }) => (ok ? <Card title="Ready" /> : <Card title="Waiting" />);

export { List, Status };
