import React, { useContext, useState } from 'react';
import { Image, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Chip } from '../chip';
import { BloomThemeContext, BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { ChannelPostCard } from './ChannelPostCard';
import { ContactList } from './ContactList';
import { MemberList } from './MemberList';
import { NewGroupForm } from './NewGroupForm';
import { SelectedChipsRow } from './SelectedChipsRow';
import { StoryViewer } from './StoryViewer';
import type { ContactSection, MemberListItem, PersonSummary } from './types';

/**
 * Invented people, invented groups, invented channels. Every "last seen" and
 * every timestamp is a pre-formatted string.
 */

const meta: Meta = {
  title: 'Blocks/Chat/People',
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj;

const PHOTO = (seed: string, w = 200, h = 200) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

const SECTIONS: readonly ContactSection[] = [
  {
    letter: 'A',
    contacts: [
      { id: 'ana', name: 'Ana Restrepo', avatar: PHOTO('ana'), subtitle: 'online', status: 'online' },
      { id: 'ade', name: 'Adeola Bakare', avatar: PHOTO('ade'), subtitle: 'last seen recently' },
    ],
  },
  {
    letter: 'D',
    contacts: [
      { id: 'dmitri', name: 'Dmitri Volkov', avatar: PHOTO('dmitri'), subtitle: 'last seen 2 h ago', status: 'idle' },
    ],
  },
  {
    letter: 'K',
    contacts: [
      { id: 'kofi', name: 'Kofi Mensah', avatar: PHOTO('kofi'), subtitle: '@kofim', status: 'busy' },
      { id: 'kira', name: 'Kira Novak', avatar: PHOTO('kira'), subtitle: 'last seen yesterday' },
    ],
  },
  {
    letter: 'M',
    contacts: [
      { id: 'marcel', name: 'Marcel Dubé', avatar: PHOTO('marcel'), subtitle: 'online', status: 'online' },
    ],
  },
  {
    letter: 'N',
    contacts: [
      { id: 'nour', name: 'Nour Haddad', avatar: PHOTO('nour'), subtitle: 'last seen a week ago' },
    ],
  },
  {
    letter: 'S',
    contacts: [
      { id: 'saoirse', name: 'Saoirse Byrne', avatar: PHOTO('saoirse'), subtitle: '@sao' },
      { id: 'sun', name: 'Sun-mi Park', avatar: PHOTO('sun'), subtitle: 'last seen recently' },
    ],
  },
  {
    letter: 'T',
    contacts: [
      { id: 'tova', name: 'Tova Lindqvist', avatar: PHOTO('tova'), subtitle: 'online', status: 'online' },
    ],
  },
];

const PICKED: readonly PersonSummary[] = [
  { id: 'ana', name: 'Ana Restrepo', avatar: PHOTO('ana') },
  { id: 'marcel', name: 'Marcel Dubé', avatar: PHOTO('marcel') },
  { id: 'nour', name: 'Nour Haddad', avatar: PHOTO('nour') },
  { id: 'kofi', name: 'Kofi Mensah', avatar: PHOTO('kofi') },
  { id: 'tova', name: 'Tova Lindqvist', avatar: PHOTO('tova') },
];

const MEMBERS: readonly MemberListItem[] = [
  { id: 'ana', name: 'Ana Restrepo', avatar: PHOTO('ana'), role: 'owner', subtitle: 'online', status: 'online' },
  { id: 'marcel', name: 'Marcel Dubé', avatar: PHOTO('marcel'), role: 'admin', subtitle: 'last seen recently' },
  { id: 'nour', name: 'Nour Haddad', avatar: PHOTO('nour'), subtitle: 'last seen 2 h ago', status: 'idle' },
  { id: 'kofi', name: 'Kofi Mensah', avatar: PHOTO('kofi'), subtitle: 'last seen yesterday' },
  { id: 'saoirse', name: 'Saoirse Byrne', avatar: PHOTO('saoirse'), subtitle: '@sao', status: 'busy' },
];

function Surface({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, padding: 20, gap: 16, backgroundColor: theme.colors.background }}>
      {children}
    </View>
  );
}

function BothModes({ children, min = 380 }: { children: React.ReactNode; min?: number }) {
  const preset = useContext(BloomThemeContext)?.colorPreset;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      <View style={{ minWidth: min, flexGrow: 1, flexBasis: min }}>
        <BloomThemeProvider mode="light" colorPreset={preset}>
          <Surface>{children}</Surface>
        </BloomThemeProvider>
      </View>
      <View style={{ minWidth: min, flexGrow: 1, flexBasis: min }}>
        <BloomThemeProvider mode="dark" colorPreset={preset}>
          <Surface>{children}</Surface>
        </BloomThemeProvider>
      </View>
    </View>
  );
}

function Caption({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <Text variant="caption-1-medium" style={{ color: theme.colors.textSecondary }}>
      {children}
    </Text>
  );
}

// ---------------------------------------------------------------------------

