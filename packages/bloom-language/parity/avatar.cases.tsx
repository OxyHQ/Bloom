import * as RN from 'react-native';
import { Avatar } from '@oxy.so/bloom/avatar';
import { AvatarGroup, type AvatarGroupItem } from '@oxy.so/bloom/avatar-group';
import { Badge } from '@oxy.so/bloom/badge';
import { AvatarPresence } from '@oxy.so/bloom/chat-indicators';

import { AVATAR_SIZE, ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/primitives';
import { toElement } from '../src/render';
import { defineTokens, type AvatarSizeName } from '../src/tokens';
import { type ParityCase, Themed } from './support/cases';
import { Text } from '@oxy.so/bloom/typography';

const PHOTO = 'https://cdn.oxy.so/avatars/ana.jpg';
const onPress = () => {};
const row = defineTokens({ avatarSize: { feed: 48, hero: 96 } });
const APP = defineTokens({ color: { ring: '#101010' } });

const avatars: ParityCase[] = [
  {
    name: 'a photo',
    language: () => toElement(L.Avatar(PHOTO)),
    bloom: () => <Avatar source={PHOTO} />,
  },
  ...(Object.keys(AVATAR_SIZE) as AvatarSizeName[]).map((size) => ({
    name: `size ${size}`,
    language: () => toElement(L.Avatar(PHOTO).size(size)),
    bloom: () => <Avatar source={PHOTO} size={AVATAR_SIZE[size]} />,
  })),
  ...(['auto', 'always', 'never'] as const).map((motion) => ({
    // Mention's account avatars: the character's motion its policy chooses.
    name: `an avatar whose character motion is ${motion}`,
    language: () => toElement(L.Avatar(PHOTO).motion(motion)),
    bloom: () => <Avatar source={PHOTO} motion={motion} />,
  })),
  {
    name: 'a group whose members keep still (motion never)',
    language: () => toElement(L.AvatarGroup(MEMBERS).motion('never')),
    bloom: () => <AvatarGroup items={MEMBERS} motion="never" />,
  },
  {
    name: 'an avatar of rounded corners (cornerRadius)',
    language: () => toElement(L.Avatar(PHOTO).size('lg').cornerRadius('md')),
    bloom: () => <Avatar source={PHOTO} size={36} style={{ borderRadius: 12 }} />,
  },
  {
    name: 'an avatar touches pass through',
    language: () => toElement(L.Avatar(PHOTO).allowsHitTesting(false)),
    // react-native-web drops an inline pointerEvents, so on the web the avatar's box takes it.
    bloom: () =>
      RN.Platform.OS === 'web' ? (
        <RN.View pointerEvents="none">
          <Avatar source={PHOTO} />
        </RN.View>
      ) : (
        <Avatar source={PHOTO} style={{ pointerEvents: 'none' }} />
      ),
  },
  {
    name: 'an app token size',
    language: () => toElement(L.Avatar(PHOTO).size(row.avatarSize.feed)),
    bloom: () => <Avatar source={PHOTO} size={48} />,
  },
  {
    name: 'a rendition of a file id',
    language: () => toElement(L.Avatar('file-123', { variant: 'small' })),
    bloom: () => <Avatar source="file-123" variant="small" />,
  },
  {
    name: 'initials from a name',
    language: () => toElement(L.Avatar(null, { name: 'Ana Lima' })),
    bloom: () => <Avatar source={null} name="Ana Lima" />,
  },
  {
    name: 'explicit initials',
    language: () => toElement(L.Avatar(null, { initials: 'AL' })),
    bloom: () => <Avatar source={null} initials="AL" />,
  },
  ...ENUMS.avatarColor.map((color) => ({
    name: `tint ${color}`,
    language: () => toElement(L.Avatar(null, { name: 'Ana' }).tint(color)),
    bloom: () => <Avatar source={null} name="Ana" color={color} />,
  })),
  ...(['squircle', 'heart', '4-sided-cookie'] as const).map((shape) => ({
    name: `shape ${shape}`,
    language: () => toElement(L.Avatar(null, { name: 'Ana' }).shape(shape)),
    bloom: () => <Avatar source={null} name="Ana" shape={shape} />,
  })),
  {
    name: 'a fallback image',
    language: () => toElement(L.Avatar(null, { fallbackSource: { uri: PHOTO } })),
    bloom: () => <Avatar source={null} fallbackSource={{ uri: PHOTO }} />,
  },
  {
    name: 'an account',
    language: () =>
      toElement(L.Avatar(null, { account: { username: 'ana', name: { first: 'Ana' } } })),
    bloom: () => <Avatar source={null} account={{ username: 'ana', name: { first: 'Ana' } }} />,
  },
  {
    name: 'verified',
    language: () => toElement(L.Avatar(PHOTO).verified()),
    bloom: () => <Avatar source={PHOTO} verified />,
  },
  {
    name: 'live',
    language: () => toElement(L.Avatar(PHOTO).size('lg').live()),
    bloom: () => <Avatar source={PHOTO} size={36} live />,
  },
  {
    name: 'live, ring only',
    language: () => toElement(L.Avatar(PHOTO).live().liveBadge(false)),
    bloom: () => <Avatar source={PHOTO} live hideLiveBadge />,
  },
  ...ENUMS.presence.map((status) => ({
    name: `presence ${status}`,
    language: () => toElement(L.Avatar(PHOTO).presence(status)),
    bloom: () => <AvatarPresence source={PHOTO} status={status} />,
  })),
  {
    name: 'presence on a small avatar',
    language: () => toElement(L.Avatar(PHOTO).size('sm').presence('online')),
    bloom: () => <AvatarPresence source={PHOTO} size={24} status="online" />,
  },
  {
    name: 'named and pressable',
    language: () => toElement(L.Avatar(PHOTO).label('Ana Lima').onPress(onPress).testID('author')),
    bloom: () => <Avatar source={PHOTO} alt="Ana Lima" onPress={onPress} testID="author" />,
  },
  {
    name: 'a count badge on an avatar',
    language: () => toElement(L.Avatar(PHOTO).badge(L.Badge(3))),
    bloom: () => (
      <Badge content={3}>
        <Avatar source={PHOTO} />
      </Badge>
    ),
  },
  {
    name: 'a dot badge at the bottom right',
    language: () =>
      toElement(L.Avatar(PHOTO).badge(L.Badge().dot().tint('success').placement('bottom-right'))),
    bloom: () => (
      <Badge dot tone="success" placement="bottom-right">
        <Avatar source={PHOTO} />
      </Badge>
    ),
  },
];

const MEMBERS: AvatarGroupItem[] = [
  { id: 'a', uri: PHOTO, name: 'Ana' },
  { id: 'b', name: 'Bo Chen' },
  { id: 'c', initials: 'CL' },
  { id: 'd', uri: 'file-9', name: 'Dee' },
  { id: 'e', name: 'Eli' },
  { id: 'f', name: 'Fay' },
];

const groups: ParityCase[] = [
  {
    name: 'a facepile',
    language: () => toElement(L.AvatarGroup(MEMBERS)),
    bloom: () => <AvatarGroup items={MEMBERS} />,
  },
  {
    // Allo's conversation info: the cluster at an app's own diameter, past Bloom's rungs.
    name: 'a conversation cluster at an app size (96)',
    language: () =>
      toElement(
        L.AvatarGroup(MEMBERS.slice(0, 3)).layout('conversation').size(row.avatarSize.hero),
      ),
    bloom: () => <AvatarGroup items={MEMBERS.slice(0, 3)} layout="conversation" size={96} />,
  },
  ...ENUMS.avatarLayout.map((layout) => ({
    name: `layout ${layout}`,
    language: () => toElement(L.AvatarGroup(MEMBERS.slice(0, 4)).layout(layout).size('md')),
    bloom: () => <AvatarGroup items={MEMBERS.slice(0, 4)} layout={layout} size={32} />,
  })),
  {
    // Mention's live room: the ring the theme's background, a follow button in each card, small renditions.
    name: 'a facepile ringed in the background, an action per member, a rendition',
    language: () =>
      toElement(
        L.AvatarGroup(MEMBERS)
          .ringColor('background')
          .variant('small')
          .hoverCard()
          .itemAction((item) => L.Text(`Follow ${item.name ?? ''}`)),
      ),
    bloom: () => (
      <Themed>
        {(c) => (
          <AvatarGroup
            items={MEMBERS}
            ringColor={c.background}
            variant="small"
            hoverCard
            renderItemAction={(item) => <Text>{`Follow ${item.name ?? ''}`}</Text>}
          />
        )}
      </Themed>
    ),
  },
  {
    name: 'a facepile ringed in an app colour',
    language: () => toElement(L.AvatarGroup(MEMBERS).ringColor(APP.color.ring)),
    bloom: () => <AvatarGroup items={MEMBERS} ringColor="#101010" />,
  },
  {
    name: 'a capped facepile with a total',
    language: () => toElement(L.AvatarGroup(MEMBERS).max(3).total(42)),
    bloom: () => <AvatarGroup items={MEMBERS} max={3} total={42} />,
  },
  {
    name: 'a row with spacing and initials',
    language: () => toElement(L.AvatarGroup(MEMBERS).layout('row').spacing('xs').initials()),
    bloom: () => <AvatarGroup items={MEMBERS} layout="row" spacing={4} showInitials />,
  },
  {
    name: 'a conversation truncated, squircles, named',
    language: () =>
      toElement(
        L.AvatarGroup(MEMBERS)
          .layout('conversation')
          .overflow('truncate')
          .shape('squircle')
          .label('Design team'),
      ),
    bloom: () => (
      <AvatarGroup
        items={MEMBERS}
        layout="conversation"
        overflow="truncate"
        shape="squircle"
        accessibilityLabel="Design team"
      />
    ),
  },
  {
    name: 'pressable members',
    language: () => toElement(L.AvatarGroup(MEMBERS).onPressItem(onPress).testID('members')),
    bloom: () => <AvatarGroup items={MEMBERS} onPressItem={onPress} testID="members" />,
  },
];

export const AVATAR_CASES: ParityCase[] = [...avatars, ...groups];
