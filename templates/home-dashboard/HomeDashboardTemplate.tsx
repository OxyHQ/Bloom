import React, { useMemo, useState } from 'react';
import { View } from 'react-native';

import { ContributionsCard, EarningsChartCard, LineChartCard } from '../../src/chart-cards';
import { violetBase } from '../../src/chart-cards/ai-profile-hues';
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
  RiHomeLine,
  RiUserLine,
} from '../../src/icons/remix';
import { RecentHiresCard } from '../../src/recent-hires-card';
import { StatCards } from '../../src/stat-cards';
import { useTheme } from '../../src/theme/use-theme';
import {
  CONTRIBUTION_CELLS,
  CONTRIBUTION_STATS,
  CUSTOMERS,
  DASHBOARD_STATS,
  DEFAULT_SELECTED_CUSTOMERS,
  EARNINGS_RANGES,
  EARNINGS_Y_MAX,
  EARNINGS_Y_TICKS,
  PRICE_BUCKETS,
  PRODUCTS,
  PURCHASES,
  RECENT_HIRES,
  REGIONS,
  REVENUE_RANGES,
  formatPrice,
  type Customer,
} from './demo-data';
import {
  CellText,
  DELETE_EDIT_ACTIONS,
  DashboardShell,
  NameCell,
  PersonAvatar,
  useBreakpoints,
} from '../shared/dashboard';

/**
 * The Home Dashboard template:
 *
 *   header   Design team › Maya › Home trail; "Welcome Maya"; the
 *            notification bell (5), Filters, Create ticket
 *   row 1    recent hires (flex) + earnings (673 fixed) side by side from `xl`
 *   row 2    revenue line chart (337 tall) + contributions side by side from `lg`
 *   KPIs     the plain stat cards (2 columns, 4 from `lg`)
 *   table    customers: filters, search, sortable columns, selection,
 *            purchase selects, status chips, row actions, 12 a page
 */

const CUSTOMER_MENU: readonly DataTableRowActionItem[] = [
  { icon: RiUserLine, label: 'View profile' },
  { icon: RiFileCopyLine, label: 'Duplicate row' },
  { icon: RiDownload2Line, label: 'Download invoice' },
  { icon: RiArchiveLine, label: 'Archive customer' },
];

