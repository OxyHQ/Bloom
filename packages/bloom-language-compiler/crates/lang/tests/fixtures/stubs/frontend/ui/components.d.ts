/** Components as libraries declare them: a class, exotic components, a callable value. */
import type {
  Component,
  ComponentType,
  FC,
  ForwardRefExoticComponent,
  LazyExoticComponent,
  MemoExoticComponent,
  NamedExoticComponent,
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
export declare const Card: FC<BadgeProps>;
export declare const Named: NamedExoticComponent<BadgeProps>;
/** react-native 0.81+'s shape: a function const, exported through `typeof`. */
declare const Toggle: (props: BadgeProps) => ReactNode;
declare const $$Toggle: typeof Toggle;
export { $$Toggle as Toggle };

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
