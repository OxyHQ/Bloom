import React, { useContext, useMemo, useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { AttachmentMenu } from './AttachmentMenu';
import { ChatComposer } from './ChatComposer';
import { ComposerBanner } from './ComposerBanner';
import { ComposerIconButton } from './ComposerIconButton';
import { EmojiPicker } from './EmojiPicker';
import { MessageContextMenu } from './MessageContextMenu';
import { ReactionPicker } from './ReactionPicker';
import { SuggestionList } from './SuggestionList';
import { VoiceRecorder } from './VoiceRecorder';
import type {
  ChatComposerAttachment,
  ChatComposerSuggestion,
  EmojiGroup,
  MessageMenuItem,
} from './types';
import { RiAddLine } from '../icons/remix/RiAddLine';
import { RiCheckboxCircleLine } from '../icons/remix/RiCheckboxCircleLine';
import { RiCornerUpLeftLine } from '../icons/remix/RiCornerUpLeftLine';
import { RiDeleteBinLine } from '../icons/remix/RiDeleteBinLine';
import { RiFileCopyLine } from '../icons/remix/RiFileCopyLine';
import { RiListCheck3 } from '../icons/remix/RiListCheck3';
import { RiNotificationOffLine } from '../icons/remix/RiNotificationOffLine';
import { RiPencilLine } from '../icons/remix/RiPencilLine';
import { RiPushpinLine } from '../icons/remix/RiPushpinLine';
import { RiShareForwardLine } from '../icons/remix/RiShareForwardLine';
import { RiTimerLine } from '../icons/remix/RiTimerLine';
import { BloomThemeContext, BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';

const meta: Meta = {
  title: 'Blocks/Chat/Composer',
};

export default meta;

type Story = StoryObj;

// ---------------------------------------------------------------------------
//  Demo data — invented people, groups and files.
// ---------------------------------------------------------------------------

const PEOPLE: ChatComposerSuggestion[] = [
  { id: '1', label: 'Ana Restrepo', handle: '@ana', avatar: 'https://picsum.photos/seed/ana/80' },
  { id: '2', label: 'Marcel Dubé', handle: '@marcel', avatar: 'https://picsum.photos/seed/marcel/80' },
  { id: '3', label: 'Nour Haddad', handle: '@nour', description: 'Away until Thursday' },
  { id: '4', label: 'Ivo Brenner', handle: '@ivo' },
];

const COMMANDS: ChatComposerSuggestion[] = [
  { id: 'shrug', label: '/shrug', handle: '<message>', description: 'Append a shrug' },
  { id: 'remind', label: '/remind', handle: '<who> <what> <when>' },
  { id: 'poll', label: '/poll', handle: '<question>' },
];

const ATTACHMENTS: ChatComposerAttachment[] = [
  { id: 'a', name: 'harbour.jpg', source: 'https://picsum.photos/seed/harbour/200' },
  { id: 'b', name: 'lease.pdf', caption: '2.1 MB' },
  { id: 'c', name: 'roof.jpg', source: 'https://picsum.photos/seed/roof/200', progress: 62 },
];

/** A small invented dataset — Bloom ships none. */
const EMOJI: EmojiGroup[] = [
  {
    key: 'smileys',
    label: 'Smileys',
    emojis: [
      { char: '😀', name: 'grinning', keywords: ['smile', 'happy'] },
      { char: '😅', name: 'sweat smile', keywords: ['relief'] },
      { char: '😂', name: 'tears of joy', keywords: ['laugh'] },
      { char: '🙂', name: 'slight smile' },
      { char: '😍', name: 'heart eyes', keywords: ['love'] },
      { char: '🤔', name: 'thinking' },
      { char: '😴', name: 'sleeping', keywords: ['tired'] },
      { char: '🥳', name: 'partying', keywords: ['celebrate'] },
      { char: '😭', name: 'loudly crying', keywords: ['sad'] },
      { char: '😎', name: 'sunglasses', keywords: ['cool'] },
    ],
  },
  {
    key: 'people',
    label: 'People',
    emojis: [
      { char: '👋', name: 'wave', keywords: ['hello'] },
      { char: '👍', name: 'thumbs up', keywords: ['yes', 'ok'] },
      { char: '👏', name: 'clap' },
      { char: '🙏', name: 'folded hands', keywords: ['thanks'] },
      { char: '💪', name: 'flexed biceps' },
      { char: '🤝', name: 'handshake', keywords: ['deal'] },
    ],
  },
  {
    key: 'animals',
    label: 'Animals & nature',
    emojis: [
      { char: '🐝', name: 'bee' },
      { char: '🐳', name: 'whale' },
      { char: '🌿', name: 'herb', keywords: ['plant'] },
      { char: '🌻', name: 'sunflower' },
      { char: '🍀', name: 'clover', keywords: ['luck'] },
    ],
  },
  {
    key: 'food',
    label: 'Food & drink',
    emojis: [
      { char: '☕', name: 'coffee' },
      { char: '🍞', name: 'bread' },
      { char: '🍅', name: 'tomato' },
      { char: '🍰', name: 'cake', keywords: ['birthday'] },
      { char: '🥂', name: 'clinking glasses', keywords: ['cheers'] },
    ],
  },
  {
    key: 'activity',
    label: 'Activity',
    emojis: [
      { char: '⚽', name: 'football' },
      { char: '🎧', name: 'headphones', keywords: ['music'] },
      { char: '🎬', name: 'clapper', keywords: ['film'] },
      { char: '🏊', name: 'swimmer' },
    ],
  },
  {
    key: 'travel',
    label: 'Travel & places',
    emojis: [
      { char: '🚲', name: 'bicycle' },
      { char: '🚆', name: 'train' },
      { char: '🏝️', name: 'island' },
      { char: '🗺️', name: 'map' },
    ],
  },
  {
    key: 'objects',
    label: 'Objects',
    emojis: [
      { char: '💡', name: 'light bulb', keywords: ['idea'] },
      { char: '🔑', name: 'key' },
      { char: '📦', name: 'package', keywords: ['box'] },
      { char: '🧾', name: 'receipt' },
    ],
  },
  {
    key: 'symbols',
    label: 'Symbols',
    emojis: [
      { char: '❤️', name: 'red heart', keywords: ['love'] },
      { char: '✅', name: 'check mark', keywords: ['done'] },
      { char: '⚠️', name: 'warning' },
      { char: '🔁', name: 'repeat' },
    ],
  },
  {
    key: 'flags',
    label: 'Flags',
    emojis: [
      { char: '🏁', name: 'chequered flag' },
      { char: '🚩', name: 'triangular flag' },
      { char: '🏳️', name: 'white flag' },
    ],
  },
];

const MENU_ITEMS: MessageMenuItem[] = [
  { id: 'reply', label: 'Reply', icon: RiCornerUpLeftLine, shortcut: 'R' },
  { id: 'forward', label: 'Forward', icon: RiShareForwardLine },
  { id: 'copy', label: 'Copy', icon: RiFileCopyLine, shortcut: '⌘C' },
  { id: 'edit', label: 'Edit', icon: RiPencilLine },
  { id: 'pin', label: 'Pin', icon: RiPushpinLine },
  { id: 'select', label: 'Select', icon: RiListCheck3 },
  { id: 'delete', label: 'Delete', icon: RiDeleteBinLine, variant: 'destructive', separated: true },
];

const WAVE = Array.from({ length: 64 }, (_, i) =>
  0.2 + 0.8 * Math.abs(Math.sin(i * 0.7) * Math.cos(i * 0.21)),
);

// ---------------------------------------------------------------------------
//  Story chrome
// ---------------------------------------------------------------------------

function Caption({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <Text variant="caption-1-medium" style={{ color: theme.colors.textSecondary }}>
      {children}
    </Text>
  );
}

function Surface({ children, width }: { children: React.ReactNode; width?: number }) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexGrow: 1,
        paddingTop: 20,
        paddingBottom: 20,
        paddingLeft: 16,
        paddingRight: 16,
        gap: 20,
        backgroundColor: theme.colors.background,
      }}>
      <View style={{ width, maxWidth: '100%', gap: 20 }}>{children}</View>
    </View>
  );
}

