import {
  CallMinimisedPill,
  CallScreen,
  GroupCallGrid,
  IncomingCallBanner,
  IncomingCallScreen,
} from '@oxy.so/bloom/call-ui';
import { Text } from '@oxy.so/bloom/typography';
import { View } from 'react-native';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import { type ParityCase, Themed } from './support/cases';

const press = () => {};
const set = () => {};
const PHOTO = 'https://cdn.oxy.so/p.jpg';
const PEOPLE = [
  { id: 'ana', name: 'Ana Restrepo', avatar: PHOTO, label: 'You' },
  { id: 'marcel', name: 'Marcel Dubé', avatar: null, muted: true },
  { id: 'nour', name: 'Nour Haddad', avatar: PHOTO, presenting: true },
  { id: 'ito', name: 'Ito Nakamura', avatar: null },
];
const SPEAKING = [...PEOPLE.slice(0, 2), { id: 'nour', name: 'Nour Haddad', speaking: true }];
const CONTROLS = {
  muted: true,
  onMutedChange: set,
  speaker: false,
  onSpeakerChange: set,
  onEndCall: press,
};
/** A screen's stage, at a phone's size: Bloom fills its parent. */
const STAGE = { width: 360, height: 640 } as const;
const frame = { width: '360', height: '640' } as const;
const Frame = () => <View style={{ width: 96, height: 140 }} />;

const screens: ParityCase[] = [
  ...ENUMS.callMode.map((mode) => ({
    name: `CallScreen ${mode}, active`,
    language: () =>
      toElement(
        L.CallScreen('Ana Restrepo', 'active', {
          duration: '00:42',
          subtitle: 'Mobile',
          controls: CONTROLS,
        })
          .style(mode)
          .frame(frame),
      ),
    bloom: () => (
      <CallScreen
        name="Ana Restrepo"
        status="active"
        duration="00:42"
        subtitle="Mobile"
        controls={CONTROLS}
        mode={mode}
        style={STAGE}
      />
    ),
  })),
  ...ENUMS.callControlSize.map((size) => ({
    name: `CallScreen controls ${size}, with an extra button`,
    language: () =>
      toElement(
        L.CallScreen('Ana Restrepo', 'active', {
          controls: { ...CONTROLS, extra: L.Text('Hold') },
        })
          .size(size)
          .frame(frame),
      ),
    bloom: () => (
      <CallScreen
        name="Ana Restrepo"
        status="active"
        controls={{ ...CONTROLS, size, children: <Text>Hold</Text> }}
        style={STAGE}
      />
    ),
  })),
  {
    name: 'CallScreen video, frames, top bar and actions',
    language: () =>
      toElement(
        L.CallScreen('Ana Restrepo', 'active', {
          duration: '01:04',
          remoteVideo: L.Embed(<View style={{ flex: 1 }} />),
          localVideo: L.Embed(<Frame />),
          localVideoCorner: 'bottom-left',
          onMoveLocal: set,
          localVideoWidth: '120',
          topBarSlot: L.Text('HD'),
          onMinimise: press,
          onOpenChat: press,
          onOpenParticipants: press,
          participantCount: 3,
          content: L.Text('Poor connection'),
        })
          .style('video')
          .frame(frame),
      ),
    bloom: () => (
      <CallScreen
        name="Ana Restrepo"
        status="active"
        duration="01:04"
        remoteVideo={<View style={{ flex: 1 }} />}
        localVideo={<Frame />}
        localVideoCorner="bottom-left"
        onMoveLocal={set}
        localVideoWidth={120}
        topBarSlot={<Text>HD</Text>}
        onMinimise={press}
        onOpenChat={press}
        onOpenParticipants={press}
        participantCount={3}
        mode="video"
        style={STAGE}
      >
        <Text>Poor connection</Text>
      </CallScreen>
    ),
  },
  {
    name: 'CallScreen tinted, encryption as words, calling',
    language: () =>
      toElement(
        L.CallScreen('Ana Restrepo', 'calling', { encryption: 'End-to-end encrypted' })
          .tint('primary')
          .frame(frame),
      ),
    bloom: () => (
      <Themed>
        {(c) => (
          <CallScreen
            name="Ana Restrepo"
            status="calling"
            encryption="End-to-end encrypted"
            accentColor={c.primary}
            style={STAGE}
          />
        )}
      </Themed>
    ),
  },
  {
    name: 'CallScreen encryption as a view, its own control bar, ended',
    language: () =>
      toElement(
        L.CallScreen('Ana Restrepo', 'ended', {
          encryption: L.Text('Verified'),
          controlsSlot: L.Text('Call again'),
          labels: { ended: 'Call over' },
        }).frame(frame),
      ),
    bloom: () => (
      <CallScreen
        name="Ana Restrepo"
        status="ended"
        encryption={<Text>Verified</Text>}
        controlsSlot={<Text>Call again</Text>}
        labels={{ ended: 'Call over' }}
        style={STAGE}
      />
    ),
  },
  {
    name: 'CallScreen minimised',
    language: () =>
      toElement(
        L.CallScreen('Ana Restrepo', 'active', {
          duration: '00:42',
          minimised: true,
          onMinimise: press,
          controls: CONTROLS,
        }).tint('success'),
      ),
    bloom: () => (
      <Themed>
        {(c) => (
          <CallScreen
            name="Ana Restrepo"
            status="active"
            duration="00:42"
            minimised
            onMinimise={press}
            controls={CONTROLS}
            accentColor={c.success}
          />
        )}
      </Themed>
    ),
  },
];

