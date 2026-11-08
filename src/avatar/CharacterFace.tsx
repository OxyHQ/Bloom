import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { AgentAvatar } from '../agent-avatar/AgentAvatar';
import { AGENT_AVATAR_MESSAGES } from '../agent-avatar/messages';
import { avatarCharacterOf, type ResolvedAvatarCharacter } from '../agent-avatar/character';
import type { ImageSource } from '../shapes';
import { usePrefersReducedMotion } from '../hooks/use-prefers-reduced-motion';
import { useMessages } from '../locale/messages';
import type { AvatarMotion } from './types';

/** Visible characters animate at every size; explicit never and reduced motion win. */
export function characterIsLive({
  motion = 'auto',
  reduced,
}: {
  motion?: AvatarMotion;
  size: number;
  working: boolean;
  reduced: boolean;
}): boolean {
  if (reduced || motion === 'never') return false;
  return true;
}

export interface CharacterFaceProps {
  character: ResolvedAvatarCharacter;
  /** @deprecated Saved raster portraits are ignored; the character recipe supplies its SVG. */
  still?: ImageSource;
  size: number;
  motion?: AvatarMotion;
  activity?: 'idle' | 'working';
  workingKey?: number;
  reactionKey?: number;
  /**
   * The avatar's `alt`: `""` makes the face decorative, any other value is its
   * accessible name. When absent, the face is named after {@link name}, then
   * "Agent avatar".
   */
  alt?: string;
  /** The account's display name or handle, when it has one. */
  name?: string;
  /** Drawn at the same size until the picture is there: reserves the box, so nothing jumps. */
  placeholder: ReactNode;
}

/** Visible characters share the live SVG engine; explicit stills reuse cached portraits. */
export function CharacterFace({
  character,
  still: _provided,
  size,
  motion,
  activity,
  workingKey,
  reactionKey,
  alt,
  name,
  placeholder,
}: CharacterFaceProps) {
  // Read here, not in `Avatar`: only an account with a character mounts this,
  // so every other avatar skips the locale lookup (one context read and one
  // hook per avatar, on every feed row that draws one).
  const { messages } = useMessages(AGENT_AVATAR_MESSAGES);
  const label = alt !== undefined ? alt : (name ?? messages.label);
  const reduced = usePrefersReducedMotion();
  const working = activity === 'working';
  const live = characterIsLive({ motion, size, working, reduced });
  const [ready, setReady] = useState(false);
  const [episodes, setEpisodes] = useState(0);
  useEffect(() => {
    if (!live) setReady(false);
  }, [live]);
  // `AgentAvatar` starts an episode when its key CHANGES, and a character that mounts working
  // has no earlier key: the first episode begins once its first frame is up.
  useEffect(() => {
    if (live && ready && working) setEpisodes((count) => count + 1);
  }, [live, ready, working]);
  const box = { width: size, height: size };
  // `AgentAvatar` resolves what it is handed, and a resolved character keeps its paint under
  // `paint`, where resolving again does not look: handed as is, every live character wore its
  // preset's paint (Alia, orchid, went blue). Written back as a character, it resolves to itself.
  const written = useMemo(() => avatarCharacterOf(character), [character]);

  if (live) {
    return (
      <View style={box}>
        {ready ? null : placeholder}
        <View style={ready ? box : { position: 'absolute', left: 0, top: 0, ...box }}>
          <AgentAvatar
            character={written}
            size={size}
            workingKey={workingKey ?? (episodes > 0 ? episodes : undefined)}
            reactionKey={reactionKey}
            onReady={() => setReady(true)}
            accessibilityLabel={label}
          />
        </View>
      </View>
    );
  }
  return (
    <View style={box}>
      {ready ? null : placeholder}
      <View style={ready ? box : { position: 'absolute', left: 0, top: 0, ...box }}>
        <AgentAvatar
          character={written}
          size={size}
          portrait
          paused
          interactive={false}
          accessibilityLabel={label}
          onReady={() => setReady(true)}
        />
      </View>
    </View>
  );
}