/** The same block in both modes, side by side — every colour here flips. */
function BothModes({ children, width }: { children: React.ReactNode; width?: number }) {
  const preset = useContext(BloomThemeContext)?.colorPreset;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      <View style={{ minWidth: 360, flexGrow: 1, flexBasis: 360 }}>
        <BloomThemeProvider mode="light" colorPreset={preset}>
          <Surface width={width}>{children}</Surface>
        </BloomThemeProvider>
      </View>
      <View style={{ minWidth: 360, flexGrow: 1, flexBasis: 360 }}>
        <BloomThemeProvider mode="dark" colorPreset={preset}>
          <Surface width={width}>{children}</Surface>
        </BloomThemeProvider>
      </View>
    </View>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Caption>{title}</Caption>
      {children}
    </View>
  );
}

/** A mock incoming bubble, so the reaction bar and menu have something to sit over. */
function Bubble({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        maxWidth: 280,
        borderRadius: 18,
        borderBottomLeftRadius: 6,
        backgroundColor: theme.colors.backgroundSecondary,
        paddingTop: 8,
        paddingBottom: 8,
        paddingLeft: 12,
        paddingRight: 12,
      }}>
      <Text variant="body-regular" style={{ color: theme.colors.text }}>
        {children}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
//  Stories
// ---------------------------------------------------------------------------

