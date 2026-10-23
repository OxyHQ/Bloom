import { memo } from 'react';
import { Pressable } from 'react-native';

import { AvatarPresence } from '../chat-indicators/AvatarPresence';
import type { PersonSummary } from '../chat-people/types';
import { useInteractionState } from '../hooks/use-interaction-state';
import type { Theme } from '../theme/types';
import { Text } from '../typography';

interface SharePersonTileProps {
  person: PersonSummary;
  avatarSize: number;
  /** "Send to Ana": the tile's name says what pressing it does. */
  accessibilityLabel: string;
  colors: Theme['colors'];
  onPress?: (id: string) => void;
  testID?: string;
}

/**
 * One person in the grid: the avatar over the name, centred in its column.
 * The column width is the grid's (a quarter of the row); the tile only fills it.
 */
function SharePersonTileComponent({
  person,
  avatarSize,
  accessibilityLabel,
  colors,
  onPress,
  testID,
}: SharePersonTileProps) {
  const { state: hovered, onIn, onOut } = useInteractionState();
  return (
    <Pressable
      role="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress ? () => onPress(person.id) : undefined}
      disabled={onPress === undefined}
      onHoverIn={onIn}
      onHoverOut={onOut}
      style={({ pressed }) => ({
        flexBasis: '25%',
        maxWidth: '25%',
        alignItems: 'center',
        gap: 6,
        paddingTop: 8,
        paddingBottom: 8,
        paddingLeft: 4,
        paddingRight: 4,
        borderRadius: 12,
        backgroundColor: pressed || hovered ? colors.backgroundSecondary : 'transparent',
      })}
      testID={testID}
    >
      <AvatarPresence
        source={person.avatar}
        variant={person.avatarVariant}
        name={person.name}
        size={avatarSize}
        status={person.status}
        presenceRingColor={colors.background}
        presenceLabel=""
      />
      <Text
        variant="caption-1-regular"
        numberOfLines={2}
        style={{ color: colors.text, textAlign: 'center' }}
      >
        {person.name}
      </Text>
    </Pressable>
  );
}

export const SharePersonTile = memo(SharePersonTileComponent);
SharePersonTile.displayName = 'SharePersonTile';
