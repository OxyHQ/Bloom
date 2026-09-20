import React, { useMemo, useState } from 'react';
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
  RiAttachmentLine,
  RiCarLine,
  RiDownload2Line,
  RiFileCopyLine,
  RiFlightTakeoffLine,
  RiHandCoinLine,
  RiHeartPulseLine,
  RiHome4Line,
  RiLightbulbLine,
  RiRepeatLine,
  RiRestaurantLine,
  RiShoppingBag3Line,
  RiStockLine,
} from '../../src/icons/remix';
import { CellText, DELETE_EDIT_ACTIONS, IconTile, MONTHS, NameCell, dateValue, makeRng } from '../shared/dashboard';

/**
 * The finance template's transactions table: the
 * customers-table recipe — toolbar with working filters and search, sortable
 * headers, selection, pagination — with ledger columns: a category icon tile +
 * payee, an account select, a category chip, the date, and a signed amount
 * chip (income lime, spending gray). A `DataTable` in its `inset` layout.
 */

type Category = { label: string; color: ChipHue; icon: ButtonIconComponent };

const CATEGORIES = {
  housing: { label: 'Housing', color: 'blue', icon: RiHome4Line },
  groceries: { label: 'Groceries', color: 'lime', icon: RiShoppingBag3Line },
  transport: { label: 'Transport', color: 'cyan', icon: RiCarLine },
  dining: { label: 'Dining', color: 'yellow', icon: RiRestaurantLine },
  subscriptions: { label: 'Subscriptions', color: 'purple', icon: RiRepeatLine },
  utilities: { label: 'Utilities', color: 'neutral', icon: RiLightbulbLine },
  travel: { label: 'Travel', color: 'cyan', icon: RiFlightTakeoffLine },
  health: { label: 'Health', color: 'rose', icon: RiHeartPulseLine },
  income: { label: 'Income', color: 'lime', icon: RiHandCoinLine },
  investing: { label: 'Investing', color: 'blue', icon: RiStockLine },
} satisfies Record<string, Category>;

type CategoryKey = keyof typeof CATEGORIES;

/** Payees with their category and a typical amount band (negative bands are spending). */
const PAYEES: { name: string; category: CategoryKey; band: [number, number] }[] = [
  { name: 'Maple Street rent', category: 'housing', band: [-2650, -2650] },
  { name: 'Whole Foods Market', category: 'groceries', band: [-180, -40] },
  { name: 'Corner grocer', category: 'groceries', band: [-60, -12] },
  { name: 'Shell', category: 'transport', band: [-90, -35] },
  { name: 'Uber', category: 'transport', band: [-42, -9] },
  { name: 'Metro card top-up', category: 'transport', band: [-40, -20] },
  { name: 'Netflix', category: 'subscriptions', band: [-18, -18] },
  { name: 'Spotify', category: 'subscriptions', band: [-12, -12] },
  { name: 'iCloud storage', category: 'subscriptions', band: [-3, -3] },
  { name: 'Gym membership', category: 'health', band: [-49, -49] },
  { name: 'City pharmacy', category: 'health', band: [-64, -8] },
  { name: 'Electric utility', category: 'utilities', band: [-140, -70] },
  { name: 'Water and waste', category: 'utilities', band: [-55, -30] },
  { name: 'Osteria Bianca', category: 'dining', band: [-120, -28] },
  { name: 'Blue Bottle Coffee', category: 'dining', band: [-14, -5] },
  { name: 'Ramen bar', category: 'dining', band: [-38, -16] },
  { name: 'Delta Airlines', category: 'travel', band: [-620, -180] },
  { name: 'Airbnb', category: 'travel', band: [-480, -150] },
  { name: 'Acme Corp payroll', category: 'income', band: [6200, 6200] },
  { name: 'Studio K invoice', category: 'income', band: [2600, 800] },
  { name: 'Dividend payout', category: 'income', band: [740, 120] },
  { name: 'Vanguard transfer', category: 'investing', band: [-1500, -400] },
];

const ACCOUNTS = ['Checking', 'Savings', 'Credit card'] as const;
type Account = (typeof ACCOUNTS)[number];

const ACCOUNT_OPTIONS: DataTableSelectOption[] = [
  { value: 'Checking', label: 'Checking', dot: 'success' },
  { value: 'Savings', label: 'Savings', dot: 'info' },
  { value: 'Credit card', label: 'Credit card', dot: 'warning' },
];

const AMOUNT_BUCKETS: { id: string; label: string; test: (n: number) => boolean }[] = [
  { id: 'all', label: 'All amounts', test: () => true },
  { id: 'income', label: 'Income only', test: (n) => n > 0 },
  { id: 'under-50', label: 'Under $50', test: (n) => n < 0 && n > -50 },
  { id: '50-500', label: '$50 – $500', test: (n) => n <= -50 && n > -500 },
  { id: 'over-500', label: 'Over $500', test: (n) => n <= -500 },
];

const MORE_MENU: DataTableRowActionItem[] = [
  { icon: RiAttachmentLine, label: 'Attach receipt' },
  { icon: RiFileCopyLine, label: 'Duplicate transaction' },
  { icon: RiDownload2Line, label: 'Export statement' },
  { icon: RiArchiveLine, label: 'Archive transaction' },
];

export interface Transaction {
  id: string;
  payee: string;
  category: Category;
  account: Account;
  amount: number;
  date: string;
  selected: boolean;
}

