/** Components as libraries declare them: a class, exotic components, a callable value. */
import type {
  Component,
  ComponentType,
  ForwardRefExoticComponent,
  LazyExoticComponent,
  MemoExoticComponent,
  ReactNode,
} from 'react';

export interface BadgeProps {
  label: string;
  children?: ReactNode;
}
export declare class Badge extends Component<BadgeProps> {}
export declare const Pill: ForwardRefExoticComponent<BadgeProps>;
export declare const Chip: MemoExoticComponent<ComponentType<BadgeProps>>;
export declare const Lazy: LazyExoticComponent<ComponentType<BadgeProps>>;

export interface ToastFn {
  (content: string, options?: { type?: 'success' | 'error' }): string;
  success(content: string): string;
}
export declare const notify: ToastFn;

export interface LogContext {
  component?: string;
  [key: string]: unknown;
}
export declare function log(message: string, context?: LogContext): void;
