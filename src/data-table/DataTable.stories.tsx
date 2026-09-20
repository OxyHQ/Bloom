import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Avatar } from '../avatar';
import { colorRamp, ACCENT_TABLE } from '../button/shared';
import { Chip, type ChipHue } from '../chip';
import {
  RiAlarmWarningLine,
  RiArchiveLine,
  RiDeleteBin6Line,
  RiDownload2Line,
  RiEditLine,
  RiFileCopyLine,
  RiHomeHeartLine,
  RiHotelBedLine,
  RiUserLine,
  RiWalkLine,
} from '../icons/remix';
import { useTheme } from '../theme/use-theme';
import { Text, TYPE_SCALE } from '../typography';
import {
  DataTable,
  DataTableFilter,
  DataTableRowActions,
  DataTableSearch,
  DataTableSelect,
  type DataTableColumn,
  type DataTableLayout,
  type DataTableRowActionItem,
  type DataTableSelectOption,
  type DataTableSize,
} from './index';

const meta: Meta<typeof DataTable> = {
  argTypes: {
    "selectable": { control: 'boolean' },
    "selectAllLabel": { control: 'text' },
    "pageSize": { control: 'number' },
    "page": { control: 'number' },
    "defaultPage": { control: 'number' },
    "size": { control: 'select', options: ["sm","md"] },
    "defaultSize": { control: 'select', options: ["sm","md"] },
    "showSizeToggle": { control: 'boolean' },
    "sizeToggleAccessibilityLabel": { control: 'text' },
    "minWidth": { control: 'number' },
    "layout": { control: 'select', options: ["inset","table"] }
  },
  title: 'Blocks/Data Table',
  component: DataTable,
};

export default meta;

type Story = StoryObj<typeof DataTable>;

// ---------------------------------------------------------------------------
//  Demo data, generated with a seeded PRNG so the rows are deterministic
//  across renders.
// ---------------------------------------------------------------------------

type Status = { label: string; hue: ChipHue };

const STATUSES: Status[] = [
  { label: 'Shipped', hue: 'lime' },
  { label: 'Delivery waiting', hue: 'yellow' },
  { label: 'Delivery failed', hue: 'rose' },
  { label: 'Confirmed', hue: 'cyan' },
];

