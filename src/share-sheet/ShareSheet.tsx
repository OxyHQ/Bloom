import type React from 'react';
import { memo } from 'react';
import { View } from 'react-native';

import { useBloomAppearance } from '../appearance';
import { ScrollArea } from '../layout/ScrollArea';
import { useCommonMessages } from '../locale/common-messages';
import { useMessages } from '../locale/messages';
import { Search } from '../search';
import * as Skeleton from '../skeleton';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { SHARE_SHEET_MESSAGES } from './messages';
import { SharePersonTile } from './SharePersonTile';
import { ShareTargetButton } from './ShareTargetButton';
import type { ShareSheetProps } from './types';

/**
 * `ShareSheet`: what a "send" button opens. It is the content of a bottom
 * sheet, not the sheet: the app presents it in its own `BottomSheet`.
 *
 *   title · search · a grid of people, four to a row · a row of other
 *   destinations (copy link, another app, the system sheet)
 *
 * The consumer owns who the people are and what pressing one does (open a
 * conversation, send, select); the sheet owns how they look. It renders flat
 * content and does not scroll vertically: the sheet it sits in owns that
 * overflow. The targets row is its own sideways scroller, the one region that
 * moves independently.
 *
 * Loading draws placeholder tiles only while `people` is empty, so refetching
 * a list that is already shown does not blank it.
 */

/** Avatar diameter and target disc per size. */
const AVATAR = { sm: 48, md: 56, lg: 64 } as const;
const DISC = { sm: 44, md: 52, lg: 56 } as const;

/** Placeholder tiles: two rows of the grid. */
const PLACEHOLDERS = 8;

/**
 * Space left at the top for the sheet's drag handle, which `BottomSheet` draws
 * as an overlay (10px down, 5px tall) over the content: the same 20px
 * clearance a `SheetShell` body keeps below its handle. Without it the title
 * sits under the pill.
 */
const HANDLE_CLEARANCE = 20;

function ShareSheetComponent({
  title,
  search,
  people,
  onPersonPress,
  peopleLoading = false,
  peopleEmpty,
  targets,
  size: sizeProp,
  locale,
  style,
  testID,
}: ShareSheetProps) {
  const { size: inherited } = useBloomAppearance(
    { size: sizeProp },
    { size: 'md', tone: 'neutral' },
  );
  const size = inherited === 'xs' ? 'sm' : inherited;
  const { colors } = useTheme();
  const { messages } = useMessages(SHARE_SHEET_MESSAGES, locale);
  const common = useCommonMessages(locale);
  const heading = title === undefined ? messages.title : title;
  const avatarSize = AVATAR[size];

  let peopleBody: React.ReactNode = null;
  if (people !== undefined) {
    if (people.length > 0) {
      peopleBody = people.map((person) => (
        <SharePersonTile
          key={person.id}
          person={person}
          avatarSize={avatarSize}
          accessibilityLabel={messages.sendTo(person.name)}
          colors={colors}
          onPress={onPersonPress}
          testID={testID ? `${testID}-person-${person.id}` : undefined}
        />
      ));
    } else if (peopleLoading) {
      peopleBody = (
        <Skeleton.Region testID={testID ? `${testID}-people-loading` : undefined}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {Array.from({ length: PLACEHOLDERS }, (_, index) => (
              <View
                // biome-ignore lint/suspicious/noArrayIndexKey: identical placeholders with no identity of their own.
                key={index}
                style={{
                  flexBasis: '25%',
                  maxWidth: '25%',
                  alignItems: 'center',
                  gap: 8,
                  paddingTop: 8,
                  paddingBottom: 8,
                }}
              >
                <Skeleton.Circle size={avatarSize} />
                <Skeleton.Text style={{ width: avatarSize, lineHeight: 16 }} />
              </View>
            ))}
          </View>
        </Skeleton.Region>
      );
    } else {
      peopleBody = peopleEmpty ?? (
        <Text
          variant="body-regular"
          style={{
            color: colors.textSecondary,
            textAlign: 'center',
            paddingTop: 24,
            paddingBottom: 24,
          }}
          testID={testID ? `${testID}-people-empty` : undefined}
        >
          {messages.noPeople}
        </Text>
      );
    }
  }

  return (
    <View
      style={[{ gap: 12, paddingTop: HANDLE_CLEARANCE, paddingBottom: 16 }, style]}
      testID={testID}
    >
      {heading ? (
        <Text
          variant="body-semibold"
          role="heading"
          style={{ color: colors.text, textAlign: 'center' }}
        >
          {heading}
        </Text>
      ) : null}
      {search ? (
        <View style={{ paddingLeft: 16, paddingRight: 16 }}>
          <Search
            value={search.value}
            onValueChange={search.onValueChange}
            label={search.placeholder ?? common.search}
            onSubmitEditing={search.onSubmit}
            onClearText={() => search.onValueChange('')}
            testID={testID ? `${testID}-search` : undefined}
          />
        </View>
      ) : null}
      {people !== undefined ? (
        <View
          role="list"
          accessibilityLabel={messages.people}
          style={
            people.length > 0
              ? { flexDirection: 'row', flexWrap: 'wrap', paddingLeft: 8, paddingRight: 8 }
              : { paddingLeft: 16, paddingRight: 16 }
          }
          testID={testID ? `${testID}-people` : undefined}
        >
          {peopleBody}
        </View>
      ) : null}
      {targets && targets.length > 0 ? (
        <View
          style={{
            borderTopWidth: people !== undefined ? 1 : 0,
            borderTopColor: colors.border,
            paddingTop: 12,
          }}
        >
          <ScrollArea
            horizontal
            showsHorizontalScrollIndicator={false}
            accessibilityLabel={messages.targets}
            contentContainerStyle={{
              flexDirection: 'row',
              gap: 4,
              paddingLeft: 8,
              paddingRight: 8,
            }}
            testID={testID ? `${testID}-targets` : undefined}
          >
            {targets.map((target) => (
              <ShareTargetButton
                key={target.key}
                target={target}
                circleSize={DISC[size]}
                colors={colors}
              />
            ))}
          </ScrollArea>
        </View>
      ) : null}
    </View>
  );
}

export const ShareSheet = memo(ShareSheetComponent);
ShareSheet.displayName = 'ShareSheet';
