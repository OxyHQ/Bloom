import React, { useContext, useState } from 'react';
import { Image, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { BloomThemeContext, BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { CallHistoryList } from './CallHistoryList';
import { CallMinimisedPill } from './CallMinimisedPill';
import { CallScreen } from './CallScreen';
import { GroupCallBar } from './GroupCallBar';
import { GroupCallGrid } from './GroupCallGrid';
import { IncomingCallBanner } from './IncomingCallBanner';
import { IncomingCallScreen } from './IncomingCallScreen';
import type { CallHistorySection, CallPipCorner, GroupCallParticipant } from './types';

/**
 * Invented people, invented calls. Every avatar and every video frame is a
 * placeholder photo service, and every time string arrives pre-formatted —
 * nothing in this family reads a clock.
 */

const meta: Meta = {
  title: 'Blocks/Chat/Calls',
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj;

const PHOTO = (seed: string, w = 200, h = 200) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

const PEOPLE: readonly GroupCallParticipant[] = [
  { id: 'ana', name: 'Ana Restrepo', avatar: PHOTO('ana') },
  { id: 'marcel', name: 'Marcel Dubé', avatar: PHOTO('marcel') },
  { id: 'nour', name: 'Nour Haddad', avatar: PHOTO('nour') },
  { id: 'ito', name: 'Ito Nakamura', avatar: PHOTO('ito') },
  { id: 'saoirse', name: 'Saoirse Byrne', avatar: PHOTO('saoirse') },
  { id: 'dmitri', name: 'Dmitri Volkov', avatar: PHOTO('dmitri') },
  { id: 'lucia', name: 'Lucía Ferrer', avatar: PHOTO('lucia') },
  { id: 'kofi', name: 'Kofi Mensah', avatar: PHOTO('kofi') },
  { id: 'wren', name: 'Wren Ashby', avatar: PHOTO('wren') },
  { id: 'tova', name: 'Tova Lindqvist', avatar: PHOTO('tova') },
  { id: 'rafi', name: 'Rafi Haq', avatar: PHOTO('rafi') },
  { id: 'elke', name: 'Elke Brandt', avatar: PHOTO('elke') },
];

function group(count: number): GroupCallParticipant[] {
  return PEOPLE.slice(0, count).map((person, index) => ({
    ...person,
    label: index === 0 ? 'You' : person.name,
    speaking: index === 1,
    muted: index === 2 || index === 4,
    video: index % 3 === 0 ? <VideoFrame seed={`v-${person.id}`} /> : undefined,
  }));
}

function VideoFrame({ seed }: { seed: string }) {
  return (
    <Image
      source={{ uri: PHOTO(seed, 640, 640) }}
      style={{ width: '100%', height: '100%' }}
      resizeMode="cover"
    />
  );
}

const HISTORY: readonly CallHistorySection[] = [
  {
    title: 'Today',
    items: [
      {
        id: '1',
        name: 'Ana Restrepo',
        avatar: PHOTO('ana'),
        direction: 'missed',
        mode: 'video',
        meta: '09:14',
        count: 2,
      },
      {
        id: '2',
        name: 'Kofi Mensah',
        avatar: PHOTO('kofi'),
        direction: 'outgoing',
        meta: '08:02 · 12:40',
      },
    ],
  },
  {
    title: 'Yesterday',
    items: [
      {
        id: '3',
        name: 'Nour Haddad',
        avatar: PHOTO('nour'),
        direction: 'incoming',
        meta: '18:40 · 4:32',
      },
      {
        id: '4',
        name: 'Saturday planning',
        avatar: PHOTO('group'),
        direction: 'declined',
        mode: 'video',
        meta: '17:05',
      },
      {
        id: '5',
        name: 'Marcel Dubé',
        avatar: PHOTO('marcel'),
        direction: 'incoming',
        meta: '11:22 · 0:48',
      },
    ],
  },
];

function Surface({ children, pad = 20 }: { children: React.ReactNode; pad?: number }) {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, padding: pad, gap: 20, backgroundColor: theme.colors.background }}>
      {children}
    </View>
  );
}

/** Both modes side by side; the ambient preset is forwarded so the toolbar reaches them. */
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

