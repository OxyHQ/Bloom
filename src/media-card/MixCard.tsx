import React, { memo, useMemo } from 'react';
import { Image, View } from 'react-native';

import { useImageResolver } from '../image-resolver/context';
import { borderRadius } from '../styles/tokens';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import type { TypeScaleVariant } from '../typography/scale';
import { MediaCard } from './MediaCard';
import { CoverGradient } from './parts';
import { joinMeta, resolveArtworkUri, resolveCoverTint } from './shared';
import type { MixCardProps, MediaCardSize } from './types';

const COVER_TITLE: Record<MediaCardSize, TypeScaleVariant> = {
  large: 'title-2-bold',
  medium: 'title-3-bold',
  small: 'headline-bold',
};
const FACE: Record<MediaCardSize, number> = { large: 32, medium: 28, small: 22 };

/**
 * A generated mix (a radio, a daily mix): the cover IS generated — a gradient
 * from `artworkColor`, stepped dark enough for light text (neutral without a
 * colour) — with "Mix" and the cover title drawn big top-left and up to four
 * artist faces overlapping bottom-left, each ringed in the cover colour. A row
 * draws the gradient and the faces only; its line reads "Mix · description".
 *
 * Name: "Daily Mix 2, Mix, Mara Vell, Juno Park and more".
 */
function MixCardComponent({
  title,
  artworkColor,
  coverTitle,
  faces,
  description,
  typeLabel = 'Mix',
  layout = 'tile',
  size = 'medium',
  testID,
  ...rest
}: MixCardProps) {
  const theme = useTheme();
  const resolver = useImageResolver();
  const tint = useMemo(() => resolveCoverTint(theme, artworkColor), [theme, artworkColor]);
  const row = layout === 'row';
  const face = row ? 18 : FACE[size];
  const pad = row ? 6 : size === 'small' ? 10 : 14;
  const shown = (faces ?? []).slice(0, row ? 2 : 4);

  return (
    <MediaCard
      {...rest}
      title={title}
      layout={layout}
      size={size}
      testID={testID}
      typeLabel={typeLabel}
      subtitle={row ? joinMeta([typeLabel, description]) : description}
      subtitleLines={row ? 1 : 2}
      accessibilityLabel={rest.accessibilityLabel ?? [title, typeLabel, description].filter(Boolean).join(', ')}
      renderArtwork={() => (
        <View style={{ width: '100%', height: '100%' }} testID={testID ? `${testID}-cover` : undefined}>
          <CoverGradient top={tint.top} bottom={tint.bottom} />
          {!row ? (
            <View style={{ position: 'absolute', top: pad, left: pad, right: pad, gap: 2 }}>
              <Text variant="caption-1-semibold" numberOfLines={1} style={{ color: tint.textMuted }}>
                {typeLabel}
              </Text>
              <Text variant={COVER_TITLE[size]} numberOfLines={3} style={{ color: tint.text }}>
                {coverTitle ?? title}
              </Text>
            </View>
          ) : null}
          {shown.length > 0 ? (
            <View style={{ position: 'absolute', left: pad, bottom: pad, flexDirection: 'row' }}>
              {shown.map((source, index) => {
                const uri = resolveArtworkUri(source, resolver);
                return (
                  <View
                    key={`${index}-${source}`}
                    style={{
                      width: face + 4,
                      height: face + 4,
                      marginLeft: index === 0 ? 0 : -Math.round(face * 0.3),
                      borderRadius: borderRadius.full,
                      backgroundColor: tint.top,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {uri ? (
                      <Image
                        source={{ uri }}
                        resizeMode="cover"
                        style={{ width: face, height: face, borderRadius: borderRadius.full }}
                      />
                    ) : null}
                  </View>
                );
              })}
            </View>
          ) : null}
        </View>
      )}
    />
  );
}

export const MixCard = memo(MixCardComponent);
MixCard.displayName = 'MixCard';