function formatAmount(n: number) {
  const abs = Math.abs(n).toLocaleString('en-US');
  return n > 0 ? `+$${abs}` : `-$${abs}`;
}

/** 140 rows from the seeded PRNG, in a fixed deterministic draw order. */
export const TRANSACTIONS: Transaction[] = (() => {
  const rng = makeRng(19);
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)]!;
  return Array.from({ length: 140 }, (_, i) => {
    const payee = pick(PAYEES);
    const [a, b] = payee.band;
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    const amount = lo === hi ? lo : lo + Math.floor(rng() * (hi - lo));
    const account: Account =
      payee.category === 'income'
        ? rng() > 0.3
          ? 'Checking'
          : 'Savings'
        : amount < -500
          ? 'Checking'
          : pick(ACCOUNTS);
    const month = pick(MONTHS);
    const day = 1 + Math.floor(rng() * 28);
    return {
      id: String(i),
      payee: payee.name,
      category: CATEGORIES[payee.category],
      account,
      amount,
      date: `${month} ${String(day).padStart(2, '0')}, 2026`,
      selected: i === 2 || i === 4,
    };
  });
})();

const COLUMNS: DataTableColumn<Transaction>[] = [
  {
    id: 'payee',
    header: 'Transaction',
    flex: 1.4,
    accessor: (t) => t.payee,
    sortDescFirst: false,
    cell: ({ row }) => (
      <NameCell leading={<IconTile icon={row.category.icon} label={row.category.label} />}>
        <CellText>{row.payee}</CellText>
      </NameCell>
    ),
  },
  {
    id: 'account',
    header: 'Account',
    cell: ({ row }) => (
      <DataTableSelect label={`Account for ${row.payee}`} defaultValue={row.account} options={ACCOUNT_OPTIONS} width={136} />
    ),
  },
  {
    id: 'category',
    header: 'Category',
    cell: ({ row }) => (
      <Chip size="md" hue={row.category.color}>
        {row.category.label}
      </Chip>
    ),
  },
  {
    id: 'date',
    header: 'Date',
    accessor: (t) => dateValue(t.date),
    sortDescFirst: false,
    cell: ({ row }) => <CellText>{row.date}</CellText>,
  },
  {
    id: 'amount',
    header: 'Amount',
    accessor: (t) => t.amount,
    sortDescFirst: false,
    cell: ({ row }) => (
      <Chip size="lg" hue={row.amount > 0 ? 'lime' : 'gray'}>
        {formatAmount(row.amount)}
      </Chip>
    ),
  },
  {
    id: 'actions',
    header: 'Actions',
    width: 140,
    cell: ({ row }) => <DataTableRowActions name={row.payee} actions={DELETE_EDIT_ACTIONS} menu={MORE_MENU} />,
  },
];

const DEFAULT_SELECTION = TRANSACTIONS.filter((t) => t.selected).map((t) => t.id);

export function TransactionsTable({ initialQuery = '' }: { initialQuery?: string }) {
  const [accountFilter, setAccountFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [amountFilter, setAmountFilter] = useState('all');
  const [query, setQuery] = useState(initialQuery);
  const [page, setPage] = useState(1);

  const rows = useMemo(() => {
    const bucket = AMOUNT_BUCKETS.find((b) => b.id === amountFilter) ?? AMOUNT_BUCKETS[0]!;
    const q = query.trim().toLowerCase();
    return TRANSACTIONS.filter(
      (t) =>
        bucket.test(t.amount) &&
        (accountFilter === 'all' || t.account === accountFilter) &&
        (categoryFilter === 'all' || t.category.label === categoryFilter) &&
        (q === '' || t.payee.toLowerCase().includes(q)),
    );
  }, [accountFilter, categoryFilter, amountFilter, query]);

  const filter = (set: (value: string) => void) => (value: string) => {
    set(value);
    setPage(1);
  };

  return (
    <DataTable
      layout="inset"
      accessibilityLabel="Transactions"
      rows={rows}
      columns={COLUMNS}
      getRowId={(row) => row.id}
      title="Total Results"
      summary={`${rows.length.toLocaleString()} transactions`}
      toolbar={
        <>
          <DataTableFilter
            label="Filter by account"
            value={accountFilter}
            onValueChange={filter(setAccountFilter)}
            options={[{ value: 'all', label: 'All accounts' }, ...ACCOUNTS.map((a) => ({ value: a, label: a }))]}
          />
          <DataTableFilter
            label="Filter by category"
            value={categoryFilter}
            onValueChange={filter(setCategoryFilter)}
            options={[
              { value: 'all', label: 'All categories' },
              ...Object.values(CATEGORIES).map((c) => ({ value: c.label, label: c.label })),
            ]}
          />
          <DataTableFilter
            label="Filter by amount"
            value={amountFilter}
            onValueChange={filter(setAmountFilter)}
            options={AMOUNT_BUCKETS.map((b) => ({ value: b.id, label: b.label }))}
          />
          <DataTableSearch label="Search transactions" value={query} onValueChange={filter(setQuery)} />
        </>
      }
      selectable
      defaultSelectedRowIds={DEFAULT_SELECTION}
      getSelectRowLabel={(row) => `Select ${row.payee}`}
      selectAllLabel="Select all transactions on this page"
      page={page}
      onPageChange={setPage}
      pageSize={10}
      emptyState="No transactions match your filters."
      minWidth={900}
    />
  );
}
