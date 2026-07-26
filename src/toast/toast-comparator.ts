/**
 * Derived from sonner-native v0.26.4 — src/toast-comparator.ts
 * (MIT © Gunnar Torfi Steinarsson). See the top-level NOTICE.
 *
 * Drives `autoWiggleOnUpdate: 'toast-change'`: an update-by-id only wiggles the
 * row when something a user can actually see changed. `description` is
 * deliberately typed `string` (not `ReactNode`) so this stays a value compare —
 * a ReactNode would differ on every parent re-render and wiggle forever.
 */
import { isToastAction, type ToastProps } from './types';

const areActionsEqual = (a: ToastProps['action'], b: ToastProps['action']) => {
  if (isToastAction(a) && isToastAction(b)) {
    return a.label === b.label;
  }

  return a === b;
};

export const areToastsEqual = (a: ToastProps, b: ToastProps) => {
  return (
    a.id === b.id &&
    a.title === b.title &&
    a.variant === b.variant &&
    a.description === b.description &&
    a.closeButton === b.closeButton &&
    a.invert === b.invert &&
    a.position === b.position &&
    a.dismissible === b.dismissible &&
    a.icon === b.icon &&
    a.jsx === b.jsx &&
    a.duration === b.duration &&
    a.style === b.style &&
    a.styles === b.styles &&
    a.important === b.important &&
    a.richColors === b.richColors &&
    a.promiseOptions === b.promiseOptions &&
    areActionsEqual(a.action, b.action) &&
    areActionsEqual(a.cancel, b.cancel)
  );
};
