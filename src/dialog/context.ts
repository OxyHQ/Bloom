import { createContext, useContext, useId, useMemo, useRef } from 'react';
import type {
  DialogContextProps,
  DialogControlProps,
  DialogControlRefProps,
} from './types';

export const Context = createContext<DialogContextProps>({
  close: () => {},
  isWithinDialog: false,
});
Context.displayName = 'BloomDialogContext';

export function useDialogContext(): DialogContextProps {
  return useContext(Context);
}

/**
 * Return a stable handle that can imperatively `open()` and `close()` a
 * `<Dialog>` mounted with the same control.
 *
 * The handle survives across re-renders; mounting a different `<Dialog>`
 * with the same control attaches the new instance via the internal ref.
 */
export function useDialogControl(): DialogControlProps {
  const id = useId();
  const control = useRef<DialogControlRefProps | null>({
    open: () => {},
    close: () => {},
  });

  return useMemo<DialogControlProps>(
    () => ({
      id,
      ref: control,
      open: () => {
        control.current?.open();
      },
      close: (cb) => {
        control.current?.close(cb);
      },
    }),
    [id],
  );
}
