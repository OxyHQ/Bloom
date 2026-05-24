import React, { isValidElement } from 'react';
import { nanoid } from 'nanoid/non-secure';
import { toast as sonner, Toaster } from 'sonner';

import { DURATION } from './const';
import {
  Icon as ToastIcon,
  Outer as ToastOuter,
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
  return (
    <Toaster
      position="bottom-left"
      gap={8}
      offset={20}
      mobileOffset={20}
    />
  );
}

/** Direct access to the underlying Sonner API. Use sparingly. */
export const api: typeof sonner = sonner;

function dispatch(
  content: React.ReactNode,
  type: ToastType,
  options: BaseToastOptions = {},
): void {
  const id = nanoid();
  if (typeof content === 'string') {
    sonner(
      <ToastConfigProvider id={id} type={type}>
        <ToastOuter>
          <ToastIcon />
          <ToastText>{content}</ToastText>
        </ToastOuter>
      </ToastConfigProvider>,
      {
        ...options,
        unstyled: true,
        id,
        duration: options?.duration ?? DURATION,
      },
    );
  } else if (isValidElement(content)) {
    sonner(
      <ToastConfigProvider id={id} type={type}>
        {content}
      </ToastConfigProvider>,
      {
        ...options,
        unstyled: true,
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
 * Show a toast notification. Identical API to the native variant — see
 * `./index.tsx` for the full usage docs.
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
export const show: ToastFn = toastImpl;
export type Toast = ToastFn;
