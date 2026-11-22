import { Search } from '@bloom/search';
import type { Cases } from '../support/cases';

export const CASES: Cases = {
  'Search plain': () => <Search label="Find" value="" />,
  'Search field with slots': () => (
    <Search
      label="Find"
      value="query"
      presentation="field"
      onClearText={() => {}}
      containerStyle={{ width: 360 }}
      fieldStyle={{ height: 44 }}
      style={{ fontSize: 16 }}
    />
  ),
  'Search collapsible': () => <Search label="Find" value="" presentation="collapsible" />,
  'Search tokens, disabled': () => (
    <Search
      label="Find"
      value=""
      disabled
      tokens={[{ key: 'a', label: 'PDF' }]}
      onRemoveToken={() => {}}
    />
  ),
};
