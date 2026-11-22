import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { IS_WEB } from '../styles/platform';
import { createTokenStyles } from '../theme/color-tokens';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';

export interface AgentCreatorFieldProps {
  /** The row's name, in the 96px column at its start. */
  label: string;
  /** The control: a `TextFieldInput`, a `Textarea`, a `Switch`, whatever the row edits. */
  children: ReactNode;
  /** A taller row whose label sits at the top, for a multi-line control. */
  multiline?: boolean;
  /** A hairline above the row. On by default; the first row of a card turns it off. */
  divider?: boolean;
}

/**
 * One row of the editor's details card: a name at the start and its control beside it.
 *
 * It is the editor's own row, used by Name, Label and Description, so a host that hands
 * `AgentCreator` rows of its own (as `children`) gets exactly the same geometry, hairlines and
 * type, in light and dark.
 */
export function AgentCreatorField({
  label,
  children,
  multiline = false,
  divider = true,
}: AgentCreatorFieldProps) {
  const { colors } = useTheme();
  const tokens = useTokenStyles();
  return (
    <View
      style={[
        styles.row,
        multiline ? styles.tall : styles.single,
        divider && styles.divider,
        {
          flexDirection: 'row',
          alignContent: 'stretch',
          ...(divider ? { borderColor: colors.border } : null),
        },
      ]}
    >
      <Text
        variant="body-regular"
        style={[
          tokens.label,
          multiline && styles.labelTall,
          { width: 96, ...(multiline ? { paddingTop: 4 } : null) },
        ]}
      >
        {label}
      </Text>
      <View style={styles.control}>{children}</View>
    </View>
  );
}

/** The label column, shared with the character rows. */
export const useAgentCreatorLabelStyles = createTokenStyles((t) => ({
  label: {
    fontSize: 14,
    color: t.foreground,
    lineHeight: 20,
    fontWeight: '400',
    ...(IS_WEB ? { letterSpacing: 0 } : null),
  },
}));
const useTokenStyles = useAgentCreatorLabelStyles;

const styles = StyleSheet.create({
  // The web lays the row out as a grid of the label column and the control.
  row: {
    flexDirection: 'row',
    paddingInlineEnd: 10,
    ...(IS_WEB ? ({ display: 'grid', gridTemplateColumns: '96px minmax(0,1fr)' } as object) : null),
  },
  single: { height: 52, alignItems: 'center' },
  tall: { minHeight: 82, alignItems: 'flex-start', paddingBlock: 10 },
  divider: { borderTopStyle: 'solid', borderTopWidth: 1 } as object,
  labelTall: { paddingTop: 4 },
  control: { minWidth: 0, flexGrow: 1, flexShrink: 1, flexBasis: '0%' },
});
