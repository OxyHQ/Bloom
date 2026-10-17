import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { BloomImage } from '../image';

import { AgentAvatar } from '../agent-avatar/AgentAvatar';
import { AGENT_AVATAR_MESSAGES } from '../agent-avatar/messages';
import { avatarCharacterOf, type ResolvedAvatarCharacter } from '../agent-avatar/character';
import { useCharacterStill } from '../agent-avatar/use-character-still';
import type { ImageSource } from '../shapes';
import { usePrefersReducedMotion } from '../hooks/use-prefers-reduced-motion';
import { useMessages } from '../locale/messages';
import { AVATAR_LIVE_SIZE } from './initials';
import type { AvatarMotion } from './types';

/**
 * Whether a character moves. Reduced motion and `'never'` always give a still; `'always'` always
 * moves; `'auto'` moves only where one avatar is the subject (profile-sized) or is working, so a
 * feed of dozens of bots is dozens of images.
 */
export function characterIsLive({
  motion = 'auto',
  size,
  working,
  reduced,
}: {
  motion?: AvatarMotion;
  size: number;
  working: boolean;
  reduced: boolean;
}): boolean {
  if (reduced || motion === 'never') return false;
  return motion === 'always' || size >= AVATAR_LIVE_SIZE || working;
}

export interface CharacterFaceProps {
  character: ResolvedAvatarCharacter;
  /** The character's still made ahead of time: drawn instead of rendering one, and under a live
   * character until its first frame. */
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

/**
 * A bot's character at avatar size. A still is an ordinary image — the caller's own `still`, else
 * one from the shared cache; a live character is one `AgentAvatar`, with the still (or the
 * placeholder) under it until its first frame.
 */
export function CharacterFace({
  character,
  still: provided,
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
  const label = alt !== undefined ? alt || undefined : (name ?? messages.label);
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
  // A still made ahead of time needs no render: the cache is not asked, so the runtime is not loaded.
  const drawn = useCharacterStill(character, size, !live && !provided);
  const still = provided ?? (drawn ? { uri: drawn } : undefined);
  const box = { width: size, height: size };
  // `AgentAvatar` resolves what it is handed, and a resolved character keeps its paint under
  // `paint`, where resolving again does not look: handed as is, every live character wore its
  // preset's paint (Alia, orchid, went blue). Written back as a character, it resolves to itself.
  const written = useMemo(() => avatarCharacterOf(character), [character]);

  if (live) {
    return (
      <View style={box}>
        {ready ? null : provided ? (
          <BloomImage
            source={provided}
            style={box}
            contentFit="contain"
            accessible={false}
            accessibilityIgnoresInvertColors
          />
        ) : (
          placeholder
        )}
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
  if (!still) return <>{placeholder}</>;
  return (
    <BloomImage
      source={still}
      style={box}
      contentFit="contain"
      accessible={label !== undefined}
      accessibilityRole="image"
      accessibilityLabel={label}
      accessibilityIgnoresInvertColors
    />
  );
}
