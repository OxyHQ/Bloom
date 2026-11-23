import {
  DataTable,
  DataTableFilter,
  DataTableSearch,
  DataTableSelect,
  type DataTableColumn,
} from '@oxy.so/bloom/data-table';
import { Text } from '@oxy.so/bloom/typography';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const set = () => {};

interface Person {
  readonly id: string;
  readonly name: string;
  readonly score: number;
  readonly status: string;
}
const PEOPLE: readonly Person[] = [
  { id: 'a', name: 'Ana Lima', score: 42, status: 'open' },
  { id: 'b', name: 'Rui Costa', score: 7, status: 'closed' },
  { id: 'c', name: 'Mia Sousa', score: 19, status: 'open' },
];
const rowId = (row: Person) => row.id;
const name = (row: Person) => row.name;
const score = (row: Person) => row.score;
const STATUSES = [
  { value: 'open', label: 'Open', dot: 'success' as const },
  { value: 'closed', label: 'Closed' },
];

/** The two columns most cases draw, as the language writes them. */
const languageColumns = () => [
  L.DataColumn<Person>('name', 'Name', name),
  L.DataColumn<Person>('score', 'Score', score).align('end'),
];
const bloomColumns: readonly DataTableColumn<Person>[] = [
  { id: 'name', header: 'Name', accessor: name },
  { id: 'score', header: 'Score', accessor: score, align: 'end' },
];

