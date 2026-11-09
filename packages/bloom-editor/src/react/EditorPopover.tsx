import type { ReactNode } from 'react';
import { Platform } from 'react-native';
import { Popover, PopoverContent } from '@oxy.so/bloom/popover';
import type { EditorController } from './controller';

/** Editor focus ownership over the shared placement, material and dismiss owner. */
export function EditorPopover({
  open,
  anchor,
  controller,
  label,
  onDismiss,
  children,
}: {
  open: boolean;
  anchor: {
    getBoundingClientRect: () => {
      top: number;
      bottom: number;
      left: number;
      right: number;
    } | null;
  };
  controller: EditorController;
  label: string;
  onDismiss: () => void;
  children: ReactNode;
}) {
  return (
    <Popover
      open={open}
      modal={false}
      onOpenChange={(next) => {
        if (next) return;
        const owned = Platform.OS === 'web' && controller.ownsControlFocus(document.activeElement);
        controller.cancelLinkEditor();
        onDismiss();
        if (owned) controller.refocus();
      }}
    >
      <PopoverContent
        virtualAnchor={anchor}
        side="top"
        align="start"
        label={label}
        minWidth={0}
        maxWidth={360}
        maxHeight={320}
      >
        {children}
      </PopoverContent>
    </Popover>
  );
}