/** Every composer state at a phone width, light and dark. */
export const States: Story = {
  render: function ComposerStates() {
    return (
      <BothModes width={390}>
        <Block title="empty — the mic is the right control">
          <ChatComposer onAttachPress={() => {}} onEmojiPress={() => {}} onMicPress={() => {}} />
        </Block>

        <Block title="typing — the send disc has swapped in">
          <ChatComposer
            defaultValue="Can you send the floor plan before Thursday?"
            onAttachPress={() => {}}
            onEmojiPress={() => {}}
            onMicPress={() => {}}
            onSend={() => {}}
          />
        </Block>

        <Block title="multi-line, camera button, keyboard hint">
          <ChatComposer
            defaultValue={'Three things:\n1. the lease\n2. the keys\n3. the meter readings'}
            onAttachPress={() => {}}
            onCameraPress={() => {}}
            onEmojiPress={() => {}}
            onSend={() => {}}
            showKeyboardHint
          />
        </Block>

        <Block title="reply banner">
          <ChatComposer
            defaultValue="On my way"
            banner={
              <ComposerBanner
                kind="reply"
                title="Ana Restrepo"
                preview="Are we still meeting at the harbour café?"
                onClose={() => {}}
              />
            }
            onAttachPress={() => {}}
            onEmojiPress={() => {}}
            onSend={() => {}}
          />
        </Block>

        <Block title="edit banner">
          <ChatComposer
            defaultValue="See you at seven"
            banner={<ComposerBanner kind="edit" title="Edit message" preview="See you at six" onClose={() => {}} />}
            onAttachPress={() => {}}
            onEmojiPress={() => {}}
            onSend={() => {}}
          />
        </Block>

        <Block title="forward banner with a thumbnail">
          <ChatComposer
            banner={
              <ComposerBanner
                kind="forward"
                title="Forward to Harbour crew"
                preview="1 photo"
                thumbnail="https://picsum.photos/seed/harbour/80"
                onClose={() => {}}
              />
            }
            onAttachPress={() => {}}
            onMicPress={() => {}}
          />
        </Block>

        <Block title="attachments — one still uploading">
          <ChatComposer
            attachments={ATTACHMENTS}
            onRemoveAttachment={() => {}}
            defaultValue="Everything from the viewing"
            onAttachPress={() => {}}
            onEmojiPress={() => {}}
            onSend={() => {}}
          />
        </Block>

        <Block title="slow mode and scheduled — the note banner">
          <ChatComposer
            banner={
              <View style={{ gap: 2 }}>
                <ComposerBanner kind="note" title="Slow mode: 12s" icon={RiTimerLine} />
                <ComposerBanner kind="note" title="Scheduled" preview="Tomorrow, 09:00" onClose={() => {}} />
              </View>
            }
            defaultValue="Morning all"
            onAttachPress={() => {}}
            onSend={() => {}}
          />
        </Block>

        <Block title="disabled">
          <ChatComposer defaultValue="Draft kept" disabled onAttachPress={() => {}} onSend={() => {}} />
        </Block>

        <Block title="read-only notices">
          <ChatComposer notice="You can't send messages in this group" />
          <ChatComposer notice="Channel muted" noticeIcon={RiNotificationOffLine} />
        </Block>
      </BothModes>
    );
  },
};

