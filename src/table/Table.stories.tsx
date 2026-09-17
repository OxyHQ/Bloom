import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  type TableSize,
  type TableSortDirection,
} from './index';

const meta: Meta<typeof Table> = {
  title: 'Base/Table',
  component: Table,
};

export default meta;

type Story = StoryObj<typeof Table>;

const PEOPLE = [
  { id: '1', name: 'Olivia Rhye', role: 'Product Designer', status: 'Active' },
  { id: '2', name: 'Phoenix Baker', role: 'Engineer', status: 'Active' },
  { id: '3', name: 'Lana Steiner', role: 'Design Lead', status: 'Invited' },
  { id: '4', name: 'Demi Wilkinson', role: 'Frontend Engineer', status: 'Active' },
];

export const Basic: Story = {
  render: () => (
    <View style={{ width: 520 }}>
      <Table accessibilityLabel="Customers">
        <TableHeader>
          <TableColumn>Name</TableColumn>
          <TableColumn>Role</TableColumn>
          <TableColumn>Status</TableColumn>
        </TableHeader>
        <TableBody>
          {PEOPLE.map((person) => (
            <TableRow key={person.id}>
              <TableCell>{person.name}</TableCell>
              <TableCell>{person.role}</TableCell>
              <TableCell>{person.status}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </View>
  ),
};

function SortableTable({ size }: { size: TableSize }) {
  const [sort, setSort] = useState<{ key: 'name' | 'role'; direction: TableSortDirection }>({
    key: 'name',
    direction: 'ascending',
  });
  const rows = useMemo(() => {
    const sorted = [...PEOPLE].sort((a, b) => a[sort.key].localeCompare(b[sort.key]));
    return sort.direction === 'descending' ? sorted.reverse() : sorted;
  }, [sort]);
  const toggle = (key: 'name' | 'role') =>
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === 'ascending' ? 'descending' : 'ascending',
    }));
  const direction = (key: 'name' | 'role'): TableSortDirection =>
    sort.key === key ? sort.direction : 'none';

  return (
    <View style={{ width: 520 }} testID={`table-${size}`}>
      <Table size={size} accessibilityLabel="Customers">
        <TableHeader>
          <TableColumn width={193} onSort={() => toggle('name')} sortDirection={direction('name')}>
            Name
          </TableColumn>
          <TableColumn width={222} onSort={() => toggle('role')} sortDirection={direction('role')}>
            Role
          </TableColumn>
          <TableColumn>Status</TableColumn>
        </TableHeader>
        <TableBody>
          {rows.map((person) => (
            <TableRow key={person.id} selected={person.id === '2'}>
              <TableCell>{person.name}</TableCell>
              <TableCell>{person.role}</TableCell>
              <TableCell>{person.status}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </View>
  );
}

/** Both densities, with sortable headers and a selected row — the data table's states. */
export const Matrix: Story = {
  render: () => (
    <View style={{ gap: 40, alignItems: 'flex-start' }}>
      <SortableTable size="md" />
      <SortableTable size="sm" />
    </View>
  ),
};

/** No rows: the body shows its 160px empty band. */
export const Empty: Story = {
  render: () => (
    <View style={{ width: 520 }}>
      <Table accessibilityLabel="Customers">
        <TableHeader>
          <TableColumn>Name</TableColumn>
          <TableColumn>Role</TableColumn>
        </TableHeader>
        <TableBody emptyState="No customers match your filters." />
      </Table>
    </View>
  ),
};

/** Wider than its container: `minWidth` scrolls the table horizontally. */
export const Scrolling: Story = {
  render: () => (
    <View style={{ width: 360, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', borderRadius: 16, paddingTop: 8, overflow: 'hidden' }}>
      <Table accessibilityLabel="Customers" minWidth={640}>
        <TableHeader>
          <TableColumn width={200}>Customer name</TableColumn>
          <TableColumn>Role</TableColumn>
          <TableColumn align="end" width={120}>
            Status
          </TableColumn>
        </TableHeader>
        <TableBody>
          {PEOPLE.map((person) => (
            <TableRow key={person.id}>
              <TableCell>{person.name}</TableCell>
              <TableCell>{person.role}</TableCell>
              <TableCell>{person.status}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </View>
  ),
};
