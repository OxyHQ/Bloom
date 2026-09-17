import React, { useState, type ComponentType } from 'react';
import { Image, View, type StyleProp, type ViewStyle } from 'react-native';

import { RiBookOpenLine } from '../icons/remix/RiBookOpenLine';
import { RiFolderLine } from '../icons/remix/RiFolderLine';
import { RiMic2Line } from '../icons/remix/RiMic2Line';
import { RiMusic2Line } from '../icons/remix/RiMusic2Line';
import { RiUserLine } from '../icons/remix/RiUserLine';
import { useImageResolver } from '../image-resolver/context';
import { isImageUrl } from '../image-resolver/is-image-url';
import type { LibraryItemKind } from './types';

// ---------------------------------------------------------------------------
//  Cover
// ---------------------------------------------------------------------------

type Glyph = ComponentType<{ width?: number; height?: number; fill?: string }>;

const KIND_GLYPH: Record<LibraryItemKind | 'song' | 'profile' | 'episode', Glyph> = {
  playlist: RiMusic2Line,
  album: RiMusic2Line,
  song: RiMusic2Line,
  artist: RiUserLine,
  profile: RiUserLine,
  podcast: RiMic2Line,
  episode: RiMic2Line,
  audiobook: RiBookOpenLine,
  folder: RiFolderLine,
};

export interface CoverProps {
  source?: string | null;
  size: number;
  round?: boolean;
  radius?: number;
  kind: keyof typeof KIND_GLYPH;
  placeholder: string;
  glyphColor: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Artwork, decorative (the row names itself). A neutral tile with the kind's glyph when empty. */
export function Cover({ source, size, round, radius = 4, kind, placeholder, glyphColor, style, testID }: CoverProps) {
  const resolver = useImageResolver();
  const [failed, setFailed] = useState(false);
  const uri = source ? (isImageUrl(source) ? source : resolver?.(source) ?? undefined) : undefined;
  const Glyph = KIND_GLYPH[kind];
  const glyph = Math.round(size * 0.45);
  return (
    <View
      testID={testID}
      aria-hidden
      style={[
        {
          width: size,
          height: size,
          borderRadius: round ? size / 2 : radius,
          backgroundColor: placeholder,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        },
        style,
      ]}
    >
      {uri && !failed ? (
        <Image
          source={{ uri }}
          onError={() => setFailed(true)}
          style={{ width: size, height: size }}
          resizeMode="cover"
        />
      ) : (
        <Glyph width={glyph} height={glyph} fill={glyphColor} />
      )}
    </View>
  );
}
