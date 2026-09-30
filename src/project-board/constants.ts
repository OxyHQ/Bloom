import type { TicketPriority } from './types';

export const PRIORITIES: readonly TicketPriority[] = [
  'Low',
  'Medium',
  'High',
  'Urgent',
];
export const PRIORITY_STYLES: Record<TicketPriority, string> = {
  Low: 'bg-status-blue-background text-status-blue-text',
  Medium: 'bg-status-yellow-background text-status-yellow-text',
  High: 'bg-status-orange-background text-status-orange-text',
  Urgent: 'bg-status-rose-background text-status-rose-text',
};
export const CHIP_BASE =
  'inline-flex items-center justify-center rounded-md px-1.5 whitespace-nowrap transition-[padding,font-size] duration-200 ease py-0.5 text-body-medium';
export const cx = (...values: (string | false | undefined | null)[]) =>
  values.filter(Boolean).join(' ');

export const DEFAULT_PROJECT = 'Bloom';
