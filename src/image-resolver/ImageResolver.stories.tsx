import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ImageResolverProvider, type ImageResolver } from './index';
import { Avatar } from '../avatar';
import { AvatarGroup } from '../avatar-group';
import { Text } from '../typography';
import { Card } from '../card';

const meta: Meta = {
  title: 'Foundations/ImageResolver',
};

export default meta;

type Story = StoryObj;

/**
 * A stand-in for `oxyServices.getFileDownloadUrl`. A real resolver builds a
 * `cloud.oxy.so` URL; this one returns a coloured square so the story is
 * self-contained and works offline.
 *
 * NOT `data:image/svg+xml;utf8,` — react-native-web matches that exact prefix
 * and runs `encodeURIComponent` over the remainder itself
 * (`exports/Image/index.js`), so a pre-encoded payload arrives DOUBLE-encoded,
 * fails to decode, and `Avatar` falls back to its initial. This story rendered
 * the same letter for both cases for exactly that reason — the resolved half
 * looked like the broken half, which is the opposite of what it is here to
 * show, and nothing errored. The plain `data:image/svg+xml,` form is left alone
 * by that rewrite and is valid on both platforms.
 */
const resolver: ImageResolver = (id, variant) => {
  const hue = [...id].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % 360;
  const label = variant ?? '—';
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96'>` +
      `<rect width='96' height='96' fill='hsl(${hue} 70% 55%)'/>` +
      `<text x='48' y='54' font-size='13' fill='white' text-anchor='middle'>${label}</text>` +
      `</svg>`,
  )}`;
};

function Case({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  return (
    <Card variant="outlined" radius="radius-16" style={{ padding: 16, gap: 10, width: 260 }}>
      <Text style={{ fontWeight: '600' }}>{title}</Text>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>{children}</View>
      <Text style={{ fontSize: 12, opacity: 0.7 }}>{note}</Text>
    </Card>
  );
}

/**
 * THE failure this family exists to prevent, side by side.
 *
 * `source` sends a non-URL string — an Oxy file id — through the registered
 * resolver. `uri` is taken as a raw URL, so the same file id is requested
 * verbatim, 404s, and the avatar falls back to its initial.
 *
 * Nothing throws. The symptom is "every avatar shows a placeholder character",
 * which reads as missing data rather than as a wiring mistake — and it is the
 * single most common way avatars break across the ecosystem.
 */
export const SourceVersusUri: Story = {
  render: () => (
    <ImageResolverProvider value={resolver}>
      <View style={{ flexDirection: 'row', gap: 16 }}>
        <Case
          title="source — correct"
          note="A bare file id resolves through the app's ImageResolver."
        >
          <Avatar source="file_abc123" name="Ada Lovelace" size={64} />
        </Case>
        <Case
          title="uri — the mistake"
          note="The file id is used as a URL. It 404s and you get the initial."
        >
          <Avatar uri="file_abc123" name="Ada Lovelace" size={64} />
        </Case>
      </View>
    </ImageResolverProvider>
  ),
};

/**
 * A full URL, or an `{ uri }` object, passes through the resolver untouched —
 * which is why both props "work" in any test written with a real URL, and only
 * one of them works with a file id.
 */
export const PassThrough: Story = {
  render: () => (
    <ImageResolverProvider value={resolver}>
      <View style={{ flexDirection: 'row', gap: 16 }}>
        <Case title="file id" note="Resolved.">
          <Avatar source="file_xyz789" name="Grace" size={64} />
        </Case>
        <Case title="absolute URL" note="Untouched — no resolver call.">
          <Avatar
            source="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=128&h=128&fit=crop"
            name="Grace"
            size={64}
          />
        </Case>
      </View>
    </ImageResolverProvider>
  ),
};

/**
 * The second argument asks for a SIZE. `Avatar` defaults it to `thumb` rather
 * than requesting the full-size original for a 32px circle — the label in each
 * square below is the variant the resolver was actually asked for.
 */
export const Variants: Story = {
  render: () => (
    <ImageResolverProvider value={resolver}>
      <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
        <Avatar source="file_v" name="A" size={48} />
        <Avatar source="file_v" variant="w320" name="A" size={64} />
        <Avatar source="file_v" variant="full" name="A" size={80} />
      </View>
    </ImageResolverProvider>
  ),
};

/**
 * Every Bloom component that wraps `Avatar` inherits the rule — `AvatarGroup`
 * items take `source`, and a group built with `uri` is a row of placeholder
 * letters.
 */
export const ThroughAvatarGroup: Story = {
  render: () => (
    <ImageResolverProvider value={resolver}>
      <View style={{ gap: 16 }}>
        <AvatarGroup
          size={40}
          max={4}
          total={12}
          items={['file_a', 'file_b', 'file_c', 'file_d', 'file_e'].map((id) => ({
            id,
            source: id,
            name: id.slice(-1).toUpperCase(),
          }))}
        />
        <Text style={{ fontSize: 12, opacity: 0.7 }}>
          Items pass `source`, so each id resolves.
        </Text>
      </View>
    </ImageResolverProvider>
  ),
};

/**
 * With NO provider registered, a file id cannot be resolved and every avatar
 * falls back — the same picture as the `uri` mistake, from a different cause.
 * Register one provider at the app root.
 */
export const NoProvider: Story = {
  render: function NoProviderStory() {
    const [withProvider, setWithProvider] = useState(false);
    const avatars = (
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {['file_1', 'file_2', 'file_3'].map((id) => (
          <Avatar key={id} source={id} name={id.slice(-1)} size={56} />
        ))}
      </View>
    );
    return (
      <View style={{ gap: 12 }}>
        <Text onPress={() => setWithProvider((v) => !v)} style={{ fontWeight: '600' }}>
          {withProvider ? 'provider mounted — tap to remove' : 'no provider — tap to mount'}
        </Text>
        {withProvider ? (
          <ImageResolverProvider value={resolver}>{avatars}</ImageResolverProvider>
        ) : (
          avatars
        )}
      </View>
    );
  },
};
