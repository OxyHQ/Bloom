import { useCallback, useEffect, useRef, useState } from 'react';
import { webLocalStorage } from '../theme/persistence';
import { INITIAL_WORKSPACE, restoreWorkspace, type Workspace } from './data';
import type { MultiAgentChatProps } from './types';

export function useWorkspace({
  initialWorkspace,
  storageKey = 'bloom:multi-agent-chat',
  storage = webLocalStorage,
  onWorkspaceChange,
}: MultiAgentChatProps) {
  const [workspace, setWorkspace] = useState<Workspace>(
    () => initialWorkspace ?? INITIAL_WORKSPACE,
  );
  const current = useRef(workspace);
  const onChange = useRef(onWorkspaceChange);
  onChange.current = onWorkspaceChange;
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (initialWorkspace || !storageKey || !storage) {
      setLoaded(true);
      return undefined;
    }
    let cancelled = false;
    const restore = (raw: string | null) => {
      if (cancelled) return;
      const saved = raw ? restoreWorkspace(raw) : null;
      if (saved) {
        current.current = saved;
        setWorkspace(saved);
      }
      setLoaded(true);
    };
    // The adapter answers synchronously (`localStorage`, restored in this same
    // effect) or later (`AsyncStorage`). A store that refuses is optional,
    // as on a private tab: the session starts from the default workspace.
    try {
      const raw = storage.getItem(storageKey);
      if (typeof raw === 'string' || raw === null) restore(raw);
      else void raw.then(restore, () => restore(null));
    } catch {
      restore(null);
    }
    return () => {
      cancelled = true;
    };
  }, [initialWorkspace, storageKey, storage]);
  useEffect(() => {
    if (!loaded || !storageKey || !storage) return;
    // Quota errors never discard in-memory work.
    try {
      void Promise.resolve(storage.setItem(storageKey, JSON.stringify(workspace))).catch(
        () => undefined,
      );
    } catch {
      /* As above: the workspace stays in memory. */
    }
  }, [workspace, loaded, storageKey, storage]);
  const update = useCallback((change: (workspace: Workspace) => Workspace) => {
    const next = change(current.current);
    current.current = next;
    setWorkspace(next);
    onChange.current?.(next);
  }, []);
  return { workspace, current, update, loaded };
}
