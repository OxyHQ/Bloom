import { StyleSheet, View } from 'react-native';

import { Text } from '../typography';
import type { WebCssStyle } from '../styles/web-view-style';
import { useSettingsLayout, useSettingsPalette } from './context';
import type { SettingsPalette } from './palette';
import type {
  SettingsSectionLabelProps,
  SettingsSectionProps,
  SettingsValueFieldProps,
} from './types';
import { IS_WEB } from '../styles/platform';

/** Web: the ring colour the family's focus rules read. */
export function settingsRingVars(palette: SettingsPalette): WebCssStyle | null {
  return IS_WEB
    ? { '--bloom-settings-ring': palette.ring, '--bloom-settings-ring-offset': palette.secondary }
    : null;
}

/** Muted 13px heading above a card ("Pull Requests", "Notifications"). */
export function SettingsSectionLabel({ children, inset = 12, style }: SettingsSectionLabelProps) {
  const palette = useSettingsPalette();
  return (
    <View style={[{ paddingLeft: inset, paddingRight: inset }, style]}>
      <Text variant="body-2-medium" style={{ color: palette.textSecondary }}>
        {children}
      </Text>
    </View>
  );
}

/**
 * A labelled block: heading (+ optional muted description, 2px under it and an
 * optional trailing action, bottom-aligned) 8px above its card.
 */
export function SettingsSection({
  label,
  description,
  action,
  inset = 12,
  children,
  style,
  testID,
}: SettingsSectionProps) {
  const palette = useSettingsPalette();
  const heading =
    label || description ? (
      <View style={styles.sectionHeading}>
        {label ? <SettingsSectionLabel inset={inset}>{label}</SettingsSectionLabel> : null}
        {description ? (
          <Text
            variant="body-2-regular"
            style={{ color: palette.textTertiary, paddingLeft: inset, paddingRight: inset }}
          >
            {description}
          </Text>
        ) : null}
      </View>
    ) : null;
  return (
    <View testID={testID} style={[styles.section, style]}>
      {action ? (
        <View style={styles.sectionHeader}>
          {heading}
          <View style={styles.sectionAction}>{action}</View>
        </View>
      ) : (
        heading
      )}
      {children}
    </View>
  );
}

/** A grey read-only value field — presents a stored value, not an input. */
export function SettingsValueField({
  icon: Icon,
  children,
  muted = false,
  style,
  testID,
}: SettingsValueFieldProps) {
  const palette = useSettingsPalette();
  const compact = useSettingsLayout() === 'compact';
  return (
    <View
      testID={testID}
      style={[
        styles.value,
        compact ? styles.valueCompact : null,
        { backgroundColor: palette.tertiary },
        style,
      ]}
    >
      {Icon ? <Icon width={20} height={20} fill={palette.iconSecondary} /> : null}
      <Text
        variant="body-regular"
        numberOfLines={1}
        style={[styles.valueText, { color: muted ? palette.textSecondary : palette.text }]}
      >
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    width: '100%',
    gap: 8,
  },
  sectionHeading: {
    flexShrink: 1,
    minWidth: 0,
    gap: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionAction: {
    flexShrink: 0,
  },
  value: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 32,
    width: 202,
    flexShrink: 0,
    borderRadius: 10,
    paddingLeft: 6,
    paddingRight: 6,
  },
  valueCompact: {
    flexGrow: 1,
    flexShrink: 1,
    width: 'auto',
    minWidth: 180,
  },
  valueText: {
    flexShrink: 1,
    paddingLeft: 4,
  },
});