export const DATA_TABLE_CASES: readonly ParityCase[] = [
  {
    name: 'a data table',
    language: () => toElement(L.DataTable(PEOPLE, rowId, ...languageColumns()).label('People')),
    bloom: () => (
      <DataTable
        rows={PEOPLE}
        columns={bloomColumns}
        getRowId={rowId}
        accessibilityLabel="People"
      />
    ),
  },
  {
    name: 'a title, a summary, no border of its own',
    language: () =>
      toElement(
        L.DataTable(PEOPLE, rowId, ...languageColumns())
          .title('Total Results')
          .summary('3 people')
          .bordered(false)
          .label('People'),
      ),
    bloom: () => (
      <DataTable
        rows={PEOPLE}
        columns={bloomColumns}
        getRowId={rowId}
        accessibilityLabel="People"
        title="Total Results"
        summary="3 people"
        bordered={false}
      />
    ),
  },
  {
    name: 'sorted, its columns laid out',
    language: () =>
      toElement(
        L.DataTable(
          PEOPLE,
          rowId,
          L.DataColumn<Person>('name', 'Name', name).width('160').minWidth('96'),
          L.DataColumn<Person>('score', 'Score', score).share(2).sortsDescendingFirst(),
          L.DataColumn<Person>('status', 'Status').width('fit').sortable(false).label('State'),
        )
          .sorting([{ columnId: 'score', direction: 'descending' }, set])
          .label('People'),
      ),
    bloom: () => (
      <DataTable
        rows={PEOPLE}
        columns={[
          { id: 'name', header: 'Name', accessor: name, width: 160, minWidth: 96 },
          { id: 'score', header: 'Score', accessor: score, flex: 2, sortDescFirst: true },
          {
            id: 'status',
            header: 'Status',
            width: 'auto',
            sortable: false,
            headerAccessibilityLabel: 'State',
          },
        ]}
        getRowId={rowId}
        accessibilityLabel="People"
        sort={{ columnId: 'score', direction: 'descending' }}
        onSortChange={set}
      />
    ),
  },
  {
    name: 'rows selected, in its own words',
    language: () =>
      toElement(
        L.DataTable(PEOPLE, rowId, ...languageColumns())
          .rowSelection([['b'], set])
          .labels({ selectAll: 'Every person', selectRow: (_row, id) => `Person ${id}` })
          .label('People'),
      ),
    bloom: () => (
      <DataTable
        rows={PEOPLE}
        columns={bloomColumns}
        getRowId={rowId}
        accessibilityLabel="People"
        selectable
        selectedRowIds={['b']}
        onSelectionChange={set}
        selectAllLabel="Every person"
        getSelectRowLabel={(_row, id) => `Person ${id}`}
      />
    ),
  },
  {
    name: 'paged',
    language: () =>
      toElement(
        L.DataTable(PEOPLE, rowId, ...languageColumns())
          .pageSize(2)
          .page([2, set])
          .label('People'),
      ),
    bloom: () => (
      <DataTable
        rows={PEOPLE}
        columns={bloomColumns}
        getRowId={rowId}
        accessibilityLabel="People"
        pageSize={2}
        page={2}
        onPageChange={set}
      />
    ),
  },
  ...ENUMS.tableSize.map((size) => ({
    name: `${size} rows`,
    language: () =>
      toElement(
        L.DataTable(PEOPLE, rowId, ...languageColumns())
          .size(size)
          .label('People'),
      ),
    bloom: () => (
      <DataTable
        rows={PEOPLE}
        columns={bloomColumns}
        getRowId={rowId}
        accessibilityLabel="People"
        size={size}
      />
    ),
  })),
  {
    name: 'its density control',
    language: () =>
      toElement(
        L.DataTable(PEOPLE, rowId, ...languageColumns())
          .sizeToggle(['sm', set])
          .labels({ density: { md: 'Roomy', sm: 'Tight' }, densityName: 'Rows' })
          .label('People'),
      ),
    bloom: () => (
      <DataTable
        rows={PEOPLE}
        columns={bloomColumns}
        getRowId={rowId}
        accessibilityLabel="People"
        showSizeToggle
        size="sm"
        onSizeChange={set}
        sizeToggleLabels={{ md: 'Roomy', sm: 'Tight' }}
        sizeToggleAccessibilityLabel="Rows"
      />
    ),
  },
  {
    name: 'inset rows, a minimum width, empty',
    language: () =>
      toElement(
        L.DataTable([] as Person[], rowId, ...languageColumns())
          .style('inset')
          .minWidth('640')
          .emptyState('No people yet')
          .label('People'),
      ),
    bloom: () => (
      <DataTable
        rows={[]}
        columns={bloomColumns}
        getRowId={rowId}
        accessibilityLabel="People"
        layout="inset"
        minWidth={640}
        emptyState="No people yet"
      />
    ),
  },
  {
    name: 'cells of its own, a select in one, a toolbar',
    language: () =>
      toElement(
        L.DataTable(
          PEOPLE,
          rowId,
          L.DataColumn<Person>('name', L.Text('Name'), name).cell(({ row }) => L.Text(row.name)),
          L.DataColumn<Person>('status', 'Status').cell(({ row, size }) =>
            L.DataTableSelect([row.status, set], 'Status', STATUSES, '120')
              .size(size)
              .testID(`status-${row.id}`),
          ),
        )
          .toolbar(
            L.DataTableFilter(['all', set], 'Status', [
              { value: 'all', label: 'All' },
              { value: 'open', label: 'Open' },
            ]),
            L.DataTableSearch(['', set], 'Search people').placeholder('Search'),
          )
          .label('People'),
      ),
    bloom: () => (
      <DataTable
        rows={PEOPLE}
        columns={[
          {
            id: 'name',
            header: <Text>Name</Text>,
            accessor: name,
            cell: ({ row }) => <Text>{row.name}</Text>,
          },
          {
            id: 'status',
            header: 'Status',
            cell: ({ row, size }) => (
              <DataTableSelect
                label="Status"
                options={STATUSES}
                value={row.status}
                onValueChange={set}
                width={120}
                size={size}
                testID={`status-${row.id}`}
              />
            ),
          },
        ]}
        getRowId={rowId}
        accessibilityLabel="People"
        toolbar={
          <>
            <DataTableFilter
              label="Status"
              options={[
                { value: 'all', label: 'All' },
                { value: 'open', label: 'Open' },
              ]}
              value="all"
              onValueChange={set}
            />
            <DataTableSearch
              label="Search people"
              value=""
              onValueChange={set}
              placeholder="Search"
            />
          </>
        }
      />
    ),
  },
  {
    name: 'a disabled filter',
    language: () =>
      toElement(
        L.DataTableFilter(['all', set], 'Status', [{ value: 'all', label: 'All' }]).disabled(),
      ),
    bloom: () => (
      <DataTableFilter
        label="Status"
        options={[{ value: 'all', label: 'All' }]}
        value="all"
        onValueChange={set}
        disabled
      />
    ),
  },
];