function Phone({ children }: { children: React.ReactNode }) {
  return <View style={{ width: 390, height: 760, alignSelf: 'center' }}>{children}</View>;
}

// ---------------------------------------------------------------------------

/** A voice call at phone width, mid-call: timer, encryption line, four controls. */
export const VoiceCall: Story = {
  render: function VoiceCallStory() {
    const [muted, setMuted] = useState(false);
    const [speaker, setSpeaker] = useState(true);
    return (
      <Phone>
        <CallScreen
          mode="voice"
          name="Ana Restrepo"
          subtitle="Mobile"
          avatar={PHOTO('ana', 400, 400)}
          status="active"
          duration="00:42"
          encryption="End-to-end encrypted"
          onMinimise={() => undefined}
          onOpenChat={() => undefined}
          controls={{
            muted,
            onMutedChange: setMuted,
            speaker,
            onSpeakerChange: setSpeaker,
            videoOn: false,
            onVideoChange: () => undefined,
            onAddParticipant: () => undefined,
            onEndCall: () => undefined,
          }}
          testID="voice"
        />
      </Phone>
    );
  },
};

/** The same call on a desktop pane, with a caller-supplied artwork hue. */
export const VoiceCallWide: Story = {
  render: () => (
    <View style={{ width: 1280, height: 720, alignSelf: 'center' }}>
      <CallScreen
        mode="voice"
        name="Saturday planning"
        subtitle="4 participants"
        avatar={PHOTO('group', 400, 400)}
        accentColor="rgb(214 86 120)"
        status="reconnecting"
        duration="02:11"
        encryption="End-to-end encrypted"
        onMinimise={() => undefined}
        onOpenChat={() => undefined}
        onOpenParticipants={() => undefined}
        participantCount={4}
        controls={{
          muted: true,
          onMutedChange: () => undefined,
          speaker: false,
          onSpeakerChange: () => undefined,
          videoOn: false,
          onVideoChange: () => undefined,
          onScreenShareChange: () => undefined,
          onAddParticipant: () => undefined,
          onEndCall: () => undefined,
        }}
        testID="wide"
      />
    </View>
  ),
};

/** A video call: the remote frame fills the stage, the PiP cycles corners on press. */
export const VideoCall: Story = {
  render: function VideoCallStory() {
    const [corner, setCorner] = useState<CallPipCorner>('top-right');
    const [videoOn, setVideoOn] = useState(true);
    return (
      <Phone>
        <CallScreen
          mode="video"
          name="Nour Haddad"
          status="active"
          duration="04:08"
          remoteVideo={<VideoFrame seed="remote" />}
          localVideo={<VideoFrame seed="local" />}
          localVideoCorner={corner}
          onMoveLocal={setCorner}
          onMinimise={() => undefined}
          onOpenChat={() => undefined}
          onOpenParticipants={() => undefined}
          participantCount={2}
          controls={{
            muted: false,
            onMutedChange: () => undefined,
            videoOn,
            onVideoChange: setVideoOn,
            onFlipCamera: () => undefined,
            onScreenShareChange: () => undefined,
            onEndCall: () => undefined,
          }}
          testID="video"
        />
      </Phone>
    );
  },
};

/** The video call on a wide pane. */
export const VideoCallWide: Story = {
  render: () => (
    <View style={{ width: 1280, height: 720, alignSelf: 'center' }}>
      <CallScreen
        mode="video"
        name="Ito Nakamura"
        status="active"
        duration="12:55"
        remoteVideo={<VideoFrame seed="remote-wide" />}
        localVideo={<VideoFrame seed="local-wide" />}
        localVideoCorner="bottom-right"
        onMoveLocal={() => undefined}
        onMinimise={() => undefined}
        onOpenChat={() => undefined}
        onOpenParticipants={() => undefined}
        participantCount={2}
        controls={{
          muted: true,
          onMutedChange: () => undefined,
          videoOn: true,
          onVideoChange: () => undefined,
          onFlipCamera: () => undefined,
          screenSharing: true,
          onScreenShareChange: () => undefined,
          onAddParticipant: () => undefined,
          onEndCall: () => undefined,
        }}
        testID="video-wide"
      />
    </View>
  ),
};

