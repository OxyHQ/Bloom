import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
  type Dispatch,
  type ReactNode,
  type RefCallback,
  type SetStateAction,
} from 'react';
import { Platform, TextInput } from 'react-native';

type Presentation = 'inline' | 'floating';
type Selection = { start: number; end: number };

/** A text input handle on React Native or the web. */
export interface PanelSessionFocusTarget {
  focus(): void;
  isFocused?(): boolean;
  /** React Native TextInput command; applies the current native event count. */
  setSelection?(start: number, end: number): void;
  setNativeProps?(props: { selection: Selection }): void;
  setSelectionRange?(start: number, end: number): void;
}

/** Internal, scoped to one descriptor ID for the lifetime of its panel owner. */
class PanelSession {
  values = new Map<string, unknown>();
  listeners = new Set<() => void>();
  presentation: Presentation = 'inline';
  active = true;
  readPresentation?: () => Presentation;
  focus: {
    key: string;
    presentation: Presentation;
    target: PanelSessionFocusTarget | null;
    selection?: Selection;
  } | null = null;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  read<T>(key: string, initial: T | (() => T)): T {
    if (!this.values.has(key)) {
      this.values.set(key, typeof initial === 'function' ? (initial as () => T)() : initial);
    }
    return this.values.get(key) as T;
  }
  write<T>(key: string, action: SetStateAction<T>, initial: T | (() => T)) {
    const previous = this.read(key, initial);
    const next = typeof action === 'function' ? (action as (value: T) => T)(previous) : action;
    if (Object.is(previous, next)) return;
    this.values.set(key, next);
    for (const listener of this.listeners) listener();
  }
}

const PanelSessionContext = createContext<PanelSession | null>(null);

/** Internal: sits above BOTH inline and modal presentation branches. */
export function PanelSessionProvider({
  presentation,
  active,
  readPresentation,
  children,
}: {
  presentation: Presentation;
  active: boolean;
  readPresentation?: () => Presentation;
  children: ReactNode;
}) {
  const session = useRef<PanelSession | null>(null);
  if (!session.current) session.current = new PanelSession();
  session.current.presentation = presentation;
  session.current.active = active;
  session.current.readPresentation = readPresentation;
  // Closing must never leave a pending focus request for a later reopen.
  if (!active) session.current.focus = null;
  return (
    <PanelSessionContext.Provider value={session.current}>{children}</PanelSessionContext.Provider>
  );
}

function useSession() {
  const parent = useContext(PanelSessionContext);
  const local = useRef<PanelSession | null>(null);
  if (!local.current) local.current = new PanelSession();
  return parent ?? local.current;
}

/**
 * State registered with the enclosing panel, retained across inline/sheet
 * remounts and hidden/closed presentations. Use a unique domain key (for example
 * `comment:${id}:draft`). Removing the panel/route destroys its session. Outside
 * a descriptor panel this behaves as component-local state. This does not retain
 * arbitrary React state, native views, media instances or network persistence.
 */
export function usePanelSessionState<T>(
  key: string,
  initial: T | (() => T),
): [T, Dispatch<SetStateAction<T>>] {
  const session = useSession();
  const initialRef = useRef(initial);
  initialRef.current = initial;
  const snapshot = useCallback(() => session.read(key, initialRef.current), [session, key]);
  const value = useSyncExternalStore(session.subscribe, snapshot, snapshot);
  const setValue = useCallback(
    (action: SetStateAction<T>) => session.write(key, action, initialRef.current),
    [session, key],
  );
  return [value, setValue];
}

/**
 * Register a text input's focus and selection with its panel. Attach `ref`,
 * `onFocus`, `onBlur`, `onSelectionChange`; compose existing handlers normally.
 * A presentation change restores the focused input after the new dialog has
 * mounted. User blur/close never requests focus. Input value belongs in
 * usePanelSessionState; focus is restoration, not native view retention.
 */
