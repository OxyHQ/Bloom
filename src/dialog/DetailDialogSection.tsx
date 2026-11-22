import { StyleSheet, View } from 'react-native';
import { useWindowBreakpoint } from '../hooks/use-width-class';
import { IS_WEB } from '../styles/platform';
import { createTokenStyles } from '../theme/color-tokens';
import { Text } from '../typography';
import type { DetailDialogSectionProps, DetailDialogSectionGroupProps } from './types';

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 20 },
  // Below `sm` the label stacks over its values.
  rowCompact: { flexDirection: 'column', gap: 8 },
  labelColumn: { width: 70, flexShrink: 0, paddingTop: 2 },
  values: {
    flex: 1,
    flexDirection: 'row',
    minWidth: 0,
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: 20,
    rowGap: 12,
  },
  group: { flexDirection: 'column', gap: 20 },
});

const useStyles = createTokenStyles((t) => ({
  label: {
    // The body-medium line: 20px on native; on the web its 20/14 ratio of
    // Text's own 13px, as the type utility drew it there.
    lineHeight: IS_WEB ? (String(20 / 14) as unknown as number) : 20,
    fontWeight: 500,
    color: t.mutedForeground,
  },
}));

/** The template's shared label/values row; product controls keep their own data semantics. */
export function DetailDialogSection({
  label,
  children,
  accessibilityLabel,
  testID,
}: DetailDialogSectionProps) {
  const themed = useStyles();
  const compact = useWindowBreakpoint() === 'base';
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={[styles.row, compact && styles.rowCompact]}
    >
      <View style={styles.labelColumn}>
        {typeof label === 'string' || typeof label === 'number' ? (
          <Text style={themed.label}>{label}</Text>
        ) : (
          label
        )}
      </View>
      <View style={styles.values}>{children}</View>
    </View>
  );
}

/** Shared spacing for a record's property sections, including full-page editors. */
export function DetailDialogSectionGroup({ children, testID }: DetailDialogSectionGroupProps) {
  return (
    <View testID={testID} style={styles.group}>
      {children}
    </View>
  );
}
