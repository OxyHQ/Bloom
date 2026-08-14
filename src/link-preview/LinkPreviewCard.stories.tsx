import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { LinkPreviewCard } from './index';

const meta: Meta<typeof LinkPreviewCard> = {
  title: 'Data Display/LinkPreviewCard',
  component: LinkPreviewCard,
};

export default meta;

type Story = StoryObj<typeof LinkPreviewCard>;

/** The full card: cover image, site name, title, description. */
export const Full: Story = {
  render: () => (
    <View style={{ width: 360 }}>
      <LinkPreviewCard
        url="https://oxy.so/blog/bloom"
        siteName="Oxy"
        title="Bloom, the shared component library"
        description="One card surface, one overlay, one token scale — across every Oxy app."
        image="https://picsum.photos/seed/bloom/720/360"
        onPress={() => {}}
      />
    </View>
  ),
};

/**
 * Everything except the URL is optional — the hostname is the fallback for both
 * the site name and the title, so a bare URL still renders a usable card rather
 * than an empty box.
 */
export const UrlOnly: Story = {
  render: () => (
    <View style={{ width: 360 }} testID="link-preview-url-only">
      <LinkPreviewCard url="https://oxy.so/careers" onPress={() => {}} />
    </View>
  ),
};

/** No cover image: the card collapses to its text block. */
export const TextOnly: Story = {
  render: () => (
    <View style={{ width: 360 }}>
      <LinkPreviewCard
        url="https://oxy.so/status"
        siteName="Oxy Status"
        title="All systems operational"
        description="No incidents reported in the last 90 days."
        onPress={() => {}}
      />
    </View>
  ),
};

/**
 * `coverFill` is for a card placed in a fixed-height row: the image flexes into
 * whatever height the consumer gives the card and the text stays a compact
 * footer, instead of the image keeping its intrinsic height and overflowing.
 */
export const CoverFill: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <LinkPreviewCard
        url="https://oxy.so/a"
        title="Fixed 180px row"
        image="https://picsum.photos/seed/a/600/600"
        coverFill
        style={{ width: 220, height: 180 }}
        onPress={() => {}}
      />
      <LinkPreviewCard
        url="https://oxy.so/b"
        title="Same row, same height"
        image="https://picsum.photos/seed/b/400/900"
        coverFill
        style={{ width: 220, height: 180 }}
        onPress={() => {}}
      />
    </View>
  ),
};

/** The A/B subject for the card-composition work. */
export const Measured: Story = {
  render: () => (
    <LinkPreviewCard
      url="https://oxy.so/measured"
      siteName="Oxy"
      title="Measured surface"
      description="outlined, radius-20"
      style={{ width: 320 }}
      onPress={() => {}}
    />
  ),
};