const pills: ParityCase[] = [
  ...ENUMS.callMode.map((mode) => ({
    name: `CallMinimisedPill ${mode}`,
    language: () =>
      toElement(
        L.CallMinimisedPill('Ana Restrepo', {
          duration: '00:42',
          muted: true,
          onMutedChange: set,
          onExpand: press,
          onEndCall: press,
        }).style(mode),
      ),
    bloom: () => (
      <CallMinimisedPill
        name="Ana Restrepo"
        duration="00:42"
        muted
        onMutedChange={set}
        onExpand={press}
        onEndCall={press}
        mode={mode}
      />
    ),
  })),
  {
    name: 'CallMinimisedPill tinted, a status, named controls',
    language: () =>
      toElement(
        L.CallMinimisedPill('Ana Restrepo', {
          statusText: 'Reconnecting…',
          labels: { expand: 'Back to the call', endCall: 'Hang up' },
          onEndCall: press,
        }).tint('primary'),
      ),
    bloom: () => (
      <Themed>
        {(c) => (
          <CallMinimisedPill
            name="Ana Restrepo"
            statusText="Reconnecting…"
            labels={{ expand: 'Back to the call', endCall: 'Hang up' }}
            onEndCall={press}
            accentColor={c.primary}
          />
        )}
      </Themed>
    ),
  },
  {
    name: 'CallMinimisedPill with no name',
    language: () => toElement(L.CallMinimisedPill()),
    bloom: () => <CallMinimisedPill />,
  },
];

const grids: ParityCase[] = [
  ...ENUMS.groupCallLayout.map((layout) => ({
    name: `GroupCallGrid ${layout}`,
    language: () =>
      toElement(
        L.GroupCallGrid(PEOPLE, {
          width: '360',
          onParticipantPress: set,
          spotlightId: 'nour',
        }).style(layout),
      ),
    bloom: () => (
      <GroupCallGrid
        participants={PEOPLE}
        width={360}
        onParticipantPress={set}
        spotlightId="nour"
        layout={layout}
      />
    ),
  })),
  {
    name: 'GroupCallGrid columns, gap, aspect, overflow',
    language: () =>
      toElement(
        L.GroupCallGrid(PEOPLE, {
          width: '360',
          maxTiles: 3,
          formatOverflow: (count) => `+${count}`,
          formatMuted: (name) => `${name} is muted`,
        })
          .columns(2)
          .spacing('xs')
          .aspectRatio(16 / 9),
      ),
    bloom: () => (
      <GroupCallGrid
        participants={PEOPLE}
        width={360}
        maxTiles={3}
        formatOverflow={(count) => `+${count}`}
        formatMuted={(name) => `${name} is muted`}
        columns={2}
        gap={4}
        aspectRatio={16 / 9}
      />
    ),
  },
];