const PRODUCTS = ['Sneakers', 'Backpack', 'Smart watch', 'Headphones', 'Sunglasses', 'Wallet'];
const REGIONS = ['North America', 'Europe', 'Asia', 'Oceania'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const PRICE_BUCKETS: { id: string; label: string; test: (p: number) => boolean }[] = [
  { id: 'all', label: 'All prices', test: () => true },
  { id: 'under-100', label: 'Under $100', test: (p) => p < 100 },
  { id: '100-500', label: '$100 – $500', test: (p) => p >= 100 && p <= 500 },
  { id: '500-1000', label: '$500 – $1,000', test: (p) => p > 500 && p <= 1000 },
  { id: 'over-1000', label: 'Over $1,000', test: (p) => p > 1000 },
];

type Purchase = 'completed' | 'waiting' | 'processing';

type Customer = {
  id: string;
  name: string;
  avatar?: string;
  initialsColor: 'neutral' | 'blue';
  purchase: Purchase;
  status: Status;
  product: string;
  region: string;
  price: number;
  updated: string;
  updatedTs: number;
};

const photo = (id: string) => `https://images.unsplash.com/${id}?w=96&h=96&fit=crop&crop=faces`;

const PHOTO_PEOPLE: { name: string; avatar: string }[] = [
  { name: 'John Clarkson', avatar: photo('photo-1500648767791-00dcc994a43e') },
  { name: 'Aspen Lubin', avatar: photo('photo-1494790108377-be9c29b29330') },
  { name: 'Michael Ekstrom', avatar: photo('photo-1507003211169-0a1dd7228f2d') },
  { name: 'Kianna Vaccaro', avatar: photo('photo-1438761681033-6461ffad8d80') },
  { name: 'Livia Saris', avatar: photo('photo-1544005313-94ddf0286df2') },
  { name: 'Jaydon Aminoff', avatar: photo('photo-1506794778202-cad84cf45f1d') },
  { name: 'Maria Lubin', avatar: photo('photo-1534528741775-53994a69daeb') },
  { name: 'Ann Press', avatar: photo('photo-1517841905240-472988babdf9') },
];

const FIRST_NAMES = ['Marcus', 'Cheyenne', 'Alfredo', 'Talan', 'Roger', 'Cristofer', 'Emery', 'Kadin', 'Nolan', 'Ruben', 'Skylar', 'Hanna', 'Corey', 'Miracle', 'Zaire', 'Cooper', 'Leilani', 'Alena', 'Terry', 'Jaxson'];
const LAST_NAMES = ['Culhane', 'Herwitz', 'Septimus', 'Bergson', 'Curtis', 'Vetrovs', 'Rhiel', 'Dokidis', 'Kenter', 'Stanton', 'Baptista', 'Workman', 'Torff', 'Calzoni', 'Rosser', 'Geidt', 'Bator', 'Vaccaro', 'Lipshutz', 'Botosh'];

function makeRng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function formatPrice(n: number) {
  return n >= 1000 ? `$${Math.floor(n / 1000)}.${String(n % 1000).padStart(3, '0')}` : `$${n}`;
}

function initialsOf(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

const CUSTOMERS: Customer[] = (() => {
  const rng = makeRng(42);
  const pick = <T,>(arr: T[]) => arr[Math.floor(rng() * arr.length)]!;
  return Array.from({ length: 48 }, (_, i) => {
    const status = pick(STATUSES);
    const purchase: Purchase =
      rng() < 0.24
        ? 'processing'
        : status.label === 'Shipped' || status.label === 'Confirmed'
          ? 'completed'
          : 'waiting';
    const price = 20 + Math.floor(rng() * 3980);
    const monthIdx = Math.floor(rng() * 12);
    const day = 1 + Math.floor(rng() * 28);
    const updated = `${MONTHS[monthIdx]} ${String(day).padStart(2, '0')}, 2026`;
    const updatedTs = new Date(2026, monthIdx, day).getTime();
    const base = {
      id: String(i),
      purchase,
      status,
      product: pick(PRODUCTS),
      region: pick(REGIONS),
      price,
      updated,
      updatedTs,
    };
    const person = PHOTO_PEOPLE[i];
    if (person) {
      return { ...base, name: person.name, avatar: person.avatar, initialsColor: 'neutral' as const };
    }
    const name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    return { ...base, name, initialsColor: rng() > 0.5 ? ('blue' as const) : ('neutral' as const) };
  });
})();

// ---------------------------------------------------------------------------
//  Cell pieces
// ---------------------------------------------------------------------------

const PURCHASES: DataTableSelectOption[] = [
  { value: 'completed', label: 'Completed', dot: 'success' },
  { value: 'waiting', label: 'Waiting', dot: 'warning' },
  { value: 'processing', label: 'Processing', dot: 'info' },
];

/** `Avatar` initials: neutral (`avatar-neutral-background`) or `blue-300`/`blue-900`. */
function CustomerAvatar({ customer, size }: { customer: Customer; size: DataTableSize }) {
  const theme = useTheme();
  const px = size === 'sm' ? 20 : 24;
  if (customer.avatar) return <Avatar size={px} source={customer.avatar} />;
  const blue = colorRamp(theme.colors.info, ACCENT_TABLE);
  const blueTone = customer.initialsColor === 'blue';
  return (
    <Avatar
      size={px}
      placeholderColor={blueTone ? blue[300] : theme.colors.backgroundTertiary}
      placeholderIcon={
        <Text
          style={
            size === 'sm'
              ? { fontSize: 10, lineHeight: 15, fontWeight: '600', color: blueTone ? blue[900] : theme.colors.textSecondary }
              : { ...TYPE_SCALE['caption-1-semibold'], letterSpacing: 0, color: blueTone ? blue[900] : theme.colors.textSecondary }
          }
        >
          {initialsOf(customer.name)}
        </Text>
      }
    />
  );
}

const ROW_ACTIONS: DataTableRowActionItem[] = [
  { icon: RiDeleteBin6Line, label: 'Delete' },
  { icon: RiEditLine, label: 'Edit' },
];

const MORE_MENU_ACTIONS: DataTableRowActionItem[] = [
  { icon: RiUserLine, label: 'View profile' },
  { icon: RiFileCopyLine, label: 'Duplicate row' },
  { icon: RiDownload2Line, label: 'Download invoice' },
  { icon: RiArchiveLine, label: 'Archive customer' },
];

function buildColumns(): DataTableColumn<Customer>[] {
  return [
    {
      id: 'name',
      header: 'Customer name',
      basis: 240,
      accessor: (c) => c.name,
      cell: ({ row, size }) => (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0, flexShrink: 1 }}>
          <CustomerAvatar customer={row} size={size} />
          <Text numberOfLines={1} variant="body-medium" style={{ flexShrink: 1 }}>
            {row.name}
          </Text>
        </View>
      ),
    },
    {
      id: 'purchase',
      header: 'Purchase',
      basis: 172,
      cell: ({ row, size }) => (
        <DataTableSelect
          label={`Purchase status for ${row.name}`}
          defaultValue={row.purchase}
          options={PURCHASES}
          width={size === 'sm' ? 132 : 142}
          size={size}
        />
      ),
    },
    {
      id: 'status',
      header: 'Status',
      basis: 168,
      cell: ({ row, size }) => (
        <Chip size={size === 'sm' ? 'sm' : 'md'} hue={row.status.hue}>
          {row.status.label}
        </Chip>
      ),
    },
    {
      id: 'updatedTs',
      header: 'Last updated',
      basis: 160,
      accessor: (c) => c.updatedTs,
      // `whitespace-nowrap text-body-medium` at both densities.
      cell: ({ row }) => (
        <Text numberOfLines={1} variant="body-medium">
          {row.updated}
        </Text>
      ),
    },
    {
      id: 'price',
      header: 'Price',
      basis: 140,
      accessor: (c) => c.price,
      cell: ({ row, size }) => (
        <Chip size={size === 'sm' ? 'sm' : 'lg'} hue="gray">
          {formatPrice(row.price)}
        </Chip>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      basis: 132,
      // Three 32px buttons + two 10px gaps + the 12px insets: the natural
      // width for the row's three actions.
      minWidth: 140,
      cell: ({ row }) => <DataTableRowActions name={row.name} actions={ROW_ACTIONS} menu={MORE_MENU_ACTIONS} />,
    },
  ];
}

function CustomersDataTable({
  pageSize = 8,
  showSizeToggle = true,
  width = 1020,
  initialQuery = '',
  layout,
  testID,
}: {
  layout?: DataTableLayout;
  pageSize?: number;
  showSizeToggle?: boolean;
  width?: number;
  initialQuery?: string;
  testID?: string;
}) {
  const [priceFilter, setPriceFilter] = useState('all');
  const [productFilter, setProductFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [query, setQuery] = useState(initialQuery);
  const [page, setPage] = useState(1);
  const columns = useMemo(buildColumns, []);

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
    <View style={{ width, maxWidth: '100%' }} testID={testID}>
      <DataTable
        accessibilityLabel="Customers"
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        title="Total Results"
        summary={`${rows.length.toLocaleString()} customers`}
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
        defaultSelectedRowIds={['1', '2']}
        getSelectRowLabel={(row) => `Select ${row.name}`}
        selectAllLabel="Select all customers on this page"
        page={page}
        onPageChange={setPage}
        pageSize={pageSize}
        showSizeToggle={showSizeToggle}
        emptyState="No customers match your filters."
        minWidth={1000}
        layout={layout}
      />
    </View>
  );
}

/** Paints the theme's page colour behind a story, so dark mode reads as dark. */
function Page({ children, padding = 0 }: { children: React.ReactNode; padding?: number }) {
  const theme = useTheme();
  return <View style={{ width: '100%', minWidth: 0, padding, backgroundColor: theme.colors.background }}>{children}</View>;
}

/** An advanced data table: filters, search, sortable columns, row selection, row actions, pagination and the density toggle. */
export const Customers: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Page padding={40}>
      <CustomersDataTable testID="dt" />
    </Page>
  ),
};

