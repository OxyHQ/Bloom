import { MenuRowShell } from '../floating/shared';
import type { PopoverItemProps } from './types';
export function PopoverItem({
  title,
  destructive,
  disabled = false,
  variant,
  tone,
  ...props
}: PopoverItemProps) {
  return (
    <MenuRowShell
      {...props}
      disabled={disabled}
      role="button"
      title={title}
      destructive={destructive || variant === 'destructive' || tone === 'danger'}
    />
  );
}
