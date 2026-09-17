import React from 'react';
import { StyleSheet, View } from 'react-native';

import { borderRadius } from '../styles/tokens';
import { Text } from '../typography';
import { useSettingsPalette } from './context';
import { RadialFade, SettingsPlanArt } from './SettingsArt';
import { SettingsCard, SettingsRow, SettingsSection } from './SettingsRows';
import type {
  SettingsGeneralPageProps,
  SettingsPageSection,
  SettingsPlanCardProps,
  SettingsProfilePageProps,
} from './types';

/**
 * The General page's "Current plan" card:
 *
 *   card     background/secondary, radius 16, clipped
 *   artwork  277×277 at top −11 / left 328, bleeding off the right edge under a
 *            radial fade into the card colour
 *   content  py 12 pr 10 pl 12, gap 10: [chip + (title / description, gap 2),
 *            gap 8] then the action
 *   chip     background/tertiary, px 6 py 2, body-2-medium text/secondary
 *            (a 6px corner — Bloom's chips are full pills)
 *   title    headline-medium text/primary; description body-2-regular
 *            text/secondary
 */

const ART_SIZE = 277;

export function SettingsPlanCard({
  badge = 'Current plan',
  title,
  description,
  action,
  artworkSource,
  artwork,
  animated = true,
  style,
  testID,
}: SettingsPlanCardProps) {
  const palette = useSettingsPalette();
  return (
    <View testID={testID} style={[styles.card, { backgroundColor: palette.secondary }, style]}>
      <View pointerEvents="none" aria-hidden style={styles.art}>
        {artwork ?? <SettingsPlanArt source={artworkSource} animated={animated} size={ART_SIZE} />}
        <RadialFade color={palette.secondary} size={ART_SIZE} />
      </View>
      <View style={styles.content}>
        <View style={styles.head}>
          <View style={[styles.chip, { backgroundColor: palette.tertiary }]}>
            <Text variant="body-2-medium" style={{ color: palette.textSecondary }}>
              {badge}
            </Text>
          </View>
          <View style={styles.titles}>
            <Text variant="headline-medium" style={{ color: palette.text }}>
              {title}
            </Text>
            {description ? (
              <Text variant="body-2-regular" style={{ color: palette.textSecondary }}>
                {description}
              </Text>
            ) : null}
          </View>
        </View>
        {action ? <View style={styles.action}>{action}</View> : null}
      </View>
    </View>
  );
}

function Sections({ sections }: { sections: SettingsPageSection[] }) {
  return (
    <>
      {sections.map((section) => {
        const card = (
          <SettingsCard>
            {section.rows.map((row) => (
              <SettingsRow key={row.key} label={row.label} description={row.description}>
                {row.control}
              </SettingsRow>
            ))}
          </SettingsCard>
        );
        return section.label || section.description || section.action ? (
          <SettingsSection
            key={section.key}
            label={section.label}
            description={section.description}
            action={section.action}
          >
            {card}
          </SettingsSection>
        ) : (
          <React.Fragment key={section.key}>{card}</React.Fragment>
        );
      })}
    </>
  );
}

/** The General page: the plan card, then labelled sections 24px apart. */
export function SettingsGeneralPage({ plan, sections, style, testID }: SettingsGeneralPageProps) {
  return (
    <View testID={testID} style={[styles.page, style]}>
      {plan ? <SettingsPlanCard {...plan} /> : null}
      <Sections sections={sections} />
    </View>
  );
}

/** The Profile page: cards of rows 24px apart (identity, account). */
export function SettingsProfilePage({ sections, style, testID }: SettingsProfilePageProps) {
  return (
    <View testID={testID} style={[styles.page, style]}>
      <Sections sections={sections} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    width: '100%',
    gap: 24,
  },
  card: {
    position: 'relative',
    width: '100%',
    overflow: 'hidden',
    borderRadius: 16,
  },
  art: {
    position: 'absolute',
    top: -11,
    left: 328,
    width: ART_SIZE,
    height: ART_SIZE,
  },
  content: {
    position: 'relative',
    gap: 10,
    paddingTop: 12,
    paddingBottom: 12,
    paddingRight: 10,
    paddingLeft: 12,
  },
  head: {
    gap: 8,
  },
  chip: {
    alignSelf: 'flex-start',
    borderRadius: borderRadius.full,
    paddingLeft: 6,
    paddingRight: 6,
    paddingTop: 2,
    paddingBottom: 2,
  },
  titles: {
    gap: 2,
  },
  action: {
    alignSelf: 'flex-start',
  },
});
