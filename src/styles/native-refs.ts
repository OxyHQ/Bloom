import type {
  ComponentRef,
  ForwardRefExoticComponent,
  NamedExoticComponent,
  PropsWithoutRef,
  RefAttributes,
} from 'react';
import type { View } from 'react-native';

/**
 * The instance a ref to a react-native `View` receives.
 *
 * Spelled through `ComponentRef` rather than a react-native name, so ONE emitted
 * declaration means the right thing under both type surfaces Bloom supports:
 * React Native 0.86's legacy types (a `View` class instance) and 0.88's strict
 * API (`ViewInstance`, an alias of the DOM-like `ReactNativeElement`). `View` as
 * a type stopped meaning the instance in 0.88 — it names the function component.
 *
 * Exported components and hooks ANNOTATE with these aliases. Left to inference,
 * their declarations would have to name `ReactNativeElement`, which 0.88 keeps
 * under a private path, and declaration emit fails (`TS2742 … not portable`).
 */
export type ViewRef = ComponentRef<typeof View>;

/** A `forwardRef` component, its ref type nameable in emitted declarations. */
export type RefComponent<P, R = ViewRef> = ForwardRefExoticComponent<
  PropsWithoutRef<P> & RefAttributes<R>
>;

/** `memo(forwardRef(...))`, likewise — the type React's `memo` overload infers. */
export type MemoRefComponent<P, R = ViewRef> = NamedExoticComponent<
  PropsWithoutRef<P> & RefAttributes<R>
>;
