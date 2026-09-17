import React, { memo, useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Avatar } from '../avatar/Avatar';
import { RiCloseLine } from '../icons/remix/RiCloseLine';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { resolveChatPeoplePaint } from './shared';
import type { PersonSummary, SelectedChipsRowProps } from './types';

/**
 * `SelectedChipsRow`: the people already picked, above the search field.
 *
 *   one 32-tall pill each — 24 avatar, the name in `body-2-medium`, a × button
 *   layout="scroll"  one row that scrolls sideways (the default): a picker
 *                    whose chip row grows downwards pushes the field and the
 *                    list it is filtering off the screen as you type
 *   layout="wrap"    every chip visible, for a sheet that has the room
 *
 * The × is its OWN button inside the chip, named "Remove <name>". The chip
 * itself is not pressable: there is nothing else it could do, and a chip that
 * removes on any press removes people who were only being read.
 */

const CHIP_HEIGHT = 32;

function PersonChip({
  person,
  onRemove,
  removeLabel,
  paint,
  testID,
}: {
  person: PersonSummary;
  onRemove?: () => void;
  removeLabel: string;
  paint: ReturnType<typeof resolveChatPeoplePaint>;
  testID?: string;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        height: CHIP_HEIGHT,
        borderRadius: CHIP_HEIGHT / 2,
        backgroundColor: paint.chip,
        paddingTop: 0,
        paddingRight: onRemove === undefined ? 12 : 4,
        paddingBottom: 0,
        paddingLeft: 4,
        maxWidth: 200,
      }}
      testID={testID}
    >
      <Avatar
        source={person.avatar}
        variant={person.avatarVariant}
        name={person.name}
        size={24}
      />
      <Text
        variant="body-2-medium"
        numberOfLines={1}
        style={{ color: paint.onChip, flexShrink: 1 }}
      >
        {person.name}
      </Text>
      {onRemove === undefined ? null : (
        <Pressable
          role="button"
          accessibilityLabel={removeLabel}
          onPress={onRemove}
          hitSlop={{ top: 6, bottom: 6, left: 4, right: 6 }}
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          testID={testID ? `${testID}-remove` : undefined}
        >
          <RiCloseLine width={14} height={14} fill={paint.textSecondary} />
        </Pressable>
      )}
    </View>
  );
}

function SelectedChipsRowComponent({
  people,
  onRemove,
  layout = 'scroll',
  formatRemoveLabel,
  emptyState,
  style,
  testID,
}: SelectedChipsRowProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveChatPeoplePaint(theme), [theme]);
  const removeLabel = formatRemoveLabel ?? ((name: string) => `Remove ${name}`);

  if (people.length === 0) {
    return emptyState === undefined ? null : (
      <View style={style} testID={testID}>
        {emptyState}
      </View>
    );
  }

  const chips = people.map((person) => (
    <PersonChip
      key={person.id}
      person={person}
      paint={paint}
      removeLabel={removeLabel(person.name)}
      onRemove={onRemove === undefined ? undefined : () => onRemove(person.id)}
      testID={testID ? `${testID}-chip-${person.id}` : undefined}
    />
  ));

  if (layout === 'wrap') {
    return (
      <View
        style={[{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, style]}
        testID={testID}
      >
        {chips}
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={style}
      contentContainerStyle={{ flexDirection: 'row', gap: 8, paddingRight: 4, paddingLeft: 4 }}
      testID={testID}
    >
      {chips}
    </ScrollView>
  );
}

export const SelectedChipsRow = memo(SelectedChipsRowComponent);
SelectedChipsRow.displayName = 'SelectedChipsRow';
