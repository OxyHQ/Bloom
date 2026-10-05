import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { INITIAL_WORKSPACE, restoreWorkspace, type Workspace } from './data';
import type { MultiAgentChatProps } from './types';

export function useWorkspace({
  initialWorkspace,
  storageKey = 'bloom:multi-agent-chat',
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
    if (
      !initialWorkspace &&
      storageKey &&
      Platform.OS === 'web' &&
      typeof window !== 'undefined'
    ) {
      try {
        const raw = window.localStorage.getItem(storageKey);
        const saved = raw && restoreWorkspace(raw);
        if (saved) {
          current.current = saved;
          setWorkspace(saved);
        }
      } catch {
        /* Private storage is optional. */
      }
    }
    setLoaded(true);
  }, [initialWorkspace, storageKey]);
  useEffect(() => {
    if (
      loaded &&
      storageKey &&
      Platform.OS === 'web' &&
      typeof window !== 'undefined'
    ) {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(workspace));
      } catch {
        /* Quota errors never discard in-memory work. */
      }
    }
  }, [workspace, loaded, storageKey]);
  const update = useCallback((change: (workspace: Workspace) => Workspace) => {
    const next = change(current.current);
    current.current = next;
    setWorkspace(next);
    onChange.current?.(next);
  }, []);
  return { workspace, current, update, loaded };
}
