import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

import { useInteractionState } from '../hooks/use-interaction-state';
import type { ErrorBoundaryProps } from './types';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

/**
 * Default fallback UI used when an ErrorBoundary catches a render error.
 *
 * This component is the LAST line of defense — by the time it renders, the
 * rest of the React tree has already crashed. It therefore MUST NOT depend
 * on any other context provider (theme, navigation, router, etc.) because
 * those providers may be unmounted, broken, or never have been part of
 * the tree above the boundary.
 *
 * Use only literal styles and built-in React Native primitives. No hooks
 * that read context, no upstream theming, no animation libraries.
 */
function DefaultFallback({
  title,
  message,
  retryLabel,
  onRetry,
}: {
  title: string;
  message: string;
  retryLabel: string;
  onRetry: () => void;
}) {
  // Component state rather than `Pressable`'s function-form `style`: css-interop
  // rewrites the `style` prop of every JSX element and swallows the function
  // form, which would drop every base style with it.
  const { state: pressed, onIn: onPressIn, onOut: onPressOut } = useInteractionState();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      <Pressable
        style={[styles.retryButton, pressed && styles.retryButtonPressed]}
        onPress={onRetry}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={retryLabel}
      >
        <Text style={styles.retryText}>{retryLabel}</Text>
      </Pressable>
    </View>
  );
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  static displayName = 'ErrorBoundary';

  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
    retryCount: 0,
  };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
  }

  private handleRetry = (): void => {
    this.setState((prev) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prev.retryCount + 1,
    }));
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      const { fallback } = this.props;

      if (typeof fallback === 'function') {
        // Render-prop variant — invoke with error context.
        return fallback({
          error: this.state.error,
          errorInfo: this.state.errorInfo,
          retry: this.handleRetry,
          retryCount: this.state.retryCount,
        });
      }

      if (fallback !== undefined) {
        // Static ReactNode variant (backward-compatible).
        return fallback;
      }

      return (
        <DefaultFallback
          title={this.props.title ?? 'Something went wrong'}
          message={this.props.message ?? 'An unexpected error occurred'}
          retryLabel={this.props.retryLabel ?? 'Try Again'}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

// Literal colors only — must never depend on a theme provider. The neutral
// palette is chosen to be readable on both light and dark device defaults.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    color: '#111111',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
    paddingHorizontal: 16,
    color: '#555555',
  },
  retryButtonPressed: {
    opacity: 0.7,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 120,
    alignItems: 'center',
    backgroundColor: '#0066FF',
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
