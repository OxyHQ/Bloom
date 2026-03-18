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
import type { BaseToastOptions } from './types';

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

/**
 * Access the full Sonner API
 */
export const api: typeof sonner = sonner;

/**
 * Show a toast notification.
 *
 * Pass a string for a simple text toast, or a React element for a custom toast.
 */
export function show(
  content: React.ReactNode,
  { type = 'default', ...options }: BaseToastOptions = {},
) {
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
