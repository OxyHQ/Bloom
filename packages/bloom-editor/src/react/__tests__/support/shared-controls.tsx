/** Editor boundary doubles: real Bloom placement/material is browser-verified separately. */
import { createContext, useContext, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { ButtonProps, LinkButtonProps } from '@oxy.so/bloom/button';
import type { TextFieldInputProps } from '@oxy.so/bloom/text-field';
import type { PopoverProps, PopoverContentProps } from '@oxy.so/bloom/popover';

export function Button({ children, onPress, disabled, pressed, accessibilityLabel }: ButtonProps) {
  return (
    <button
      type="button"
      aria-label={accessibilityLabel}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={(event) => onPress?.(event as never)}
    >
      {children}
    </button>
  );
}
export function LinkButton({ children, href, onPress, accessibilityLabel }: LinkButtonProps) {
  return (
    <a href={href} aria-label={accessibilityLabel} onClick={(event) => onPress?.(event as never)}>
      {children}
    </a>
  );
}
export function TextFieldInput({
  label,
  value,
  onChangeText,
  autoFocus,
  invalid,
  onKeyPress,
  onSubmitEditing,
}: TextFieldInputProps) {
  return (
    <input
      aria-label={label}
      value={value}
      autoFocus={autoFocus}
      aria-invalid={invalid}
      onChange={(event) => onChangeText?.(event.target.value)}
      onKeyDown={(event) => {
        onKeyPress?.({ nativeEvent: { key: event.key } } as never);
        if (event.key === 'Enter') onSubmitEditing?.(event as never);
      }}
    />
  );
}
export function ScrollArea({ children }: { children?: ReactNode }) {
  return <div>{children}</div>;
}
const Open = createContext<Pick<PopoverProps, 'open' | 'onOpenChange'>>({ open: false });
export function Popover({ open, onOpenChange, children }: PopoverProps) {
  return <Open.Provider value={{ open, onOpenChange }}>{children}</Open.Provider>;
}
export function PopoverContent({ children, label }: PopoverContentProps) {
  const state = useContext(Open);
  return state.open
    ? createPortal(
        <div
          role="dialog"
          aria-label={label}
          onKeyDown={(event) => {
            if (event.key === 'Escape') state.onOpenChange?.(false);
          }}
        >
          {children}
        </div>,
        document.body,
      )
    : null;
}
