import React from 'react';
import { ScrollView } from 'react-native';
import { EmptyState } from '../empty-state';
import { useBottomEdgeInset } from '../layout/bottom-edge';
import { useMessages } from '../locale/messages';
import { space } from '../styles/tokens';
import { ErrorBoundary } from './ErrorBoundary';
import { ERROR_BOUNDARY_MESSAGES } from './messages';
import type { PanelErrorBoundaryProps } from './types';

/** Local recovery inside a healthy Bloom shell. Catastrophic/provider errors belong to ErrorBoundary. */
export function PanelErrorBoundary({
  children,
  fallback,
  emptyState,
  bottomInset,
  ...props
}: PanelErrorBoundaryProps) {
  const { messages } = useMessages(ERROR_BOUNDARY_MESSAGES);
  const inheritedBottom = useBottomEdgeInset();
  return (
    <ErrorBoundary
      {...props}
      fallback={
        fallback !== undefined
          ? fallback
          : ({ retry }) => (
              <ScrollView
                style={{ flex: 1, minHeight: 0 }}
                contentContainerStyle={{
                  flexGrow: 1,
                  paddingHorizontal: space.md,
                  paddingBottom: bottomInset ?? inheritedBottom,
                }}
              >
                <EmptyState
                  variant="compact"
                  {...emptyState}
                  title={emptyState?.title ?? messages.title}
                  description={emptyState?.description ?? messages.message}
                  style={[{ flexGrow: 1 }, emptyState?.style]}
                  action={{
                    ...emptyState?.action,
                    label: emptyState?.action?.label ?? messages.retry,
                    onPress: () => {
                      emptyState?.action?.onPress?.();
                      retry();
                    },
                  }}
                />
              </ScrollView>
            )
      }
    >
      {children}
    </ErrorBoundary>
  );
}
