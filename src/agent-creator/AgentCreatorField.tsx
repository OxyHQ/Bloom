import type { ReactNode } from 'react';
import { StyledView } from '../styles/styled-primitives';
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
  return (
    <StyledView
      className={`grid grid-cols-[96px_minmax(0,1fr)] flex-row pe-2.5 ${
        multiline ? 'min-h-[82px] items-start py-2.5' : 'h-[52px] items-center'
      } ${divider ? 'border-t border-border-button-default dark:border-border-button-default/35' : ''}`}
      style={{
        flexDirection: 'row',
        alignContent: 'stretch',
        ...(divider ? { borderColor: colors.border } : null),
      }}
    >
      <Text
        variant="body-regular"
        className={`text-body-regular text-text-primary ${multiline ? 'pt-1' : ''}`}
        style={{ width: 96, ...(multiline ? { paddingTop: 4 } : null) }}
      >
        {label}
      </Text>
      <StyledView className="min-w-0 flex-1">{children}</StyledView>
    </StyledView>
  );
}