/** The landing-collage crop: five rows a page, no density control. */
export const FiveRows: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Page padding={40}>
      <CustomersDataTable testID="dt5" pageSize={5} showSizeToggle={false} />
    </Page>
  ),
};

/**
 * `layout="inset"`: the dashboard templates' flex-row recipe — a 12px gutter
 * the first column sits flush against, row hairlines starting after it (and
 * under the last row, instead of the footer's), no selection wash, and the
 * sorted header's label in the primary text colour. Sort a column to see it.
 */
export const Inset: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Page padding={40}>
      <CustomersDataTable testID="dt-inset" layout="inset" showSizeToggle={false} />
    </Page>
  ),
};

/** A search with no match: the 160px empty band, and no pagination footer (the surface drops its bottom padding). */
export const Empty: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Page padding={40}>
      <CustomersDataTable testID="dt-empty" initialQuery="zzz" showSizeToggle={false} />
    </Page>
  ),
};

/** Below 640px the toolbar stacks and its controls scroll sideways; the table scrolls horizontally past its 1000px minimum. */
export const Narrow: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Page padding={16}>
      <CustomersDataTable testID="dt-narrow" width={375} showSizeToggle={false} />
    </Page>
  ),
};

const ADMISSIONS: DataTableSelectOption[] = [
  { value: 'inpatient', label: 'Inpatient', icon: RiHotelBedLine },
  { value: 'outpatient', label: 'Outpatient', icon: RiWalkLine },
  { value: 'discharged', label: 'Discharged', icon: RiHomeHeartLine },
  { value: 'emergency', label: 'Emergency', icon: RiAlarmWarningLine },
];

