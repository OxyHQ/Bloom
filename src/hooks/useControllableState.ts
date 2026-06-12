import { useCallback, useRef, useState } from 'react';

export interface UseControllableStateOptions<T> {
  /** Controlled value. When defined, the hook does not own internal state. */
  value?: T;
  /** Initial value used when uncontrolled. */
  defaultValue: T;
  /** Notified whenever the value changes, controlled or not. */
  onChange?: (next: T) => void;
}

/**
 * Canonical Radix/shadcn-style controllable state hook. Returns a tuple of the
 * current value and a setter that:
 *   - updates internal state when uncontrolled, and
 *   - always calls `onChange` (so controlled parents stay in sync).
 *
 * Switching between controlled and uncontrolled at runtime is supported but
 * discouraged; the hook keeps the latest `value` for reads either way.
 */
export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: UseControllableStateOptions<T>): [T, (next: T) => void] {
  const [internal, setInternal] = useState<T>(defaultValue);
  const isControlled = value !== undefined;
  const current = isControlled ? (value as T) : internal;

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const setValue = useCallback(
    (next: T) => {
      if (!isControlled) {
        setInternal(next);
      }
      onChangeRef.current?.(next);
    },
    [isControlled],
  );

  return [current, setValue];
}
