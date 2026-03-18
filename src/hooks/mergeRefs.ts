import React from 'react';

/**
 * Merges multiple React refs into a single callback ref.
 */
export function mergeRefs<T>(
  refs: Array<React.Ref<T> | null | undefined>,
): React.RefCallback<T> {
  return (instance: T | null) => {
    for (const ref of refs) {
      if (typeof ref === 'function') {
        ref(instance);
      } else if (ref != null) {
        (ref as React.MutableRefObject<T | null>).current = instance;
      }
    }
  };
}