/** The minimised pill, in both modes — the app owns where it sits. */
export const MinimisedPill: Story = {
  render: () => (
    <BothModes min={340}>
      <Caption>a voice call, muted</Caption>
      <CallMinimisedPill
        name="Ana Restrepo"
        duration="00:42"
        muted
        onMutedChange={() => undefined}
        onExpand={() => undefined}
        onEndCall={() => undefined}
      />
      <Caption>a video call, reconnecting, no controls</Caption>
      <CallMinimisedPill
        name="Nour Haddad"
        mode="video"
        statusText="Reconnecting…"
        onExpand={() => undefined}
      />
    </BothModes>
  ),
};

/** The in-app banner: an ordinary card, so it flips with the mode. */
export const IncomingBanner: Story = {
  render: () => (
    <BothModes min={360}>
      <Caption>video</Caption>
      <IncomingCallBanner
        name="Marcel Dubé"
        avatar={PHOTO('marcel')}
        mode="video"
        status="online"
        onAccept={() => undefined}
        onDecline={() => undefined}
        onPress={() => undefined}
      />
      <Caption>voice</Caption>
      <IncomingCallBanner
        name="Kofi Mensah"
        avatar={PHOTO('kofi')}
        onAccept={() => undefined}
        onDecline={() => undefined}
      />
    </BothModes>
  ),
};

/** The full-screen incoming call, both answer modes. */
export const IncomingScreens: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 24, padding: 24, flexWrap: 'wrap' }}>
      <View style={{ width: 390, height: 760 }}>
        <IncomingCallScreen
          name="Ana Restrepo"
          avatar={PHOTO('ana', 400, 400)}
          mode="video"
          onAccept={() => undefined}
          onDecline={() => undefined}
          onMessage={() => undefined}
          onRemind={() => undefined}
          testID="incoming-buttons"
        />
      </View>
      <View style={{ width: 390, height: 760 }}>
        <IncomingCallScreen
          name="Lucía Ferrer"
          avatar={PHOTO('lucia', 400, 400)}
          accentColor="rgb(96 132 214)"
          answerMode="slide"
          onAccept={() => undefined}
          onDecline={() => undefined}
          onMessage={() => undefined}
          testID="incoming-slide"
        />
      </View>
    </View>
  ),
};

/** 2, 4, 6 and 9 participants, one speaking in each. */
export const GroupGrids: Story = {
  render: () => (
    <View style={{ padding: 24, gap: 24, flexDirection: 'row', flexWrap: 'wrap' }}>
      {[2, 4, 6, 9].map((count) => (
        <View key={count} style={{ width: 330, gap: 8 }}>
          <Caption>{`${count} participants`}</Caption>
          <GroupCallGrid
            participants={group(count)}
            width={330}
            onParticipantPress={() => undefined}
            testID={`grid-${count}`}
          />
        </View>
      ))}
      <View style={{ width: 330, gap: 8 }}>
        <Caption>12 participants, 9-up (8 faces + overflow)</Caption>
        <GroupCallGrid participants={group(12)} width={330} testID="grid-12" />
      </View>
      <View style={{ width: 330, gap: 8 }}>
        <Caption>spotlight</Caption>
        <GroupCallGrid
          participants={group(6)}
          layout="spotlight"
          spotlightId="marcel"
          width={330}
          testID="grid-spotlight"
        />
      </View>
    </View>
  ),
};

/** The strip that says a call is happening, joined and not. */
export const GroupBar: Story = {
  render: () => (
    <BothModes min={380}>
      <Caption>not joined</Caption>
      <GroupCallBar
        title="Saturday planning"
        statusText="4 on the call"
        participants={PEOPLE.slice(0, 6)}
        onJoin={() => undefined}
        onPress={() => undefined}
      />
      <Caption>joined, someone speaking</Caption>
      <GroupCallBar
        title="Saturday planning"
        speakingName="Marcel"
        participants={PEOPLE.slice(0, 4)}
        joined
        muted
        onMutedChange={() => undefined}
        onLeave={() => undefined}
        onPress={() => undefined}
      />
    </BothModes>
  ),
};

/** The call log, in day sections. */
export const History: Story = {
  render: () => (
    <BothModes min={380}>
      <CallHistoryList
        sections={HISTORY}
        onItemPress={() => undefined}
        onCallBack={() => undefined}
        testID="history"
      />
    </BothModes>
  ),
};
