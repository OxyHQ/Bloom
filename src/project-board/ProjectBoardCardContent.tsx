import type { ReactNode } from 'react';
import { StyledView } from '../styles/styled-primitives';
import { Text } from '../typography';
import type { ProjectBoardCardContentProps } from './types';

function text(value: ReactNode, className: string) {
  return typeof value === 'string' || typeof value === 'number' ? (
    <Text className={className}>{value}</Text>
  ) : (
    value
  );
}

/** The template card's content geometry; the board owns material and dragging. */
export function ProjectBoardCardContent({
  preview,
  header,
  actions,
  badges,
  title,
  description,
  children,
  footer,
  testID,
}: ProjectBoardCardContentProps) {
  return (
    <StyledView testID={testID} className="flex w-full flex-col">
      {preview}
      <StyledView className="flex w-full flex-col gap-2 p-3">
        {(header != null || actions != null) && (
          <StyledView className="flex flex-row min-h-[22px] items-start justify-between gap-3">
            <StyledView style={{ flex: 1, minWidth: 0 }}>
              {text(header, 'text-body-2-medium text-text-secondary')}
            </StyledView>
            {actions}
          </StyledView>
        )}
        <StyledView className="flex flex-col items-start gap-2">
          {badges != null && (
            <StyledView className="flex flex-row items-center gap-1.5">{badges}</StyledView>
          )}
          {(title != null || description != null) && (
            <StyledView className="flex w-full flex-col gap-[5px]">
              {text(title, 'text-body-medium text-text-primary')}
              {text(description, 'text-body-2-medium text-text-secondary')}
            </StyledView>
          )}
          {children}
        </StyledView>
        {footer}
      </StyledView>
    </StyledView>
  );
}
