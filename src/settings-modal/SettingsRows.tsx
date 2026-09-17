import React, { Children, Fragment, isValidElement, useContext, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '../typography';
import type { WebCssStyle } from '../styles/web-view-style';
import { SettingsRowPositionContext, useSettingsLayout, useSettingsPalette } from './context';
import type { SettingsPalette } from './palette';
import type {
  SettingsCardProps,
  SettingsRowProps,
  SettingsSectionLabelProps,
  SettingsSectionProps,
  SettingsValueFieldProps,
} from './types';
import { IS_WEB, useSettingsWebCss } from './web-css';

/**
 * Settings row chrome:
 *
 *   card   background/secondary, radius 16, pl 12 — the left padding lives on
 *          the card so each row's bottom hairline stops 12px short of the left
 *          edge, exactly like Figma.
 *   row    py 10 pr 10, min-height 52, gap 16, 1px separator under every row
 *          except the last; label body-regular text/primary, optional
 *          body-2-regular text/secondary description.
 *   label  body-2-medium text/secondary, px 12.
 *   value  32 tall, 202 wide, radius 10, background/tertiary, px 6, gap 2,
 *          20px icon + body-regular (pl 4) truncated.
 */

/** Web: the ring colour the family's focus rules read. */
export function settingsRingVars(palette: SettingsPalette): WebCssStyle | null {
  return IS_WEB
    ? { '--bloom-settings-ring': palette.ring, '--bloom-settings-ring-offset': palette.secondary }
    : null;
}

/** Flatten fragments so "last" means the last rendered row, not the last fragment. */
function flatChildren(children: ReactNode): ReactNode[] {
  const out: ReactNode[] = [];
  Children.forEach(children, (child) => {
    if (isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment) {
      out.push(...flatChildren(child.props.children));
    } else if (child !== null && child !== undefined && typeof child !== 'boolean') {
      out.push(child);
    }
  });
  return out;
}

/** Grouped card. Its rows separate themselves; the last carries no hairline. */
export function SettingsCard({ children, style, testID }: SettingsCardProps) {
  useSettingsWebCss();
  const palette = useSettingsPalette();
  const items = flatChildren(children);
  return (
    <View
      testID={testID}
      style={[styles.card, { backgroundColor: palette.secondary }, settingsRingVars(palette), style]}
    >
      {items.map((child, index) => (
        <SettingsRowPositionContext.Provider
          // Keyed by the child's own key when it has one.
          key={isValidElement(child) && child.key != null ? child.key : index}
          value={index === items.length - 1 ? LAST : NOT_LAST}
        >
          {child}
        </SettingsRowPositionContext.Provider>
      ))}
    </View>
  );
}

const LAST = { last: true };
const NOT_LAST = { last: false };

/** Whether the calling row is the last in its card. */
export function useSettingsRowIsLast(): boolean {
  return useContext(SettingsRowPositionContext).last;
}

/** One label + control row. */
export function SettingsRow({ label, description, children, style, testID }: SettingsRowProps) {
  const palette = useSettingsPalette();
  const last = useSettingsRowIsLast();
  // Compact: the control wraps under its label when both do not fit on one line
  // (a switch stays beside it; a 202px value field drops below).
  const compact = useSettingsLayout() === 'compact';
  return (
    <View
      testID={testID}
      style={[
        styles.row,
        compact ? styles.rowCompact : null,
        { borderBottomWidth: last ? 0 : 1, borderBottomColor: palette.separator },
        style,
      ]}
    >
      <View style={[styles.rowText, compact ? styles.rowTextCompact : null]}>
        <Text variant="body-regular" style={{ color: palette.text }}>
          {label}
        </Text>
        {description ? (
          <Text variant="body-2-regular" style={{ color: palette.textSecondary }}>
            {description}
          </Text>
        ) : null}
      </View>
      {children}
    </View>
  );
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
export function SettingsValueField({ icon: Icon, children, muted = false, style, testID }: SettingsValueFieldProps) {
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
  card: {
    width: '100%',
    borderRadius: 16,
    paddingLeft: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    minHeight: 52,
    width: '100%',
    paddingTop: 10,
    paddingBottom: 10,
    paddingRight: 10,
  },
  rowText: {
    flexShrink: 1,
    minWidth: 0,
  },
  rowCompact: {
    flexWrap: 'wrap',
    rowGap: 8,
    columnGap: 12,
  },
  rowTextCompact: {
    flexGrow: 1,
    flexBasis: 140,
  },
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