export function usePanelSessionFocus<T extends PanelSessionFocusTarget>(key: string) {
  const session = useSession();
  const presentation = session.presentation;
  const target = useRef<T | null>(null);
  const selection = useRef<Selection | undefined>(undefined);
  const ref: RefCallback<T> = useCallback((node: T | null) => {
    target.current = node;
  }, []);
  const restoreSelection = useCallback(
    (pending: NonNullable<PanelSession['focus']>) => {
      if (!session.active || session.focus !== pending || !target.current) return;
      if (pending.selection) {
        selection.current = pending.selection;
        const { start, end } = pending.selection;
        if (target.current.setSelection) target.current.setSelection(start, end);
        else if (target.current.setSelectionRange) target.current.setSelectionRange(start, end);
        else target.current.setNativeProps?.({ selection: pending.selection });
      }
      session.focus = { ...pending, presentation, target: target.current };
    },
    [session, presentation],
  );
  const onFocus = useCallback(() => {
    if (!session.active || session.presentation !== presentation) return;
    const pending = session.focus;
    // An imperatively opened Dialog can autofocus its first field before the
    // session's restoration frame. Keep that transfer's snapshot intact until
    // the frame restores selection. A user pointer/key already cancels it.
    if (pending?.key === key && pending.presentation !== presentation) {
      // Native focus is asynchronous and can initialize the caret AFTER focus()
      // returns. Send the selection command only after its focus event arrives.
      if (Platform.OS !== 'web') restoreSelection(pending);
      return;
    }
    session.focus = { key, presentation, target: target.current, selection: selection.current };
  }, [session, key, presentation, restoreSelection]);
  const onBlur = useCallback(() => {
    // CSS resolves responsive presentation before ResizeObserver commits React
    // state. Read that same owner rather than clearing a transfer on early blur.
    const currentPresentation = session.readPresentation?.() ?? session.presentation;
    if (currentPresentation === presentation && session.focus?.key === key) session.focus = null;
  }, [session, key, presentation]);
  useLayoutEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const cancelForUserChoice = (event: Event) => {
      if (session.focus?.key !== key) return;
      const keyboard = event as KeyboardEvent;
      if (
        event.target !== target.current ||
        keyboard.key === 'Tab' ||
        keyboard.key === 'Escape' ||
        session.focus.presentation !== presentation
      ) {
        session.focus = null;
      }
    };
    document.addEventListener('pointerdown', cancelForUserChoice, true);
    document.addEventListener('keydown', cancelForUserChoice, true);
    return () => {
      document.removeEventListener('pointerdown', cancelForUserChoice, true);
      document.removeEventListener('keydown', cancelForUserChoice, true);
    };
  }, [session, key, presentation]);
  const onSelectionChange = useCallback(
    (event: { nativeEvent: { selection: Selection } }) => {
      selection.current = event.nativeEvent.selection;
      if (
        session.focus?.key === key &&
        session.focus.presentation === presentation &&
        session.presentation === presentation &&
        session.focus.target === target.current
      ) {
        session.focus.selection = selection.current;
      }
    },
    [session, key, presentation],
  );
  useLayoutEffect(() => {
    const focused = session.focus;
    if (!session.active || focused?.key !== key || focused.presentation === presentation) return;
    // Dialog's own focus boundary mounts first; restore on the next frame so it
    // does not replace the previously focused editor with the first button.
    const cancelForInteraction = () => {
      if (session.focus === focused) session.focus = null;
    };
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.addEventListener('pointerdown', cancelForInteraction, true);
      document.addEventListener('keydown', cancelForInteraction, true);
    }
    const frame = requestAnimationFrame(() => {
      if (!session.active || session.focus !== focused || !target.current) return;
      const current: unknown =
        Platform.OS === 'web'
          ? typeof document === 'undefined'
            ? null
            : document.activeElement
          : TextInput.State.currentlyFocusedInput();
      const empty =
        current == null || (typeof document !== 'undefined' && current === document.body);
      // Never take focus back after the user or another surface chose a new
      // destination during adaptation. The previous host may already detach.
      if (!empty && current !== focused.target && current !== target.current) {
        session.focus = null;
        return;
      }
      if (Platform.OS !== 'web') {
        // TextInput.State/isFocused can change before the native event too.
        // Even an autofocused host must confirm focus through onFocus.
        target.current.focus();
        return;
      }
      target.current.focus();
      restoreSelection(focused);
    });
    return () => {
      cancelAnimationFrame(frame);
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        document.removeEventListener('pointerdown', cancelForInteraction, true);
        document.removeEventListener('keydown', cancelForInteraction, true);
      }
    };
  }, [session, key, presentation, restoreSelection]);
  return { ref, onFocus, onBlur, onSelectionChange };
}