function customerColumns(): DataTableColumn<Customer>[] {
  return [
    {
      id: 'name',
      header: 'Customer name',
      accessor: (c) => c.name,
      cell: ({ row }) => (
        <NameCell leading={<PersonAvatar name={row.name} avatar={row.avatar} color={row.initialsColor} />}>
          <CellText>{row.name}</CellText>
        </NameCell>
      ),
    },
    {
      id: 'purchase',
      header: 'Purchase',
      cell: ({ row, size }) => (
        <DataTableSelect
          defaultValue={row.purchase}
          label={`Purchase status for ${row.name}`}
          options={PURCHASES}
          width={142}
          size={size}
        />
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Chip size="md" hue={row.status.color}>
          {row.status.label}
        </Chip>
      ),
    },
    {
      id: 'updated',
      header: 'Last updated',
      accessor: (c) => c.updatedTs,
      sortDescFirst: false,
      cell: ({ row }) => <CellText>{row.updated}</CellText>,
    },
    {
      id: 'price',
      header: 'Price',
      accessor: (c) => c.price,
      sortDescFirst: false,
      cell: ({ row }) => (
        <Chip size="lg" hue="gray">
          {formatPrice(row.price)}
        </Chip>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      width: 140,
      cell: ({ row }) => <DataTableRowActions name={row.name} actions={DELETE_EDIT_ACTIONS} menu={CUSTOMER_MENU} />,
    },
  ];
}

export function CustomersTable() {
  const [priceFilter, setPriceFilter] = useState('all');
  const [productFilter, setProductFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const columns = useMemo(customerColumns, []);

  const rows = useMemo(() => {
    const bucket = PRICE_BUCKETS.find((b) => b.id === priceFilter) ?? PRICE_BUCKETS[0]!;
    const q = query.trim().toLowerCase();
    return CUSTOMERS.filter(
      (c) =>
        bucket.test(c.price) &&
        (productFilter === 'all' || c.product === productFilter) &&
        (regionFilter === 'all' || c.region === regionFilter) &&
        (q === '' || c.name.toLowerCase().includes(q)),
    );
  }, [priceFilter, productFilter, regionFilter, query]);

  const filter = (set: (value: string) => void) => (value: string) => {
    set(value);
    setPage(1);
  };

  return (
    <DataTable
      layout="inset"
      accessibilityLabel="Customers"
      rows={rows}
      columns={columns}
      getRowId={(row) => row.id}
      title="Total Results"
      summary={`${rows.length.toLocaleString('en-US')} customers`}
      toolbar={
        <>
          <DataTableFilter
            label="Filter by price"
            value={priceFilter}
            onValueChange={filter(setPriceFilter)}
            options={PRICE_BUCKETS.map((b) => ({ value: b.id, label: b.label }))}
          />
          <DataTableFilter
            label="Filter by product"
            value={productFilter}
            onValueChange={filter(setProductFilter)}
            options={[{ value: 'all', label: 'All products' }, ...PRODUCTS.map((p) => ({ value: p, label: p }))]}
          />
          <DataTableFilter
            label="Filter by region"
            value={regionFilter}
            onValueChange={filter(setRegionFilter)}
            options={[{ value: 'all', label: 'All regions' }, ...REGIONS.map((r) => ({ value: r, label: r }))]}
          />
          <DataTableSearch label="Search customers" value={query} onValueChange={filter(setQuery)} />
        </>
      }
      selectable
      defaultSelectedRowIds={DEFAULT_SELECTED_CUSTOMERS}
      getSelectRowLabel={(row) => `Select ${row.name}`}
      selectAllLabel="Select all customers on this page"
      page={page}
      onPageChange={setPage}
      pageSize={12}
      emptyState="No customers match your filters."
      minWidth={860}
    />
  );
}

export function HomeDashboardTemplate() {
  const theme = useTheme();
  const bp = useBreakpoints();
  const violet = useMemo(() => violetBase(theme), [theme]);

  return (
    <DashboardShell selected="home" title="Welcome Maya" crumb="Home" crumbIcon={RiHomeLine} primaryAction="Create ticket">
      <View
        style={{
          width: '100%',
          flexDirection: bp.xl ? 'row' : 'column',
          alignItems: bp.xl ? 'flex-start' : 'stretch',
          gap: 16,
        }}
      >
        <RecentHiresCard
          count={56}
          teamLabel="Design team"
          hires={RECENT_HIRES}
          // Stacked (below xl) `flex-1` beats `h-[329px]` in the column: content height.
          height={bp.xl ? undefined : 'auto'}
          style={bp.xl ? { flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0 } : undefined}
        />
        <EarningsChartCard
          ranges={EARNINGS_RANGES}
          yTicks={EARNINGS_Y_TICKS}
          yMax={EARNINGS_Y_MAX}
          style={bp.xl ? { width: 673, flexShrink: 0 } : { width: '100%' }}
        />
      </View>
      <View
        style={{
          width: '100%',
          flexDirection: bp.lg ? 'row' : 'column',
          alignItems: bp.lg ? 'flex-start' : 'stretch',
          gap: 16,
        }}
      >
        <LineChartCard ranges={REVENUE_RANGES} style={[{ height: 337 }, bp.lg ? { flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0 } : null]} />
        <ContributionsCard
          total={958}
          delta={0.148}
          stats={CONTRIBUTION_STATS}
          cells={CONTRIBUTION_CELLS}
          color={violet}
          style={bp.lg ? { flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0 } : undefined}
        />
      </View>
      <StatCards stats={DASHBOARD_STATS} />
      <CustomersTable />
    </DashboardShell>
  );
}
