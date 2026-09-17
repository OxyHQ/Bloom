import React, { useMemo, useState } from 'react';
import { resolveButtonRamps } from '../../src/button/shared';
import type { ButtonIconComponent } from '../../src/button/types';
import { Chip, type ChipHue } from '../../src/chip';
import {
  DataTable,
  DataTableFilter,
  DataTableRowActions,
  DataTableSearch,
  DataTableSelect,
  type DataTableColumn,
  type DataTableRowActionItem,
  type DataTableSelectOption,
} from '../../src/data-table';
import {
  RiArchiveLine,
  RiDownload2Line,
  RiFileCopyLine,
  RiGlobalLine,
  RiGoogleFill,
  RiLinkedinBoxFill,
  RiMailLine,
  RiMetaFill,
  RiTwitterXFill,
} from '../../src/icons/remix';
import { useTheme } from '../../src/theme/use-theme';
import { Text } from '../../src/typography';
import { CellText, DELETE_EDIT_ACTIONS, IconTile, MONTHS, NameCell, dateValue, makeRng } from '../shared/dashboard';

/**
 * The marketing template's campaigns table: the
 * customers-table recipe with campaign columns — a channel icon tile + name, a
 * delivery select, an objective chip, the last-updated date, a spend chip
 * (`$0` in tertiary text for drafts) and row actions. A `DataTable` in its
 * `inset` layout.
 */

type Channel = { label: string; icon: ButtonIconComponent };

const CHANNELS: Channel[] = [
  { label: 'Google Ads', icon: RiGoogleFill },
  { label: 'Meta', icon: RiMetaFill },
  { label: 'X Ads', icon: RiTwitterXFill },
  { label: 'LinkedIn', icon: RiLinkedinBoxFill },
  { label: 'Email', icon: RiMailLine },
  { label: 'Referral', icon: RiGlobalLine },
];

type Objective = { label: string; color: ChipHue };

const OBJECTIVES: Objective[] = [
  { label: 'Conversions', color: 'lime' },
  { label: 'Traffic', color: 'cyan' },
  { label: 'Awareness', color: 'blue' },
  { label: 'Leads', color: 'yellow' },
  { label: 'Retargeting', color: 'purple' },
];

const SPEND_BUCKETS: { id: string; label: string; test: (n: number) => boolean }[] = [
  { id: 'all', label: 'All spend', test: () => true },
  { id: 'under-1k', label: 'Under $1,000', test: (n) => n < 1000 },
  { id: '1k-5k', label: '$1,000 – $5,000', test: (n) => n >= 1000 && n <= 5000 },
  { id: '5k-20k', label: '$5,000 – $20,000', test: (n) => n > 5000 && n <= 20_000 },
  { id: 'over-20k', label: 'Over $20,000', test: (n) => n > 20_000 },
];

const BASE_NAMES = [
  'Spring launch',
  'Brand search',
  'Cart retargeting',
  'Competitor keywords',
  'Founder story video',
  'Newsletter promo',
  'Lookalike broad',
  'Launch week',
  'Free tier push',
  'Docs remarketing',
  'Holiday gift guide',
  'Webinar signups',
  'Case study promo',
  'Feature announcement',
  'Year in review',
  'Partner co-marketing',
];

const REGIONS = ['US', 'EU', 'UK', 'APAC', 'Global'];

type Delivery = 'active' | 'paused' | 'draft';

const DELIVERY_OPTIONS: DataTableSelectOption[] = [
  { value: 'active', label: 'Active', dot: 'success' },
  { value: 'paused', label: 'Paused', dot: 'warning' },
  { value: 'draft', label: 'Draft', dot: 'info' },
];

const MORE_MENU: DataTableRowActionItem[] = [
  { icon: RiFileCopyLine, label: 'Duplicate campaign' },
  { icon: RiDownload2Line, label: 'Export report' },
  { icon: RiArchiveLine, label: 'Archive campaign' },
];

export interface Campaign {
  id: string;
  name: string;
  channel: Channel;
  delivery: Delivery;
  objective: Objective;
  spend: number;
  updated: string;
  selected: boolean;
}

/** Every base name crossed with every region, shuffled with a seeded RNG. */
export const CAMPAIGNS: Campaign[] = (() => {
  const rng = makeRng(7);
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)]!;
  const names: string[] = [];
  for (const base of BASE_NAMES) {
    for (const region of REGIONS) names.push(`${base} · ${region}`);
  }
  for (let i = names.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [names[i], names[j]] = [names[j]!, names[i]!];
  }
  return names.map((name, i) => {
    const delivery: Delivery = rng() < 0.55 ? 'active' : rng() < 0.6 ? 'paused' : 'draft';
    const spend = delivery === 'draft' ? 0 : 180 + Math.floor(rng() * 47_800);
    const month = pick(MONTHS);
    const day = 1 + Math.floor(rng() * 28);
    return {
      id: String(i),
      name,
      channel: pick(CHANNELS),
      delivery,
      objective: pick(OBJECTIVES),
      spend,
      updated: `${month} ${String(day).padStart(2, '0')}, 2026`,
      selected: i === 1 || i === 3,
    };
  });
})();

