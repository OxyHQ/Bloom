// A TS component whose props Bloom cannot read (they extend React Native's `ViewProps`) and
// whose `icon` takes a component type, not an element (Mention's EmptyState, Bloom's icons).
import type { ComponentType, ReactNode } from 'react';
import type { ViewProps } from 'react-native';

export type IconComponent = ComponentType<{ width?: number; height?: number; fill?: string }>;
export interface EmptyStateProps extends ViewProps {
  title: string;
  icon?: IconComponent;
  footer?: ReactNode;
}
export declare function EmptyState(props: EmptyStateProps): React.JSX.Element;
