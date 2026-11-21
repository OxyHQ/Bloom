import { Button } from '@oxy.so/bloom/button';
import {
  AttachmentMenu,
  ChatComposer,
  CompactComposer,
  ComposerBanner,
  ComposerIconButton,
  EmojiPicker,
  MessageContextMenu,
  ReactionPicker,
  SuggestionList,
  VoiceRecorder,
} from '@oxy.so/bloom/chat-composer';
import { RiAttachmentLine, RiImageLine, RiMicLine } from '@oxy.so/bloom/icons';
import { Text } from '@oxy.so/bloom/typography';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import { type ParityCase, Themed } from './support/cases';

const set = () => {};
const press = () => {};
const SUGGESTIONS = [
  { id: 'ana', label: 'Ana Lima', handle: 'ana', verified: true },
  { id: 'bo', label: 'Bo Chen', handle: 'bo', description: 'Design' },
];
const ATTACHMENTS = [
  { id: 'a', name: 'notes.pdf', progress: 0.4 },
  { id: 'b', name: 'photo.jpg', source: 'https://cdn.oxy.so/p.jpg' },
];
const GROUPS = [
  { key: 'smileys', label: 'Smileys', emojis: ['😀', '😂', '🙂'] },
  { key: 'food', label: 'Food', emojis: ['🍎', '🍕'] },
];
const MENU = [
  { id: 'reply', label: 'Reply' },
  { id: 'copy', label: 'Copy', shortcut: '⌘C' },
  { id: 'delete', label: 'Delete', variant: 'destructive' as const, separated: true },
];
const ITEMS = [
  { id: 'photo', label: 'Photo', icon: RiImageLine },
  { id: 'file', label: 'File', icon: RiAttachmentLine, disabled: true },
];

const composers: ParityCase[] = [
  {
    name: 'ChatComposer',
    language: () => toElement(L.ChatComposer(['', set])),
    bloom: () => <ChatComposer value="" onValueChange={set} />,
  },
  {
    name: 'ChatComposer with text, its handlers and a placeholder',
    language: () =>
      toElement(
        L.ChatComposer(['Hello', set], {
          placeholder: 'Message',
          onSend: set,
          onAttachPress: press,
          onEmojiPress: press,
          onCameraPress: press,
          onMicPress: press,
          sendOn: 'mod-enter',
          showKeyboardHint: true,
        }),
      ),
    bloom: () => (
      <ChatComposer
        value="Hello"
        onValueChange={set}
        placeholder="Message"
        onSend={set}
        onAttachPress={press}
        onEmojiPress={press}
        onCameraPress={press}
        onMicPress={press}
        sendOn="mod-enter"
        showKeyboardHint
      />
    ),
  },
  {
    name: 'ChatComposer disabled, with a notice',
    language: () =>
      toElement(L.ChatComposer(['', set], { notice: L.Text('You can’t reply here') }).disabled()),
    bloom: () => (
      <ChatComposer
        value=""
        onValueChange={set}
        disabled
        notice={<Text>You can’t reply here</Text>}
      />
    ),
  },
  {
    name: 'ChatComposer with a banner, attachments and suggestions',
    language: () =>
      toElement(
        L.ChatComposer(['@a', set], {
          banner: L.ComposerBanner('reply', 'Ana Lima', { preview: 'See you' }),
          attachments: ATTACHMENTS,
          onRemoveAttachment: set,
          suggestions: SUGGESTIONS,
          suggestionKind: 'mention',
        }),
      ),
    bloom: () => (
      <ChatComposer
        value="@a"
        onValueChange={set}
        banner={<ComposerBanner kind="reply" title="Ana Lima" preview="See you" />}
        attachments={ATTACHMENTS}
        onRemoveAttachment={set}
        suggestions={SUGGESTIONS}
        suggestionKind="mention"
      />
    ),
  },
  {
    name: 'CompactComposer',
    language: () =>
      toElement(
        L.CompactComposer(['Nice', set], {
          maxLength: 280,
          onSubmit: press,
          placeholder: 'Reply',
          onExpand: press,
        }),
      ),
    bloom: () => (
      <CompactComposer
        value="Nice"
        onChangeText={set}
        maxLength={280}
        onSubmit={press}
        placeholder="Reply"
        onExpand={press}
      />
    ),
  },
  {
    name: 'CompactComposer disabled, busy, with an avatar and actions',
    language: () =>
      toElement(
        L.CompactComposer(['', set], {
          maxLength: 10,
          onSubmit: press,
          busy: true,
          avatar: L.Avatar(null, { name: 'Ana Lima' }),
          attachmentActions: [{ id: 'img', icon: RiImageLine, label: 'Image', onPress: press }],
        }).disabled(),
      ),
    bloom: () => (
      <CompactComposer
        value=""
        onChangeText={set}
        maxLength={10}
        onSubmit={press}
        busy
        disabled
        avatar={toElement(L.Avatar(null, { name: 'Ana Lima' }))}
        attachmentActions={[{ id: 'img', icon: RiImageLine, label: 'Image', onPress: press }]}
      />
    ),
  },
];