/** `<span className="text-body-medium text-text-tertiary">$0</span>`. */
function ZeroSpend() {
  const theme = useTheme();
  const { neutral: n } = resolveButtonRamps(theme);
  return (
    <Text variant="body-medium" style={{ color: theme.isDark ? n[600] : n[400] }}>
      $0
    </Text>
  );
}

const COLUMNS: DataTableColumn<Campaign>[] = [
  {
    id: 'name',
    header: 'Campaign',
    flex: 1.4,
    accessor: (c) => c.name,
    sortDescFirst: false,
    cell: ({ row }) => (
      <NameCell leading={<IconTile icon={row.channel.icon} label={row.channel.label} />}>
        <CellText>{row.name}</CellText>
      </NameCell>
    ),
  },
  {
    id: 'delivery',
    header: 'Delivery',
    cell: ({ row }) => (
      <DataTableSelect
        label={`Delivery status for ${row.name}`}
        defaultValue={row.delivery}
        options={DELIVERY_OPTIONS}
        width={124}
      />
    ),
  },
  {
    id: 'objective',
    header: 'Objective',
    cell: ({ row }) => (
      <Chip size="medium" hue={row.objective.color}>
        {row.objective.label}
      </Chip>
    ),
  },
  {
    id: 'updated',
    header: 'Last updated',
    accessor: (c) => dateValue(c.updated),
    sortDescFirst: false,
    cell: ({ row }) => <CellText>{row.updated}</CellText>,
  },
  {
    id: 'spend',
    header: 'Spend',
    accessor: (c) => c.spend,
    sortDescFirst: false,
    cell: ({ row }) =>
      row.spend > 0 ? (
        <Chip size="large" hue="gray">
          {`$${row.spend.toLocaleString('en-US')}`}
        </Chip>
      ) : (
        <ZeroSpend />
      ),
  },
  {
    id: 'actions',
    header: 'Actions',
    width: 140,
    cell: ({ row }) => <DataTableRowActions name={row.name} actions={DELETE_EDIT_ACTIONS} menu={MORE_MENU} />,
  },
];

const DEFAULT_SELECTION = CAMPAIGNS.filter((c) => c.selected).map((c) => c.id);

export function CampaignsTable({ initialQuery = '' }: { initialQuery?: string }) {
  const [channelFilter, setChannelFilter] = useState('all');
  const [objectiveFilter, setObjectiveFilter] = useState('all');
  const [spendFilter, setSpendFilter] = useState('all');
  const [query, setQuery] = useState(initialQuery);
  const [page, setPage] = useState(1);

  const rows = useMemo(() => {
    const bucket = SPEND_BUCKETS.find((b) => b.id === spendFilter) ?? SPEND_BUCKETS[0]!;
    const q = query.trim().toLowerCase();
    return CAMPAIGNS.filter(
      (c) =>
        bucket.test(c.spend) &&
        (channelFilter === 'all' || c.channel.label === channelFilter) &&
        (objectiveFilter === 'all' || c.objective.label === objectiveFilter) &&
        (q === '' || c.name.toLowerCase().includes(q)),
    );
  }, [channelFilter, objectiveFilter, spendFilter, query]);

  const filter = (set: (value: string) => void) => (value: string) => {
    set(value);
    setPage(1);
  };

  return (
    <DataTable
      layout="inset"
      accessibilityLabel="Campaigns"
      rows={rows}
      columns={COLUMNS}
      getRowId={(row) => row.id}
      title="Total Results"
      summary={`${rows.length.toLocaleString()} campaigns`}
      toolbar={
        <>
          <DataTableFilter
            label="Filter by channel"
            value={channelFilter}
            onValueChange={filter(setChannelFilter)}
            options={[{ value: 'all', label: 'All channels' }, ...CHANNELS.map((c) => ({ value: c.label, label: c.label }))]}
          />
          <DataTableFilter
            label="Filter by objective"
            value={objectiveFilter}
            onValueChange={filter(setObjectiveFilter)}
            options={[
              { value: 'all', label: 'All objectives' },
              ...OBJECTIVES.map((o) => ({ value: o.label, label: o.label })),
            ]}
          />
          <DataTableFilter
            label="Filter by spend"
            value={spendFilter}
            onValueChange={filter(setSpendFilter)}
            options={SPEND_BUCKETS.map((b) => ({ value: b.id, label: b.label }))}
          />
          <DataTableSearch label="Search campaigns" value={query} onChangeText={filter(setQuery)} />
        </>
      }
      selectable
      defaultSelectedRowIds={DEFAULT_SELECTION}
      getSelectRowLabel={(row) => `Select ${row.name}`}
      selectAllLabel="Select all campaigns on this page"
      page={page}
      onPageChange={setPage}
      pageSize={10}
      emptyState="No campaigns match your filters."
      minWidth={900}
    />
  );
}
