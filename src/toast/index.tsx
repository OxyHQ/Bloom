import React, { isValidElement } from 'react';
import { View, StyleSheet } from 'react-native';
import { nanoid } from 'nanoid/non-secure';
import { toast as sonner, Toaster } from 'sonner-native';

import { DURATION } from './const';
import {
  Icon as ToastIcon,
  Outer as BaseOuter,
  Text as ToastText,
  ToastConfigProvider,
} from './Toast';
import type { BaseToastOptions, ToastType } from './types';

export { DURATION } from './const';
export { Action, Icon, Outer, Text, ToastConfigProvider } from './Toast';
export type { ToastType, BaseToastOptions } from './types';

/**
 * Toasts are rendered in a global outlet, which is placed at the top of the
 * component tree.
 */
export function ToastOutlet() {
  return <Toaster pauseWhenPageIsHidden gap={8} />;
}

function OuterWrapper({ children }: { children: React.ReactNode }) {
  return (
    <View style={wrapperStyles.container}>
      <BaseOuter>{children}</BaseOuter>
    </View>
  );
}

/**
 * Direct access to the Sonner API. Use sparingly — `toast()` covers the
 * common case and keeps the surface tied to bloom's themed look.
 */
export const api = sonner;

function dispatch(
  content: React.ReactNode,
  type: ToastType,
  options: BaseToastOptions = {},
): void {
  const id = nanoid();
  if (typeof content === 'string') {
    sonner.custom(
      <ToastConfigProvider id={id} type={type}>
        <OuterWrapper>
          <ToastIcon />
          <ToastText>{content}</ToastText>
        </OuterWrapper>
      </ToastConfigProvider>,
      {
        ...options,
        id,
        duration: options?.duration ?? DURATION,
      },
    );
  } else if (isValidElement(content)) {
    sonner.custom(
      <ToastConfigProvider id={id} type={type}>
        {content}
      </ToastConfigProvider>,
      {
        ...options,
        id,
        duration: options?.duration ?? DURATION,
      },
    );
  } else {
    throw new Error(
      `Toast can be a string or a React element, got ${typeof content}`,
    );
  }
}

/**
 * Show a toast notification.
 *
 * Pass a string for a simple text toast, or a React element for a custom
 * toast. The optional `options` argument accepts the standard Sonner
 * options plus a bloom `type` (defaults to `'default'`).
 *
 * ```ts
 * toast('Saved');
 * toast.success('Profile updated');
 * toast.error('Network error', { duration: 5000 });
 * toast.dismiss(id);
 * ```
 *
 * Pre-typed variants (`toast.success`, `toast.error`, `toast.warning`,
 * `toast.info`) are aliases for the corresponding `type`.
 */
export interface ToastFn {
  (content: React.ReactNode, options?: BaseToastOptions): void;
  success: (content: React.ReactNode, options?: Omit<BaseToastOptions, 'type'>) => void;
  error: (content: React.ReactNode, options?: Omit<BaseToastOptions, 'type'>) => void;
  warning: (content: React.ReactNode, options?: Omit<BaseToastOptions, 'type'>) => void;
  info: (content: React.ReactNode, options?: Omit<BaseToastOptions, 'type'>) => void;
  dismiss: (id?: string | number) => void;
}

const toastImpl = ((content: React.ReactNode, options: BaseToastOptions = {}) => {
  dispatch(content, options.type ?? 'default', options);
}) as ToastFn;

toastImpl.success = (content, options) => dispatch(content, 'success', options ?? {});
toastImpl.error = (content, options) => dispatch(content, 'error', options ?? {});
toastImpl.warning = (content, options) => dispatch(content, 'warning', options ?? {});
toastImpl.info = (content, options) => dispatch(content, 'info', options ?? {});
toastImpl.dismiss = (id) => sonner.dismiss(id);

export const toast: ToastFn = toastImpl;

/**
 * Alias of `toast` kept for compatibility with the original 0.4.x surface
 * where `show()` was the documented entry point. New code should prefer
 * `toast()` directly.
 */
export const show: ToastFn = toastImpl;

/** Re-export the Toast function type so callers can refer to it. */
export type Toast = ToastFn;

const wrapperStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    width: '100%',
  },
});
