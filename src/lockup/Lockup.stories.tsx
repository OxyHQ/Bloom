import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../button';
import { Shelf } from '../media-shelf';
import { Rating } from '../rating';
import { Lockup, LockupSkeleton } from './index';

const meta: Meta<typeof Lockup> = {
  id: 'base-lockup',
  title: 'Components/Data Display/Lockup',
  component: Lockup,
};

export default meta;

type Story = StoryObj<typeof Lockup>;

/** Self-contained icons: a tinted square with a glyph, so the stories need no network. */
function icon(from: string, to: string, glyph: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="256" height="256" fill="url(#g)"/><text x="128" y="168" font-size="120" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-weight="700">${glyph}</text></svg>`,
  )}`;
}

/** Invented products. */
const PRODUCTS = [
  {
    id: 'p1',
    title: 'Tidewater',
    subtitle: 'Plan the week, one tide at a time',
    icon: icon('#1d3557', '#457b9d', 'T'),
    rating: 4.7,
    count: 1284,
  },
  {
    id: 'p2',
    title: 'Fernlight Notes',
    subtitle: 'Notes that link themselves',
    icon: icon('#2a9d8f', '#8ab17d', 'F'),
    rating: 4.4,
    count: 312,
  },
  {
    id: 'p3',
    title: 'Copperleaf',
    subtitle: 'Budgets for two',
    icon: icon('#e76f51', '#f4a261', 'C'),
    rating: null,
    count: 0,
  },
  {
    id: 'p4',
    title: 'Harbor Mail',
    subtitle: 'Mail without the noise',
    icon: icon('#3a0ca3', '#4361ee', 'H'),
    rating: 4.9,
    count: 5620,
  },
  {
    id: 'p5',
    title: 'Quillmark',
    subtitle: 'Write, then publish anywhere',
    icon: icon('#6d597a', '#b56576', 'Q'),
    rating: 4.1,
    count: 88,
  },
  {
    id: 'p6',
    title: 'Orbit Chat',
    subtitle: 'Groups that stay small',
    icon: icon('#0b525b', '#14a3a3', 'O'),
    rating: 4.6,
    count: 940,
  },
  {
    id: 'p7',
    title: 'Lantern',
    subtitle: 'A calm reader for long pieces',
    icon: icon('#bc6c25', '#dda15e', 'L'),
    rating: null,
    count: 0,
  },
  {
    id: 'p8',
    title: 'Driftwood',
    subtitle: 'Photos, sorted by where',
    icon: icon('#283618', '#606c38', 'D'),
    rating: 4.3,
    count: 211,
  },
  {
    id: 'p9',
    title: 'Keystone',
    subtitle: 'Passwords, kept close',
    icon: icon('#03045e', '#0077b6', 'K'),
    rating: 4.8,
    count: 2301,
  },
];

const noop = () => {};

function Get({ label = 'Get' }: { label?: string }) {
  return (
    <Button size="sm" appearance="subtle" tone="accent" onPress={noop}>
      {label}
    </Button>
  );
}

/** The three sizes, and an unrated product whose caption is simply absent. */
export const Sizes: Story = {
  render: () => {
    const [first, second, third] = PRODUCTS;
    if (!first || !second || !third) return <View />;
    return (
      <View style={{ gap: 24, maxWidth: 560 }}>
        <Lockup
          size="lg"
          title={first.title}
          subtitle={first.subtitle}
          icon={first.icon}
          action={<Get label="Open" />}
        />
        <Lockup
          title={second.title}
          subtitle={second.subtitle}
          icon={second.icon}
          caption={<Rating value={second.rating} count={second.count} size="sm" />}
          onPress={noop}
          action={<Get />}
        />
        <Lockup
          size="sm"
          title={third.title}
          subtitle={third.subtitle}
          icon={third.icon}
          onPress={noop}
          action={<Get />}
        />
      </View>
    );
  },
};

/**
 * A store's shelf: three rows to a column, whole columns to a page, the
 * header's buttons paging one page at a time. The rows of each column are
 * separated without the caller counting them.
 */
export const PagedShelf: Story = {
  render: () => (
    <View style={{ maxWidth: 1040 }}>
      <Shelf
        title="Apps we love"
        layout="paged"
        rows={3}
        minItemWidth={300}
        gap={20}
        rowGap={0}
        onShowAll={noop}
      >
        {PRODUCTS.map((product) => (
          <Lockup
            key={product.id}
            title={product.title}
            subtitle={product.subtitle}
            icon={product.icon}
            onPress={noop}
            action={<Get />}
          />
        ))}
      </Shelf>
    </View>
  ),
};

/** A chart: the same rows with their position. */
export const Ranked: Story = {
  render: () => (
    <View style={{ maxWidth: 420 }}>
      {PRODUCTS.slice(0, 4).map((product, index) => (
        <Lockup
          key={product.id}
          rank={index + 1}
          title={product.title}
          subtitle={product.subtitle}
          icon={product.icon}
          onPress={noop}
          action={<Get />}
          divider={index < 3}
        />
      ))}
    </View>
  ),
};

/** Loading: the same geometry, so nothing moves when the rows arrive. */
export const Skeletons: Story = {
  render: () => (
    <View style={{ gap: 8, maxWidth: 420 }}>
      <LockupSkeleton size="lg" />
      <LockupSkeleton divider />
      <LockupSkeleton caption divider />
      <LockupSkeleton size="sm" />
    </View>
  ),
};
