import React, { type ErrorInfo, type ReactNode } from 'react';
import { Text } from 'react-native';
import { act, render, fireEvent } from '@testing-library/react-native';

import { ErrorBoundary } from '../error-boundary';
import type {
  ErrorBoundaryFallback,
  ErrorBoundaryFallbackContext,
} from '../error-boundary';

/**
 * Renders normally on the first mount, then throws once we flip the
 * controlled flag. Used to drive the boundary into / out of its error state.
 */
function MaybeThrow({ shouldThrow, message = 'boom' }: { shouldThrow: boolean; message?: string }) {
  if (shouldThrow) throw new Error(message);
  return <Text>ok</Text>;
}

describe('ErrorBoundary', () => {
  // React intentionally logs errors caught by boundaries — silence the noise
  // so test output stays useful.
  let errorSpy: jest.SpyInstance;
  beforeEach(() => {
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    errorSpy.mockRestore();
  });

  it('renders children when no error is thrown', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <MaybeThrow shouldThrow={false} />
      </ErrorBoundary>,
    );
    expect(getByText('ok')).toBeTruthy();
  });

  it('renders the default fallback when a child throws', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <MaybeThrow shouldThrow />
      </ErrorBoundary>,
    );
    expect(getByText('Something went wrong')).toBeTruthy();
    expect(getByText('An unexpected error occurred')).toBeTruthy();
    expect(getByText('Try Again')).toBeTruthy();
  });

  it('renders a static ReactNode fallback (backward-compatible)', () => {
    const { getByText, queryByText } = render(
      <ErrorBoundary fallback={<Text>Static fallback</Text>}>
        <MaybeThrow shouldThrow />
      </ErrorBoundary>,
    );
    expect(getByText('Static fallback')).toBeTruthy();
    // Default fallback must NOT also appear.
    expect(queryByText('Something went wrong')).toBeNull();
  });

  it('renders a render-prop fallback with error context', () => {
    const { getByText } = render(
      <ErrorBoundary
        fallback={({ error, retryCount }) => (
          <Text>{`err:${error.message} count:${retryCount}`}</Text>
        )}>
        <MaybeThrow shouldThrow message="custom-boom" />
      </ErrorBoundary>,
    );
    expect(getByText('err:custom-boom count:0')).toBeTruthy();
  });

  it('passes errorInfo to the render-prop after componentDidCatch', () => {
    let captured: ErrorBoundaryFallbackContext | null = null;
    render(
      <ErrorBoundary
        fallback={(ctx) => {
          captured = ctx;
          return <Text>captured</Text>;
        }}>
        <MaybeThrow shouldThrow />
      </ErrorBoundary>,
    );
    expect(captured).not.toBeNull();
    const ctx = captured as unknown as ErrorBoundaryFallbackContext;
    expect(ctx.error.message).toBe('boom');
    // componentDidCatch populates errorInfo with a componentStack string.
    expect(ctx.errorInfo).not.toBeNull();
    expect(typeof ctx.errorInfo?.componentStack).toBe('string');
  });

  it('invokes onError when a child throws', () => {
    const onError = jest.fn<void, [Error, ErrorInfo]>();
    render(
      <ErrorBoundary onError={onError}>
        <MaybeThrow shouldThrow message="reported" />
      </ErrorBoundary>,
    );
    expect(onError).toHaveBeenCalledTimes(1);
    const [err, info] = onError.mock.calls[0]!;
    expect(err.message).toBe('reported');
    expect(typeof info.componentStack).toBe('string');
  });

  it('increments retryCount each time retry() is invoked', () => {
    /**
     * The boundary's `retry()` resets `hasError` and re-renders children. To
     * observe successive `retryCount` values without immediately re-throwing
     * (which would just snap straight back to the fallback), we capture each
     * call's count via the render-prop and trigger retry from the fallback.
     */
    const seenCounts: number[] = [];
    let triggerRetry: (() => void) | null = null;

    const fallback: ErrorBoundaryFallback = ({ retry, retryCount }) => {
      seenCounts.push(retryCount);
      triggerRetry = retry;
      return <Text testID="retry-btn">{`count:${retryCount}`}</Text>;
    };

    function AlwaysThrow(): React.ReactElement {
      throw new Error('persistent');
    }

    render(
      <ErrorBoundary fallback={fallback}>
        <AlwaysThrow />
      </ErrorBoundary>,
    );

    expect(seenCounts[0]).toBe(0);
    expect(triggerRetry).not.toBeNull();

    // First retry — boundary resets, child throws again, fallback re-renders
    // with retryCount === 1. Wrap in act() because retry() triggers React
    // state updates and a synchronous error during the re-render.
    act(() => {
      triggerRetry?.();
    });
    expect(seenCounts).toContain(1);

    // Second retry → count 2.
    act(() => {
      triggerRetry?.();
    });
    expect(seenCounts).toContain(2);
  });

  /**
   * Type-only compile-time test. These assignments must type-check; they are
   * never executed. If a future change breaks either variant, ts-jest will
   * fail the suite at compile time.
   */
  it('accepts both ReactNode and render-prop fallback (compile-time)', () => {
    const _staticFallback: ErrorBoundaryFallback = <Text>static</Text>;
    const _undefinedFallback: ErrorBoundaryFallback = undefined as ReactNode;
    const _functionFallback: ErrorBoundaryFallback = ({
      error,
      errorInfo,
      retry,
      retryCount,
    }) => (
      <Text>
        {error.message}
        {errorInfo?.componentStack ?? ''}
        {retryCount}
        {retry.name}
      </Text>
    );

    // Use the values so TS does not flag them as unused.
    expect(_staticFallback).toBeDefined();
    expect(_undefinedFallback).toBeUndefined();
    expect(typeof _functionFallback).toBe('function');
  });

  it('also accepts assigning fallback directly onto ErrorBoundary props', () => {
    // Smoke check that the props.fallback union compiles for both variants.
    const _staticProps = (
      <ErrorBoundary fallback={<Text>x</Text>}>
        <Text>y</Text>
      </ErrorBoundary>
    );
    const _renderProps = (
      <ErrorBoundary fallback={({ retry }) => <Text onPress={retry}>z</Text>}>
        <Text>y</Text>
      </ErrorBoundary>
    );
    expect(_staticProps).toBeDefined();
    expect(_renderProps).toBeDefined();
  });

  it('uses custom default-fallback labels when provided', () => {
    const { getByText } = render(
      <ErrorBoundary title="Oops" message="boom message" retryLabel="Retry!">
        <MaybeThrow shouldThrow />
      </ErrorBoundary>,
    );
    expect(getByText('Oops')).toBeTruthy();
    expect(getByText('boom message')).toBeTruthy();
    expect(getByText('Retry!')).toBeTruthy();
  });

  it('fires the default-fallback retry button without crashing', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <MaybeThrow shouldThrow />
      </ErrorBoundary>,
    );
    // The button is rendered inside a TouchableOpacity; pressing fires the
    // internal handleRetry which resets state. The child will throw again on
    // the next render, but the test only asserts the press itself does not
    // throw synchronously.
    expect(() => fireEvent.press(getByText('Try Again'))).not.toThrow();
  });
});
