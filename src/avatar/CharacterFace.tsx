import { useEffect, useState, type ReactNode } from 'react';
import { Image, View } from 'react-native';

import { AgentAvatar } from '../agent-avatar/AgentAvatar';
import type { ResolvedAvatarCharacter } from '../agent-avatar/character';
import { useCharacterStill } from '../agent-avatar/use-character-still';
import { usePrefersReducedMotion } from '../hooks/use-prefers-reduced-motion';
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
  size: number;
  motion?: AvatarMotion;
  activity?: 'idle' | 'working';
  workingKey?: number;
  reactionKey?: number;
  /** The accessible name; `undefined` makes the face decorative. */
  label?: string;
  /** Drawn at the same size until the picture is there: reserves the box, so nothing jumps. */
  placeholder: ReactNode;
}

/**
 * A bot's character at avatar size. A still is an ordinary image from the shared cache; a live
 * character is one `AgentAvatar`, with the placeholder under it until its first frame.
 */
export function CharacterFace({
  character,
  size,
  motion,
  activity,
  workingKey,
  reactionKey,
  label,
  placeholder,
}: CharacterFaceProps) {
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
  const still = useCharacterStill(character, size, !live);
  const box = { width: size, height: size };

  if (live) {
    return (
      <View style={box}>
        {!ready ? placeholder : null}
        <View style={ready ? box : { position: 'absolute', left: 0, top: 0, ...box }}>
          <AgentAvatar
            character={character}
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
    <Image
      source={{ uri: still }}
      style={box}
      resizeMode="contain"
      accessible={label !== undefined}
      accessibilityRole="image"
      accessibilityLabel={label}
      accessibilityIgnoresInvertColors
    />
  );
}
