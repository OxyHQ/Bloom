import { RiSearchLine } from '@bloom/icons/remix';
import { DataTable, DataTableFilter, DataTableSearch, DataTableSelect } from '@bloom/data-table';
import type { Cases } from '../support/cases';

const DOTS = [
  { value: 'completed', label: 'Completed', dot: 'success' },
  { value: 'waiting', label: 'Waiting', dot: 'warning' },
] as const;
const ICONS = [
  { value: 'search', label: 'Search', icon: RiSearchLine },
  { value: 'plain', label: 'Plain' },
];

type Row = { id: string; name: string; total: number };
const ROWS: Row[] = [
  { id: 'a', name: 'Aspen', total: 12 },
  { id: 'b', name: 'Corey', total: 40 },
  { id: 'c', name: 'Hanna', total: 7 },
];
const COLUMNS = [
  { id: 'name', header: 'Name', accessor: (row: Row) => row.name },
  { id: 'total', header: 'Total', accessor: (row: Row) => row.total, align: 'end' as const },
];

export const CASES: Cases = {
  'DataTable bordered': () => (
    <DataTable
      rows={ROWS}
      columns={COLUMNS}
      getRowId={(row) => row.id}
      accessibilityLabel="Orders"
      title="Orders"
      summary="3 orders"
      pageSize={2}
      testID="dt"
    />
  ),
  'DataTable inset sorted': () => (
    <DataTable
      rows={ROWS}
      columns={COLUMNS}
      getRowId={(row) => row.id}
      accessibilityLabel="Orders"
      layout="inset"
      defaultSort={{ columnId: 'total', direction: 'desc' }}
      pageSize={2}
      testID="dt"
    />
  ),
  'DataTable inset empty': () => (
    <DataTable
      rows={[]}
      columns={COLUMNS}
      getRowId={(row: Row) => row.id}
      accessibilityLabel="Orders"
      layout="inset"
      emptyState="No orders"
      testID="dt"
    />
  ),
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
