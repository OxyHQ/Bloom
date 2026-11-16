import { StyledView } from '../styles/styled-primitives';
import { Text } from '../typography';
import type { DetailDialogSectionProps, DetailDialogSectionGroupProps } from './types';

/** The template's shared label/values row; product controls keep their own data semantics. */
export function DetailDialogSection({
  label,
  children,
  accessibilityLabel,
  testID,
}: DetailDialogSectionProps) {
  return (
    <StyledView
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      className="flex flex-row items-start gap-5 max-sm:flex-col max-sm:gap-2"
    >
      <StyledView className="w-[70px] shrink-0 pt-0.5">
        {typeof label === 'string' || typeof label === 'number' ? (
          <Text className="text-body-medium text-text-secondary">{label}</Text>
        ) : (
          label
        )}
      </StyledView>
      <StyledView
        className="flex flex-row min-w-0 flex-wrap items-center gap-x-5 gap-y-3"
        style={{ flex: 1 }}
      >
        {children}
      </StyledView>
    </StyledView>
  );
}

/** Shared spacing for a record's property sections, including full-page editors. */
export function DetailDialogSectionGroup({ children, testID }: DetailDialogSectionGroupProps) {
  return (
    <StyledView testID={testID} className="flex flex-col gap-5">
      {children}
    </StyledView>
  );
}