const parts: ParityCase[] = [
  ...(['reply', 'edit', 'forward', 'note'] as const).map((kind) => ({
    name: `ComposerBanner ${kind}`,
    language: () =>
      toElement(L.ComposerBanner(kind, 'Ana Lima', { preview: 'See you', onClose: press })),
    bloom: () => <ComposerBanner kind={kind} title="Ana Lima" preview="See you" onClose={press} />,
  })),
  {
    name: 'ComposerBanner tinted, with a thumbnail',
    language: () =>
      toElement(
        L.ComposerBanner('reply', 'Photo', { thumbnail: 'https://cdn.oxy.so/p.jpg' }).tint(
          'success',
        ),
      ),
    bloom: () => (
      <Themed>
        {(c) => (
          <ComposerBanner
            kind="reply"
            title="Photo"
            thumbnail="https://cdn.oxy.so/p.jpg"
            accentColor={c.success}
          />
        )}
      </Themed>
    ),
  },
  {
    name: 'ComposerIconButton',
    language: () => toElement(L.ComposerIconButton(RiMicLine, 'Record').onPress(press)),
    bloom: () => (
      <ComposerIconButton icon={RiMicLine} accessibilityLabel="Record" onPress={press} />
    ),
  },
  ...ENUMS.composerButtonTone.map((tone) => ({
    name: `ComposerIconButton ${tone}, sized, disabled`,
    language: () =>
      toElement(
        L.ComposerIconButton(RiMicLine, 'Record')
          .tint(tone)
          .size('4xl')
          .iconSize('lg')
          .disabled()
          .onPress(press),
      ),
    bloom: () => (
      <ComposerIconButton
        icon={RiMicLine}
        accessibilityLabel="Record"
        tone={tone}
        size={40}
        iconSize={24}
        disabled
        onPress={press}
      />
    ),
  })),
  ...(['mention', 'command', 'emoji'] as const).map((kind) => ({
    name: `SuggestionList ${kind}`,
    language: () => toElement(L.SuggestionList(kind, SUGGESTIONS, { header: 'People' })),
    bloom: () => <SuggestionList kind={kind} suggestions={SUGGESTIONS} header="People" />,
  })),
  ...(['sm', 'md', 'lg'] as const).map((size) => ({
    name: `SuggestionList ${size}, loading`,
    language: () =>
      toElement(
        L.SuggestionList('command', [], { showEmpty: true, maxHeight: '3xl' }).size(size).loading(),
      ),
    bloom: () => (
      <SuggestionList
        kind="command"
        suggestions={[]}
        showEmpty
        maxHeight={32}
        size={size}
        loading
      />
    ),
  })),
  ...(['recording', 'locked', 'preview'] as const).map((state) => ({
    name: `VoiceRecorder ${state}`,
    language: () =>
      toElement(
        L.VoiceRecorder(state, 12, {
          duration: 30,
          amplitudes: [0.2, 0.6, 0.4],
          onCancel: press,
          onSend: press,
        }),
      ),
    bloom: () => (
      <VoiceRecorder
        state={state}
        seconds={12}
        duration={30}
        amplitudes={[0.2, 0.6, 0.4]}
        onCancel={press}
        onSend={press}
      />
    ),
  })),
];

const pickers: ParityCase[] = [
  ...ENUMS.attachmentLayout.map((layout) => ({
    name: `AttachmentMenu ${layout}, open`,
    language: () =>
      toElement(
        L.AttachmentMenu(L.Button(L.Text('Attach')).onPress(press), {
          open: true,
          items: ITEMS,
          onSelect: set,
          label: 'Attach',
        })
          .style(layout)
          .columns(2),
      ),
    bloom: () => (
      <AttachmentMenu open items={ITEMS} onSelect={set} label="Attach" layout={layout} columns={2}>
        <Button onPress={press}>Attach</Button>
      </AttachmentMenu>
    ),
  })),
  {
    name: 'EmojiPicker',
    language: () => toElement(L.EmojiPicker(GROUPS, { onSelectEmoji: set })),
    bloom: () => <EmojiPicker groups={GROUPS} onSelectEmoji={set} />,
  },
  ...(['sm', 'md', 'lg'] as const).map((size) => ({
    name: `EmojiPicker ${size}, searched, a height`,
    language: () =>
      toElement(
        L.EmojiPicker(GROUPS, { query: 'app', frequentlyUsed: ['👍'], height: '3xl' }).size(size),
      ),
    bloom: () => (
      <EmojiPicker groups={GROUPS} query="app" frequentlyUsed={['👍']} height={32} size={size} />
    ),
  })),
  {
    name: 'ReactionPicker',
    language: () => toElement(L.ReactionPicker()),
    bloom: () => <ReactionPicker />,
  },
  ...ENUMS.reactionPickerSize.map((size) => ({
    name: `ReactionPicker ${size}, no surface`,
    language: () =>
      toElement(
        L.ReactionPicker(['❤️', '👍'], { selected: '👍', onMorePress: press })
          .size(size)
          .surface(false),
      ),
    bloom: () => (
      <ReactionPicker
        emojis={['❤️', '👍']}
        selected="👍"
        onMorePress={press}
        size={size}
        surface={false}
      />
    ),
  })),
  {
    name: 'MessageContextMenu, closed',
    language: () => toElement(L.MessageContextMenu(L.Text('Hello'), MENU, { onSelect: set })),
    bloom: () => (
      <MessageContextMenu items={MENU} onSelect={set}>
        <Text>Hello</Text>
      </MessageContextMenu>
    ),
  },
  {
    name: 'MessageContextMenu, open with reactions',
    language: () =>
      toElement(
        L.MessageContextMenu(L.Text('Hello'), MENU, {
          open: true,
          onSelect: set,
          reactions: ['❤️', '👍'],
          selectedReaction: '❤️',
        }),
      ),
    bloom: () => (
      <MessageContextMenu
        open
        items={MENU}
        onSelect={set}
        reactions={['❤️', '👍']}
        selectedReaction="❤️"
      >
        <Text>Hello</Text>
      </MessageContextMenu>
    ),
  },
];

export const CHAT_COMPOSER_CASES: ParityCase[] = [...composers, ...parts, ...pickers];
