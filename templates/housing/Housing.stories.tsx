import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { HousingTemplate } from './HousingTemplate';

/**
 * The housing app template: long-term rentals, sales, vacation rentals and
 * home swaps in one marketplace, the listing page for each, the tenant's own
 * home, community eviction reports, the listing wizard and the saved page.
 * Each story opens one page; the logo, the account menu, the cards and the
 * sidebar move between them. Pages scroll the document on web.
 */
const meta: Meta = {
  title: 'Templates/Housing',
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj;

/**
 * The marketplace: mode tabs (Rent / Buy / Vacation rentals / Swap) over the
 * search bar with its panels, the category strip with filters and "Save
 * search", the results grid and the "Show map" pill. Below `lg` the compact
 * trigger opens the step-by-step search.
 */
export const Explore: Story = {
  render: () => <HousingTemplate initialPage="explore" />,
};

/** Explore in buy mode, split into the list and the map. */
export const ExploreMap: Story = {
  name: 'Explore — Map',
  render: () => <HousingTemplate initialPage="explore" initialMode="buy" initialMap />,
};

/** A long-term rental: facts, floor plans, the neighbourhood, rent history, building reviews and the viewing request. */
export const ListingRent: Story = {
  name: 'Listing — Rent',
  render: () => <HousingTemplate initialPage="rent" />,
};

/** A home for sale: energy label, price estimate, price history, price per m² and the mortgage calculator. */
export const ListingSale: Story = {
  name: 'Listing — Sale',
  render: () => <HousingTemplate initialPage="sale" />,
};

/** A vacation rental: the booking card with dates, guests and the price breakdown; the booking bar on a phone. */
export const ListingVacationRental: Story = {
  name: 'Listing — Vacation rental',
  render: () => <HousingTemplate initialPage="stay" />,
};

/** A home open to a swap, with the proposal card comparing your home and theirs. */
export const SwapProposal: Story = {
  name: 'Swap proposal',
  render: () => <HousingTemplate initialPage="swap" />,
};

/** The tenant's area in the app shell: lease, payments, repairs, documents and an application. */
export const MyHome: Story = {
  name: 'My home',
  render: () => <HousingTemplate initialPage="my-home" />,
};

/** Community eviction reports, upcoming and past, with a case history. */
export const Evictions: Story = {
  render: () => <HousingTemplate initialPage="evictions" />,
};

/** The listing wizard, from the property type to publishing. */
export const PublishListing: Story = {
  name: 'Publish listing',
  render: () => <HousingTemplate initialPage="publish" />,
};

/** Saved searches, upcoming trips and swaps, and wishlists. */
export const Saved: Story = {
  render: () => <HousingTemplate initialPage="saved" />,
};