/** The composer on a wide column, where the bar stretches and the field does not. */
export const Wide: Story = {
  render: function ComposerWide() {
    return (
      <BothModes width={900}>
        <Block title="900 — empty">
          <ChatComposer onAttachPress={() => {}} onEmojiPress={() => {}} onMicPress={() => {}} />
        </Block>
        <Block title="900 — reply, attachments, hint">
          <ChatComposer
            defaultValue="Sending the three photos from the roof inspection now."
            banner={
              <ComposerBanner
                kind="reply"
                title="Ivo Brenner"
                preview="Did the surveyor send anything yet?"
                onClose={() => {}}
              />
            }
            attachments={ATTACHMENTS}
            onRemoveAttachment={() => {}}
            onAttachPress={() => {}}
            onCameraPress={() => {}}
            onEmojiPress={() => {}}
            onSend={() => {}}
            showKeyboardHint
          />
        </Block>
        <Block title="900 — recording, locked">
          <VoiceRecorder state="locked" seconds={38} amplitudes={WAVE} onCancel={() => {}} onSend={() => {}} />
        </Block>
      </BothModes>
    );
  },
};

/** Arrow keys move the highlight; the list is the same part for all three kinds. */
export const Suggestions: Story = {
  render: function ComposerSuggestions() {
    const Demo = () => {
      const [index, setIndex] = useState(1);
      return (
        <View style={{ gap: 20 }}>
          <Block title="mentions — press ↑ / ↓ / Enter in the field">
            <ChatComposer
              defaultValue="Ping @ma"
              suggestions={PEOPLE}
              suggestionKind="mention"
              activeIndex={index}
              onActiveIndexChange={setIndex}
              onSelectSuggestion={() => {}}
              onAttachPress={() => {}}
              onSend={() => {}}
            />
          </Block>
          <Block title="slash commands">
            <SuggestionList kind="command" suggestions={COMMANDS} activeIndex={0} header="Commands" />
          </Block>
          <Block title="emoji shortcodes">
            <SuggestionList
              kind="emoji"
              suggestions={[
                { id: '1', label: ':smile:', emoji: '😄' },
                { id: '2', label: ':sweat_smile:', emoji: '😅' },
                { id: '3', label: ':smirk:', emoji: '😏' },
              ]}
              activeIndex={0}
            />
          </Block>
        </View>
      );
    };
    return (
      <BothModes width={390}>
        <Demo />
      </BothModes>
    );
  },
};

/** The three recorder states, plus the composer with a recorder in its slot. */
export const Recorder: Story = {
  render: function ComposerRecorder() {
    return (
      <BothModes width={390}>
        <Block title="recording — slide to cancel (native) and the lock">
          <VoiceRecorder
            state="recording"
            seconds={7}
            amplitudes={WAVE.slice(0, 20)}
            slideToCancel
            onCancel={() => {}}
            onLock={() => {}}
          />
        </Block>
        <Block title="recording — pointer: an explicit cancel">
          <VoiceRecorder
            state="recording"
            seconds={7}
            amplitudes={WAVE.slice(0, 20)}
            slideToCancel={false}
            onCancel={() => {}}
            onLock={() => {}}
          />
        </Block>
        <Block title="locked — hands free">
          <VoiceRecorder state="locked" seconds={64} amplitudes={WAVE} onCancel={() => {}} onSend={() => {}} />
        </Block>
        <Block title="preview — play it back, delete or send">
          <VoiceRecorder
            state="preview"
            seconds={12}
            duration={41}
            amplitudes={WAVE}
            onPlayToggle={() => {}}
            onDelete={() => {}}
            onSend={() => {}}
          />
        </Block>
        <Block title="preview, playing">
          <VoiceRecorder
            state="preview"
            seconds={28}
            duration={41}
            amplitudes={WAVE}
            playing
            onPlayToggle={() => {}}
            onDelete={() => {}}
            onSend={() => {}}
          />
        </Block>
        <Block title="in the composer's `recorder` slot">
          <ChatComposer
            recorder={
              <VoiceRecorder state="recording" seconds={3} amplitudes={WAVE.slice(0, 8)} onCancel={() => {}} onLock={() => {}} />
            }
          />
        </Block>
      </BothModes>
    );
  },
};

