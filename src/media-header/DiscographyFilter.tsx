import React, { memo, useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { Chip } from '../chip';
import { useInteractionState } from '../hooks/use-interaction-state';
import type { WebCssStyle } from '../styles/web-view-style';
import { webDataSet } from '../styles/web-data';
import { Text } from '../typography';
import { useMediaHeaderPaint } from './parts';
import type { DiscographyFilterOption, DiscographyFilterProps } from './types';
import { useMessages } from '../locale/messages';
import { MEDIA_HEADER_MESSAGES, type MediaHeaderMessages } from './messages';

/**
 * The heading and chips over an artist's discography.
 *
 *   heading    title-1-bold, with a "Show all" link at the right
 *   chips      `Chip` medium; the chosen one is `selected` (aria-pressed)
 */

/** The chips in a language's words. */
function discographyOptions(messages: MediaHeaderMessages): readonly DiscographyFilterOption[] {
  return [
    { value: 'albums', label: messages.albums },
    { value: 'singles', label: messages.singlesAndEps },
    { value: 'compilations', label: messages.compilations },
  ];
}

/** The English chips; the filter draws the locale's (`BloomProvider locale`) unless `options` is given. */
export const DEFAULT_DISCOGRAPHY_OPTIONS: readonly DiscographyFilterOption[] = discographyOptions(MEDIA_HEADER_MESSAGES.en);

function DiscographyFilterComponent({
  value,
  onValueChange,
  options: optionsProp,
  title: titleProp,
  onShowAll,
  showAllLabel: showAllLabelProp,
  style,
  testID,
}: DiscographyFilterProps) {
  const { messages } = useMessages(MEDIA_HEADER_MESSAGES);
  const options = useMemo(() => optionsProp ?? discographyOptions(messages), [optionsProp, messages]);
  // `null` is a deliberate "no heading"; only an absent title takes the catalog's.
  const title = titleProp === undefined ? messages.discography : titleProp;
  const showAllLabel = showAllLabelProp ?? messages.showAll;
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
