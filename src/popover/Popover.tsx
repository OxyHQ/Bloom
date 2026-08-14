import React, { useMemo, useRef, useState } from 'react';
import { View } from 'react-native';

import { useDialogControl } from '../dialog/context';
import { SheetShell } from '../dialog/SheetShell';
import { PopoverContext, usePopoverContext } from './context';
import type {
  PopoverContentProps,
  PopoverControlProps,
  PopoverProps,
  PopoverTriggerProps,
} from './types';

/**
 * A `Popover`'s imperative handle. Declared here rather than re-exported from
 * `dialog` under an alias, for the same reason as `useMenuControl`: the web fork
 * implements its own (it anchors a floating panel, not a sheet), so both
 * platforms must publish this name from THIS family.
 */
export function usePopoverControl(): PopoverControlProps {
  return useDialogControl();
}

/**
 * Native `Popover` — presents its content in a bottom sheet (Bloom's
 * established native-overlay convention, shared with `Menu`/`Select`). The
 * web fork (`index.web.tsx`) anchors a floating panel to the trigger.
 */
export function Popover({ children, control }: PopoverProps) {
  const defaultControl = useDialogControl();
  const triggerRef = useRef<View | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const activeControl = control ?? defaultControl;

  // Wrap the control so `isOpen` reflects open/close on native too.
  const wrappedControl = useMemo<PopoverControlProps>(
    () => ({
      ...activeControl,
      open: () => {
        setIsOpen(true);
        activeControl.open();
      },
      close: (cb) => {
        setIsOpen(false);
        activeControl.close(cb);
      },
    }),
    [activeControl],
  );

  const context = useMemo(
    () => ({ control: wrappedControl, isOpen, triggerRef }),
    [wrappedControl, isOpen],
  );

  return (
    <PopoverContext.Provider value={context}>
      {children}
    </PopoverContext.Provider>
  );
}

export function PopoverTrigger({ children, label }: PopoverTriggerProps) {
  const { control, triggerRef } = usePopoverContext();
  const [focused, setFocused] = useState(false);
  const [pressed, setPressed] = useState(false);

  const rendered = children({
    control,
    state: { hovered: false, focused, pressed },
    props: {
      onPress: () => control.open(),
      onFocus: () => setFocused(true),
      onBlur: () => setFocused(false),
      accessibilityLabel: label,
      accessibilityRole: 'button',
      'aria-haspopup': 'dialog',
    },
  });

  return (
    <View ref={triggerRef} collapsable={false}>
      {rendered}
    </View>
  );
}

export function PopoverContent({
  children,
  label = 'Popover',
  style,
}: PopoverContentProps) {
  const { control } = usePopoverContext();

  return (
    <SheetShell control={control} label={label} contentStyle={style}>
      {children}
    </SheetShell>
  );
}

export { usePopoverContext };
