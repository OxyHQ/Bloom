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
import type { BaseToastOptions } from './types';

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
 * Access the full Sonner API
 */
export const api = sonner;

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

const wrapperStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    width: '100%',
  },
});