/** Contacts with the A–Z rail: chevrons on the left, a picker on the right. */
export const Contacts: Story = {
  render: function ContactsStory() {
    const [picked, setPicked] = useState<readonly string[]>(['ana', 'kofi']);
    const selectable = SECTIONS.map((section) => ({
      ...section,
      contacts: section.contacts.map((contact) => ({
        ...contact,
        selected: picked.includes(contact.id),
      })),
    }));
    return (
      <BothModes min={400}>
        <Caption>browse — chevrons, sticky headings, the rail</Caption>
        <ContactList
          sections={SECTIONS.map((section) => ({
            ...section,
            contacts: section.contacts.map((c) => ({ ...c, trailing: 'chevron' as const })),
          }))}
          activeLetter="A"
          height={320}
          onContactPress={() => undefined}
          onJumpToLetter={() => undefined}
          testID="contacts"
        />
        <Caption>pick — the row IS the checkbox</Caption>
        <ContactList
          sections={selectable}
          height={260}
          onContactSelectedChange={(id, next) =>
            setPicked((current) =>
              next ? [...current, id] : current.filter((entry) => entry !== id),
            )
          }
          testID="picker"
        />
      </BothModes>
    );
  },
};

/** The chips above a search field, scrolling and wrapping. */
export const SelectedChips: Story = {
  render: function SelectedChipsStory() {
    const [people, setPeople] = useState(PICKED);
    return (
      <BothModes min={360}>
        <Caption>scroll (the default)</Caption>
        <SelectedChipsRow
          people={people}
          onRemove={(id) => setPeople((current) => current.filter((p) => p.id !== id))}
          testID="chips"
        />
        <Caption>wrap</Caption>
        <SelectedChipsRow people={PICKED} layout="wrap" onRemove={() => undefined} />
      </BothModes>
    );
  },
};

/** Creating a group: photo, name with its counter, description, members. */
export const NewGroup: Story = {
  render: function NewGroupStory() {
    const [name, setName] = useState('Saturday planning');
    const [about, setAbout] = useState('');
    return (
      <BothModes min={420}>
        <NewGroupForm
          name={name}
          onNameChange={setName}
          description={about}
          onDescriptionChange={setAbout}
          onPickPhoto={() => undefined}
          members={PICKED}
          onRemoveMember={() => undefined}
          onAddMembers={() => undefined}
          testID="new-group"
        />
      </BothModes>
    );
  },
};

/** A group's members, with roles and the per-member menu. */
export const Members: Story = {
  render: function MembersStory() {
    const [search, setSearch] = useState('');
    return (
      <BothModes min={400}>
        <MemberList
          members={MEMBERS}
          title="5 members"
          search={search}
          onSearchChange={setSearch}
          onAddMembers={() => undefined}
          onMemberPress={() => undefined}
          onPromote={() => undefined}
          onRestrict={() => undefined}
          onRemove={() => undefined}
          testID="members"
        />
      </BothModes>
    );
  },
};

/** A channel broadcast, with counts, reactions and a comments button. */
export const ChannelPost: Story = {
  render: () => (
    <BothModes min={400}>
      <ChannelPostCard
        channelName="Coast Weather Watch"
        channelAvatar={PHOTO('channel')}
        verified
        pinned
        time="12:41"
        media={
          <Image
            source={{ uri: PHOTO('storm', 640, 360) }}
            style={{ width: '100%', height: 180 }}
            resizeMode="cover"
          />
        }
        views="12.4K"
        forwards="318"
        comments="128 comments"
        onComments={() => undefined}
        onShare={() => undefined}
        onMore={() => undefined}
        onPress={() => undefined}
        reactions={
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
            <Chip size="small" variant="subtle">
              🌊 42
            </Chip>
            <Chip size="small" variant="subtle">
              👀 18
            </Chip>
            <Chip size="small" variant="subtle">
              🙏 7
            </Chip>
          </View>
        }
        testID="post"
      >
        Swell picks up after midnight along the whole north shore. The harbour road stays open,
        but the lower car park floods on the high tide at 03:10.
      </ChannelPostCard>
    </BothModes>
  ),
};

/** The story viewer, with the progress strip running. */
export const Stories: Story = {
  render: function StoriesStory() {
    const [index, setIndex] = useState(1);
    const [paused, setPaused] = useState(false);
    const [reply, setReply] = useState('');
    const stories = ['a', 'b', 'c', 'd', 'e'].map((id) => ({
      id,
      media: (
        <Image
          source={{ uri: PHOTO(`story-${id}`, 800, 1400) }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      ),
    }));
    return (
      <View style={{ flexDirection: 'row', gap: 24, padding: 24, flexWrap: 'wrap' }}>
        <View style={{ width: 390, height: 760 }}>
          <StoryViewer
            stories={stories}
            index={index}
            paused={paused}
            name="Saoirse Byrne"
            avatar={PHOTO('saoirse')}
            time="2 h"
            muted
            onMutedChange={() => setPaused((p) => !p)}
            onMore={() => undefined}
            onClose={() => undefined}
            onNext={() => setIndex((i) => Math.min(stories.length - 1, i + 1))}
            onPrevious={() => setIndex((i) => Math.max(0, i - 1))}
            replyValue={reply}
            onReplyChange={setReply}
            onReplySend={() => setReply('')}
            reactions={['❤️', '🔥', '😂']}
            onReact={() => undefined}
            testID="story"
          />
        </View>
        <View style={{ width: 390, height: 760 }}>
          <StoryViewer
            stories={stories.slice(0, 3)}
            index={0}
            progress={0.35}
            name="Ito Nakamura"
            avatar={PHOTO('ito')}
            time="just now"
            onClose={() => undefined}
            onNext={() => undefined}
            onPrevious={() => undefined}
            testID="story-controlled"
          />
        </View>
      </View>
    );
  },
};
