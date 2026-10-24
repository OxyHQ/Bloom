import { ScrollArea } from '../layout/ScrollArea';
import { memo, useEffect, useMemo } from 'react';
import { View } from 'react-native';

import { Avatar } from '../avatar';
import { webDataSet } from '../styles/web-data';
import { StoryRing } from '../chat-indicators';
import { RiAddFill } from '../icons/remix/RiAddFill';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { CHAT_LIST_CSS, CHAT_LIST_STYLE_ID, resolveChatListPaint, sortStories } from './shared';
import type { StoriesRowProps } from './types';
import { useMessages } from '../locale/messages';
import { CHAT_LIST_MESSAGES } from './messages';

/**
 * The strip of story rings above the conversations.
 *
 * "Your story" comes first with a `+` badge on its ring; the rest follow with
 * the UNSEEN ones before the seen (`seenLast`, on by default) — the point of the
 * row is what is new, and a seen ring that keeps its place pushes the new ones
 * off the right edge. The order is computed with a STABLE sort, so two unseen
 * stories keep the order the app gave them.
 *
 * Names sit under the rings, one line, in a caption column as wide as the
 * entry's whole SLOT (the ring's footprint plus the gap to its neighbour), so a
 * long name is clipped there and the row's rhythm survives it. Your own
 * caption is the LABEL ("Your story"), never your name, and may take two lines
 * rather than truncate a short phrase; the avatar is drawn from `own.name` and
 * `own.avatar`, so with no name it shows the placeholder, not the label's first
 * letter. The whole strip scrolls horizontally with no visible scrollbar on web.
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
  accessibilityLabel: accessibilityLabelProp,
  labels,
  style,
  testID,
}: StoriesRowProps) {
  const theme = useTheme();
  const { messages } = useMessages(CHAT_LIST_MESSAGES);
  const accessibilityLabel = accessibilityLabelProp ?? messages.stories;
  useEffect(() => {
    adoptStyleSheet(CHAT_LIST_STYLE_ID, CHAT_LIST_CSS);
  }, []);
  const paint = useMemo(() => resolveChatListPaint(theme), [theme]);
  const ordered = useMemo(
    () => (seenLast ? sortStories(stories) : [...stories]),
    [seenLast, stories],
  );

  // The caption and the avatar are TWO strings. One string for both drew the
  // label's first letter ("Y" of "Your status") as the avatar's initial when the
  // app passed no name, and the person's name as the caption when it did.
  const ownCaption = labels?.own ?? messages.ownStory;
  const addLabel = labels?.add ?? messages.addStory;
  // The ring reserves `thickness + gap` on every side (2 + 2 by default), so the
  // ring's real footprint is that, not the avatar's.
  const footprint = size + 8;
  // A caption may use the entry's whole SLOT, the footprint plus the gap to the
  // next entry: capped at the footprint alone (68px at the default size) it cut
  // "Your status" to "Your sta…". The column is centred under the ring and
  // overflows the footprint by half a gap on each side, so the rings keep their
  // spacing exactly.
  const captionWidth = footprint + gap;

  const caption = (text: string, lines: number, captionTestID?: string) => (
    <View
      aria-hidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: captionWidth, alignItems: 'center' }}
      testID={captionTestID}
    >
      <Text
        variant="caption-1-regular"
        numberOfLines={lines}
        style={{ color: paint.textMuted, maxWidth: captionWidth, textAlign: 'center' }}
      >
        {text}
      </Text>
    </View>
  );

  return (
    <ScrollArea
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
              <Avatar source={own.avatar ?? null} name={own.name} size={size} />
            </StoryRing>
            {caption(ownCaption, 2, testID ? `${testID}-own-caption` : undefined)}
          </View>
        ) : null}
        {ordered.map((story) => (
          <View key={story.id} style={{ alignItems: 'center', gap: NAME_GAP, width: footprint }}>
            <StoryRing
              state={story.state ?? 'unseen'}
              size={size}
              onPress={onStoryPress ? () => onStoryPress(story.id) : undefined}
              accessibilityLabel={messages.storyOf(story.name)}
              testID={testID ? `${testID}-story-${story.id}` : undefined}
            >
              <Avatar source={story.avatar ?? null} name={story.name} size={size} />
            </StoryRing>
            {caption(story.name, 1)}
          </View>
        ))}
      </View>
    </ScrollArea>
  );
}

export const StoriesRow = memo(StoriesRowComponent);
StoriesRow.displayName = 'StoriesRow';
