import type { ReactNode } from 'react';
import { View } from 'react-native';

/**
 * Function components typed as a library's emitted declarations type them
 * (`import("react").JSX.Element`), for the trailing-builder test.
 */
export function EngagementBar({
  children,
}: {
  size?: 'sm' | 'md';
  children?: ReactNode;
}): import('react').JSX.Element {
  return <View testID="bar">{children}</View>;
}

/** A component whose one node prop is not `children`. */
export function Slot({
  content,
}: {
  title: string;
  content?: ReactNode;
}): import('react').JSX.Element {
  return <View testID="slot">{content}</View>;
}
