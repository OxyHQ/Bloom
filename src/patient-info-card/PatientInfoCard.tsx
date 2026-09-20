import React, { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Avatar } from '../avatar';
import { Button } from '../button';
import { RiAddLine } from '../icons/remix/RiAddLine';
import { resolveDashboardSurfaces } from '../stat-cards/tones';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import type { PatientInfoCardProps } from './types';

/**
 * The patient info card. Geometry, to the pixel:
 *
 *   card     330 tall, radius 20, padding 24 top / 10 sides / 10 bottom,
 *            centred column, 15 apart (Figma's absolute positions — avatar
 *            bottom 90 → name 105 → details 146 — not a spacing step)
 *   avatar   66, initials 24.75 semibold (its 1.5 line: the arbitrary size drops
 *            the `lg` leading), on the neutral disc;
 *            a 24px secondary icon button pinned 2px outside its top-right
 *   name     20/26 medium, one line
 *   rows     fill the rest, 10 apart; radius 10, padding 8 / 10;
 *            icon 16 + 6 + label 14/20 regular (secondary) … value 14/20 medium
 */

const AVATAR_SIZE = 66;

function PatientInfoCardComponent({
  name,
  avatarSource,
  initials,
  details,
  onAddPhoto,
  addPhotoLabel = 'Add profile photo',
  hideAddPhoto = false,
  height = 330,
  style,
  testID,
}: PatientInfoCardProps) {
  const theme = useTheme();
  const surfaces = useMemo(() => resolveDashboardSurfaces(theme), [theme]);
  const letters = initials ?? name.trim().charAt(0).toUpperCase();

  return (
    <View
      testID={testID}
      style={[styles.card, { height, backgroundColor: surfaces.secondary }, style]}
    >
      <View style={styles.avatarWrap}>
        <Avatar
          testID={testID ? `${testID}-avatar` : undefined}
          size={AVATAR_SIZE}
          source={avatarSource ?? undefined}
          initials={letters}
          color="neutral"
          alt={avatarSource ? name : undefined}
          // The `lg` initials are overridden to 24.75px (Tailwind's 1.5 line).
          placeholderIcon={
            <Text
              allowFontScaling={false}
              numberOfLines={1}
              style={[styles.initials, { color: surfaces.textSecondary }]}
            >
              {letters}
            </Text>
          }
        />
        {hideAddPhoto ? null : (
          <View style={styles.addPhoto}>
            <Button testID={testID ? `${testID}-add-photo` : undefined} size="xs" icon={RiAddLine} accessibilityLabel={addPhotoLabel} onPress={onAddPhoto} appearance="subtle" tone="neutral" />
          </View>
        )}
      </View>

      <Text variant="title-2-medium" numberOfLines={1} style={{ color: surfaces.text }}>
        {name}
      </Text>

      <View style={styles.details}>
        {details.map((detail, index) => {
          const Icon = detail.icon;
          return (
            <View
              key={`${detail.label}-${index}`}
              testID={testID ? `${testID}-detail-${index}` : undefined}
              style={[styles.row, { backgroundColor: surfaces.inner }]}
            >
              <View style={styles.rowLabel}>
                <Icon width={16} height={16} fill={surfaces.textSecondary} />
                <Text
                  variant="body-regular"
                  numberOfLines={1}
                  style={{ color: surfaces.textSecondary }}
                >
                  {detail.label}
                </Text>
              </View>
              <Text variant="body-medium" numberOfLines={1} style={{ color: surfaces.text }}>
                {detail.value}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export const PatientInfoCard = memo(PatientInfoCardComponent);
PatientInfoCard.displayName = 'PatientInfoCard';

const styles = StyleSheet.create({
  card: {
    width: '100%',
    minWidth: 0,
    alignItems: 'center',
    gap: 15,
    borderRadius: 20,
    paddingTop: 24,
    paddingBottom: 10,
    paddingLeft: 10,
    paddingRight: 10,
  },
  avatarWrap: { position: 'relative' },
  initials: { fontSize: 24.75, lineHeight: 37.125, fontWeight: '600', letterSpacing: 0, textAlign: 'center' },
  addPhoto: { position: 'absolute', top: -2, right: -2 },
  details: { width: '100%', flexGrow: 1, flexShrink: 1, flexBasis: 0, gap: 10 },
  row: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 10,
    paddingRight: 10,
  },
  rowLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
