import { fn } from 'storybook/test';
import type React from 'react';
import { useState } from 'react';
import { View } from 'react-native';
import { BloomImage } from '../image';
import { Button } from '../button';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { List } from '../list';
import { PageHeader } from '../page-header';
import { CallMinimisedPill } from './CallMinimisedPill';
import { CallScreen } from './CallScreen';
import { GroupCallBar } from './GroupCallBar';
import { GroupCallGrid } from './GroupCallGrid';
import { IncomingCallBanner } from './IncomingCallBanner';
import { IncomingCallScreen } from './IncomingCallScreen';
import type { CallHistorySection, CallPipCorner, CallStatus, GroupCallParticipant } from './types';

/**
 * Invented people, invented calls. Every avatar and every video frame is a
 * placeholder photo service, and every time string arrives pre-formatted —
 * nothing in this family reads a clock.
 */

const meta: Meta = {
  id: 'blocks-chat-calls',
  title: 'Patterns/Chat/Calls',
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj;

const PHOTO = (seed: string, w = 200, h = 200) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

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
    <BloomImage
      source={{ uri: PHOTO(seed, 640, 640) }}
      style={{ width: '100%', height: '100%' }}
      contentFit="cover"
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

function Caption({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <Text variant="caption-1-medium" style={{ color: theme.colors.textSecondary }}>
      {children}
    </Text>
  );
}

/** One call component adapts to its actual viewport; controls own local demo state. */
function CallDemo({ mode, status = 'active' }: { mode: 'voice' | 'video'; status?: CallStatus }) {
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(true);
  const [videoOn, setVideoOn] = useState(mode === 'video');
  const [screenSharing, setScreenSharing] = useState(false);
  const [minimised, setMinimised] = useState(false);
  const [ended, setEnded] = useState(false);
  const [participants, setParticipants] = useState(2);
  const [camera, setCamera] = useState(false);
  const [corner, setCorner] = useState<CallPipCorner>('top-right');
  return (
    <View style={{ width: '100%', height: 720 }}>
      <CallScreen
        mode={videoOn ? 'video' : 'voice'}
        name="Ana Restrepo"
        subtitle={`${participants} participants`}
        avatar={PHOTO('ana', 400, 400)}
        status={ended ? 'ended' : status}
        duration="04:08"
        encryption="End-to-end encrypted"
        remoteVideo={videoOn ? <VideoFrame seed="remote" /> : undefined}
        localVideo={videoOn ? <VideoFrame seed={camera ? 'local-back' : 'local'} /> : undefined}
        localVideoCorner={corner}
        onMoveLocal={setCorner}
        minimised={minimised}
        onMinimise={() => setMinimised(!minimised)}
        participantCount={participants}
        controls={{
          muted,
          onMutedChange: setMuted,
          speaker,
          onSpeakerChange: setSpeaker,
          videoOn,
          onVideoChange: setVideoOn,
          screenSharing,
          onScreenShareChange: setScreenSharing,
          onFlipCamera: () => setCamera(!camera),
          onAddParticipant: () => setParticipants(participants + 1),
          onEndCall: () => setEnded(true),
        }}
        controlsSlot={
          ended ? <Button onPress={() => setEnded(false)}>Restart demo call</Button> : undefined
        }
        testID={mode === 'video' ? 'video' : 'voice'}
      />
    </View>
  );
}
export const VoiceCall: Story = { render: () => <CallDemo mode="voice" /> };
export const VideoCall: Story = { render: () => <CallDemo mode="video" /> };
export const Reconnecting: Story = {
  render: () => <CallDemo mode="voice" status="reconnecting" />,
};

/** The minimised pill, in both modes — the app owns where it sits. */
export const MinimisedPill: Story = {
  render: () => (
    <Surface>
      <Caption>a voice call, muted</Caption>
      <CallMinimisedPill
        name="Ana Restrepo"
        duration="00:42"
        muted
        onMutedChange={fn().mockName('onMutedChange')}
        onExpand={fn().mockName('onExpand')}
        onEndCall={fn().mockName('onEndCall')}
      />
      <Caption>a video call, reconnecting, no controls</Caption>
      <CallMinimisedPill
        name="Nour Haddad"
        mode="video"
        statusText="Reconnecting…"
        onExpand={fn().mockName('onExpand')}
      />
    </Surface>
  ),
};

/** The in-app banner: an ordinary card, so it flips with the mode. */
export const IncomingBanner: Story = {
  render: () => (
    <Surface>
      <Caption>video</Caption>
      <IncomingCallBanner
        name="Marcel Dubé"
        avatar={PHOTO('marcel')}
        mode="video"
        status="online"
        onAccept={fn().mockName('onAccept')}
        onDecline={fn().mockName('onDecline')}
        onPress={fn().mockName('onPress')}
      />
      <Caption>voice</Caption>
      <IncomingCallBanner
        name="Kofi Mensah"
        avatar={PHOTO('kofi')}
        onAccept={fn().mockName('onAccept')}
        onDecline={fn().mockName('onDecline')}
      />
    </Surface>
  ),
};

/** The full-screen incoming call, both answer modes. */
export const IncomingScreens: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 24, padding: 24, flexWrap: 'wrap' }}>
      <View style={{ width: '100%', maxWidth: 390, height: 760 }}>
        <IncomingCallScreen
          name="Ana Restrepo"
          avatar={PHOTO('ana', 400, 400)}
          mode="video"
          onAccept={fn().mockName('onAccept')}
          onDecline={fn().mockName('onDecline')}
          onMessage={fn().mockName('onMessage')}
          onRemind={fn().mockName('onRemind')}
          testID="incoming-buttons"
        />
      </View>
      <View style={{ width: '100%', maxWidth: 390, height: 760 }}>
        <IncomingCallScreen
          name="Lucía Ferrer"
          avatar={PHOTO('lucia', 400, 400)}
          accentColor="rgb(96 132 214)"
          answerMode="slide"
          onAccept={fn().mockName('onAccept')}
          onDecline={fn().mockName('onDecline')}
          onMessage={fn().mockName('onMessage')}
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
        <View key={count} style={{ width: '100%', maxWidth: 330, gap: 8 }}>
          <Caption>{`${count} participants`}</Caption>
          <GroupCallGrid
            participants={group(count)}
            onParticipantPress={fn().mockName('onParticipantPress')}
            testID={`grid-${count}`}
          />
        </View>
      ))}
      <View style={{ width: '100%', maxWidth: 330, gap: 8 }}>
        <Caption>12 participants, 9-up (8 faces + overflow)</Caption>
        <GroupCallGrid participants={group(12)} testID="grid-12" />
      </View>
      <View style={{ width: '100%', maxWidth: 330, gap: 8 }}>
        <Caption>spotlight</Caption>
        <GroupCallGrid
          participants={group(6)}
          layout="spotlight"
          spotlightId="marcel"
          testID="grid-spotlight"
        />
      </View>
    </View>
  ),
};

