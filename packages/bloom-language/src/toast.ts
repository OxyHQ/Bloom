import type { ReactNode } from 'react';
import { toast as bloomToast, type ToastOptions } from '@oxy.so/bloom/toast';

import type { ViewNode } from './node';
import { toElement } from './render';

/**
 * What a toast says: a title, or a view that is the whole row (Bloom's custom
 * toast).
 */
export type ToastContent = string | ViewNode;

type Options = Omit<ToastOptions, 'type'>;

function content(value: ToastContent): ReactNode {
  return typeof value === 'string' ? value : toElement(value);
}

/**
 * Bloom's `toast`: a toast is an event, not a view, so it stays an imperative
 * call (from a press, an effect or a store), and Bloom's toaster draws it. Its
 * content is a title or a language view; everything else is Bloom's own.
 *
 * ```ts
 * Button(Text('Save')).onPress(() => save().then(() => toast.success('Saved')))
 * ```
 */
export const toast = Object.assign(
  (value: ToastContent, options?: ToastOptions): string | number =>
    bloomToast(content(value), options),
  {
    success: (value: ToastContent, options?: Options) =>
      bloomToast.success(content(value), options),
    error: (value: ToastContent, options?: Options) => bloomToast.error(content(value), options),
    warning: (value: ToastContent, options?: Options) =>
      bloomToast.warning(content(value), options),
    info: (value: ToastContent, options?: Options) => bloomToast.info(content(value), options),
    loading: (value: ToastContent, options?: Options) =>
      bloomToast.loading(content(value), options),
    promise: bloomToast.promise,
    dismiss: bloomToast.dismiss,
    wiggle: bloomToast.wiggle,
  },
);
