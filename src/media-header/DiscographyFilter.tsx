import React, { memo } from 'react';
import { Pressable, View } from 'react-native';

import { Chip } from '../chip';
import { useInteractionState } from '../hooks/use-interaction-state';
import type { WebCssStyle } from '../styles/web-view-style';
import { webDataSet } from '../styles/web-data';
import { Text } from '../typography';
import { useMediaHeaderPaint } from './parts';
import type { DiscographyFilterOption, DiscographyFilterProps } from './types';

/**
 * The heading and chips over an artist's discography.
 *
 *   heading    title-1-bold, with a "Show all" link at the right
 *   chips      `Chip` medium; the chosen one is `selected` (aria-pressed)
 */

export const DEFAULT_DISCOGRAPHY_OPTIONS: readonly DiscographyFilterOption[] = [
  { value: 'albums', label: 'Albums' },
  { value: 'singles', label: 'Singles and EPs' },
  { value: 'compilations', label: 'Compilations' },
];

function DiscographyFilterComponent({
  value,
  onValueChange,
  options = DEFAULT_DISCOGRAPHY_OPTIONS,
  title = 'Discography',
  onShowAll,
  showAllLabel = 'Show all',
  style,
  testID,
}: DiscographyFilterProps) {
  const paint = useMediaHeaderPaint();
  const { state: hovered, onIn, onOut } = useInteractionState();
  const linkStyle: WebCssStyle = { borderRadius: 4, '--bloom-media-header-ring': paint.ring };
  return (
    <View style={[{ gap: 12 }, style]} testID={testID}>
      {title !== null || onShowAll ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          {title !== null ? (
            <Text variant="title-1-bold" role="heading" aria-level={2} style={{ color: paint.text }}>
              {title}
            </Text>
          ) : (
            <View />
          )}
          {onShowAll ? (
            <Pressable
              {...webDataSet({ bloomMediaHeaderPress: '' })}
              role="link"
              accessibilityLabel={showAllLabel}
              onPress={onShowAll}
              onHoverIn={onIn}
              onHoverOut={onOut}
              style={linkStyle}
            >
              <Text
                variant="body-semibold"
                style={{ color: paint.textMuted, textDecorationLine: hovered ? 'underline' : 'none' }}
              >
                {showAllLabel}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {options.map((option) => (
          <Chip
            key={option.value}
            size="medium"
            selected={option.value === value}
            onPress={() => onValueChange(option.value)}
            accessibilityLabel={option.label}
            testID={testID ? `${testID}-${option.value}` : undefined}
          >
            {option.label}
          </Chip>
        ))}
      </View>
    </View>
  );
}

export const DiscographyFilter = memo(DiscographyFilterComponent);
DiscographyFilter.displayName = 'DiscographyFilter';
