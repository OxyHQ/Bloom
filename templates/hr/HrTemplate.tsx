import React, { useMemo, useState } from 'react';
import { View } from 'react-native';

import {
  BarListCard,
  ComboChartCard,
  RadarChartCard,
  StageBarsCard,
} from '../../src/chart-cards';
import { chartHueTone } from '../../src/chart-cards/palette';
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
import {
  RiArchiveLine,
  RiDownload2Line,
  RiFileCopyLine,
  RiTeamLine,
  RiUserLine,
} from '../../src/icons/remix';
import { RecentHiresCard } from '../../src/recent-hires-card';
import { StatCards } from '../../src/stat-cards';
import { useTheme } from '../../src/theme/use-theme';
import { RECENT_HIRES } from '../home-dashboard/demo-data';
import {
  CellText,
  DELETE_EDIT_ACTIONS,
  DashboardShell,
  NameCell,
  NameLines,
  PersonAvatar,
  useBreakpoints,
} from '../shared/dashboard';
import {
  DEFAULT_SELECTED_EMPLOYEES,
  DEPARTMENTS,
  EMPLOYEES,
  ENGAGEMENT_RANGES,
  ENGAGEMENT_SERIES,
  GROWTH_RANGES,
  HIRES_BAR,
  HR_STATS,
  PIPELINE_RANGES,
  SALARY_BUCKETS,
  TEAM_TABS,
  WORK_STATUSES,
  attritionLine,
  formatSalary,
  type Employee,
} from './demo-data';

/**
 * The HR Management template: the dashboard shell with no sidebar row
 * selected, then
 *
 *   KPIs     employees, open roles, time to hire, attrition
 *   row 1    recent hires, hiring pipeline stage bars, team engagement radar
 *            (score) — 1 column, 2 from `md` (the radar spans both), 3 from `xl`
 *   row 2    hires vs. attrition combo with tiles, the team breakdown bar list
 *            — 2 columns from `lg`, stretched to one height
 *   table    employees: filters, search, sortable columns, selection, work
 *            status selects, department chips, salary chips, 10 a page
 */

const EMPLOYEE_MENU: readonly DataTableRowActionItem[] = [
  { icon: RiUserLine, label: 'View profile' },
  { icon: RiFileCopyLine, label: 'Copy email' },
  { icon: RiDownload2Line, label: 'Download contract' },
  { icon: RiArchiveLine, label: 'Archive employee' },
];

function employeeColumns(): DataTableColumn<Employee>[] {
  return [
    {
      id: 'name',
      header: 'Employee',
      flex: 1.4,
      accessor: (e) => e.name,
      cell: ({ row }) => (
        <NameCell leading={<PersonAvatar name={row.name} avatar={row.avatar} color={row.initialsColor} />}>
          <NameLines name={row.name} detail={row.role} />
        </NameCell>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row, size }) => (
        <DataTableSelect
          defaultValue={row.status}
          label={`Work status for ${row.name}`}
          options={WORK_STATUSES}
          width={130}
          size={size}
        />
      ),
    },
    {
      id: 'department',
      header: 'Department',
      cell: ({ row }) => (
        <Chip size="medium" hue={row.department.color}>
          {row.department.label}
        </Chip>
      ),
    },
    {
      id: 'started',
      header: 'Start date',
      accessor: (e) => e.startedTs,
      sortDescFirst: false,
      cell: ({ row }) => <CellText>{row.started}</CellText>,
    },
    {
      id: 'salary',
      header: 'Salary',
      accessor: (e) => e.salary,
      sortDescFirst: false,
      cell: ({ row }) => (
        <Chip size="large" hue="gray">
          {formatSalary(row.salary)}
        </Chip>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      width: 140,
      cell: ({ row }) => <DataTableRowActions name={row.name} actions={DELETE_EDIT_ACTIONS} menu={EMPLOYEE_MENU} />,
    },
  ];
}

