// Bloom's overlays and feedback as named stand-ins: what reaches them is the prop contract under test.
export const AlertDialog = 'AlertDialog';
export const ConnectionStatusToasts = 'ConnectionStatusToasts';
export const Popover = 'Popover';
export const PopoverTrigger = 'PopoverTrigger';
export const PopoverContent = 'PopoverContent';

/** Bloom's `toast`: each call recorded as `[method, content, options]`. */
export const toastCalls: unknown[][] = [];
const record =
  (method: string) =>
  (content: unknown, options?: unknown): string => {
    toastCalls.push([method, content, options]);
    return `t${toastCalls.length}`;
  };
export const toast = Object.assign(record('toast'), {
  success: record('success'),
  error: record('error'),
  warning: record('warning'),
  info: record('info'),
  loading: record('loading'),
  promise: record('promise'),
  dismiss: record('dismiss'),
  wiggle: record('wiggle'),
  custom: record('custom'),
});
