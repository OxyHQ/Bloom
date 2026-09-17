import React, { useContext, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { BloomThemeContext, BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { ContactMessage } from './ContactMessage';
import { DocumentGrid } from './DocumentGrid';
import { FileMessage } from './FileMessage';
import { GifMessage } from './GifMessage';
import { ImageMessage } from './ImageMessage';
import { LinkPreviewMessage } from './LinkPreviewMessage';
import { LocationMessage } from './LocationMessage';
import { MediaAlbum } from './MediaAlbum';
import { PollMessage } from './PollMessage';
import { SharedMediaGrid } from './SharedMediaGrid';
import { StickerMessage } from './StickerMessage';
import { VideoMessage } from './VideoMessage';
import { VoiceMessage } from './VoiceMessage';
import { resolveBubbleColor, MESSAGE_MEDIA_RADIUS } from './shared';
import type { MessageTone, VoicePlaybackRate } from './types';

const meta: Meta = {
  title: 'Blocks/Chat/Message Media',
};

export default meta;
type Story = StoryObj;

// ---------------------------------------------------------------------------
//  Demo data — invented people, places and files.
// ---------------------------------------------------------------------------

const PHOTOS = [
  'https://picsum.photos/seed/bloom-harbour/640/480',
  'https://picsum.photos/seed/bloom-orchard/640/640',
  'https://picsum.photos/seed/bloom-terrace/640/800',
  'https://picsum.photos/seed/bloom-rooftop/640/420',
  'https://picsum.photos/seed/bloom-canal/640/520',
  'https://picsum.photos/seed/bloom-market/640/600',
  'https://picsum.photos/seed/bloom-dunes/640/460',
  'https://picsum.photos/seed/bloom-attic/640/700',
  'https://picsum.photos/seed/bloom-ferry/640/540',
  'https://picsum.photos/seed/bloom-garden/640/620',
  'https://picsum.photos/seed/bloom-lantern/640/580',
  'https://picsum.photos/seed/bloom-quay/640/440',
] as const;

/** Indexed access under `noUncheckedIndexedAccess`, wrapping at the end. */
function photo(index: number): string {
  return PHOTOS[index % PHOTOS.length] ?? PHOTOS[0];
}

const STICKER =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd166"/><stop offset="1" stop-color="#ef476f"/></linearGradient></defs><circle cx="60" cy="60" r="46" fill="url(#g)"/><circle cx="45" cy="50" r="6" fill="#2b2b2b"/><circle cx="75" cy="50" r="6" fill="#2b2b2b"/><path d="M40 72c6 10 34 10 40 0" stroke="#2b2b2b" stroke-width="6" fill="none" stroke-linecap="round"/></svg>`,
  );

/** A believable voice-note envelope: quiet edges, two louder phrases. */
const SAMPLES = Array.from({ length: 64 }, (_, i) => {
  const phrase = Math.sin((i / 64) * Math.PI * 3) ** 2;
  const grain = ((i * 37) % 13) / 24;
  return Math.min(1, 0.12 + phrase * 0.7 + grain * 0.3);
});

const DOCS = [
  { id: 'd1', name: 'Tenancy agreement.pdf', sizeBytes: 2.44 * 1024 * 1024, metaLabel: 'Yesterday' },
  { id: 'd2', name: 'Quarterly rents.xlsx', sizeBytes: 812 * 1024, metaLabel: 'Monday' },
  { id: 'd3', name: 'Handover photos.zip', sizeBytes: 148.6 * 1024 * 1024, metaLabel: '12 Aug' },
  { id: 'd4', name: 'Doorbell chime.m4a', sizeBytes: 640 * 1024, metaLabel: '9 Aug' },
  { id: 'd5', name: 'Move-in checklist.docx', sizeBytes: 96 * 1024, metaLabel: '2 Aug' },
];

// ---------------------------------------------------------------------------
//  Harness
// ---------------------------------------------------------------------------

/**
 * A MINIMAL local bubble.
 *
 * `message-bubble` (the shell, grouping, meta row and reactions) is another
 * agent's family and was not on `main` when these stories were written, so this
 * stands in for its `media` slot: the fill, the radius and the on-colour a block
 * is handed. Nothing in `message-media` renders it — that is the point of the
 * split — and these stories should switch to the real shell once it lands.
 */
function Bubble({
  tone,
  children,
  bare = false,
  inset = true,
}: {
  tone: MessageTone;
  children: React.ReactNode;
  bare?: boolean;
  inset?: boolean;
}) {
  const theme = useTheme();
  const fill = resolveBubbleColor(theme, tone);
  return (
    <View style={{ alignItems: tone === 'outgoing' ? 'flex-end' : 'flex-start' }}>
      <View
        style={{
          backgroundColor: bare ? 'transparent' : fill,
          borderRadius: MESSAGE_MEDIA_RADIUS + 4,
          paddingTop: bare || !inset ? 0 : 10,
          paddingBottom: bare || !inset ? 0 : 10,
          paddingLeft: bare || !inset ? 0 : 10,
          paddingRight: bare || !inset ? 0 : 10,
        }}
      >
        {children}
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

function Surface({ children, width }: { children: React.ReactNode; width?: number }) {
  const theme = useTheme();
  return (
    <View
      style={{
        width,
        flexGrow: 1,
        padding: 20,
        gap: 20,
        backgroundColor: theme.colors.background,
      }}
    >
      {children}
    </View>
  );
}

/** The same block in both modes. The ambient preset is forwarded. */
function BothModes({ children, width }: { children: React.ReactNode; width?: number }) {
  const preset = useContext(BloomThemeContext)?.colorPreset;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      <View style={{ minWidth: 340, flexGrow: 1, flexBasis: 360 }}>
        <BloomThemeProvider mode="light" colorPreset={preset}>
          <Surface width={width}>{children}</Surface>
        </BloomThemeProvider>
      </View>
      <View style={{ minWidth: 340, flexGrow: 1, flexBasis: 360 }}>
        <BloomThemeProvider mode="dark" colorPreset={preset}>
          <Surface width={width}>{children}</Surface>
        </BloomThemeProvider>
      </View>
    </View>
  );
}

/** One block drawn on BOTH bubbles, which is the contract every block here has. */
function BothTones({
  title,
  render,
}: {
  title: string;
  render: (tone: MessageTone) => React.ReactNode;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Caption>{title}</Caption>
      <View style={{ gap: 10 }}>
        <Bubble tone="incoming">{render('incoming')}</Bubble>
        <Bubble tone="outgoing">{render('outgoing')}</Bubble>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
//  Stories
// ---------------------------------------------------------------------------

/** Every block, on both bubbles, in both modes. */
export const Matrix: Story = {
  render: function MessageMediaMatrix() {
    return (
      <BothModes>
        <BothTones
          title="photo — 4:3, rounded 16"
          render={(tone) => (
            <ImageMessage tone={tone} source={photo(0)} aspectRatio={4 / 3} onPress={() => {}} />
          )}
        />
        <BothTones
          title="video — poster, duration pill, centred play"
          render={(tone) => (
            <VideoMessage
              tone={tone}
              source={photo(3)}
              duration={187}
              sizeBytes={24.6 * 1024 * 1024}
              onPress={() => {}}
            />
          )}
        />
        <BothTones
          title="voice — waveform, speed, transcript"
          render={(tone) => (
            <VoiceMessage
              tone={tone}
              samples={SAMPLES}
              duration={14}
              position={5}
              rate={1}
              onRateChange={() => {}}
              onSeek={() => {}}
              onPlayPress={() => {}}
              transcript="Left the keys with the neighbour on the second floor."
            />
          )}
        />
        <BothTones
          title="file — kind disc, size · type, download"
          render={(tone) => (
            <FileMessage
              tone={tone}
              name="Tenancy agreement.pdf"
              sizeBytes={2.44 * 1024 * 1024}
              onDownload={() => {}}
              onPress={() => {}}
            />
          )}
        />
        <BothTones
          title="location — placeholder map, address"
          render={(tone) => (
            <LocationMessage
              tone={tone}
              title="Casa del Puerto"
              address="Carrer de la Marina 118, Vila Nova"
              onPress={() => {}}
            />
          )}
        />
        <BothTones
          title="contact — avatar, handle, two actions"
          render={(tone) => (
            <ContactMessage
              tone={tone}
              name="Marta Ferreira"
              detail="+34 600 11 22 33"
              onMessage={() => {}}
              onAdd={() => {}}
            />
          )}
        />
        <BothTones
          title="link preview — accent rule, no nested card"
          render={(tone) => (
            <LinkPreviewMessage
              tone={tone}
              url="https://example.invalid/guides/moving-in"
              siteName="Vila Nova Guide"
              title="What to check before you sign a lease"
              description="Damp, meters, deposits and the eleven things a walkthrough should cover."
              image={photo(5)}
            />
          )}
        />
        <BothTones
          title="gif — pill, capped at 220"
          render={(tone) => (
            <GifMessage tone={tone} source={photo(6)} aspectRatio={1.6} onPress={() => {}} />
          )}
        />
      </BothModes>
    );
  },
};

/** The packed grid at every count it supports. */
export const AlbumMatrix: Story = {
  render: function AlbumMatrixStory() {
    const counts = [2, 3, 4, 5, 6, 7, 8, 9, 10, 14];
    return (
      <BothModes>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 20 }}>
          {counts.map((count) => (
            <View key={count} style={{ gap: 8 }}>
              <Caption>{count === 14 ? '14 → 10 tiles + "+4"' : `${count} items`}</Caption>
              <Bubble tone={count % 2 === 0 ? 'incoming' : 'outgoing'}>
                <MediaAlbum
                  tone={count % 2 === 0 ? 'incoming' : 'outgoing'}
                  width={240}
                  items={Array.from({ length: count }, (_, i) => ({
                    id: `p${i}`,
                    source: photo(i),
                    kind: i === 1 ? ('video' as const) : ('image' as const),
                    duration: i === 1 ? 48 : undefined,
                  }))}
                  onPress={() => {}}
                />
              </Bubble>
            </View>
          ))}
        </View>
      </BothModes>
    );
  },
};

/** Sending, progress and failure, on every block that can be in flight. */
export const SendingAndFailed: Story = {
  render: function SendingStory() {
    return (
      <BothModes>
        <View style={{ gap: 16 }}>
          <Caption>indeterminate → 38% → failed</Caption>
          <Bubble tone="outgoing">
            <ImageMessage tone="outgoing" source={photo(1)} state="sending" onCancel={() => {}} />
          </Bubble>
          <Bubble tone="outgoing">
            <ImageMessage
              tone="outgoing"
              source={photo(2)}
              state="sending"
              progress={0.38}
              onCancel={() => {}}
            />
          </Bubble>
          <Bubble tone="outgoing">
            <ImageMessage tone="outgoing" source={photo(4)} state="failed" onRetry={() => {}} />
          </Bubble>
          <Bubble tone="outgoing">
            <MediaAlbum
              tone="outgoing"
              width={240}
              state="sending"
              progress={0.62}
              onCancel={() => {}}
              items={PHOTOS.slice(0, 4).map((source, i) => ({ id: `s${i}`, source }))}
            />
          </Bubble>
          <Bubble tone="incoming">
            <FileMessage
              name="Handover photos.zip"
              sizeBytes={148.6 * 1024 * 1024}
              transfer="downloading"
              progress={0.44}
              onCancel={() => {}}
            />
          </Bubble>
          <Bubble tone="incoming">
            <FileMessage
              name="Move-in checklist.docx"
              sizeBytes={96 * 1024}
              transfer="done"
            />
          </Bubble>
        </View>
      </BothModes>
    );
  },
};

/** A voice note that actually plays, so the waveform and the clock can be watched. */
export const VoicePlayback: Story = {
  render: function VoicePlaybackStory() {
    return (
      <BothModes>
        <FakePlayback tone="incoming" />
        <FakePlayback tone="outgoing" />
      </BothModes>
    );
  },
};

function FakePlayback({ tone }: { tone: MessageTone }) {
  const duration = 14;
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [rate, setRate] = useState<VoicePlaybackRate>(1);
  const rateRef = useRef(rate);
  rateRef.current = rate;

  useEffect(() => {
    if (!playing) return undefined;
    const id = setInterval(() => {
      setPosition((current) => {
        const next = current + 0.1 * rateRef.current;
        if (next >= duration) {
          setPlaying(false);
          return duration;
        }
        return next;
      });
    }, 100);
    return () => clearInterval(id);
  }, [playing]);

  return (
    <Bubble tone={tone}>
      <VoiceMessage
        tone={tone}
        samples={SAMPLES}
        duration={duration}
        position={position}
        playing={playing}
        unplayed={position === 0}
        rate={rate}
        onRateChange={setRate}
        onPlayPress={() => setPlaying((p) => !p)}
        onSeek={setPosition}
        transcript="Left the keys with the neighbour on the second floor — the one with the blue door."
      />
    </Bubble>
  );
}

/** Single, multiple, quiz and anonymous, before and after voting. */
export const Polls: Story = {
  render: function PollsStory() {
    const base = [
      { id: 'a', label: 'Saturday morning', votes: 14 },
      { id: 'b', label: 'Saturday afternoon', votes: 9 },
      { id: 'c', label: 'Sunday, any time', votes: 8 },
    ];
    return (
      <BothModes>
        <View style={{ gap: 16 }}>
          <Caption>single, not yet voted</Caption>
          <Bubble tone="incoming">
            <PollMessage question="When should we do the handover?" options={base} />
          </Bubble>

          <Caption>single, voted — results</Caption>
          <Bubble tone="outgoing">
            <PollMessage
              tone="outgoing"
              question="When should we do the handover?"
              options={base.map((o) => ({ ...o, selected: o.id === 'b' }))}
              voted
              onViewResults={() => {}}
            />
          </Bubble>

          <Caption>multiple + anonymous</Caption>
          <Bubble tone="incoming">
            <PollMessage
              question="Which rooms still need a coat of paint?"
              multiple
              anonymous
              onVote={() => {}}
              options={[
                { id: 'k', label: 'Kitchen', votes: 6 },
                { id: 'h', label: 'Hallway', votes: 11 },
                { id: 'b2', label: 'Back bedroom', votes: 3 },
              ]}
            />
          </Bubble>

          <Caption>quiz — answered wrong</Caption>
          <Bubble tone="incoming">
            <PollMessage
              question="How much notice does a landlord owe on a rent review?"
              quiz
              voted
              options={[
                { id: 'q1', label: 'One month', votes: 4, selected: true },
                { id: 'q2', label: 'Two months', votes: 17, correct: true },
                { id: 'q3', label: 'No notice at all', votes: 1 },
              ]}
            />
          </Bubble>
        </View>
      </BothModes>
    );
  },
};

/** Spoiler, sticker, round video note and live location. */
export const SpoilerStickerNoteAndLive: Story = {
  render: function SpecialsStory() {
    return (
      <BothModes>
        <View style={{ gap: 16 }}>
          <Caption>spoiler — press to reveal</Caption>
          <Bubble tone="incoming">
            <ImageMessage source={photo(7)} spoiler aspectRatio={1.2} onPress={() => {}} />
          </Bubble>

          <Caption>sticker — no bubble at all (bare)</Caption>
          <Bubble tone="outgoing" bare>
            <StickerMessage source={STICKER} accessibilityLabel="Sticker: grinning sun" />
          </Bubble>

          <Caption>round video note — ring is the position</Caption>
          <Bubble tone="incoming" bare>
            <VideoMessage
              source={photo(8)}
              variant="videoNote"
              duration={31}
              position={19}
              onPress={() => {}}
            />
          </Bubble>

          <Caption>live location</Caption>
          <Bubble tone="outgoing">
            <LocationMessage
              tone="outgoing"
              live
              title="Marta"
              address="Moving along Avinguda del Port"
              liveUntilLabel="Live until 18:30"
              onStopSharing={() => {}}
              onPress={() => {}}
            />
          </Bubble>
        </View>
      </BothModes>
    );
  },
};

/** The info panel's two tabs. */
export const InfoPanelGrids: Story = {
  render: function GridsStory() {
    return (
      <BothModes width={420}>
        <View style={{ gap: 16 }}>
          <Caption>shared media — 3 columns, "+N more" on the last tile</Caption>
          <SharedMediaGrid
            width={340}
            maxItems={9}
            onPressItem={() => {}}
            onPressOverflow={() => {}}
            items={PHOTOS.map((source, i) => ({
              id: `m${i}`,
              source,
              kind: i % 4 === 2 ? ('video' as const) : ('image' as const),
              duration: i % 4 === 2 ? 72 : undefined,
            }))}
          />

          <Caption>shared files</Caption>
          <DocumentGrid items={DOCS} onPressItem={() => {}} onDownloadItem={() => {}} />
        </View>
      </BothModes>
    );
  },
};

/** Narrow: the width every block is designed against. */
export const Narrow: Story = {
  parameters: { viewport: { defaultViewport: 'mobile2' } },
  render: function NarrowStory() {
    return (
      <BothModes width={390}>
        <View style={{ gap: 12 }}>
          <Bubble tone="incoming">
            <MediaAlbum
              width={240}
              items={PHOTOS.slice(0, 5).map((source, i) => ({ id: `n${i}`, source }))}
              onPress={() => {}}
            />
          </Bubble>
          <Bubble tone="outgoing">
            <VoiceMessage
              tone="outgoing"
              samples={SAMPLES}
              duration={9}
              position={3}
              width={230}
              rate={1.5}
              onRateChange={() => {}}
              onSeek={() => {}}
            />
          </Bubble>
          <Bubble tone="incoming">
            <FileMessage name="Quarterly rents.xlsx" sizeBytes={812 * 1024} onDownload={() => {}} />
          </Bubble>
        </View>
      </BothModes>
    );
  },
};
