/**
 * Derived from sonner-native v0.26.4 — src/toast-fns.ts
 * (MIT © Gunnar Torfi Steinarsson). See the top-level NOTICE.
 *
 * This module is the ONLY translation layer between the public API and the
 * engine:
 *   - the public option `type` becomes the internal `variant` (`'default'` →
 *     absent, so an unqualified toast renders neutral);
 *   - a `ReactNode` content becomes either `title` (string) or `jsx` (element).
 * Nothing downstream of here knows the word `type`.
 */
import { isValidElement, type ReactElement, type ReactNode } from 'react';
import { toastStore } from './toast-store';
import type {
  PromiseToastOptions,
  ToastFn,
  ToastOptions,
  ToastType,
  ToastVariant,
} from './types';

const TYPE_TO_VARIANT: Record<ToastType, ToastVariant | undefined> = {
  default: undefined,
  success: 'success',
  error: 'error',
  warning: 'warning',
  info: 'info',
  loading: 'loading',
};

const resolveContent = (
  content: ReactNode,
): { title: string; jsx?: ReactNode } => {
  if (typeof content === 'string') {
    return { title: content };
  }
  if (isValidElement(content)) {
    // A custom element owns the whole row, so there is no title to render.
    return { title: '', jsx: content };
  }
  throw new Error(
    `Toast can be a string or a React element, got ${typeof content}`,
  );
};

const dispatch = (
  content: ReactNode,
  options: ToastOptions,
  variant?: ToastVariant,
): string | number => {
  const { type, ...rest } = options;
  return toastStore.addToast({
    ...rest,
    ...resolveContent(content),
    variant: variant ?? (type === undefined ? undefined : TYPE_TO_VARIANT[type]),
  });
};

export const toast: ToastFn = Object.assign(
  (content: ReactNode, options: ToastOptions = {}) => dispatch(content, options),
  {
    success: (content: ReactNode, options: Omit<ToastOptions, 'type'> = {}) =>
      dispatch(content, options, 'success'),

    error: (content: ReactNode, options: Omit<ToastOptions, 'type'> = {}) =>
      dispatch(content, options, 'error'),

    warning: (content: ReactNode, options: Omit<ToastOptions, 'type'> = {}) =>
      dispatch(content, options, 'warning'),

    info: (content: ReactNode, options: Omit<ToastOptions, 'type'> = {}) =>
      dispatch(content, options, 'info'),

    loading: (content: ReactNode, options: Omit<ToastOptions, 'type'> = {}) =>
      dispatch(content, options, 'loading'),

    custom: (jsx: ReactElement, options: Omit<ToastOptions, 'type'> = {}) =>
      dispatch(jsx, options),

    promise: <T,>(promise: Promise<T>, options: PromiseToastOptions<T>) => {
      const { loading, success, error, styles, ...rest } = options;
      return toastStore.addToast({
        ...rest,
        title: loading,
        variant: 'loading',
        styles: styles?.loading,
        promiseOptions: {
          // Mapping the result to its title here is what keeps `PromiseOptions`
          // non-generic — the store never sees the caller's result type.
          promise: promise.then(success),
          loading,
          error,
          styles,
        },
      });
    },

    dismiss: (id?: string | number) => toastStore.dismissToast(id),

    wiggle: (id: string | number) => {
      toastStore.wiggleToast(id);
    },
  },
);