/** The plus menu, open, in both layouts. */
export const Attachments: Story = {
  render: function ComposerAttachments() {
    const Demo = () => {
      const [grid, setGrid] = useState(true);
      const [list, setList] = useState(true);
      return (
        <View style={{ gap: 460, paddingTop: 230 }}>
          <View>
            <ChatComposer
              leading={
                <AttachmentMenu open={grid} onOpenChange={setGrid} onSelect={() => {}}>
                  <ComposerIconButton icon={RiAddLine} accessibilityLabel="Attach" iconSize={22} />
                </AttachmentMenu>
              }
              onEmojiPress={() => {}}
              onMicPress={() => {}}
            />
            <Caption>grid (default) — the panel opens upward from the plus</Caption>
          </View>
          <View>
            <ChatComposer
              leading={
                <AttachmentMenu
                  open={list}
                  onOpenChange={setList}
                  layout="list"
                  onSelect={() => {}}
                  recent={
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {['a', 'b', 'c'].map((seed) => (
                        <View
                          key={seed}
                          style={{
                            width: 56,
                            height: 56,
                            borderRadius: 12,
                            overflow: 'hidden',
                          }}>
                          <View
                            style={{
                              flexGrow: 1,
                              backgroundColor: '#8884',
                            }}
                          />
                        </View>
                      ))}
                    </View>
                  }>
                  <ComposerIconButton icon={RiAddLine} accessibilityLabel="Attach" iconSize={22} />
                </AttachmentMenu>
              }
              onMicPress={() => {}}
            />
            <Caption>list layout, with a recent-gallery strip at the top</Caption>
          </View>
        </View>
      );
    };
    return (
      <BothModes width={390}>
        <Demo />
      </BothModes>
    );
  },
};

/** The picker over a supplied dataset — Bloom ships none. */
export const Emoji: Story = {
  render: function ComposerEmoji() {
    const Demo = () => {
      const [picked, setPicked] = useState<string[]>([]);
      const frequent = useMemo(() => ['👍', '😂', '❤️', '🙏', '🎉', '👀'], []);
      return (
        <View style={{ gap: 12 }}>
          <Block title="picker — search matches name and keywords">
            <EmojiPicker
              groups={EMOJI}
              frequentlyUsed={frequent}
              onSelectEmoji={(char) => setPicked((prev) => [...prev, char])}
              tabs={[
                {
                  key: 'stickers',
                  label: 'Stickers',
                  content: (
                    <View style={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}>
                      <Caption>Your sticker packs render here</Caption>
                    </View>
                  ),
                },
                {
                  key: 'gifs',
                  label: 'GIFs',
                  content: (
                    <View style={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}>
                      <Caption>Your GIF search renders here</Caption>
                    </View>
                  ),
                },
              ]}
            />
          </Block>
          <Caption>{picked.length ? `Picked: ${picked.join(' ')}` : 'Pick something'}</Caption>
        </View>
      );
    };
    return (
      <BothModes width={390}>
        <Demo />
      </BothModes>
    );
  },
};

/** The quick bar and the full menu, over a mock bubble. */
export const Reactions: Story = {
  render: function ComposerReactions() {
    const Demo = () => {
      const [open, setOpen] = useState(true);
      const [reaction, setReaction] = useState<string | undefined>('👍');
      return (
        <View style={{ gap: 24 }}>
          <Block title="quick bar over a message">
            <View style={{ gap: 6 }}>
              <ReactionPicker selected={reaction} onSelectEmoji={setReaction} onMorePress={() => {}} />
              <Bubble>The surveyor can come Tuesday morning — does that work?</Bubble>
            </View>
          </Block>

          <Block title="small bar, no surface, with a confirmation glyph">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ReactionPicker size="small" surface={false} emojis={['👍', '❤️', '😂']} onSelectEmoji={() => {}} />
              <RiCheckboxCircleLine width={18} height={18} fill="#8a8a8a" />
            </View>
          </Block>

          <Block title="a closed menu — press the bubble to open it">
            <MessageContextMenu
              items={MENU_ITEMS.slice(0, 4)}
              reactions={false}
              onSelect={() => {}}>
              <View>
                <Bubble>Channels where reactions are off.</Bubble>
              </View>
            </MessageContextMenu>
          </Block>

          <Block title="context menu, open (a sheet on native)">
            <MessageContextMenu
              open={open}
              onOpenChange={setOpen}
              items={MENU_ITEMS}
              selectedReaction={reaction}
              onSelectReaction={setReaction}
              onMoreReactions={() => {}}
              onSelect={() => {}}>
              <View>
                <Bubble>Long-press me on a phone, right-click me on a pointer.</Bubble>
              </View>
            </MessageContextMenu>
          </Block>
          <View style={{ height: 360 }} />
        </View>
      );
    };
    return (
      <BothModes width={390}>
        <Demo />
      </BothModes>
    );
  },
};
