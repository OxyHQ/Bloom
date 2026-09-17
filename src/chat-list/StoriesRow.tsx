import React, { memo, useEffect, useMemo } from 'react';
import { ScrollView, View } from 'react-native';

import { Avatar } from '../avatar';
import { webDataSet } from '../checkbox/shared';
import { StoryRing } from '../chat-indicators';
import { RiAddFill } from '../icons/remix/RiAddFill';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import {
  CHAT_LIST_CSS,
  CHAT_LIST_STYLE_ID,
  resolveChatListPaint,
  sortStories,
} from './shared';
import type { StoriesRowProps } from './types';

/**
 * The strip of story rings above the conversations.
 *
 * "Your story" comes first with a `+` badge on its ring; the rest follow with
 * the UNSEEN ones before the seen (`seenLast`, on by default) — the point of the
 * row is what is new, and a seen ring that keeps its place pushes the new ones
 * off the right edge. The order is computed with a STABLE sort, so two unseen
 * stories keep the order the app gave them.
 *
 * Names sit under the rings, one line, clipped to the ring's footprint so the
 * row's rhythm survives a long name. The whole strip scrolls horizontally with
 * no visible scrollbar on web.
 *
 * ACCESSIBILITY: `role="list"` named by `accessibilityLabel`; each ring is a
 * button named by `StoryRing`'s own `accessibilityLabel` ("Ana Ferrer's story"),
 * and the caption under it is hidden so the name is announced once.
 */

const NAME_GAP = 6;

function StoriesRowComponent({
  stories,
  own,
  onStoryPress,
  onOwnPress,
  size = 60,
  seenLast = true,
  gap = 12,
  paddingHorizontal = 16,
  accessibilityLabel = 'Stories',
  labels,
  style,
  testID,
}: StoriesRowProps) {
  const theme = useTheme();
  useEffect(() => {
    adoptStyleSheet(CHAT_LIST_STYLE_ID, CHAT_LIST_CSS);
  }, []);
  const paint = useMemo(() => resolveChatListPaint(theme), [theme]);
  const ordered = useMemo(
    () => (seenLast ? sortStories(stories) : [...stories]),
    [seenLast, stories],
  );

  const ownName = own?.name ?? labels?.own ?? 'Your story';
  const addLabel = labels?.add ?? 'Add to your story';
  // The ring reserves `thickness + gap` on every side (2 + 2 by default), so the
  // caption column is the ring's real footprint, not the avatar's.
  const footprint = size + 8;

  const caption = (text: string) => (
    <View aria-hidden importantForAccessibility="no-hide-descendants">
      <Text
        variant="caption-1-regular"
        numberOfLines={1}
        style={{ color: paint.textMuted, maxWidth: footprint, textAlign: 'center' }}
      >
        {text}
      </Text>
    </View>
  );

  return (
    <ScrollView
      {...webDataSet({ bloomChatScrollX: '' })}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        flexDirection: 'row',
        gap,
        paddingLeft: paddingHorizontal,
        paddingRight: paddingHorizontal,
        paddingTop: 12,
        paddingBottom: 12,
      }}
      style={style}
      testID={testID}
    >
      <View
        role="list"
        accessibilityLabel={accessibilityLabel}
        style={{ flexDirection: 'row', gap }}
      >
        {own !== undefined ? (
          <View style={{ alignItems: 'center', gap: NAME_GAP, width: footprint }}>
            <StoryRing
              state={own.state ?? 'none'}
              size={size}
              onPress={onOwnPress}
              accessibilityLabel={addLabel}
              badge={
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: paint.accent,
                    borderWidth: 2,
                    borderColor: paint.background,
                  }}
                >
                  <RiAddFill width={14} height={14} fill={paint.onAccent} />
                </View>
              }
              testID={testID ? `${testID}-own` : undefined}
            >
              <Avatar source={own.avatar ?? null} name={ownName} size={size} />
            </StoryRing>
            {caption(ownName)}
          </View>
        ) : null}
        {ordered.map((story) => (
          <View
            key={story.id}
            style={{ alignItems: 'center', gap: NAME_GAP, width: footprint }}
          >
            <StoryRing
              state={story.state ?? 'unseen'}
              size={size}
              onPress={onStoryPress ? () => onStoryPress(story.id) : undefined}
              accessibilityLabel={`${story.name}'s story`}
              testID={testID ? `${testID}-story-${story.id}` : undefined}
            >
              <Avatar source={story.avatar ?? null} name={story.name} size={size} />
            </StoryRing>
            {caption(story.name)}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

export const StoriesRow = memo(StoriesRowComponent);
StoriesRow.displayName = 'StoriesRow';
