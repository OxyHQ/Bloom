import React, { useMemo, useState } from 'react';
import { View } from 'react-native';

import { Chip } from '../../src/chip';
import {
  DataTable,
  DataTableFilter,
  DataTableRowActions,
  DataTableSearch,
  DataTableSelect,
  type DataTableColumn,
  type DataTableRowActionItem,
} from '../../src/data-table';
import { RiEditLine, RiFileTextLine } from '../../src/icons/remix';
import { CellText, NameCell, PersonAvatar } from '../shared/dashboard';
import {
  ADMISSIONS,
  CONDITIONS,
  DEFAULT_SELECTED,
  MORE_ACTIONS,
  PATIENTS,
  STATUSES,
  type Patient,
} from './demo-data';

/**
 * A patients table composed from Bloom's `DataTable`: status / condition
 * filters and a pill search in the toolbar, a selectable patient column, an
 * admission select with icons, status and condition chips, the next
 * appointment, and three row actions — 12 rows a page over 540 seeded
 * patients.
 */

const PAGE_SIZE = 12;

const ROW_ACTIONS: readonly DataTableRowActionItem[] = [
  { icon: RiFileTextLine, label: 'View chart' },
  { icon: RiEditLine, label: 'Edit patient' },
];

const COLUMNS: DataTableColumn<Patient>[] = [
  {
    id: 'name',
    header: 'Patient',
    flex: 1,
    accessor: (p) => p.name,
    cell: ({ row }) => (
      <NameCell leading={<PersonAvatar name={row.name} avatar={row.avatar} color={row.initialsColor} />}>
        <CellText>{row.name}</CellText>
      </NameCell>
    ),
  },
  {
    id: 'admission',
    header: 'Admission',
    flex: 1,
    cell: ({ row }) => (
      <DataTableSelect
        label={`Admission status for ${row.name}`}
        defaultValue={row.admission}
        options={ADMISSIONS}
        width={150}
      />
    ),
  },
  {
    id: 'status',
    header: 'Status',
    flex: 1,
    cell: ({ row }) => (
      <Chip size="medium" hue={row.status.hue}>
        {row.status.label}
      </Chip>
    ),
  },
  {
    id: 'condition',
    header: 'Condition',
    flex: 1,
    cell: ({ row }) => (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, minWidth: 0 }}>
        {row.conditions.map((condition) => (
          <Chip key={condition} size="medium" hue="gray">
            {condition}
          </Chip>
        ))}
      </View>
    ),
  },
  {
    id: 'nextAppointment',
    header: 'Next appointment',
    flex: 1,
    accessor: (p) => p.appointmentTs,
    // Both sortable columns start ascending.
    sortDescFirst: false,
    cell: ({ row }) => <CellText>{row.nextAppointment}</CellText>,
  },
  {
    id: 'actions',
    header: 'Actions',
    width: 140,
    cell: ({ row }) => <DataTableRowActions name={row.name} actions={ROW_ACTIONS} menu={MORE_ACTIONS} />,
  },
];

export function PatientsTable({ testID }: { testID?: string }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [conditionFilter, setConditionFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PATIENTS.filter(
      (p) =>
        (statusFilter === 'all' || p.status.label === statusFilter) &&
        (conditionFilter === 'all' || p.conditions.includes(conditionFilter)) &&
        (q === '' || p.name.toLowerCase().includes(q)),
    );
  }, [statusFilter, conditionFilter, query]);

  const filter = (set: (value: string) => void) => (value: string) => {
    set(value);
    setPage(1);
  };

  return (
    <DataTable
      testID={testID}
      accessibilityLabel="Patients"
      rows={rows}
      columns={COLUMNS}
      getRowId={(row) => row.id}
      title="Total Results"
      summary={`${rows.length.toLocaleString('en-US')} patients`}
      toolbar={
        <>
          <DataTableFilter
            label="Filter by status"
            value={statusFilter}
            onValueChange={filter(setStatusFilter)}
            options={[{ value: 'all', label: 'All statuses' }, ...STATUSES.map((s) => ({ value: s.label, label: s.label }))]}
          />
          <DataTableFilter
            label="Filter by condition"
            value={conditionFilter}
            onValueChange={filter(setConditionFilter)}
            options={[{ value: 'all', label: 'All conditions' }, ...CONDITIONS.map((c) => ({ value: c, label: c }))]}
          />
          <DataTableSearch label="Search patients" value={query} onChangeText={filter(setQuery)} />
        </>
      }
      selectable
      defaultSelectedRowIds={DEFAULT_SELECTED}
      getSelectRowLabel={(row) => `Select ${row.name}`}
      selectAllLabel="Select all patients on this page"
      page={page}
      onPageChange={setPage}
      pageSize={PAGE_SIZE}
      emptyState="No patients match your filters."
      minWidth={960}
      layout="inset"
    />
  );
}
