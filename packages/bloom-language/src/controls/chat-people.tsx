import {
  NewGroupForm as BloomNewGroupForm,
  type NewGroupFormProps,
  type PersonSummary,
  SelectedChipsRow as BloomSelectedChipsRow,
  type SelectedChipsRowProps,
  type StoryItem,
  StoryViewer as BloomStoryViewer,
  type StoryViewerProps,
} from '@oxy.so/bloom/chat-people';

import type { Binding } from '../binding';
import { type Child, Node, type ViewModifiers } from '../node';
import type { SelectedChipsLayout, SpaceToken } from '../tokens';
import type { ControlRenderer } from './draw';
import { product } from './product';

/** The people beside a conversation: stories, picked people and a new group. */
export type ChatPeopleKind = 'storyViewer' | 'selectedChipsRow' | 'newGroupForm';

type Drawn = 'style' | 'testID';

/**
 * Bloom `StoryViewer`'s data: its author, time, playback state, handlers and
 * words. A composer of the app's own is a language child; its height a space
 * token.
 */
export type StoryViewerOptions = Omit<
  StoryViewerProps,
  Drawn | 'stories' | 'index' | 'composer' | 'height'
> & { readonly composer?: Child; readonly height?: SpaceToken };
/** Bloom `SelectedChipsRow`'s handlers and words; what it shows with nobody picked is a language child. */
export type SelectedChipsRowOptions = Omit<
  SelectedChipsRowProps,
  Drawn | 'people' | 'layout' | 'emptyState'
> & { readonly emptyState?: Child };
/**
 * Bloom `NewGroupForm`'s data: its photo, description, members, handlers and
 * words; `content` is the rows it draws between the fields and the members
 * (Bloom's children).
 */
export type NewGroupFormOptions = Omit<
  NewGroupFormProps,
  Drawn | 'name' | 'onNameChange' | 'children'
> & { readonly content?: Child };

export type StoryViewerView = ViewModifiers<StoryViewerView>;
export interface SelectedChipsRowView extends ViewModifiers<SelectedChipsRowView> {
  /** `scroll` (default): one row that scrolls sideways; `wrap`: as many rows as it takes. */
  style(value: SelectedChipsLayout): SelectedChipsRowView;
}
export type NewGroupFormView = ViewModifiers<NewGroupFormView>;

/** Bloom `StoryViewer` of `stories`, showing the one at `index` (zero-based). */
export function StoryViewer(
  stories: readonly StoryItem[],
  index: number,
  options: StoryViewerOptions,
): StoryViewerView {
  return new Node('storyViewer', { stories, index, options }, []);
}
/** Bloom `SelectedChipsRow` of the `people` picked. */
export function SelectedChipsRow(
  people: readonly PersonSummary[],
  options: SelectedChipsRowOptions = {},
): SelectedChipsRowView {
  return new Node('selectedChipsRow', { people, options }, []);
}
/** Bloom `NewGroupForm`, writing the group's name its binding holds. */
export function NewGroupForm(
  name: Binding<string>,
  options: NewGroupFormOptions = {},
): NewGroupFormView {
  const { content, ...rest } = options;
  return new Node(
    'newGroupForm',
    { binding: name, options: rest },
    content === undefined ? [] : [content],
  );
}

export const CHAT_PEOPLE: Record<ChatPeopleKind, ControlRenderer> = {
  storyViewer: product(BloomStoryViewer, { slots: ['composer'], lengths: ['height'] }),
  selectedChipsRow: product(BloomSelectedChipsRow, {
    slots: ['emptyState'],
    own: (d) => ({ layout: d.own('style')?.value }),
  }),
  newGroupForm: product(BloomNewGroupForm, { binding: ['name', 'onNameChange'] }),
};