export function EmployeesTable() {
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [salaryFilter, setSalaryFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const columns = useMemo(employeeColumns, []);

  const rows = useMemo(() => {
    const bucket = SALARY_BUCKETS.find((b) => b.id === salaryFilter) ?? SALARY_BUCKETS[0]!;
    const q = query.trim().toLowerCase();
    return EMPLOYEES.filter(
      (e) =>
        bucket.test(e.salary) &&
        (departmentFilter === 'all' || e.department.label === departmentFilter) &&
        (statusFilter === 'all' || e.status === statusFilter) &&
        (q === '' || e.name.toLowerCase().includes(q) || e.role.toLowerCase().includes(q)),
    );
  }, [departmentFilter, statusFilter, salaryFilter, query]);

  const filter = (set: (value: string) => void) => (value: string) => {
    set(value);
    setPage(1);
  };

  return (
    <DataTable
      layout="inset"
      accessibilityLabel="Employees"
      rows={rows}
      columns={columns}
      getRowId={(row) => row.id}
      title="Total Results"
      summary={`${rows.length.toLocaleString('en-US')} employees`}
      toolbar={
        <>
          <DataTableFilter
            label="Filter by department"
            value={departmentFilter}
            onValueChange={filter(setDepartmentFilter)}
            options={[
              { value: 'all', label: 'All departments' },
              ...DEPARTMENTS.map((d) => ({ value: d.label, label: d.label })),
            ]}
          />
          <DataTableFilter
            label="Filter by work status"
            value={statusFilter}
            onValueChange={filter(setStatusFilter)}
            options={[{ value: 'all', label: 'All statuses' }, ...WORK_STATUSES.map((s) => ({ value: s.value, label: s.label }))]}
          />
          <DataTableFilter
            label="Filter by salary"
            value={salaryFilter}
            onValueChange={filter(setSalaryFilter)}
            options={SALARY_BUCKETS.map((b) => ({ value: b.id, label: b.label }))}
          />
          <DataTableSearch label="Search employees" value={query} onChangeText={filter(setQuery)} />
        </>
      }
      selectable
      defaultSelectedRowIds={DEFAULT_SELECTED_EMPLOYEES}
      getSelectRowLabel={(row) => `Select ${row.name}`}
      selectAllLabel="Select all employees on this page"
      page={page}
      onPageChange={setPage}
      pageSize={10}
      emptyState="No employees match your filters."
      minWidth={900}
    />
  );
}

/**
 * A CSS grid track: an equal share of the row whatever the card's own padding
 * (a padded flex item's basis never drops below its padding). `stretch` fills
 * the row's height, like a grid item without a fixed height.
 */
function Track({ children, stretch = false }: { children: React.ReactNode; stretch?: boolean }) {
  return <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0, alignSelf: stretch ? 'stretch' : 'flex-start' }}>{children}</View>;
}

export function HrTemplate() {
  const theme = useTheme();
  const bp = useBreakpoints();
  const attrition = useMemo(() => {
    const pink = chartHueTone(theme, 3);
    return attritionLine(pink.color, pink.activeColor);
  }, [theme]);

  const hires = <RecentHiresCard count={56} teamLabel="Design team" hires={RECENT_HIRES} />;
  const pipeline = <StageBarsCard title="Hiring pipeline" ranges={PIPELINE_RANGES} />;
  const radar = (
    <RadarChartCard
      variant="score"
      title="Team engagement"
      series={ENGAGEMENT_SERIES}
      ranges={ENGAGEMENT_RANGES}
      alertBelow={60}
    />
  );

  const combo = <ComboChartCard title="Hires" bar={HIRES_BAR} line={attrition} ranges={GROWTH_RANGES} tiles />;
  const teams = <BarListCard tabs={TEAM_TABS} metricLabel="People" metric="value" style={{ flexGrow: 1 }} />;

  return (
    <DashboardShell selected="hr" title="HR Team" crumbIcon={RiTeamLine} primaryAction="Add employee">
      <StatCards stats={HR_STATS} />
      {bp.xl ? (
        <View style={{ width: '100%', flexDirection: 'row', alignItems: 'flex-start', gap: 16 }}>
          <Track>{hires}</Track>
          <Track>{pipeline}</Track>
          <Track>{radar}</Track>
        </View>
      ) : bp.md ? (
        <View style={{ width: '100%', gap: 16 }}>
          <View style={{ width: '100%', flexDirection: 'row', alignItems: 'flex-start', gap: 16 }}>
            <Track>{hires}</Track>
            <Track>{pipeline}</Track>
          </View>
          {radar}
        </View>
      ) : (
        <View style={{ width: '100%', gap: 16 }}>
          {hires}
          {pipeline}
          {radar}
        </View>
      )}
      {bp.lg ? (
        // Grid row: two equal tracks stretched to the taller card.
        <View style={{ width: '100%', flexDirection: 'row', gap: 16 }}>
          <Track stretch>{combo}</Track>
          <Track stretch>{teams}</Track>
        </View>
      ) : (
        <View style={{ width: '100%', gap: 16 }}>
          {combo}
          {teams}
        </View>
      )}
      <EmployeesTable />
    </DashboardShell>
  );
}