/**
 * The cell and toolbar parts on their own: a `DataTableSelect` whose options
 * lead with a status dot, one whose options lead with an icon (the trigger's
 * left inset drops to 8), a `DataTableFilter`, a `DataTableSearch` and a row's
 * `DataTableRowActions`.
 */
export const Parts: Story = {
  parameters: { controls: { disable: true } },
  render: function PartsDemo() {
    const [region, setRegion] = useState('all');
    const [query, setQuery] = useState('');
    return (
      <Page>
        <View style={{ gap: 16, alignItems: 'flex-start' }} testID="dt-parts">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', maxWidth: '100%', gap: 16, alignItems: 'center' }}>
            <DataTableSelect label="Purchase status" defaultValue="waiting" options={PURCHASES} width={142} />
            <DataTableSelect label="Purchase status (compact)" defaultValue="completed" options={PURCHASES} width={132} size="sm" />
            <DataTableSelect label="Admission status" defaultValue="outpatient" options={ADMISSIONS} width={150} />
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', maxWidth: '100%', gap: 10, alignItems: 'center' }}>
            <DataTableFilter
              label="Filter by region"
              value={region}
              onValueChange={setRegion}
              options={[{ value: 'all', label: 'All regions' }, ...REGIONS.map((r) => ({ value: r, label: r }))]}
            />
            <DataTableSearch label="Search customers" value={query} onValueChange={setQuery} />
          </View>
          <View style={{ width: 140 }}>
            <DataTableRowActions name="John Clarkson" actions={ROW_ACTIONS} menu={MORE_MENU_ACTIONS} />
          </View>
        </View>
      </Page>
    );
  },
};

type Person = { id: string; name: string; role: string; joined: Date };

const PEOPLE: Person[] = [
  { id: 'a', name: 'Olivia Rhye', role: 'Product Designer', joined: new Date(2024, 2, 4) },
  { id: 'b', name: 'Phoenix Baker', role: 'Engineer', joined: new Date(2023, 10, 21) },
  { id: 'c', name: 'Lana Steiner', role: 'Design Lead', joined: new Date(2025, 0, 9) },
];

/** The generic API with nothing but accessors: default text cells, sorting, no toolbar, no selection. */
export const Minimal: Story = {
  args: { selectable: false, defaultSize: 'md', showSizeToggle: true, pageSize: 5, layout: 'inset' },
  parameters: { controls: { include: ["selectable","defaultSize","showSizeToggle","pageSize","layout","selectAllLabel","page","defaultPage","size","sizeToggleAccessibilityLabel","minWidth"] } },
  render: (args) => (
    <Page>
      <View style={{ maxWidth: '100%', width: 600 }}>
      <DataTable {...args}
        accessibilityLabel="People"
        rows={PEOPLE}
        getRowId={(p) => p.id}
        columns={[
          { id: 'name', header: 'Name', accessor: (p) => p.name },
          { id: 'role', header: 'Role', accessor: (p) => p.role },
          { id: 'joined', header: 'Joined', accessor: (p) => p.joined, cell: ({ row }) => row.joined.toDateString() },
        ]}
      />
      </View>
    </Page>
  ),
};
