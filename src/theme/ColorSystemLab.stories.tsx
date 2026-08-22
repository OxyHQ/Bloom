import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { defaultAvatarSource } from '../avatar/default-avatar';
import {
  COLOR_PRESET_FAMILY_REGISTRY,
  COLOR_PRESET_REGISTRY,
  type ColorPresetFamily,
  type ColorPresetPairing,
  type ColorPresetRecipe,
} from './color-presets';
import { getResolvedTokens } from './token-registry';

type ColorMode = 'light' | 'dark';

interface LabPalette {
  canvas: string;
  shell: string;
  surface: string;
  raised: string;
  text: string;
  textMuted: string;
  identity: string;
  onIdentity: string;
  action: string;
  onAction: string;
  actionSoft: string;
}

type ColorRecipe = ColorPresetRecipe;

const COLOR_RECIPES: readonly ColorRecipe[] = COLOR_PRESET_REGISTRY;

type RecipeFamilyFilter = 'all' | ColorPresetFamily;
type RecipePairingFilter = 'all' | ColorPresetPairing;

function resolveLabPalette(recipe: ColorRecipe, mode: ColorMode): LabPalette {
  const tokens = getResolvedTokens(recipe.name, mode);
  const token = (name: string): string => tokens[`--${name}`] ?? 'rgb(0 0 0)';

  return {
    canvas: token('background'),
    shell: token('surface'),
    surface: token('popover'),
    raised: token('card'),
    text: token('foreground'),
    textMuted: token('muted-foreground'),
    identity: token('primary'),
    onIdentity: token('primary-foreground'),
    action: token('tertiary'),
    onAction: token('tertiary-foreground'),
    actionSoft: token('tertiary-subtle'),
  };
}
const meta: Meta = {
  title: 'Theme/Color System Playground',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj;

function Swatch({ label, color, text }: { label: string; color: string; text: string }) {
  return (
    <View style={styles.swatchItem}>
      <View style={[styles.swatch, { backgroundColor: color }]} />
      <View style={styles.swatchLabel}>
        <Text style={[styles.swatchName, { color: text }]}>{label}</Text>
        <Text style={[styles.swatchHex, { color: text }]}>{color}</Text>
      </View>
    </View>
  );
}

type MentionIconName =
  | 'home'
  | 'search'
  | 'bell'
  | 'live'
  | 'channel'
  | 'bookmark'
  | 'hashtag'
  | 'list'
  | 'video'
  | 'gear'
  | 'compose'
  | 'heart'
  | 'comment'
  | 'boost'
  | 'share'
  | 'more'
  | 'image'
  | 'sign-in';

const CHANNEL_PATH =
  'm744-227-38 53q-9 12-24 14.5t-27-6.5q-12-9-14.5-23.5T647-216l39-53-63-20q-14-5-21-18.5t-2-27.5q5-14 18.5-21t27.5-2l62 21v-66q0-15.3 10.29-25.65Q728.58-439 743.79-439t25.71 10.35Q780-418.3 780-403v66l63-21q14.22-5 27.11 2Q883-349 888-335t-2.5 27.5Q878-294 864-289l-62 20 39 53q9 12 6.5 26.5T833-166q-12 9-27 6.5T782-174l-38-53Zm-528 83q-29 0-50.5-21.5T144-216v-528q0-29.7 21.5-50.85Q187-816 216-816h528q29.7 0 50.85 21.15Q816-773.7 816-744v167q0 15.26-10.29 25.13t-25.5 9.87q-15.21 0-25.71-10.35T744-578v-166H216v312h139q11 0 22.5 5t13.5 16q7 29 24 46.5t40 24.5q11 4 18 13t7 21q0 17.8-14.5 28.4Q451-267 434-272q-38-11-64-34t-41.88-54H216v144h248q15.3 0 25.65 10.29Q500-195.42 500-180.21t-10.35 25.71Q479.3-144 464-144H216Zm108-468h312q15.3 0 25.65-10.29Q672-632.58 672-647.79t-10.35-25.71Q651.3-684 636-684H324q-15.3 0-25.65 10.29Q288-663.42 288-648.21t10.35 25.71Q308.7-612 324-612Zm0 120h264q15.3 0 25.65-10.29Q624-512.58 624-527.79t-10.35-25.71Q603.3-564 588-564H324q-15.3 0-25.65 10.29Q288-543.42 288-528.21t10.35 25.71Q308.7-492 324-492Z';

function MentionLogo({ color, size = 28 }: { color: string; size?: number }) {
  return (
    <Svg viewBox="0 0 67.65 74.16" width={size} height={size}>
      <Path
        d="M60.31,69.05c-.38,1.28-.28,3.27,1.23,4.4,1.25,.94,2.94,.89,4.15,.2,2.17-1.23,1.95-4.01,1.93-4.2-.12-1.2-.79-3.05-2.38-3.57-1.99-.65-4.32,1.12-4.93,3.17Zm-25.68-15.26c-.55-2.36,.03-3.77,.36-5.19,1.9-8.07,3.99-16.1,5.7-24.21,1.3-6.17,3.27-12.26,2.95-18.69-.1-2.04-.31-4.09-2.44-5.07-2.19-1.02-4.42-.79-6.38,.64-.89,.65-1.74,1.46-2.35,2.37-3.65,5.43-7.57,10.72-10.77,16.4C13.26,35.01,6.84,50.89,.74,66.91c-1.42,3.74-.85,5.88,2.18,6.94,2.72,.95,5.21-.38,6.16-3.74,4.57-16.2,11.72-31.29,19.67-46.06,1.02-1.9,1.97-3.83,4.61-5.66-.42,2.24-.67,3.66-.96,5.07-2.65,12.88-6.49,25.49-8.48,38.52-.52,3.43,.15,6.29,3.47,7.82,3.48,1.6,6.02-.21,8.02-2.9,3.7-4.96,7.34-9.96,10.96-14.98,2.77-3.84,5.71-7.53,9.2-10.75,.78-.72,1.54-2.01,2.77-1.45,1.12,.51,1.02,1.92,1.04,3.01,.09,4.71,.06,9.43,.18,14.14,.06,2.24,.12,4.9,3.14,5.09,3.03,.19,3.79-2.12,4.17-4.69,.89-6.05,.87-12.13,.6-18.2-.3-6.7-4.95-9.74-11.34-7.69-5.82,1.87-9.12,6.72-12.82,11.01-2.97,3.45-5.54,7.24-8.69,11.4Z"
        fill={color}
      />
    </Svg>
  );
}

function MentionIcon({
  name,
  color,
  size = 24,
  active = false,
}: {
  name: MentionIconName;
  color: string;
  size?: number;
  active?: boolean;
}) {
  if (name === 'channel') {
    return (
      <Svg viewBox="0 -960 960 960" width={size} height={size}>
        <Path d={CHANNEL_PATH} fill={color} />
      </Svg>
    );
  }

  return (
    <Svg viewBox="0 0 24 24" width={size} height={size} fill="none">
      {name === 'home' && (
        <Path
          d={
            active
              ? 'M2.25 12.886V20.75c0 1.105.895 2 2 2h4c.276 0 .5-.224.5-.5V17.5A4.25 4.25 0 0 1 13 13.25a4.25 4.25 0 0 1 4.25 4.25v4.75c0 .276.224.5.5.5h4c1.105 0 2-.895 2-2v-7.864a5 5 0 0 0-1.855-3.887l-5.75-4.654a5 5 0 0 0-6.29 0l-5.75 4.654a5 5 0 0 0-1.855 3.887Z'
              : 'M2.25 12.886V20.75c0 1.105.895 2 2 2h5c.276 0 .5-.224.5-.5V16.5A3.25 3.25 0 0 1 13 13.25a3.25 3.25 0 0 1 3.25 3.25v5.75c0 .276.224.5.5.5h5c1.105 0 2-.895 2-2v-7.864a5 5 0 0 0-1.855-3.887l-5.75-4.654a5 5 0 0 0-6.29 0l-5.75 4.654a5 5 0 0 0-1.855 3.887Z'
          }
          fill={active ? color : 'none'}
          stroke={color}
          strokeLinecap="round"
          strokeWidth="2.3"
        />
      )}
      {name === 'search' && (
        <>
          <Circle cx="10.5" cy="10.5" r="8.5" stroke={color} strokeWidth="2" />
          <Line x1="16.5" y1="16.5" x2="22" y2="22" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </>
      )}
      {name === 'bell' && (
        <Path
          fill={color}
          d="M19.993 9.042C19.48 5.017 16.054 2 11.996 2s-7.49 3.021-7.999 7.051L2.866 18H7.1c.463 2.282 2.481 4 4.9 4s4.437-1.718 4.9-4h4.236l-1.143-8.958zM12 20c-1.306 0-2.417-.835-2.829-2h5.658c-.412 1.165-1.523 2-2.829 2zm-6.866-4 .847-6.698C6.364 6.272 8.941 4 11.996 4s5.627 2.268 6.013 5.295L18.864 16H5.134z"
        />
      )}
      {name === 'live' && (
        <>
          <Circle cx="12" cy="12" r="2.25" fill={color} />
          <Path d="M8.6 8.4a5 5 0 0 0 0 7.2M15.4 8.4a5 5 0 0 1 0 7.2M5.6 5.4a9 9 0 0 0 0 13.2M18.4 5.4a9 9 0 0 1 0 13.2" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </>
      )}
      {name === 'bookmark' && (
        <Path fill={color} d="M4 4.5C4 3.12 5.119 2 6.5 2h11C18.881 2 20 3.12 20 4.5v18.44l-8-5.71-8 5.71V4.5zM6.5 4c-.276 0-.5.22-.5.5v14.56l6-4.29 6 4.29V4.5c0-.28-.224-.5-.5-.5h-11z" />
      )}
      {name === 'hashtag' && (
        <Path fill={color} d="M10.09 3.098 9.72 7h5.99l.39-4.089 1.99.187L17.72 7h3.78v2h-3.97l-.56 6h3.53v2h-3.72l-.38 4.089-1.99-.187.36-3.902H8.78l-.38 4.089-1.99-.187L6.77 17H2.5v-2h4.46l.56-6H3.5V7h4.21l.39-4.089 1.99.187zM14.96 15l.56-6H9.53l-.56 6h5.99z" />
      )}
      {name === 'list' && (
        <Path fill={color} fillRule="evenodd" d="M6 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2ZM3 7a3 3 0 1 1 6 0 3 3 0 0 1-6 0Zm9 0a1 1 0 0 1 1-1h7a1 1 0 1 1 0 2h-7a1 1 0 0 1-1-1Zm-6 9a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm-3 1a3 3 0 1 1 6 0 3 3 0 0 1-6 0Zm9 0a1 1 0 0 1 1-1h7a1 1 0 1 1 0 2h-7a1 1 0 0 1-1-1Z" />
      )}
      {name === 'video' && (
        <>
          <Path d="M2 12V8.55C2 5.7 2.7 4.55 3.61 3.61 4.55 2.7 5.7 2 8.55 2h6.9c2.85 0 4 .7 4.94 1.61C21.3 4.55 22 5.7 22 8.55v6.9c0 2.85-.7 4-1.61 4.94C19.45 21.3 18.3 22 15.45 22h-6.9c-2.85 0-4-.7-4.94-1.61C2.7 19.45 2 18.3 2 15.45V12Z" stroke={color} strokeWidth="2" />
          <Line x1="2.05" y1="7" x2="21.95" y2="7" stroke={color} strokeWidth="2" />
          <Path fill={color} d="M9.76 17.66a.91.91 0 0 1-.45-.79v-5.24a.91.91 0 0 1 1.36-.79l4.55 2.63a.91.91 0 0 1 0 1.57l-4.55 2.63a.91.91 0 0 1-.91 0Z" />
        </>
      )}
      {name === 'gear' && (
        <Path fill={color} d="M10.54 1.75h2.92l1.57 2.36c.11.17.32.25.53.21l2.53-.59 2.17 2.17-.58 2.54c-.05.2.04.41.21.53l2.36 1.57v2.92l-2.36 1.57c-.17.12-.26.33-.21.53l.58 2.54-2.17 2.17-2.53-.59c-.21-.04-.42.04-.53.21l-1.57 2.36h-2.92l-1.58-2.36c-.11-.17-.32-.25-.52-.21l-2.54.59-2.17-2.17.58-2.54c.05-.2-.03-.41-.21-.53l-2.35-1.57v-2.92L4.1 8.97c.18-.12.26-.33.21-.53L3.73 5.9 5.9 3.73l2.54.59c.2.04.41-.04.52-.21l1.58-2.36zM12 8.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 0 0 12 8.5Zm0 2A1.5 1.5 0 1 1 12 13.5 1.5 1.5 0 0 1 12 10.5Z" />
      )}
      {name === 'compose' && (
        <Path fill={color} d="M23 3c-6.62-.1-10.38 2.421-13.05 6.03C7.29 12.61 6 17.331 6 22h2c0-1.007.07-2.012.19-3H12c4.1 0 7.48-3.082 7.94-7.054C22.79 10.147 23.17 6.359 23 3zm-7 8h-1.5v2H16c.63-.016 1.2-.08 1.72-.188C16.95 15.24 14.68 17 12 17H8.55c.57-2.512 1.57-4.851 3-6.78 2.16-2.912 5.29-4.911 9.45-5.187C20.95 8.079 19.9 11 16 11zM4 9V6H1V4h3V1h2v3h3v2H6v3H4z" />
      )}
      {name === 'heart' && (
        <Path stroke={color} fill="transparent" d="M2.34 9.53c0 2.2.7 3.9 2.94 6.22 1.82 1.82 3.8 3.27 4.55 3.8a1.4 1.4 0 0 0 1.67 0c.75-.53 2.74-1.98 4.55-3.8C18.3 13.5 19 11.8 19 9.53c0-2.3-1.57-4.28-4-4.28-2.02 0-3.4 1.68-4.33 3.57-.93-1.89-2.31-3.57-4.33-3.57-2.43 0-4 1.98-4 4.28Z" strokeWidth="1.8" />
      )}
      {name === 'comment' && (
        <Path stroke={color} fill="transparent" d="M18.5 16.2 20 21l-4.8-1.5a8.3 8.3 0 1 1 3.3-3.3Z" strokeWidth="1.7" strokeLinejoin="round" />
      )}
      {name === 'boost' && (
        <Path fill={color} d="m4.5 3.88 4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z" />
      )}
      {name === 'share' && (
        <Path fill={color} d="m12 2.59 5.7 5.7-1.41 1.42L13 6.41V16h-2V6.41l-3.3 3.3-1.41-1.42L12 2.59zM21 15l-.02 3.51c0 1.38-1.12 2.49-2.5 2.49H5.5C4.11 21 3 19.88 3 18.5V15h2v3.5c0 .28.22.5.5.5h12.98c.28 0 .5-.22.5-.5L19 15h2z" />
      )}
      {name === 'more' && (
        <>
          <Circle cx="6" cy="12" r="1.7" fill={color} />
          <Circle cx="12" cy="12" r="1.7" fill={color} />
          <Circle cx="18" cy="12" r="1.7" fill={color} />
        </>
      )}
      {name === 'image' && (
        <Path d="M4 3h16a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm0 16h16v-3l-4.5-4.5-3.2 3.2-2.2-2.2L4 18.6V19Zm4-9a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" fill={color} />
      )}
      {name === 'sign-in' && (
        <>
          <Path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <Path d="m14 8 4 4-4 4M18 12H8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
    </Svg>
  );
}

const NAV_ITEMS: readonly { label: string; icon: MentionIconName }[] = [
  { label: 'Home', icon: 'home' },
  { label: 'Explore', icon: 'search' },
  { label: 'Notifications', icon: 'bell' },
  { label: 'Live Rooms', icon: 'live' },
  { label: 'Channels', icon: 'channel' },
  { label: 'Saved', icon: 'bookmark' },
  { label: 'Feeds', icon: 'hashtag' },
  { label: 'Lists', icon: 'list' },
  { label: 'Videos', icon: 'video' },
  { label: 'Settings', icon: 'gear' },
];

function SidebarItem({
  active,
  icon,
  label,
  palette,
}: {
  active?: boolean;
  icon: MentionIconName;
  label: string;
  palette: LabPalette;
}) {
  const color = active ? palette.identity : palette.text;
  return (
    <View style={styles.sidebarItem}>
      {active ? (
        <View
          pointerEvents="none"
          style={[styles.sidebarActiveTint, { backgroundColor: palette.identity }]}
        />
      ) : null}
      <View style={styles.sidebarIcon}>
        <MentionIcon name={icon} active={active} color={color} size={24} />
      </View>
      <Text style={[styles.sidebarLabel, { color }, active && styles.sidebarLabelActive]}>{label}</Text>
    </View>
  );
}

function PostAction({ name, palette }: { name: MentionIconName; palette: LabPalette }) {
  return (
    <View style={styles.postActionButton}>
      <MentionIcon name={name} color={palette.textMuted} size={20} />
    </View>
  );
}

type PostIllustrationVariant = 'books' | 'dictionary-primary' | 'dictionary-secondary';

function PostIllustration({
  palette,
  variant,
}: {
  palette: LabPalette;
  variant: PostIllustrationVariant;
}) {
  const books = variant === 'books';
  const accent = variant === 'dictionary-secondary' ? palette.action : palette.identity;
  const onAccent = variant === 'dictionary-secondary' ? palette.onAction : palette.onIdentity;
  const label = books
    ? 'Abstract rare-books illustration'
    : 'Abstract dictionary-card illustration';

  return (
    <View
      accessible
      accessibilityLabel={label}
      accessibilityRole="image"
      style={[
        books ? styles.linkPreviewImage : styles.galleryImage,
        styles.postIllustration,
        { backgroundColor: palette.shell },
      ]}
    >
      {books ? (
        <>
          <View
            style={[
              styles.bookHalo,
              { backgroundColor: palette.actionSoft },
            ]}
          />
          <View style={styles.bookStack}>
            <View style={[styles.bookVolumeWide, { backgroundColor: palette.identity }]} />
            <View style={[styles.bookVolumeNarrow, { backgroundColor: palette.action }]} />
            <View style={[styles.bookVolumeWide, { backgroundColor: palette.raised }]} />
          </View>
        </>
      ) : (
        <View style={[styles.dictionaryCard, { backgroundColor: palette.raised }]}>
          <View style={[styles.dictionaryMonogram, { backgroundColor: accent }]}>
            <Text style={[styles.dictionaryMonogramText, { color: onAccent }]}>W</Text>
          </View>
          <View style={styles.dictionaryCopy}>
            <View style={[styles.dictionaryLineLong, { backgroundColor: palette.text }]} />
            <View style={[styles.dictionaryLineMedium, { backgroundColor: accent }]} />
            <View style={[styles.dictionaryLineShort, { backgroundColor: palette.textMuted }]} />
          </View>
        </View>
      )}
    </View>
  );
}

function MentionPost({
  palette,
  second = false,
}: {
  palette: LabPalette;
  second?: boolean;
}) {
  return (
    <View style={[styles.post, { backgroundColor: palette.canvas, borderBottomColor: palette.shell }]}>
      <Image accessibilityLabel="" source={defaultAvatarSource} style={styles.postAvatarImage} />
      <View style={styles.postBody}>
        <View style={styles.postIdentityRow}>
          <Text numberOfLines={1} style={[styles.postName, { color: palette.text }]}>
            {second ? 'Depths of Wiktionary' : '404 MEDIA'}
          </Text>
          <Text numberOfLines={1} style={[styles.postHandle, { color: palette.textMuted }]}>
            {second ? '@depthsofwiktionary@wikis.world · 5d' : '@404mediaco@mastodon.social · 3d'}
          </Text>
          <MentionIcon name="more" color={palette.textMuted} size={20} />
        </View>
        {second ? null : (
          <Text style={[styles.postText, { color: palette.text }]}>
            We placed a tracking device in a shipment of rare books to see which AI company was
            buying it, and found an Amazon facility where Amazon scans and destroys books.
          </Text>
        )}

        {second ? (
          <View style={styles.galleryRow}>
            <PostIllustration palette={palette} variant="dictionary-primary" />
            <PostIllustration palette={palette} variant="dictionary-secondary" />
          </View>
        ) : (
          <View
            style={[
              styles.linkPreview,
              { borderColor: palette.shell, backgroundColor: palette.raised },
            ]}
          >
            <PostIllustration palette={palette} variant="books" />
            <View style={styles.linkPreviewCopy}>
              <Text style={[styles.linkDomain, { color: palette.textMuted }]}>404 MEDIA</Text>
              <Text numberOfLines={2} style={[styles.linkTitle, { color: palette.text }]}>
                We Tracked a Shipment of Rare Books. It Ended at an Amazon AI Training Facility
              </Text>
              <Text numberOfLines={2} style={[styles.linkDescription, { color: palette.textMuted }]}>
                We placed a tracking device in a shipment of rare books to see which AI company was buying it.
              </Text>
            </View>
          </View>
        )}

        <View style={styles.postActions}>
          <PostAction name="heart" palette={palette} />
          <PostAction name="comment" palette={palette} />
          <PostAction name="boost" palette={palette} />
          <PostAction name="share" palette={palette} />
          <View style={styles.postActionSpacer} />
          <PostAction name="bookmark" palette={palette} />
        </View>
      </View>
    </View>
  );
}

function TrendRow({
  rank,
  title,
  meta,
  palette,
}: {
  rank: number;
  title: string;
  meta: string;
  palette: LabPalette;
}) {
  return (
    <View style={[styles.trendRow, { borderBottomColor: palette.shell }]}>
      <Text style={[styles.trendRank, { color: palette.textMuted }]}>{rank}</Text>
      <View style={styles.trendCopy}>
        <Text style={[styles.trendMeta, { color: palette.textMuted }]}>{meta}</Text>
        <Text style={[styles.trendTitle, { color: palette.text }]}>{title}</Text>
      </View>
      <View style={styles.trendSpark}>
        <Svg viewBox="0 0 50 18" width={50} height={18}>
          <Path d={rank % 2 ? 'M1 14h19l4-8 5 7h13l7-5' : 'M1 12h10l5-5 7 6h16l10 3'} stroke={palette.identity} strokeWidth="1.8" fill="none" strokeLinecap="round" />
        </Svg>
      </View>
      <MentionIcon name="more" color={palette.textMuted} size={18} />
    </View>
  );
}

const FOLLOW_ITEMS = [
  ['Depths of Wiktionary', '@depthsofwiktionary@wikis.world'],
  ['David Revoy', '@davidrevoy@framapiaf.org'],
  ['Ritalin Invitees', '@intransitivelie@beige.party'],
  ['J L Westover', '@mrlovenstein@mastodon.social'],
] as const;

function RightRail({ palette }: { palette: LabPalette }) {
  return (
    <View style={styles.rightRail}>
      <View style={[styles.searchField, { backgroundColor: palette.surface }]}>
        <MentionIcon name="search" color={palette.textMuted} size={20} />
        <Text style={[styles.searchPlaceholder, { color: palette.textMuted }]}>Search Mention</Text>
      </View>

      <Text style={[styles.widgetTitle, { color: palette.text }]}>Trending</Text>
      <TrendRow rank={1} title="Earth" meta="Trending · 4 people" palette={palette} />
      <TrendRow rank={2} title="Elon Musk" meta="Trending · 5 people" palette={palette} />
      <TrendRow rank={3} title="York" meta="Trending · 3 people" palette={palette} />
      <TrendRow rank={4} title="Grok" meta="Trending · 6 people" palette={palette} />
      <TrendRow rank={5} title="Trump" meta="Trending · 4 people" palette={palette} />
      <Text style={[styles.showMore, { color: palette.identity }]}>Show more</Text>

      <View style={[styles.widgetDivider, { backgroundColor: palette.shell }]} />
      <Text style={[styles.widgetTitle, { color: palette.text }]}>Who to follow</Text>
      {FOLLOW_ITEMS.map(([name, handle]) => (
        <View key={name} style={[styles.followRow, { borderBottomColor: palette.shell }]}>
          <Image accessibilityLabel="" source={defaultAvatarSource} style={styles.followAvatar} />
          <View style={styles.followCopy}>
            <Text numberOfLines={1} style={[styles.followName, { color: palette.text }]}>{name}</Text>
            <Text numberOfLines={1} style={[styles.followHandle, { color: palette.textMuted }]}>{handle}</Text>
          </View>
        </View>
      ))}
      <Text style={[styles.showMore, { color: palette.identity }]}>Show more</Text>
      <Text style={[styles.footerLinks, { color: palette.textMuted }]}>About   Privacy   Terms   Cookies   Oxy</Text>
      <Text style={[styles.footerCopy, { color: palette.textMuted }]}>Made with ❤️ in the 🌎 by Oxy.</Text>
      <Text style={[styles.footerCopy, { color: palette.textMuted }]}>Mention™ is a trademark of The Oxy Collective, Inc.</Text>
    </View>
  );
}

function ThemePreview({
  authenticated,
  mode,
  palette,
}: {
  authenticated: boolean;
  mode: ColorMode;
  palette: LabPalette;
}) {
  return (
    <View style={styles.previewBlock}>
      <View style={styles.previewLabelRow}>
        <Text style={styles.previewModeTitle}>{mode === 'light' ? 'Light mode' : 'Dark mode'}</Text>
        <Text style={styles.previewModeNote}>Mention desktop · 1500 px · expanded shell</Text>
      </View>
      <View testID={`mention-preview-${mode}`} style={[styles.preview, { backgroundColor: palette.canvas }]}>
        <View style={styles.appFrame}>
          <View style={styles.sidebar}>
            <View style={styles.sidebarNavigation}>
              <SidebarItem active icon="home" label="Home" palette={palette} />
              {authenticated ? (
                <View style={styles.sidebarItem}>
                  <Image
                    accessibilityLabel=""
                    source={defaultAvatarSource}
                    style={styles.sidebarProfileAvatar}
                  />
                  <Text style={[styles.sidebarLabel, { color: palette.text }]}>Profile</Text>
                </View>
              ) : null}
              {NAV_ITEMS.slice(1).map((item) => (
                <SidebarItem
                  key={item.label}
                  icon={item.icon}
                  label={item.label}
                  palette={palette}
                />
              ))}
              <View style={[styles.composeButton, { backgroundColor: palette.action }]}>
                <Text style={[styles.composeButtonText, { color: palette.onAction }]}>New Post</Text>
              </View>
            </View>
            <View style={styles.profileRow}>
              {authenticated ? (
                <>
                  <Image
                    accessibilityLabel="Nate"
                    source={defaultAvatarSource}
                    style={styles.profileAvatar}
                  />
                  <View style={styles.profileCopy}>
                    <Text style={[styles.profileName, { color: palette.text }]}>Nate</Text>
                    <Text style={[styles.profileHandle, { color: palette.textMuted }]}>@nate</Text>
                  </View>
                </>
              ) : (
                <>
                  <MentionIcon name="sign-in" color={palette.text} size={24} />
                  <Text style={[styles.sidebarLabel, { color: palette.text }]}>Sign In</Text>
                </>
              )}
            </View>
          </View>

          <View style={styles.mainShell}>
            <View style={styles.panelGutter}>
              <View style={[styles.contentPanel, { backgroundColor: palette.canvas, borderColor: palette.shell }]}>
                <View style={styles.contentHeader}>
                  <MentionLogo color={palette.text} />
                  <View style={styles.headerActions}>
                    <View style={[styles.headerIconButton, { borderColor: palette.shell }]}>
                      <MentionIcon name="search" color={palette.text} size={20} />
                    </View>
                    <View style={[styles.headerIconButton, { borderColor: palette.shell }]}>
                      <MentionIcon name="bell" color={palette.text} size={20} />
                    </View>
                  </View>
                </View>

                <View style={[styles.tabs, { borderBottomColor: palette.shell }]}>
                  <View style={styles.tab}>
                    <Text style={[styles.tabTextActive, { color: palette.identity }]}>For You</Text>
                    <View style={[styles.tabIndicator, { backgroundColor: palette.identity }]} />
                  </View>
                  {authenticated ? (
                    <View style={styles.tab}>
                      <Text style={[styles.tabText, { color: palette.textMuted }]}>Following</Text>
                    </View>
                  ) : null}
                </View>

                {authenticated ? (
                  <View
                    style={[
                      styles.composer,
                      { backgroundColor: palette.raised, shadowColor: palette.identity },
                    ]}
                  >
                    <Image
                      accessibilityLabel="Nate"
                      source={defaultAvatarSource}
                      style={styles.composerAvatar}
                    />
                    <Text style={[styles.composerPlaceholder, { color: palette.textMuted }]}>What&apos;s up?</Text>
                    <MentionIcon name="image" color={palette.textMuted} size={22} />
                  </View>
                ) : null}

                <MentionPost palette={palette} />
                <MentionPost second palette={palette} />
                {!authenticated ? (
                  <View style={[styles.signInBanner, { backgroundColor: palette.identity }]}>
                    <View>
                      <Text style={[styles.signInTitle, { color: palette.onIdentity }]}>Don&apos;t miss what&apos;s happening</Text>
                      <Text style={[styles.signInSubtitle, { color: palette.onIdentity }]}>People on Mention are the first to know.</Text>
                    </View>
                    <View style={[styles.signInButton, { backgroundColor: palette.raised }]}>
                      <Text style={[styles.signInButtonText, { color: palette.text }]}>Sign In</Text>
                    </View>
                  </View>
                ) : null}
              </View>
            </View>
            <RightRail palette={palette} />
          </View>
        </View>
      </View>
    </View>
  );
}

function FilterButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      aria-pressed={selected}
      onPress={onPress}
      style={[styles.filterButton, selected && styles.filterButtonSelected]}
    >
      <Text style={[styles.filterButtonText, selected && styles.filterButtonTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

function ColorSystemLab() {
  const [activeRecipeIndex, setActiveRecipeIndex] = useState(0);
  const [authenticated, setAuthenticated] = useState(true);
  const [familyFilter, setFamilyFilter] = useState<RecipeFamilyFilter>('all');
  const [pairingFilter, setPairingFilter] = useState<RecipePairingFilter>('curated');
  const visibleRecipes = COLOR_RECIPES.filter(
    (recipe) =>
      (familyFilter === 'all' || recipe.family === familyFilter) &&
      (pairingFilter === 'all' || recipe.pairing === pairingFilter),
  );
  const activeRecipe = visibleRecipes[activeRecipeIndex] ?? visibleRecipes[0];
  if (activeRecipe === undefined) return null;
  const activeLight = resolveLabPalette(activeRecipe, 'light');
  const activeDark = resolveLabPalette(activeRecipe, 'dark');

  return (
    <View style={styles.page}>
      <View style={styles.labHeader}>
        <View style={styles.labHeading}>
          <Text style={styles.labEyebrow}>BLOOM COLOR LAB · MENTION INTERFACE</Text>
          <Text style={styles.labTitle}>More energy, less pastel</Text>
          <Text style={styles.labDescription}>
            The same Mention structure applied to {COLOR_RECIPES.length} dynamic recipes. Large
            surfaces stay neutral while identity and action carry the saturated colour.
          </Text>
        </View>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#75805D' }]} />
            <Text style={styles.legendText}>Identity: selection, navigation and brand</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#E9B522' }]} />
            <Text style={styles.legendText}>Action: one dominant CTA in each context</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#BDB6AC' }]} />
            <Text style={styles.legendText}>Hierarchy: flow, spacing and radius without decorative boxes</Text>
          </View>
        </View>
      </View>

      <View style={styles.paletteMapHeader}>
        <Text style={styles.paletteMapTitle}>{COLOR_RECIPES.length} directions to compare</Text>
        <Text style={styles.paletteMapDescription}>
          Filter by family or curated/derived pairing. Every card shows light and dark.
        </Text>
      </View>

      <View style={styles.filterStack}>
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Family</Text>
          <FilterButton
            label="All"
            selected={familyFilter === 'all'}
            onPress={() => {
              setFamilyFilter('all');
              setActiveRecipeIndex(0);
            }}
          />
          {COLOR_PRESET_FAMILY_REGISTRY.map((family) => (
            <FilterButton
              key={family.name}
              label={family.displayName}
              selected={familyFilter === family.name}
              onPress={() => {
                setFamilyFilter(family.name);
                setActiveRecipeIndex(0);
              }}
            />
          ))}
        </View>
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Pairing</Text>
          <FilterButton
            label="All"
            selected={pairingFilter === 'all'}
            onPress={() => {
              setPairingFilter('all');
              setActiveRecipeIndex(0);
            }}
          />
          <FilterButton
            label="Curated combinations"
            selected={pairingFilter === 'curated'}
            onPress={() => {
              setPairingFilter('curated');
              setActiveRecipeIndex(0);
            }}
          />
          <FilterButton
            label="Derived"
            selected={pairingFilter === 'derived'}
            onPress={() => {
              setPairingFilter('derived');
              setActiveRecipeIndex(0);
            }}
          />
          <Text style={styles.filterCount}>{visibleRecipes.length} visible</Text>
        </View>
      </View>

      <View style={styles.recipeGrid}>
        {visibleRecipes.map((recipe, index) => {
          const selected = index === activeRecipeIndex;
          const light = resolveLabPalette(recipe, 'light');
          const dark = resolveLabPalette(recipe, 'dark');
          return (
            <Pressable
              key={recipe.name}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              aria-pressed={selected}
              onPress={() => setActiveRecipeIndex(index)}
              style={[
                styles.recipeButton,
                selected ? styles.recipeButtonSelected : styles.recipeButtonIdle,
              ]}
            >
              <View style={styles.recipeModes}>
                <View style={styles.recipeSwatches}>
                  <View style={[styles.recipeSwatch, { backgroundColor: light.canvas }]} />
                  <View style={[styles.recipeSwatch, { backgroundColor: light.identity }]} />
                  <View style={[styles.recipeSwatch, { backgroundColor: light.action }]} />
                </View>
                <View style={styles.recipeSwatches}>
                  <View style={[styles.recipeSwatch, { backgroundColor: dark.canvas }]} />
                  <View style={[styles.recipeSwatch, { backgroundColor: dark.identity }]} />
                  <View style={[styles.recipeSwatch, { backgroundColor: dark.action }]} />
                </View>
              </View>
              <Text style={styles.recipeName}>{recipe.displayName}</Text>
              <Text style={styles.recipeSource}>{recipe.family} · {recipe.pairing}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.recipeIntro}>
        <View style={styles.recipeIntroCopy}>
          <Text style={styles.recipeTitle}>{activeRecipe.displayName}</Text>
          <Text style={styles.recipeIdea}>{activeRecipe.description}</Text>
        </View>
        <View style={styles.rulePill}>
          <Text style={styles.rulePillText}>The palette changes by mode; the relationship stays intact</Text>
        </View>
      </View>

      <View style={styles.viewerModeRow}>
        <Text style={styles.viewerModeLabel}>Mention state</Text>
        <View style={styles.viewerModeControl}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: authenticated }}
            aria-pressed={authenticated}
            onPress={() => setAuthenticated(true)}
            style={[styles.viewerModeButton, authenticated && styles.viewerModeButtonSelected]}
          >
            <Text style={[styles.viewerModeButtonText, authenticated && styles.viewerModeButtonTextSelected]}>
              Signed in
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: !authenticated }}
            aria-pressed={!authenticated}
            onPress={() => setAuthenticated(false)}
            style={[styles.viewerModeButton, !authenticated && styles.viewerModeButtonSelected]}
          >
            <Text style={[styles.viewerModeButtonText, !authenticated && styles.viewerModeButtonTextSelected]}>
              Public view
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.previewRow}>
        <ThemePreview authenticated={authenticated} mode="light" palette={activeLight} />
        <ThemePreview authenticated={authenticated} mode="dark" palette={activeDark} />
      </View>

      <View style={styles.swatchSection}>
        <View style={styles.swatchMode}>
          <Text style={styles.swatchModeTitle}>Light · neutral layers, concentrated colour</Text>
          <View style={styles.swatchRow}>
            <Swatch label="Canvas" color={activeLight.canvas} text="#18202A" />
            <Swatch label="Shell" color={activeLight.shell} text="#18202A" />
            <Swatch label="Surface" color={activeLight.surface} text="#18202A" />
            <Swatch label="Raised" color={activeLight.raised} text="#18202A" />
            <Swatch label="Identity" color={activeLight.identity} text="#18202A" />
            <Swatch label="Action" color={activeLight.action} text="#18202A" />
          </View>
        </View>
        <View style={styles.swatchMode}>
          <Text style={styles.swatchModeTitle}>Dark · deep layers, not inverted</Text>
          <View style={styles.swatchRow}>
            <Swatch label="Canvas" color={activeDark.canvas} text="#18202A" />
            <Swatch label="Shell" color={activeDark.shell} text="#18202A" />
            <Swatch label="Surface" color={activeDark.surface} text="#18202A" />
            <Swatch label="Raised" color={activeDark.raised} text="#18202A" />
            <Swatch label="Identity" color={activeDark.identity} text="#18202A" />
            <Swatch label="Action" color={activeDark.action} text="#18202A" />
          </View>
        </View>
      </View>
    </View>
  );
}

export const Playground: Story = {
  render: () => <ColorSystemLab />,
};

const styles = StyleSheet.create({
  page: {
    width: '100%',
    maxWidth: 1480,
    alignSelf: 'center',
    padding: 32,
    gap: 28,
    backgroundColor: '#F1EEE8',
  },
  labHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 24,
  },
  labHeading: {
    maxWidth: 760,
    gap: 8,
  },
  labEyebrow: {
    color: '#6E655B',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 1.6,
  },
  labTitle: {
    color: '#1F1C19',
    fontSize: 38,
    lineHeight: 44,
    fontWeight: '700',
    letterSpacing: -1.2,
  },
  labDescription: {
    color: '#625B54',
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 680,
  },
  legend: {
    gap: 10,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#E7E2DA',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    color: '#4C4640',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  paletteMapHeader: {
    gap: 3,
  },
  paletteMapTitle: {
    color: '#1F1C19',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
  },
  paletteMapDescription: {
    color: '#625B54',
    fontSize: 13,
    lineHeight: 18,
  },
  filterStack: {
    gap: 10,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  filterLabel: {
    width: 68,
    color: '#4C4640',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#E4DFD7',
  },
  filterButtonSelected: {
    backgroundColor: '#1F1C19',
  },
  filterButtonText: {
    color: '#625B54',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
  },
  filterButtonTextSelected: {
    color: '#FFFFFF',
  },
  filterCount: {
    color: '#766F67',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
  },
  recipeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  recipeButton: {
    minWidth: 180,
    maxWidth: 220,
    flexGrow: 1,
    flexBasis: 210,
    padding: 14,
    borderRadius: 16,
    gap: 8,
  },
  recipeButtonSelected: {
    backgroundColor: '#FFFFFF',
  },
  recipeButtonIdle: {
    backgroundColor: '#E9E5DE',
  },
  recipeModes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  recipeSwatches: {
    flexDirection: 'row',
  },
  recipeSwatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: -6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  recipeName: {
    color: '#1F1C19',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },
  recipeSource: {
    color: '#766F67',
    fontSize: 11,
    lineHeight: 15,
  },
  recipeIntro: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  recipeIntroCopy: {
    maxWidth: 760,
    gap: 4,
  },
  recipeTitle: {
    color: '#1F1C19',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
  },
  recipeIdea: {
    color: '#625B54',
    fontSize: 14,
    lineHeight: 21,
  },
  rulePill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#DFD9D0',
  },
  rulePillText: {
    color: '#4C4640',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
  },
  viewerModeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  viewerModeLabel: {
    color: '#4C4640',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },
  viewerModeControl: {
    padding: 4,
    borderRadius: 999,
    backgroundColor: '#DFD9D0',
    flexDirection: 'row',
    gap: 4,
  },
  viewerModeButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  viewerModeButtonSelected: {
    backgroundColor: '#FFFFFF',
  },
  viewerModeButtonText: {
    color: '#6E655B',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
  },
  viewerModeButtonTextSelected: {
    color: '#1F1C19',
  },
  previewRow: {
    gap: 32,
  },
  previewBlock: {
    gap: 10,
  },
  previewLabelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 16,
  },
  previewModeTitle: {
    color: '#1F1C19',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
  },
  previewModeNote: {
    color: '#766F67',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
  },
  preview: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: 28,
  },
  appFrame: {
    width: '100%',
    maxWidth: 1190,
    minHeight: 1000,
    alignSelf: 'center',
    flexDirection: 'row',
  },
  sidebar: {
    width: 240,
    padding: 6,
  },
  sidebarNavigation: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
  },
  sidebarItem: {
    width: '100%',
    minHeight: 44,
    marginBottom: 8,
    paddingHorizontal: 16,
    borderRadius: 35,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    overflow: 'hidden',
  },
  sidebarActiveTint: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 35,
    opacity: 0.1,
  },
  sidebarIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebarProfileAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  sidebarLabel: {
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '500',
  },
  sidebarLabelActive: {
    fontWeight: '600',
  },
  composeButton: {
    width: '100%',
    minHeight: 44,
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composeButtonText: {
    fontSize: 17,
    lineHeight: 21,
    fontWeight: '800',
  },
  profileRow: {
    minHeight: 56,
    width: '100%',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  profileCopy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  profileName: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
  },
  profileHandle: {
    fontSize: 13,
    lineHeight: 16,
  },
  mainShell: {
    flex: 1,
    minWidth: 0,
    maxWidth: 950,
    flexDirection: 'row',
  },
  panelGutter: {
    flex: 2.2,
    minWidth: 0,
    paddingTop: 8,
    paddingRight: 8,
    paddingBottom: 8,
  },
  contentPanel: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 28,
  },
  contentHeader: {
    minHeight: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  headerActions: {
    position: 'absolute',
    right: 12,
    top: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabs: {
    height: 38,
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    minWidth: 76,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabTextActive: {
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '700',
  },
  tabText: {
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '500',
  },
  tabIndicator: {
    position: 'absolute',
    left: 4,
    right: 4,
    bottom: 0,
    height: 2,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  composer: {
    minHeight: 56,
    margin: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  composerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  composerPlaceholder: {
    flex: 1,
    fontSize: 16,
    lineHeight: 20,
  },
  post: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    gap: 12,
    borderBottomWidth: 1,
  },
  postAvatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  postBody: {
    flex: 1,
    minWidth: 0,
    gap: 12,
  },
  postIdentityRow: {
    minHeight: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postName: {
    flexShrink: 1,
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '700',
  },
  postHandle: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    lineHeight: 18,
  },
  postText: {
    fontSize: 15,
    lineHeight: 20,
  },
  linkPreview: {
    width: 280,
    overflow: 'hidden',
    borderRadius: 18,
    borderWidth: 1,
  },
  linkPreviewImage: {
    width: '100%',
    height: 160,
  },
  postIllustration: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookHalo: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    top: -54,
    right: -38,
  },
  bookStack: {
    width: 150,
    gap: 8,
    transform: [{ rotate: '-7deg' }],
  },
  bookVolumeWide: {
    width: 150,
    height: 28,
    borderRadius: 7,
  },
  bookVolumeNarrow: {
    width: 124,
    height: 24,
    borderRadius: 7,
    alignSelf: 'flex-end',
  },
  linkPreviewCopy: {
    padding: 12,
    gap: 3,
  },
  linkDomain: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '600',
  },
  linkTitle: {
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '700',
  },
  linkDescription: {
    fontSize: 13,
    lineHeight: 17,
  },
  galleryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  galleryImage: {
    width: 462,
    height: 180,
    borderRadius: 16,
  },
  dictionaryCard: {
    width: '78%',
    height: '74%',
    borderRadius: 14,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  dictionaryMonogram: {
    width: 54,
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dictionaryMonogramText: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '800',
  },
  dictionaryCopy: {
    flex: 1,
    gap: 9,
  },
  dictionaryLineLong: {
    width: '88%',
    height: 8,
    borderRadius: 4,
  },
  dictionaryLineMedium: {
    width: '68%',
    height: 7,
    borderRadius: 4,
  },
  dictionaryLineShort: {
    width: '48%',
    height: 6,
    borderRadius: 3,
  },
  postActions: {
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  postActionButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postActionSpacer: {
    flex: 1,
  },
  signInBanner: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 64,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  signInTitle: {
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '800',
  },
  signInSubtitle: {
    marginTop: 3,
    fontSize: 13,
    lineHeight: 16,
    opacity: 0.86,
  },
  signInButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  signInButtonText: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '800',
  },
  rightRail: {
    width: 350,
    marginTop: 50,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  searchField: {
    width: '100%',
    minHeight: 44,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchPlaceholder: {
    fontSize: 15,
    lineHeight: 18,
  },
  widgetTitle: {
    marginBottom: 7,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '700',
  },
  trendRow: {
    minHeight: 48,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trendRank: {
    width: 9,
    fontSize: 13,
    lineHeight: 16,
  },
  trendCopy: {
    flex: 1,
    minWidth: 0,
  },
  trendMeta: {
    fontSize: 12,
    lineHeight: 15,
  },
  trendTitle: {
    fontSize: 14,
    lineHeight: 17,
    fontWeight: '600',
  },
  trendSpark: {
    width: 50,
    height: 18,
  },
  showMore: {
    marginTop: 9,
    marginBottom: 11,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
  },
  widgetDivider: {
    height: 1,
    marginBottom: 15,
  },
  followRow: {
    minHeight: 65,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  followAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  followCopy: {
    flex: 1,
    minWidth: 0,
  },
  followName: {
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '600',
  },
  followHandle: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 16,
  },
  footerLinks: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 17,
  },
  footerCopy: {
    fontSize: 12,
    lineHeight: 16,
  },
  swatchSection: {
    gap: 18,
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#E7E2DA',
  },
  swatchMode: {
    gap: 10,
  },
  swatchModeTitle: {
    color: '#1F1C19',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },
  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  swatchItem: {
    width: 154,
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F7F5F1',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(31, 28, 25, 0.12)',
  },
  swatchLabel: {
    gap: 1,
  },
  swatchName: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '800',
  },
  swatchHex: {
    fontSize: 9,
    lineHeight: 12,
    opacity: 0.62,
  },
});
