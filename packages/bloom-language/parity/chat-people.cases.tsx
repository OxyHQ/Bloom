import { NewGroupForm, SelectedChipsRow, StoryViewer } from '@oxy.so/bloom/chat-people';
import { Text } from '@oxy.so/bloom/typography';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const press = () => {};
const set = () => {};
const PHOTO = 'https://cdn.oxy.so/p.jpg';
const PEOPLE = [
  {
    id: 'ana',
    name: 'Ana Restrepo',
    avatar: PHOTO,
    subtitle: 'Designer',
    status: 'online' as const,
  },
  { id: 'marcel', name: 'Marcel Dubé', avatar: null },
  { id: 'nour', name: 'Nour Haddad', avatar: PHOTO, status: 'busy' as const },
];
const STORIES = [
  { id: 's1', media: <Text>Sunrise</Text> },
  { id: 's2', media: <Text>Harbour</Text>, duration: 8000 },
  { id: 's3' },
];
/** Held still: the progress bars run on a timer unless paused. */
const STORY = {
  name: 'Ana Restrepo',
  avatar: PHOTO,
  time: '2h',
  paused: true,
  progress: 0.4,
  onNext: press,
  onPrevious: press,
  onClose: press,
};

const stories: ParityCase[] = [
  {
    name: 'StoryViewer',
    language: () => toElement(L.StoryViewer(STORIES, 1, STORY)),
    bloom: () => <StoryViewer stories={STORIES} index={1} {...STORY} />,
  },
  {
    name: 'StoryViewer muted, a reply, reactions, a height, named',
    language: () =>
      toElement(
        L.StoryViewer(STORIES, 0, {
          ...STORY,
          muted: true,
          onMutedChange: set,
          onMore: press,
          replyValue: 'So pretty',
          onReplyChange: set,
          onReplySend: press,
          reactions: ['❤️', '😂'],
          onReact: set,
          height: '448',
          labels: { close: 'Close the story' },
        }),
      ),
    bloom: () => (
      <StoryViewer
        stories={STORIES}
        index={0}
        {...STORY}
        muted
        onMutedChange={set}
        onMore={press}
        replyValue="So pretty"
        onReplyChange={set}
        onReplySend={press}
        reactions={['❤️', '😂']}
        onReact={set}
        height={448}
        labels={{ close: 'Close the story' }}
      />
    ),
  },
  {
    name: 'StoryViewer a composer of its own',
    language: () =>
      toElement(L.StoryViewer(STORIES, 2, { ...STORY, composer: L.Text('Replies are off') })),
    bloom: () => (
      <StoryViewer stories={STORIES} index={2} {...STORY} composer={<Text>Replies are off</Text>} />
    ),
  },
];

const chips: ParityCase[] = [
  ...ENUMS.selectedChipsLayout.map((layout) => ({
    name: `SelectedChipsRow ${layout}`,
    language: () => toElement(L.SelectedChipsRow(PEOPLE, { onRemove: set }).style(layout)),
    bloom: () => <SelectedChipsRow people={PEOPLE} onRemove={set} layout={layout} />,
  })),
  {
    name: 'SelectedChipsRow empty, with an empty state and words',
    language: () =>
      toElement(
        L.SelectedChipsRow([], {
          emptyState: L.Text('Nobody yet'),
          formatRemoveLabel: (name) => `Drop ${name}`,
        }),
      ),
    bloom: () => (
      <SelectedChipsRow
        people={[]}
        emptyState={<Text>Nobody yet</Text>}
        formatRemoveLabel={(name) => `Drop ${name}`}
      />
    ),
  },
  {
    name: 'SelectedChipsRow empty, nothing shown',
    language: () => toElement(L.SelectedChipsRow([])),
    bloom: () => <SelectedChipsRow people={[]} />,
  },
];

const groups: ParityCase[] = [
  {
    name: 'NewGroupForm',
    language: () => toElement(L.NewGroupForm(['', set])),
    bloom: () => <NewGroupForm name="" onNameChange={set} />,
  },
  {
    name: 'NewGroupForm filled: photo, description, members, words',
    language: () =>
      toElement(
        L.NewGroupForm(['Weekend trip', set], {
          photo: PHOTO,
          onPickPhoto: press,
          nameMaxLength: 40,
          description: 'Planning the coast',
          onDescriptionChange: set,
          descriptionMaxLength: 120,
          members: PEOPLE,
          onRemoveMember: set,
          onAddMembers: press,
          labels: { addMembers: 'Invite people' },
        }),
      ),
    bloom: () => (
      <NewGroupForm
        name="Weekend trip"
        onNameChange={set}
        photo={PHOTO}
        onPickPhoto={press}
        nameMaxLength={40}
        description="Planning the coast"
        onDescriptionChange={set}
        descriptionMaxLength={120}
        members={PEOPLE}
        onRemoveMember={set}
        onAddMembers={press}
        labels={{ addMembers: 'Invite people' }}
      />
    ),
  },
  {
    name: 'NewGroupForm rows of its own',
    language: () =>
      toElement(L.NewGroupForm(['Book club', set], { content: L.Text('Disappearing messages') })),
    bloom: () => (
      <NewGroupForm name="Book club" onNameChange={set}>
        <Text>Disappearing messages</Text>
      </NewGroupForm>
    ),
  },
];

export const CHAT_PEOPLE_CASES: ParityCase[] = [...stories, ...chips, ...groups];