/** The strip that says a call is happening, joined and not. */
export const GroupBar: Story = {
  render: () => (
    <Surface>
      <Caption>not joined</Caption>
      <GroupCallBar
        title="Saturday planning"
        statusText="4 on the call"
        participants={PEOPLE.slice(0, 6)}
        onJoin={fn().mockName('onJoin')}
        onPress={fn().mockName('onPress')}
      />
      <Caption>joined, someone speaking</Caption>
      <GroupCallBar
        title="Saturday planning"
        speakingName="Marcel"
        participants={PEOPLE.slice(0, 4)}
        joined
        muted
        onMutedChange={fn().mockName('onMutedChange')}
        onLeave={fn().mockName('onLeave')}
        onPress={fn().mockName('onPress')}
      />
    </Surface>
  ),
};

/** The call log, in day sections. */
export const History: Story = {
  render: () => (
    <Surface>
      <PageHeader title="Calls" onBack={null} safeArea={false} sticky={false} />
      <List
        sections={HISTORY.map((section) => ({
          id: section.id ?? section.title,
          title: section.title,
          items: section.items.map((item) => ({
            id: item.id,
            call: { ...item, onCallBack: fn().mockName('onCallBack') },
            onPress: fn().mockName('onPress'),
          })),
        }))}
        testID="history"
      />
    </Surface>
  ),
};
