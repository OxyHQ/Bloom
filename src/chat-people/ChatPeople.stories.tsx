import { AppShell } from '../app-shell';
import { Screen } from '../screen';
import { fn } from 'storybook/test';
import { PageHeader } from '../page-header';
import { RiArrowRightSLine } from '../icons/remix/RiArrowRightSLine';
import { RiUserAddLine } from '../icons/remix/RiUserAddLine';
import { List } from '../list';
import type React from 'react';
import { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { BloomImage } from '../image';
import { Button } from '../button';
import { NewGroupForm } from './NewGroupForm';
import { SelectedChipsRow } from './SelectedChipsRow';
import { StoryViewer } from './StoryViewer';
import type { ContactSection, PersonSummary } from './types';

/**
 * Invented people, invented groups, invented channels. Every "last seen" and
 * every timestamp is a pre-formatted string.
 */

const meta: Meta = {
  id: 'blocks-chat-people',
  title: 'Patterns/Chat/People',
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj;

const PHOTO = (seed: string, w = 200, h = 200) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

const SECTIONS: readonly ContactSection[] = [
  {
    letter: 'A',
    contacts: [
      {
        id: 'ana',
        name: 'Ana Restrepo',
        avatar: PHOTO('ana'),
        subtitle: 'online',
        status: 'online',
      },
      { id: 'ade', name: 'Adeola Bakare', avatar: PHOTO('ade'), subtitle: 'last seen recently' },
    ],
  },
  {
    letter: 'D',
    contacts: [
      {
        id: 'dmitri',
        name: 'Dmitri Volkov',
        avatar: PHOTO('dmitri'),
        subtitle: 'last seen 2 h ago',
        status: 'idle',
      },
    ],
  },
  {
    letter: 'K',
    contacts: [
      {
        id: 'kofi',
        name: 'Kofi Mensah',
        avatar: PHOTO('kofi'),
        subtitle: '@kofim',
        status: 'busy',
      },
      { id: 'kira', name: 'Kira Novak', avatar: PHOTO('kira'), subtitle: 'last seen yesterday' },
    ],
  },
  {
    letter: 'M',
    contacts: [
      {
        id: 'marcel',
        name: 'Marcel Dubé',
        avatar: PHOTO('marcel'),
        subtitle: 'online',
        status: 'online',
      },
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
      {
        id: 'tova',
        name: 'Tova Lindqvist',
        avatar: PHOTO('tova'),
        subtitle: 'online',
        status: 'online',
      },
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

function Surface({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, padding: 20, gap: 16, backgroundColor: theme.colors.background }}>
      {children}
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

/** The same list handles browsing and selecting people. */
export const Contacts: Story = {
  render: function ContactsStory() {
    const [picked, setPicked] = useState<readonly string[]>(['ana', 'kofi']);
    return (
      <Surface>
        <PageHeader title="Contacts" onBack={null} safeArea={false} sticky={false} />
        <Caption>browse — sticky headings (opt-in on Android) and alphabet index</Caption>
        <List
          sections={SECTIONS.map(({ letter, contacts }) => ({
            id: letter,
            title: letter,
            items: contacts.map((person) => ({
              id: person.id,
              person,
              trailing: (
                <View pointerEvents="none">
                  <RiArrowRightSLine size="md" />
                </View>
              ),
              onPress: fn().mockName('onPress'),
            })),
          }))}
          height={320}
          testID="contacts"
          sectionIndex={{ activeId: 'A' }}
        />
        <Caption>pick — select from the avatar or row</Caption>
        <List
          sections={SECTIONS.map(({ letter, contacts }) => ({
            id: letter,
            title: letter,
            items: contacts.map((person) => ({
              id: person.id,
              person,
              checked: picked.includes(person.id),
              selecting: true,
              onCheckedChange: (checked) =>
                setPicked((current) =>
                  checked ? [...current, person.id] : current.filter((id) => id !== person.id),
                ),
            })),
          }))}
          height={260}
          testID="picker"
          sectionIndex={{}}
        />
      </Surface>
    );
  },
};

/** Flat results can have a heading without an alphabet index or sticky header. */
export const ContactSearchResults: Story = {
  render: () => {
    const [result, setResult] = useState('');
    const items = SECTIONS.flatMap(({ contacts }) => contacts).map((person) => ({
      id: person.id,
      person: {
        ...person,
        actionLabel: 'Add contact',
        onAction: () => setResult(`Add ${person.id}`),
      },
      actions: [
        {
          key: 'add',
          label: 'Add contact',
          icon: RiUserAddLine,
          onPress: () => setResult(`Add ${person.id}`),
        },
      ],
      onPress: () => setResult(`Open ${person.id}`),
    }));
    return (
      <Surface>
        <Text accessibilityLiveRegion="polite" testID="contacts-result">
          {result}
        </Text>
        <Caption>flat, unlabelled</Caption>
        <List items={items} height={260} testID="results" stickyHeaders={false} />
        <Caption>flat, one label</Caption>
        <List
          sections={[{ id: 'results', title: 'Results', items }]}
          height={260}
          testID="results-labelled"
          stickyHeaders={false}
        />
      </Surface>
    );
  },
};

/** The chips above a search field, scrolling and wrapping. */
export const SelectedChips: Story = {
  render: function SelectedChipsStory() {
    const [people, setPeople] = useState(PICKED);
    return (
      <Surface>
        <Caption>scroll (the default)</Caption>
        <SelectedChipsRow
          people={people}
          onRemove={(id) => setPeople((current) => current.filter((p) => p.id !== id))}
          testID="chips"
        />
        <Caption>wrap</Caption>
        <SelectedChipsRow people={PICKED} layout="wrap" onRemove={fn().mockName('onRemove')} />
      </Surface>
    );
  },
};

/** Creating a group: photo, name with its counter, description, members. */
export const NewGroup: Story = {
  render: function NewGroupStory() {
    const [name, setName] = useState('Saturday planning');
    const [about, setAbout] = useState('');
    const [members, setMembers] = useState(PICKED.slice(0, 3));
    return (
      <Surface>
        <PageHeader title="New group" onBack={null} safeArea={false} sticky={false} />
        <NewGroupForm
          name={name}
          onNameChange={setName}
          description={about}
          onDescriptionChange={setAbout}
          onPickPhoto={fn().mockName('onPickPhoto')}
          members={members}
          onRemoveMember={(id) =>
            setMembers((current) => current.filter((member) => member.id !== id))
          }
          onAddMembers={
            members.length < PICKED.length
              ? () =>
                  setMembers((current) => [
                    ...current,
                    PICKED.find((person) => !current.some((member) => member.id === person.id))!,
                  ])
              : undefined
          }
          testID="new-group"
        />
      </Surface>
    );
  },
};

/** The story viewer, with the progress strip running. */
export const Stories: StoryObj<{ controlledProgress: boolean; progress: number }> = {
  args: { controlledProgress: false, progress: 0.35 },
  argTypes: {
    controlledProgress: { control: 'boolean' },
    progress: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
  },
  render: function StoriesStory({ controlledProgress, progress }) {
    const [index, setIndex] = useState(1);
    const [muted, setMuted] = useState(true);
    const [closed, setClosed] = useState(false);
    const [result, setResult] = useState('');
    const [reply, setReply] = useState('');

    const stories = ['a', 'b', 'c', 'd', 'e'].map((id) => ({
      id,
      media: (
        <BloomImage
          source={{ uri: PHOTO(`story-${id}`, 800, 1400) }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
        />
      ),
    }));
    return (
      <AppShell variant="canvas" header={null}>
        <Screen
          bottomBar={result ? <Text accessibilityLiveRegion="polite">{result}</Text> : undefined}
        >
          {closed ? (
            <Button onPress={() => setClosed(false)}>Reopen stories</Button>
          ) : (
            <StoryViewer
              stories={stories}
              progress={controlledProgress ? progress : undefined}
              index={index}
              name="Saoirse Byrne"
              avatar={PHOTO('saoirse')}
              time="2 h"
              muted={muted}
              onMutedChange={setMuted}
              onClose={() => setClosed(true)}
              onNext={() => setIndex((i) => Math.min(stories.length - 1, i + 1))}
              onPrevious={() => setIndex((i) => Math.max(0, i - 1))}
              replyValue={reply}
              onReplyChange={setReply}
              onReplySend={() => {
                setResult(`Reply sent: ${reply}`);
                setReply('');
              }}
              reactions={['❤️', '🔥', '😂']}
              onReact={(reaction) => setResult(`Reacted ${reaction}`)}
              testID="story"
            />
          )}
        </Screen>
      </AppShell>
    );
  },
};
