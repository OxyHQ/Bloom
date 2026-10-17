import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { AgentAvatar } from '../agent-avatar';
import {
  AgentProfile,
  AgentReply,
  AgentReplyBubble,
  AgentReplyIdentity,
  type AgentReplyAgent,
} from '../agent-reply';
import { Button } from '../button';
import { Text } from '../typography';
import {
  AvatarAnchor,
  AvatarFlightLayer,
  avatarJoinFlights,
  useAvatarFlights,
  useAvatarJoin,
} from './index';

const meta: Meta = {
  title: 'Agents/Avatar Flight',
  parameters: { controls: { disable: true } },
};
export default meta;
type Story = StoryObj;

const TEAM: AgentReplyAgent[] = [
  {
    id: 'lumi',
    name: 'Lumi',
    avatar: { shape: 'slender', eyes: 'oval', eyewear: 'none', accessory: 'none', color: 'teal' },
  },
  {
    id: 'atlas',
    name: 'Atlas',
    avatar: { shape: 'shield', eyes: 'oval', eyewear: 'none', accessory: 'none', color: 'violet' },
  },
  {
    id: 'sol',
    name: 'Sol',
    avatar: { shape: 'pocket', eyes: 'oval', eyewear: 'none', accessory: 'none', color: 'cyan' },
  },
];
const [RESPONDER, ...WAITING] = TEAM as [AgentReplyAgent, ...AgentReplyAgent[]];

/**
 * A group chat's first message: the team sits in the empty chat; on send the answering agent flies
 * onto its reply and the others merge into the header's profile. Use "Send" again after "Reset".
 */
export const FirstMessage: Story = {
  render: () => {
    const flights = useAvatarFlights();
    const [sent, setSent] = useState(false);

    const send = async () => {
      await flights.launch([
        {
          key: RESPONDER.id,
          character: RESPONDER.avatar,
          from: `empty:${RESPONDER.id}`,
          to: `reply:${RESPONDER.id}`,
          duration: 800,
        },
        ...avatarJoinFlights(WAITING, {
          from: (agent) => `empty:${agent.id}`,
          to: 'profile',
          character: (agent) => agent.avatar,
        }),
      ]);
      setSent(true);
    };
    const reset = () => {
      flights.cancel();
      setSent(false);
    };

    return (
      <View style={{ width: 420, minHeight: 360, gap: 16, padding: 16 }}>
        <View style={{ alignItems: 'center' }}>
          <AgentProfile
            agents={sent ? TEAM : [RESPONDER]}
            onPress={() => {}}
            avatarRef={flights.anchor('profile')}
          />
        </View>

        {sent ? (
          <AgentReply
            identity={
              <AgentReplyIdentity
                character={RESPONDER.avatar}
                name={RESPONDER.name}
                avatarRef={flights.anchor(`reply:${RESPONDER.id}`)}
                avatarHidden={flights.isLanding(`reply:${RESPONDER.id}`)}
              />
            }
          >
            <AgentReplyBubble>
              <Text>The avatar that answers lands on its reply.</Text>
            </AgentReplyBubble>
          </AgentReply>
        ) : (
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
            {TEAM.map((agent) => (
              <AvatarAnchor key={agent.id} flights={flights} anchor={`empty:${agent.id}`}>
                <AgentAvatar character={agent.avatar} size={64} />
              </AvatarAnchor>
            ))}
          </View>
        )}

        <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center' }}>
          <Button onPress={() => void send()} disabled={sent}>
            Send
          </Button>
          <Button appearance="outline" onPress={reset}>
            Reset
          </Button>
        </View>
        <AvatarFlightLayer flights={flights} />
      </View>
    );
  },
};

/**
 * Agents joining a conversation already under way: each one that starts answering flies from its
 * reply into the header's profile, which gains it as it lands (`useAvatarJoin`). Several answering
 * together fly as one staggered batch; one answering while a batch is in the air waits for it.
 */
export const AgentsJoin: Story = {
  render: () => {
    const flights = useAvatarFlights();
    const [answering, setAnswering] = useState(0);
    const [round, setRound] = useState(0);
    const arrivals = useMemo(
      () => WAITING.slice(0, answering).map((agent) => ({ agent, live: true })),
      [answering],
    );
    const joined = useAvatarJoin({
      arrivals,
      flights,
      from: (agent) => `reply:${agent.id}`,
      to: 'profile',
      character: (agent) => agent.avatar,
      resetKey: round,
    });
    const reset = () => {
      flights.cancel();
      setAnswering(0);
      setRound((value) => value + 1);
    };

    return (
      <View style={{ width: 420, minHeight: 360, gap: 16, padding: 16 }}>
        <View style={{ alignItems: 'center' }}>
          <AgentProfile
            agents={[RESPONDER, ...joined]}
            onPress={() => {}}
            avatarRef={flights.anchor('profile')}
            avatarHidden={flights.isLanding('profile')}
          />
        </View>

        {WAITING.slice(0, answering).map((agent) => (
          <AgentReply
            key={agent.id}
            identity={
              <AgentReplyIdentity
                character={agent.avatar}
                name={agent.name}
                avatarRef={flights.anchor(`reply:${agent.id}`)}
              />
            }
          >
            <AgentReplyBubble>
              <Text>{`${agent.name} joins the conversation.`}</Text>
            </AgentReplyBubble>
          </AgentReply>
        ))}

        <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center' }}>
          <Button
            onPress={() => setAnswering((count) => Math.min(count + 1, WAITING.length))}
            disabled={answering >= WAITING.length}
          >
            Consult the next agent
          </Button>
          <Button appearance="outline" onPress={reset}>
            Reset
          </Button>
        </View>
        <AvatarFlightLayer flights={flights} />
      </View>
    );
  },
};
