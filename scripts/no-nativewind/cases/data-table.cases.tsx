import { RiSearchLine } from '@bloom/icons/remix';
import { DataTableFilter, DataTableSearch, DataTableSelect } from '@bloom/data-table';
import type { Cases } from '../support/cases';

const DOTS = [
  { value: 'completed', label: 'Completed', dot: 'success' },
  { value: 'waiting', label: 'Waiting', dot: 'warning' },
] as const;
const ICONS = [
  { value: 'search', label: 'Search', icon: RiSearchLine },
  { value: 'plain', label: 'Plain' },
];

export const CASES: Cases = {
  'DataTableSelect dot md': () => (
    <DataTableSelect label="Status" defaultValue="completed" options={DOTS} width={142} />
  ),
  'DataTableSelect dot sm': () => (
    <DataTableSelect label="Status" defaultValue="waiting" options={DOTS} width={132} size="sm" />
  ),
  'DataTableSelect icon': () => (
    <DataTableSelect label="Kind" defaultValue="search" options={ICONS} width={142} testID="sel" />
  ),
  'DataTableSelect icon sm disabled': () => (
    <DataTableSelect
      label="Kind"
      defaultValue="search"
      options={ICONS}
      width={132}
      size="sm"
      disabled
    />
  ),
  'DataTableSelect no icon': () => (
    <DataTableSelect label="Kind" defaultValue="plain" options={ICONS} width={142} />
  ),
  DataTableFilter: () => (
    <DataTableFilter
      label="Filter"
      options={[
        { value: 'all', label: 'All' },
        { value: 'open', label: 'Open' },
      ]}
    />
  ),
  DataTableSearch: () => <DataTableSearch value="" onChangeText={() => {}} />,
};
