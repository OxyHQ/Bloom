import { Tabs, TabsTrigger } from '@bloom/tabs';
import type { Cases } from '../support/cases';

export const CASES: Cases = {
  'Tabs basic': () => (
    <Tabs label="Sections" value="posts" onValueChange={() => {}}>
      <TabsTrigger value="posts" label="Posts" />
      <TabsTrigger value="replies" label="Replies" count={3} />
      <TabsTrigger value="media" label="Media" disabled />
    </Tabs>
  ),
};