const incoming: ParityCase[] = [
  ...ENUMS.callMode.map((mode) => ({
    name: `IncomingCallScreen ${mode}, buttons`,
    language: () =>
      toElement(
        L.IncomingCallScreen('Ana Restrepo', {
          avatar: PHOTO,
          onAccept: press,
          onDecline: press,
          onMessage: press,
          onRemind: press,
        })
          .style(mode)
          .answerStyle('buttons')
          .frame(frame),
      ),
    bloom: () => (
      <IncomingCallScreen
        name="Ana Restrepo"
        avatar={PHOTO}
        onAccept={press}
        onDecline={press}
        onMessage={press}
        onRemind={press}
        mode={mode}
        answerMode="buttons"
        style={STAGE}
      />
    ),
  })),
  {
    name: 'IncomingCallScreen tinted, its subtitle and content',
    language: () =>
      toElement(
        L.IncomingCallScreen('Ana Restrepo', {
          subtitle: 'Oxy call',
          onAccept: press,
          onDecline: press,
          content: L.Text('From work'),
        })
          .tint('primary')
          .frame(frame),
      ),
    bloom: () => (
      <Themed>
        {(c) => (
          <IncomingCallScreen
            name="Ana Restrepo"
            subtitle="Oxy call"
            onAccept={press}
            onDecline={press}
            accentColor={c.primary}
            style={STAGE}
          >
            <Text>From work</Text>
          </IncomingCallScreen>
        )}
      </Themed>
    ),
  },
  ...ENUMS.callMode.map((mode) => ({
    name: `IncomingCallBanner ${mode}`,
    language: () =>
      toElement(
        L.IncomingCallBanner('Ana Restrepo', {
          avatar: PHOTO,
          status: 'online',
          onAccept: press,
          onDecline: press,
        })
          .style(mode)
          .onPress(press),
      ),
    bloom: () => (
      <IncomingCallBanner
        name="Ana Restrepo"
        avatar={PHOTO}
        status="online"
        onAccept={press}
        onDecline={press}
        mode={mode}
        onPress={press}
      />
    ),
  })),
  {
    name: 'IncomingCallBanner tinted, its subtitle and words, not pressable',
    language: () =>
      toElement(
        L.IncomingCallBanner('Ana Restrepo', {
          subtitle: 'Oxy call',
          labels: { accept: 'Answer', decline: 'Ignore' },
          onAccept: press,
          onDecline: press,
        }).tint('success'),
      ),
    bloom: () => (
      <Themed>
        {(c) => (
          <IncomingCallBanner
            name="Ana Restrepo"
            subtitle="Oxy call"
            labels={{ accept: 'Answer', decline: 'Ignore' }}
            onAccept={press}
            onDecline={press}
            accentColor={c.success}
          />
        )}
      </Themed>
    ),
  },
];

export const CALL_UI_CASES: ParityCase[] = [...screens, ...pills, ...grids, ...incoming];

/** A speaking ring and the slide track's chevrons breathe on a loop: compared by Jest as they mount. */
export const CALL_UI_CASES_MOVING: ParityCase[] = [
  {
    name: 'GroupCallGrid with a speaker',
    language: () => toElement(L.GroupCallGrid(SPEAKING, { width: '360' })),
    bloom: () => <GroupCallGrid participants={SPEAKING} width={360} />,
  },
  ...ENUMS.callMode.map((mode) => ({
    name: `IncomingCallScreen ${mode}, slide`,
    language: () =>
      toElement(
        L.IncomingCallScreen('Ana Restrepo', { onAccept: press, onDecline: press })
          .style(mode)
          .answerStyle('slide')
          .frame(frame),
      ),
    bloom: () => (
      <IncomingCallScreen
        name="Ana Restrepo"
        onAccept={press}
        onDecline={press}
        mode={mode}
        answerMode="slide"
        style={STAGE}
      />
    ),
  })),
];
