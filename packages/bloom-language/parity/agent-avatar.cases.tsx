import { Pressable } from 'react-native';
import { AgentAvatar } from '@oxy.so/bloom/agent-avatar';

import { AVATAR_SIZE, ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import { type AvatarSizeName, defineTokens } from '../src/tokens';
import type { ParityCase } from './support/cases';

const BERET = { preset: 'blue_beret' } as const;
const hero = defineTokens({ avatarSize: { hero: 96 } });
const onPress = () => {};

export const AGENT_AVATAR_CASES: ParityCase[] = [
  {
    name: 'AgentAvatar',
    language: () => toElement(L.AgentAvatar(BERET)),
    bloom: () => <AgentAvatar character={BERET} />,
  },
  // In view as the page loads: the renderer draws an avatar once it is on screen.
  {
    name: 'AgentAvatar pressable',
    language: () => toElement(L.AgentAvatar(BERET).onPress(onPress).label('Open Ana')),
    bloom: () => (
      <Pressable onPress={onPress} accessibilityLabel="Open Ana">
        <AgentAvatar character={BERET} />
      </Pressable>
    ),
  },
  ...(Object.keys(AVATAR_SIZE) as AvatarSizeName[]).map((size) => ({
    name: `AgentAvatar size ${size}`,
    language: () => toElement(L.AgentAvatar(BERET).size(size)),
    bloom: () => <AgentAvatar character={BERET} size={AVATAR_SIZE[size]} />,
  })),
  {
    name: 'AgentAvatar an app size',
    language: () => toElement(L.AgentAvatar(BERET).size(hero.avatarSize.hero)),
    bloom: () => <AgentAvatar character={BERET} size={96} />,
  },
  ...ENUMS.agentMood.map((mood) => ({
    name: `AgentAvatar mood ${mood}`,
    language: () => toElement(L.AgentAvatar(BERET).mood(mood)),
    bloom: () => <AgentAvatar character={BERET} mood={mood} />,
  })),
  {
    name: 'AgentAvatar paused, interactive',
    language: () => toElement(L.AgentAvatar(BERET).paused(true).interactive()),
    bloom: () => <AgentAvatar character={BERET} paused interactive />,
  },
  {
    name: 'AgentAvatar portrait',
    language: () => toElement(L.AgentAvatar(BERET).portrait().size('xl')),
    bloom: () => <AgentAvatar character={BERET} portrait size={40} />,
  },
  {
    name: 'AgentAvatar with its keys, named',
    language: () =>
      toElement(
        L.AgentAvatar(
          { preset: 'lime_frog' },
          { reactionKey: 2, entranceKey: 1, workingKey: 3, workingCycles: 2 },
        ).label('Ana'),
      ),
    bloom: () => (
      <AgentAvatar
        character={{ preset: 'lime_frog' }}
        reactionKey={2}
        entranceKey={1}
        workingKey={3}
        workingCycles={2}
        accessibilityLabel="Ana"
      />
    ),
  },
  {
    name: 'AgentAvatar padded',
    language: () => toElement(L.AgentAvatar(BERET).padding('sm')),
    bloom: () => (
      <AgentAvatar
        character={BERET}
        style={{ paddingTop: 8, paddingBottom: 8, paddingStart: 8, paddingEnd: 8 }}
      />
    ),
  },
];
